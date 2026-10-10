// EF Website Candidatura -- production candidate. Public submissions require Cloudflare Turnstile + scoped secrets.
// Never enable publicly until anti-abuse challenge and privacy review are complete.
// App EF accounts, client health data and payment tables are not modified.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const allowedOrigins=new Set(["https://edgarfilipe.pt","https://www.edgarfilipe.pt","https://ef-candidatura-preview-20261009.onrender.com"]);
const allowedChallengeHosts=new Set(["edgarfilipe.pt","www.edgarfilipe.pt","ef-candidatura-preview-20261009.onrender.com"]);
const projectOrigin="https://twbriibfrrfcrksnsypd.supabase.co";
const goals=new Set(["Perder gordura","Ganhar massa muscular","Recomposição corporal","Força / performance","Saúde e consistência","Hyrox / híbrido","Outro"]);
const exp=new Set(["Iniciante","Intermédio","Avançado","A regressar"]);
const places=new Set(["Ginásio","Casa","Ambos","Exterior","A decidir"]);
const commits=new Set(["Sim, estou preparado(a)","Quero perceber melhor primeiro"]);
const makeResponse=(data:Record<string,unknown>,status:number,origin:string|null)=>{
 const headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff"});
 if(origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin",origin);
 headers.set("Access-Control-Allow-Methods","OPTIONS,POST");
 headers.set("Access-Control-Allow-Headers","content-type");
 return new Response(JSON.stringify(data),{status,headers});
};
const clean=(x:unknown,max:number)=>typeof x==="string"?x.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
async function ipHash(ip:string){ const salt=Deno.env.get("EF_FORM_IP_SALT")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!salt||salt.length<24)throw new Error("missing_form_ip_salt");const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+":"+ip)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""); }

function normalizeNotionText(value:string) {
  return [{type:"text",text:{content:value.slice(0,1800)}}];
}
type CandidatePayload = { submissionKey:string,fullName:string,email:string,phone:string,goal:string,situation:string,experience:string,frequency:string,environment:string,startWhen:string,commitment:string,notes:string };
async function syncDirectNotion(db:any, row:any, payload:CandidatePayload) {
  const key=Deno.env.get("EF_NOTION_TOKEN");
  if(!key) return {ok:false,reason:"notion_secret_unconfigured",pageId:null};
  const target="a877082e-2e54-42ef-a693-a9571987b0b2";
  const headers={"Authorization":"Bearer "+key,"Notion-Version":"2025-09-03","Content-Type":"application/json"};
  try {
    if(row.notion_page_id) return {ok:true,reason:"",pageId:row.notion_page_id};
    const query=await fetch("https://api.notion.com/v1/data_sources/"+target+"/query",{
      method:"POST",headers,body:JSON.stringify({page_size:2,filter:{property:"Email",email:{equals:payload.email}}}),signal:AbortSignal.timeout(9500)
    });
    if(!query.ok)return {ok:false,reason:"notion_query_http_"+query.status,pageId:null};
    const matches=await query.json();
    if(matches.results?.length) return {ok:true,reason:"",pageId:matches.results[0].id};
    const notes=[
      "CANDIDATURA EF WEBSITE (SEM PAGAMENTO)",
      "Objetivo: "+payload.goal,
      "Situação: "+payload.situation,
      "Experiência: "+payload.experience,
      "Dias/semana: "+payload.frequency,
      "Local: "+payload.environment,
      "Início: "+payload.startWhen,
      "Compromisso: "+payload.commitment,
      "Notas: "+payload.notes,
      "Submissão: "+payload.submissionKey
    ].join("\n");
    const properties={
      "Lead":{title:normalizeNotionText(payload.fullName)},
      "Email":{email:payload.email},
      "Telefone":{phone_number:payload.phone},
      "Estado":{select:{name:"Novo"}},
      "Interesse":{select:{name:"Online"}},
      "Origem":{select:{name:"Outro"}},
      "Valor potencial €":{number:199},
      "Notas":{rich_text:normalizeNotionText(notes)}
    };
    const created=await fetch("https://api.notion.com/v1/pages",{
      method:"POST",headers,body:JSON.stringify({parent:{type:"data_source_id",data_source_id:target},properties}),
      signal:AbortSignal.timeout(9500)
    });
    if(!created.ok)return {ok:false,reason:"notion_create_http_"+created.status,pageId:null};
    const result=await created.json();
    return {ok:typeof result.id==="string",reason:typeof result.id==="string"?"":"notion_bad_result",pageId:result.id??null};
  }catch{return {ok:false,reason:"notion_unavailable",pageId:null};}
}
async function sendDirectEmail(row:any,payload:CandidatePayload,pageId:string|null){
  if(row.email_notified_at)return {ok:true,reason:""};
  const key=Deno.env.get("EF_RESEND_API_KEY");
  if(!key)return {ok:false,reason:"resend_secret_unconfigured"};
  const from=Deno.env.get("EF_RESEND_FROM")||"EF Coaching <candidaturas@edgarfilipe.pt>";
  const to=Deno.env.get("EF_LEAD_NOTIFICATION_TO")||"edgarfilipe5@gmail.com";
  const message=[
    "Nova candidatura EF Coaching",
    "Nome: "+payload.fullName,"Email: "+payload.email,"WhatsApp: "+payload.phone,
    "Objetivo: "+payload.goal,"Situação: "+payload.situation,
    "Local: "+payload.environment,"Dias/semana: "+payload.frequency,
    "CRM: "+(pageId?"https://www.notion.so/"+pageId.replace(/-/g,""):"sincronização pendente"),
    "Sem pagamento, sem criação de conta na App EF."
  ].join("\n");
  try{
    const result=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json",
       "Idempotency-Key":"eflead-"+row.id},
      body:JSON.stringify({from,to:[to],subject:"[EF] Nova candidatura: "+payload.fullName,
       text:message}),signal:AbortSignal.timeout(10000)
    });
    return {ok:result.ok,reason:result.ok?"":"resend_http_"+result.status};
  }catch{return {ok:false,reason:"resend_unavailable"};}
}

