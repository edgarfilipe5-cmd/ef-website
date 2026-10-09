// EF Website Candidatura -- QA ONLY. No real-candidate submissions allowed.
// Published by approval only to staging function; official website remains on Jotform.
// App EF accounts, client health data and payment tables are not modified.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const allowedOrigin="https://ef-candidatura-preview-20261009.onrender.com";
const projectOrigin="https://twbriibfrrfcrksnsypd.supabase.co";
const goals=new Set(["Perder gordura","Ganhar massa muscular","Recomposição corporal","Força / performance","Saúde e consistência","Hyrox / híbrido","Outro"]);
const exp=new Set(["Iniciante","Intermédio","Avançado","A regressar"]);
const places=new Set(["Ginásio","Casa","Ambos","Exterior","A decidir"]);
const commits=new Set(["Sim, estou preparado(a)","Quero perceber melhor primeiro"]);
const makeResponse=(data:Record<string,unknown>,status:number,origin:string|null)=>{
 const headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff"});
 if(origin===allowedOrigin) headers.set("Access-Control-Allow-Origin",allowedOrigin);
 headers.set("Access-Control-Allow-Methods","OPTIONS,POST");
 headers.set("Access-Control-Allow-Headers","content-type");
 return new Response(JSON.stringify(data),{status,headers});
};
const clean=(x:unknown,max:number)=>typeof x==="string"?x.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
async function ipHash(ip:string){ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("ef-preview-20261009:"+ip)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""); }
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin!==allowedOrigin)return makeResponse({error:"origin_not_allowed"},403,origin);
 if(req.method==="OPTIONS")return makeResponse({ok:true},200,origin);
 if(req.method!=="POST")return makeResponse({error:"method_not_allowed"},405,origin);
 if((req.headers.get("content-type")||"").split(";")[0]!=="application/json")return makeResponse({error:"invalid_content_type"},415,origin);
 const raw=await req.text();
 if(raw.length>7000)return makeResponse({error:"payload_too_large"},413,origin);
 let body:Record<string,unknown>;
 try{body=JSON.parse(raw)}catch{return makeResponse({error:"invalid_json"},400,origin)}
 if(!body||typeof body!=="object"||Array.isArray(body))return makeResponse({error:"invalid_payload"},422,origin);
 const val={
 submissionKey:clean(body.submissionKey,36),fullName:clean(body.fullName,100),
 email:clean(body.email,180).toLowerCase(),phone:clean(body.phone,25),
 goal:clean(body.goal,80),situation:clean(body.situation,600),
 experience:clean(body.experience,40),frequency:clean(body.frequency,2),
 environment:clean(body.environment,40),startWhen:clean(body.startWhen,60),
 commitment:clean(body.commitment,60),notes:clean(body.notes,700),
 privacyAcknowledged:body.privacyAcknowledged===true,companyWebsite:clean(body.companyWebsite,200)
 };
 // TEST-ONLY gate prevents real candidate PII while the privacy page and email OAuth are pending.
 if(!val.email.endsWith("@example.com")||!val.fullName.toUpperCase().startsWith("TESTE EF"))
  return makeResponse({error:"qa_only",message:"Nesta fase usa dados fictícios: nome TESTE EF e email @example.com."},422,origin);
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(val.submissionKey)
    ||val.fullName.length<8||!/^[^\s@]+@example\.com$/.test(val.email)
    ||!/^\+?[0-9() .-]{9,25}$/.test(val.phone)
    ||!goals.has(val.goal)||val.situation.length<12
    ||!exp.has(val.experience)||!places.has(val.environment)
    ||!commits.has(val.commitment)||!/^([1-7])$/.test(val.frequency)
    ||!val.privacyAcknowledged)return makeResponse({error:"invalid_fields"},422,origin);
 if(val.companyWebsite) return makeResponse({ok:true,qa:true},202,origin);
 const su=Deno.env.get("SUPABASE_URL")||projectOrigin;
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!secret)return makeResponse({error:"service_unconfigured"},503,origin);
 const db=createClient(su,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"preview";
 const hash=await ipHash(ip);
 const {data:admit,error:insertError}=await db.rpc("ef_accept_website_application",{p_payload:val,p_ip_hash:hash});
 if(insertError){console.error("ef candidate persist",insertError.code);return makeResponse({error:"storage_failure"},503,origin);}
 if(admit?.status==="RATE_LIMIT")return makeResponse({error:"rate_limit"},429,origin);
 if(admit?.status==="DUPLICATE")return makeResponse({ok:true,qa:true,duplicate:true},200,origin);
 if(admit?.status!=="CREATED"||typeof admit.id!=="string")return makeResponse({error:"invalid_candidate"},422,origin);
 // Credentials are read only by the Edge runtime using its service key.
 const {data:config,error:configError}=await db.from("ef_website_integration_config").select("key,value").in("key",["ap_webhook_url","ap_webhook_secret"]);
 const configs=Object.fromEntries((config||[]).map(x=>[x.key,x.value]));
 let delivered=false;
 let reason=configError?"config_read_failed":"delivery_failed";
 if(configs.ap_webhook_secret&&configs.ap_webhook_url){
  try{
   const abort=AbortSignal.timeout(30000);
   const forwarded=Object.fromEntries(Object.entries(val).filter(([k])=>!["privacyAcknowledged","companyWebsite"].includes(k)));
   const resp=await fetch(configs.ap_webhook_url,{
     method:"POST",headers:{"Content-Type":"application/json","x-ef-website-token":configs.ap_webhook_secret},
     body:JSON.stringify(forwarded),signal:abort
   });
   const answer=await resp.json().catch(()=>null);
   delivered=resp.ok&&answer?.ok===true&&answer?.notified===true;
   reason=delivered?"":"ap_delivery_incomplete";
  }catch{reason="ap_delivery_unavailable";}
 }else reason="ap_integration_unconfigured";
 const updated=await db.from("ef_website_applications").update({
   state:delivered?"DELIVERED":"DELIVERY_PENDING",
   email_notified_at:delivered?new Date().toISOString():null,
   notion_synced_at:delivered?new Date().toISOString():null,
   last_delivery_error:delivered?null:reason
 }).eq("id",admit.id);
 if(updated.error)console.error("ef delivery state update",updated.error.code);
 return makeResponse({ok:true,qa:true,received:true,notified:delivered,
   message:delivered?"Teste recebido no CRM com notificação":"Teste guardado; notificação ainda pendente"},202,origin);
});
