// EF Coaching: controlled 180-day expiration of native website applications only.
// Fails closed for converted leads, linked clients, manually protected leads and recent follow-ups.
// No test bypass exists in the production function.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.95.3";
const site="https://twbriibfrrfcrksnsypd.supabase.co";
const dataSource="a877082e-2e54-42ef-a693-a9571987b0b2";
const cutoffDays=180;
const reply=(obj:Record<string,unknown>,status=200)=>new Response(JSON.stringify(obj),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
});
const notes=(page:any):string=>Array.isArray(page?.properties?.Notas?.rich_text)
  ?page.properties.Notas.rich_text.map((x:any)=>x.plain_text||x.text?.content||"").join(""):"";
const lastContact=(p:any):number=>{
 const t=Date.parse(p?.properties?.["Último contacto"]?.date?.start||"");
 return Number.isFinite(t)?t:0;
};
function classify(p:any,r:any,olderThan:number):string{
 if(r.notion_owned!==true||r.retention_exempt===true||r.state!=="DELIVERED")return "protected";
 if(Date.parse(r.created_at)>=olderThan)return "not_expired";
 if(p.parent?.data_source_id!==dataSource)return "different_crm";
 const note=notes(p);
 if(note==="EF_RETENTION_PURGED "+r.submission_key &&
    p.properties?.Email?.email==null)return p.in_trash||p.archived?"redacted_in_trash":"redacted_pending_trash";
 if(p.in_trash||p.archived)return "archived_unrelated";
 if(p.properties?.Email?.email?.toLowerCase()!==r.email.toLowerCase())return "email_mismatch";
 if(!note.includes("CANDIDATURA EF WEBSITE (SEM PAGAMENTO)")||
    !note.includes("Submissão: "+r.submission_key))return "not_native_submission";
 if(!["Novo","Perdido"].includes(p.properties?.Estado?.select?.name))return "active_sales_pipeline";
 if((p.properties?.Cliente?.relation||[]).length>0)return "linked_client";
 if(p.properties?.["Próximo follow-up"]?.date?.start)return "future_or_open_followup";
 if(lastContact(p)>olderThan)return "recent_last_contact";
 if(p.properties?.Stripe?.url||p.properties?.Jotform?.url)return "payment_or_legacy_reference";
 return "eligible";
}
const redact=(key:string)=>({
 properties:{
  "Lead":{title:[{text:{content:"EF — candidatura expirada"}}]},
  "Email":{email:null},
  "Telefone":{phone_number:null},
  "Instagram":{rich_text:[]},
  "Notas":{rich_text:[{text:{content:"EF_RETENTION_PURGED "+key}}]},
  "Motivo perda":{rich_text:[]}
 }
});
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 const token=req.headers.get("x-ef-retry-token")||"";
 if(!/^[a-f0-9]{64}$/.test(token))return reply({error:"forbidden"},403);
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const notion=Deno.env.get("EF_NOTION_TOKEN");
 if(!service||!notion)return reply({error:"configuration"},503);
 const db=createClient(Deno.env.get("SUPABASE_URL")||site,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const a=await db.rpc("ef_verify_website_retry_token",{p_token:token});
 if(a.error||a.data!==true)return reply({error:"forbidden"},403);
 let body:any={};
 try{body=await req.json()}catch{return reply({error:"invalid_json"},400)}
 const {data:enabled,error:statusError}=await db.rpc("ef_is_website_retention_enabled");
 if(statusError)return reply({error:"configuration"},503);
 const execute=enabled===true;
 const cutoff=Date.now()-cutoffDays*86400000;
 let query=db.from("ef_website_applications").select(
   "id,submission_key,email,state,created_at,notion_page_id,notion_owned,retention_exempt"
 ).eq("state","DELIVERED").eq("notion_owned",true).eq("retention_exempt",false)
  .lt("created_at",new Date(cutoff).toISOString()).order("created_at",{ascending:true}).limit(12);
 const {data:rows,error:listError}=await query;
 if(listError)return reply({error:"storage_failure"},503);
 const headers={"Authorization":"Bearer "+notion,"Notion-Version":"2025-09-03","Content-Type":"application/json"};
 let scanned=0,eligible=0,cleaned=0,skipped=0,errors=0;const reasons:Record<string,number>={};
 for(const row of rows||[]){
  scanned++;
  if(typeof row.notion_page_id!=="string"||!/^[a-f0-9-]{32,36}$/i.test(row.notion_page_id)){skipped++;continue}
  try{
   const url="https://api.notion.com/v1/pages/"+row.notion_page_id;
   const read=await fetch(url,{headers,signal:AbortSignal.timeout(8500)});
   if(!read.ok){errors++;continue}
   const page=await read.json();
   const reason=classify(page,row,cutoff);
   if(reason!=="eligible"&&reason!=="redacted_pending_trash"&&reason!=="redacted_in_trash"){
    skipped++;reasons[reason]=(reasons[reason]||0)+1;continue;
   }
   eligible++;
   if(!execute)continue;
   if(reason==="eligible"){
    const p=await fetch(url,{method:"PATCH",headers,body:JSON.stringify(redact(row.submission_key)),
      signal:AbortSignal.timeout(8500)});
    if(!p.ok){errors++;continue}
    const changed=await p.json();
    if(changed.id!==row.notion_page_id||changed.properties?.Email?.email!=null){errors++;continue}
   }
   if(reason!=="redacted_in_trash"){
    const t=await fetch(url,{method:"PATCH",headers,body:JSON.stringify({in_trash:true}),
      signal:AbortSignal.timeout(8500)});
    if(!t.ok){errors++;continue}
    const archived=await t.json();
    if(!archived.in_trash&&!archived.archived){errors++;continue}
   }
   const gone=await db.from("ef_website_applications").delete()
      .eq("id",row.id).eq("state","DELIVERED").eq("notion_owned",true)
      .eq("retention_exempt",false).lt("created_at",new Date(cutoff).toISOString()).select("id");
   if(gone.error||gone.data?.length!==1){errors++;continue}
   cleaned++;
  }catch{errors++}
 }
 return reply({ok:true,dryRun:!execute,scanned,eligible,cleaned,skipped,errors,reasons});
});