async function verifyTurnstile(token:string, submissionKey:string):Promise<boolean>{
 const secret=(Deno.env.get("EF_TURNSTILE_SECRET")||"").trim();
 if(!secret || token.length<16 || token.length>2048) {
   console.warn("ef turnstile precheck",{
     secretConfigured:secret.length>0,
     tokenPresent:token.length>0,
     tokenLengthValid:token.length>=16&&token.length<=2048
   });
   return false;
 }
 try{
  const form=new URLSearchParams({secret,response:token,idempotency_key:submissionKey});
  const result=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form,
    signal:AbortSignal.timeout(9000)
  });
  if(!result.ok){console.warn("ef turnstile upstream_http",{status:result.status});return false;}
  const verified=await result.json();
  const hostnameValid=typeof verified.hostname==="string"&&allowedChallengeHosts.has(verified.hostname);
  const actionValid=!verified.action||verified.action==="ef-candidatura";
  const success=verified.success===true;
  if(!success||!hostnameValid||!actionValid){
    // Diagnostic metadata only: never log token, secret, IP, form values or Cloudflare challenge metadata.
    const known=new Set(["missing-input-secret","invalid-input-secret","missing-input-response",
      "invalid-input-response","bad-request","timeout-or-duplicate","internal-error"]);
    const reasons=Array.isArray(verified["error-codes"])
      ? verified["error-codes"].filter((s:unknown)=>typeof s==="string"&&known.has(s))
      : [];
    console.warn("ef turnstile rejected",{
      success,hostnameValid,actionValid,
      returnedHostname:typeof verified.hostname==="string"?verified.hostname.slice(0,150):null,
      returnedAction:typeof verified.action==="string"?verified.action.slice(0,50):null,
      codes:reasons
    });
  }
  return success&&hostnameValid&&actionValid;
 }catch{console.warn("ef turnstile upstream_unavailable");return false}
}

