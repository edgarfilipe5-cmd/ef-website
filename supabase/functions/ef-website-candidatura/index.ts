// EF Native Website Candidate endpoint -- SOURCE ONLY, NOT DEPLOYED.
// Public endpoint by design: must be deployed with verify_jwt=false after security review.
// Requires the unexecuted docs/ef-candidatura-schema-proposta.sql and secrets in Supabase.
// Intentionally has no dependency on the App EF login or customer records.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.1";

const permittedGoals = new Set(["Perder gordura","Ganhar massa muscular","Recomposição corporal","Força / performance","Saúde e consistência","Hyrox / híbrido","Outro"]);
const experienceSet = new Set(["Iniciante","Intermédio","Avançado","A regressar"]);
const environmentSet = new Set(["Ginásio","Casa","Ambos","Exterior","A decidir"]);
const commitmentSet = new Set(["Sim, estou preparado(a)","Quero perceber melhor primeiro"]);
const allowedOrigins = (Deno.env.get("EF_FORM_ALLOWED_ORIGINS") || "").split(",").map(x => x.trim()).filter(Boolean);

function response(data: Record<string,unknown>, status: number, origin: string | null) {
  const headers = new Headers({"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff", "Vary":"Origin"});
  if (origin && allowedOrigins.includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers","content-type");
  headers.set("Access-Control-Allow-Methods","POST, OPTIONS");
  return new Response(JSON.stringify(data),{status,headers});
}
function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\\u0000-\\u001F\\u007F]/g," ").trim().slice(0,max) : "";
}
function normalize(p: Record<string,unknown>) {
  const x = {
    submissionKey:clean(p.submissionKey,40), fullName:clean(p.fullName,100),
    email:clean(p.email,180).toLowerCase(), phone:clean(p.phone,25),
    goal:clean(p.goal,80), situation:clean(p.situation,600),
    experience:clean(p.experience,40), frequency:clean(p.frequency,2),
    environment:clean(p.environment,40), startWhen:clean(p.startWhen,60),
    commitment:clean(p.commitment,60), notes:clean(p.notes,700),
    privacyAcknowledged:p.privacyAcknowledged === true,
    companyWebsite:clean(p.companyWebsite,200),
  };
  const valid = /^[0-9a-f-]{36}$/i.test(x.submissionKey)
    && x.fullName.length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)
    && /^[+0-9() .-]{9,25}$/.test(x.phone)
    && permittedGoals.has(x.goal) && x.situation.length >= 12
    && experienceSet.has(x.experience)
    && /^[1-7]$/.test(x.frequency) && environmentSet.has(x.environment)
    && commitmentSet.has(x.commitment) && x.privacyAcknowledged;
  return {x,valid};
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function notionSync(p: ReturnType<typeof normalize>["x"]): Promise<string> {
  const token = Deno.env.get("EF_NOTION_TOKEN");
  const db = Deno.env.get("EF_NOTION_LEADS_DATABASE_ID");
  if (!token || !db) throw new Error("notion_unconfigured");
  const headers = { Authorization:"Bearer "+token, "Notion-Version":"2022-06-28", "Content-Type":"application/json" };
  const query = await fetch("https://api.notion.com/v1/databases/"+encodeURIComponent(db)+"/query",{
    method:"POST",headers,body:JSON.stringify({page_size:2,filter:{property:"Email",email:{equals:p.email}}})
  });
  if (!query.ok) throw new Error("notion_lookup_failed_"+query.status);
  const hits = await query.json();
  if (hits.results?.length > 0) {
    // Never overwrite an existing pipeline stage or attach a new customer account.
    return hits.results[0].id;
  }
  const plain = (value:string) => [{type:"text",text:{content:value}}];
  const note = [
    "Origem: candidatura nativa website EF (sem pagamento).",
    "Objetivo: "+p.goal,
    "Situação: "+p.situation,
    "Experiência: "+p.experience,
    "Dias semana: "+p.frequency,
    "Ambiente: "+p.environment,
    "Início: "+(p.startWhen||"não indicado"),
    "Compromisso: "+p.commitment,
    "Notas: "+(p.notes||"—"),
  ].join("\n").slice(0,1900);
  const payload = {
    parent:{ database_id:db },
    properties:{
      "Lead":{title:plain(p.fullName)},
      "Email":{email:p.email},
      "Telefone":{phone_number:p.phone},
      "Estado":{select:{name:"Novo"}},
      "Interesse":{select:{name:"Online"}},
      "Origem":{select:{name:"Outro"}},
      "Valor potencial €":{number:199},
      "Data entrada":{date:{start:new Date().toISOString().slice(0,10)}},
      "Notas":{rich_text:plain(note)}
    }
  };
  const created = await fetch("https://api.notion.com/v1/pages",{
    method:"POST",headers,body:JSON.stringify(payload)
  });
  if (!created.ok) throw new Error("notion_create_failed_"+created.status);
  const page = await created.json();
  if (typeof page.id !== "string") throw new Error("notion_invalid_page");
  return page.id;
}
function emailMime(to: string, subject: string, body: string): string {
  const raw = "To: "+to+"\r\nSubject: "+subject+"\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n"+body;
  const bytes = new TextEncoder().encode(raw);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function gmailNotify(p: ReturnType<typeof normalize>["x"],notionPageId: string|null) {
  const clientId=Deno.env.get("EF_GMAIL_CLIENT_ID");
  const clientSecret=Deno.env.get("EF_GMAIL_CLIENT_SECRET");
  const refreshToken=Deno.env.get("EF_GMAIL_REFRESH_TOKEN");
  const owner=Deno.env.get("EF_GMAIL_OWNER");
  if(!clientId||!clientSecret||!refreshToken||!owner) throw new Error("gmail_unconfigured");
  const auth = await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:"refresh_token"})
  });
  if (!auth.ok) throw new Error("gmail_auth_failed_"+auth.status);
  const authJson=await auth.json();
  if (!authJson.access_token) throw new Error("gmail_auth_missing_token");
  const body = "Nova candidatura EF recebida.\n\nNome: "+p.fullName+
    "\nEmail: "+p.email+"\nWhatsApp: "+p.phone+
    "\nObjetivo: "+p.goal+
    "\nCRM Notion: "+(notionPageId ? "https://www.notion.so/"+notionPageId.replace(/-/g,"") : "pendente de sincronização")+
    "\n\nSem pagamento realizado. Contactar pessoalmente o candidato.";
  const sent=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{
    method:"POST",headers:{"Authorization":"Bearer "+authJson.access_token,"Content-Type":"application/json"},
    body:JSON.stringify({raw:emailMime(owner,"Nova candidatura EF Coaching",body)})
  });
  if (!sent.ok) throw new Error("gmail_send_failed_"+sent.status);
}
Deno.serve(async (req:Request)=>{
  const origin=req.headers.get("Origin");
  if (!origin || !allowedOrigins.includes(origin)) return response({error:"origin_not_allowed"},403,origin);
  if (req.method==="OPTIONS") return response({ok:true},200,origin);
  if (req.method!=="POST") return response({error:"method_not_allowed"},405,origin);
  if ((req.headers.get("content-type")||"").split(";")[0]!=="application/json") return response({error:"invalid_content_type"},415,origin);
  const raw=await req.text();
  if(raw.length>7000) return response({error:"payload_too_large"},413,origin);
  let input:Record<string,unknown>;
  try { input=JSON.parse(raw); } catch { return response({error:"invalid_json"},400,origin); }
  if(!input || Array.isArray(input) || typeof input!=="object") return response({error:"invalid_payload"},400,origin);
  const {x,valid}=normalize(input);
  if (!valid) return response({error:"invalid_fields"},422,origin);
  if(x.companyWebsite) return response({ok:true},200,origin); // bot honeypot
  const salt=Deno.env.get("EF_FORM_IP_SALT");
  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!salt || !supabaseUrl || !serviceRole) return response({error:"temporarily_unavailable"},503,origin);
  // Proxy metadata must be independently trusted; this is a basic rate limit, not an anti-bot guarantee.
  const ip=req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash=await sha256(salt+":"+ip);
  const db=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:admit,error:dbError}=await db.rpc("ef_accept_website_application",{p_payload:x,p_ip_hash:ipHash});
  if(dbError) { console.error("EF candidate persistence failed",dbError.code);return response({error:"temporarily_unavailable"},503,origin); }
  if(admit?.status==="RATE_LIMIT") return response({error:"try_later"},429,origin);
  if(admit?.status==="DUPLICATE") return response({ok:true},200,origin);
  if(admit?.status!=="CREATED" || !admit?.id) return response({error:"invalid_fields"},422,origin);
  let notionPageId:string|null=null;
  let notified=false;
  const failures:string[]=[];
  try{notionPageId=await notionSync(x);}catch(error){failures.push(String(error).slice(0,90));}
  try{await gmailNotify(x,notionPageId);notified=true;}catch(error){failures.push(String(error).slice(0,90));}
  const {error:deliveryError}=await db.from("ef_website_applications").update({
    state:failures.length?"DELIVERY_PENDING":"DELIVERED",
    notion_page_id:notionPageId,
    notion_synced_at:notionPageId?new Date().toISOString():null,
    email_notified_at:notified?new Date().toISOString():null,
    last_delivery_error:failures.length?failures.join("|"):null
  }).eq("id",admit.id);
  if(deliveryError) console.error("EF candidate delivery state update failed",deliveryError.code);
  // Persisted leads must be reconciled if CRM/email fails; never tell applicant that email was delivered.
  return response({ok:true},202,origin);
});
