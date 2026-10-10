// EF Coaching / retention. Candidates owned by the native application ONLY.
// Private cron endpoint; all destructive actions fail closed unless manually enabled and eligible.
// Notion pages created by other workflows or converted leads must NEVER be deleted.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const project="https://twbriibfrrfcrksnsypd.supabase.co";
const targetSource="a877082e-2e54-42ef-a693-a9571987b0b2";
const statesEligible=new Set(["Novo","Contactado","Qualificado","Perdido"]);
const payload=(object:Record<string,unknown>,status=200)=>new Response(JSON.stringify(object),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
});
function plainTexts(p:any):string{
 return Array.isArray(p?.rich_text)?p.rich_text.map((x:any)=>x.plain_text||x.text?.content||"").join(""):"";
}
function pageDate(p:any):number{
 const value=p?.date?.start;
 if(!value||typeof value!=="string")return 0;
 const time=Date.parse(value);return Number.isFinite(time)?time:0;
}
function eligibility(page:any,row:any,cutoff:number):string{
 if(!row.notion_owned||row.retention_exempt||row.state!=="DELIVERED")return "not_owned_or_exempt";
 if(page.archived===true||page.in_trash===true)return "already_trashed";
 if(page.parent?.data_source_id!==targetSource)return "different_parent";
 const properties=page.properties||{};
 if(properties.Email?.email?.toLowerCase()!==row.email.toLowerCase())return "email_mismatch";
 const note=plainTexts(properties.Notas);
 if(!note.includes("CANDIDATURA EF WEBSITE (SEM PAGAMENTO)")||!note.includes("Submissão: "+row.submission_key))
   return "marker_mismatch";
 const state=properties.Estado?.select?.name;
 if(!statesEligible.has(state))return "converted_or_active";
 if(Array.isArray(properties.Cliente?.relation)&&properties.Cliente.relation.length>0)return "linked_client";
 if(pageDate(properties["Último contacto"])>cutoff)return "recent_contact";
 // Any manually scheduled follow-up represents an active sales interaction.
 if(properties["Próximo follow-up"]?.date?.start)return "open_followup";
 if(Date.parse(row.created_at)>cutoff)return "not_old_enough";
 return "eligible";
}

Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return payload({error:"method_not_allowed"},405);
 const token=req.headers.get("x-ef-retry-token")||"";
 if(!/^[a-f0-9]{64}$/.test(token))return payload({error:"forbidden"},403);
 const role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const notion=(Deno.env.get("EF_NOTION_TOKEN")||"").trim();
 if(!role||!notion)return payload({error:"unconfigured"},503);
 const db=createClient(Deno.env.get("SUPABASE_URL")||project,role,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:authenticated,error:authError}=await db.rpc("ef_verify_website_retry_token",{p_token:token});
 if(authError||authenticated!==true)return payload({error:"forbidden"},403);
 const executable=Deno.env.get("EF_RETENTION_EXECUTE")==="true";
 const days=180;
 const cutoff=Date.now()-days*86400000;
 const {data:rows,error:queueErr}=await db.from("ef_website_applications")
 .select("id,submission_key,email,created_at,state,notion_page_id,notion_owned,retention_exempt")
 .eq("notion_owned",true).eq("retention_exempt",false).eq("state","DELIVERED")
 .lt("created_at",new Date(cutoff).toISOString()).order("created_at",{ascending:true}).limit(12);
 if(queueErr)return payload({error:"query_failure"},503);
 let checked=0,eligible=0,cleared=0,skipped=0,errors=0;
 const reasons:Record<string,number>={};
 const headers={"Authorization":"Bearer "+notion,"Notion-Version":"2025-09-03","Content-Type":"application/json"};
 for(const row of rows||[]){
  checked++;
  const pageId=row.notion_page_id;
  if(typeof pageId!=="string"||!/^[0-9a-f-]{32,36}$/i.test(pageId)){skipped++;continue;}
  try{
   const resp=await fetch("https://api.notion.com/v1/pages/"+pageId,{headers,signal:AbortSignal.timeout(8000)});
   if(!resp.ok){errors++;continue;}
   const page=await resp.json();
   const reason=eligibility(page,row,cutoff);
   if(reason!=="eligible"){skipped++;reasons[reason]=(reasons[reason]||0)+1;continue;}
   eligible++;
   if(!executable)continue; // security gate: never delete on a configuration mistake.
   const trash=await fetch("https://api.notion.com/v1/pages/"+pageId,{
     method:"PATCH",headers,body:JSON.stringify({in_trash:true}),signal:AbortSignal.timeout(8000)
   });
   if(!trash.ok){errors++;continue;}
   const changed=await trash.json();
   if(changed.in_trash!==true&&changed.archived!==true){errors++;continue;}
   const {error:deleted,error:deleteError}=await db.from("ef_website_applications").delete()
     .eq("id",row.id).eq("notion_owned",true).eq("retention_exempt",false)
     .eq("state","DELIVERED").lt("created_at",new Date(cutoff).toISOString());
   if(deleted||deleteError){errors++;continue;}
   cleared++;
  }catch{errors++;}
 }
 return payload({ok:true,dryRun:!executable,checked,eligible,cleared,skipped,errors,reasons});
});