type DbClient = ReturnType<typeof createClient>;
async function processStored(db:DbClient, row:any){
 const payload:CandidatePayload={
  submissionKey:row.submission_key,fullName:row.full_name,email:row.email,phone:row.phone,
  goal:row.goal,situation:row.situation,experience:row.experience,
  frequency:String(row.frequency),environment:row.environment,startWhen:row.start_when||"",
  commitment:row.commitment,notes:row.notes||""
 };
 const notion=await syncDirectNotion(db,row,payload);
 const resend=await sendDirectEmail(row,payload,notion.pageId);
 const complete=notion.ok&&resend.ok;
 const failures=[notion.reason,resend.reason].filter(Boolean).join(";").slice(0,190)||null;
 const retryMinutes=Math.min(720,Math.pow(2,Math.min(8,row.retry_attempts||1))*5);
 const {error}=await db.from("ef_website_applications").update({
   state:complete?"DELIVERED":"DELIVERY_PENDING",
   processing_until:null,
   notion_page_id:notion.pageId||row.notion_page_id,
   notion_synced_at:notion.ok?(row.notion_synced_at||new Date().toISOString()):null,
   email_notified_at:resend.ok?(row.email_notified_at||new Date().toISOString()):null,
   last_delivery_error:failures,
   next_retry_at:complete?new Date().toISOString():new Date(Date.now()+retryMinutes*60000).toISOString()
 }).eq("id",row.id);
 if(error)console.error("ef processing status update failed",error.code);
 return {complete,notionOk:notion.ok,emailAccepted:resend.ok};
}
async function retryPending(req:Request){
 const db=createClient(Deno.env.get("SUPABASE_URL")||projectOrigin,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",{auth:{persistSession:false,autoRefreshToken:false}});
 const token=req.headers.get("x-ef-retry-token")||"";
 if(!/^[0-9a-f]{64}$/.test(token))return makeResponse({error:"not_authorized"},403,null);
 const {data:valid,error:verifyError}=await db.rpc("ef_verify_website_retry_token",{p_token:token});
 if(verifyError||valid!==true)return makeResponse({error:"not_authorized"},403,null);
 const now=new Date().toISOString();
 const {data:pending,error:queueError}=await db.from("ef_website_applications")
 .select("id").in("state",["RECEIVED","DELIVERY_PENDING","PROCESSING"])
 .lte("next_retry_at",now).lt("retry_attempts",12)
 .order("created_at",{ascending:true}).limit(8);
 if(queueError)return makeResponse({error:"queue_unavailable"},503,null);
 let processed=0,complete=0;
 for(const p of pending||[]){
  const {data:claimed,error:claimError}=await db.rpc("ef_claim_website_application",{p_id:p.id});
  if(claimError||!claimed?.length)continue;
  const result=await processStored(db,claimed[0]);
  processed++;if(result.complete)complete++;
 }
 // Alert the trainer once a day when delivery repeatedly fails.
 const {count:stuck}=await db.from("ef_website_applications")
 .select("id",{count:"exact",head:true}).eq("state","DELIVERY_PENDING").gte("retry_attempts",6);
 if((stuck||0)>0 && Deno.env.get("EF_RESEND_API_KEY")){
  const today=new Date().toISOString().slice(0,10);
  try{
   await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":"Bearer "+Deno.env.get("EF_RESEND_API_KEY"),
      "Content-Type":"application/json","Idempotency-Key":"ef-lead-pending-alert-"+today},
    body:JSON.stringify({
     from:Deno.env.get("EF_RESEND_FROM")||"EF Coaching <candidaturas@edgarfilipe.pt>",
     to:[Deno.env.get("EF_LEAD_NOTIFICATION_TO")||"edgarfilipe5@gmail.com"],
     subject:"[EF] Atenção: candidaturas pendentes de entrega",
     text:"Existem "+stuck+" candidatura(s) com 6+ tentativas de entrega. Rever estados DELIVERY_PENDING na área restrita Supabase. Não reenviar manualmente antes de verificar Notion e Resend."
    }),signal:AbortSignal.timeout(9000)
   });
  }catch{console.error("EF delivery alert unavailable");}
 }
 return makeResponse({ok:true,processed,completed:complete},200,null);
}

Deno.serve(async(req:Request)=>{
 if(req.method==="POST" && new URL(req.url).pathname.endsWith("/retry"))return retryPending(req);
 const origin=req.headers.get("Origin");
 if(!origin||!allowedOrigins.has(origin))return makeResponse({error:"origin_not_allowed"},403,origin);
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
 // Staging host is restricted to fictitious test identities; it must never accept real leads.
 if(origin==="https://ef-candidatura-preview-20261009.onrender.com" &&
   (!val.fullName.toUpperCase().startsWith("TESTE EF")||!val.email.endsWith("@example.com")))
    return makeResponse({error:"preview_test_only",message:"Neste ambiente utiliza apenas dados fictícios: nome TESTE EF e email @example.com."},422,origin);
 const errors:string[]=[];
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(val.submissionKey))errors.push("identificador");
 if(val.fullName.length<8)errors.push("nome completo");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email))errors.push("email");
 if(!/^\+?[0-9() .-]{9,25}$/.test(val.phone))errors.push("telemóvel");
 if(!goals.has(val.goal))errors.push("objetivo");
 if(val.situation.length<12)errors.push("dificuldade");
 if(!exp.has(val.experience))errors.push("experiência");
 if(!places.has(val.environment))errors.push("local de treino");
 if(!commits.has(val.commitment))errors.push("compromisso");
 if(!/^([1-7])$/.test(val.frequency))errors.push("dias disponíveis");
 if(!val.privacyAcknowledged)errors.push("privacidade");
 if(errors.length)return makeResponse({error:"invalid_fields",message:"Verifica os seguintes campos: "+errors.join(", ")+".",fields:errors},422,origin);
 if(val.companyWebsite) return makeResponse({ok:true},202,origin);
 const captchaToken=clean(body.turnstileToken,2100);
 if(!await verifyTurnstile(captchaToken,val.submissionKey))
  return makeResponse({error:"verification_required",message:"Confirma a verificação de segurança e tenta novamente."},403,origin);

 const su=Deno.env.get("SUPABASE_URL")||projectOrigin;
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!secret)return makeResponse({error:"service_unconfigured"},503,origin);
 const db=createClient(su,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"preview";
 let hash:string;
 try{hash=await ipHash(ip)}catch{return makeResponse({error:"temporarily_unavailable"},503,origin)}
 const {data:admit,error:insertError}=await db.rpc("ef_accept_website_application",{p_payload:val,p_ip_hash:hash});
 if(insertError){console.error("ef candidate persist",insertError.code);return makeResponse({error:"storage_failure"},503,origin);}
 if(admit?.status==="RATE_LIMIT")return makeResponse({error:"rate_limit"},429,origin);

 if(admit?.status!=="DUPLICATE"&&(admit?.status!=="CREATED"||typeof admit.id!=="string"))return makeResponse({error:"invalid_candidate"},422,origin);

 // Atomic claim protects against duplicate leads and concurrent in-flight email deliveries.
 if(admit?.status!=="CREATED" && admit?.status!=="DUPLICATE")return makeResponse({error:"invalid_request"},422,origin);
 const q=admit.status==="DUPLICATE"
   ? await db.from("ef_website_applications")
       .select("id,state,email").eq("email",val.email)
       .eq("submitted_on",new Date().toLocaleDateString("en-CA",{timeZone:"Europe/Lisbon"}))
       .order("created_at",{ascending:false}).limit(1).maybeSingle()
   : {data:{id:admit.id,state:"RECEIVED",email:val.email},error:null};
 if(q.error||!q.data)return makeResponse({error:"processing_unavailable"},503,origin);
 if(q.data.state==="DELIVERED")return makeResponse({ok:true,received:true,duplicate:true},200,origin);
 const {data:claimed,error:claimError}=await db.rpc("ef_claim_website_application",{p_id:q.data.id});
 if(claimError)return makeResponse({ok:true,received:true,pending:true},202,origin);
 if(!claimed?.length)return makeResponse({ok:true,received:true,pending:true},202,origin);
 const sent=await processStored(db,claimed[0]);
 return makeResponse({ok:true,received:true,crmSynced:sent.notionOk,
   notified:sent.emailAccepted,processingComplete:sent.complete,
   duplicate:admit.status==="DUPLICATE"},202,origin);
});
