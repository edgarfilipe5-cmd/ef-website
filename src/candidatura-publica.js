/* EF Coaching — public candidature form; server validates Turnstile and persists the lead. */
(() => {
 "use strict";
 const form=document.getElementById("efApplication");
 if(!form)return;
 const stage1=form.querySelector('[data-step="1"]');
 const stage2=form.querySelector('[data-step="2"]');
 const next=document.getElementById("nextButton");
 const back=document.getElementById("backButton");
 const restart=document.getElementById("restartButton");
 const feedback=document.getElementById("feedback");
 const success=document.getElementById("successState");
 const indicator=document.getElementById("stepIndicator");
 const percent=document.getElementById("progressPercent");
 const progress=document.getElementById("progressFill");
 const submit=document.getElementById("submitButton");
 const security=document.getElementById("securityStatus");
 const endpoint="https://twbriibfrrfcrksnsypd.supabase.co/functions/v1/ef-website-candidatura";
 let submissionKey=crypto.randomUUID();
 let captchaToken="";
 let widgetId=null;
 submit.disabled=true;
 function error(message){
  feedback.textContent=message;feedback.hidden=false;feedback.scrollIntoView({block:"nearest"});
 }
 function setStep(step){
  stage1.hidden=step!==1;stage2.hidden=step!==2;
  indicator.textContent="ETAPA 0"+step+" / 02";
  percent.textContent=(step===1?50:100)+"%";
  progress.style.width=(step===1?50:100)+"%";feedback.hidden=true;
  const title=(step===1?stage1:stage2).querySelector("h3");
  if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
 }
 function valid(el){
  for(const field of el.querySelectorAll("[required]")) {
   if(!field.checkValidity()){field.reportValidity();return false;}
  }
  return true;
 }
 function resetCaptcha(){
  captchaToken="";submit.disabled=true;
  if(window.turnstile&&widgetId!==null)window.turnstile.reset(widgetId);
 }
 async function loadChallenge(){
  try {
   const result=await fetch("./content/site.json",{cache:"no-store"});
   if(!result.ok)throw Error("site-config-unavailable");
   const config=await result.json();
   const sitekey=String(config.site?.turnstile_site_key||"").trim();
   if(!/^[A-Za-z0-9_-]{8,120}$/.test(sitekey))throw Error("turnstile-not-configured");
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;script.defer=true;
   script.onload=()=>{
    if(!window.turnstile){security.textContent="Verificação indisponível. Tenta novamente mais tarde.";return;}
    widgetId=window.turnstile.render("#turnstileMount",{
     sitekey,action:"ef-candidatura",theme:"light",
     callback(token){captchaToken=token;submit.disabled=false;security.textContent="Verificação concluída."},
     "expired-callback"(){captchaToken="";submit.disabled=true;security.textContent="Verificação expirada. Confirma novamente."},
     "error-callback"(){captchaToken="";submit.disabled=true;security.textContent="Não foi possível verificar a segurança. Atualiza a página."}
    });
    security.textContent="Confirma a verificação para enviar a candidatura.";
   };
   script.onerror=()=>{security.textContent="Verificação temporariamente indisponível. Tenta mais tarde."};
   document.head.appendChild(script);
  }catch{
   submit.disabled=true;
   security.textContent="O formulário está temporariamente indisponível. Podes contactar diretamente o EF Coaching pelo email edgarfilipe5@gmail.com.";
  }
 }
 next.addEventListener("click",()=>{
  if(!valid(stage1))return;
  if(document.getElementById("situation").value.trim().length<12){error("Descreve um pouco melhor a dificuldade.");return;}
  setStep(2);
 });
 back.addEventListener("click",()=>setStep(1));
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!valid(stage1)){setStep(1);return;}
  if(!valid(stage2))return;
  if(form.companyWebsite.value.trim())return;
  if(!captchaToken){error("Confirma a verificação de segurança antes de enviar.");return;}
  const payload=Object.fromEntries(new FormData(form).entries());
  payload.submissionKey=submissionKey;
  payload.privacyAcknowledged=payload.privacyAcknowledged==="on";
  payload.turnstileToken=captchaToken;
  submit.disabled=true;submit.textContent="A enviar candidatura…";feedback.hidden=true;
  try {
   const result=await fetch(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(40000)
   });
   const data=await result.json().catch(()=>({}));
   if(!result.ok)throw new Error(data.message||(result.status===429?"Demasiadas tentativas. Tenta novamente mais tarde.":"Não foi possível enviar. Por favor tenta novamente."));
   if(data.ok!==true)throw new Error("Não foi possível confirmar a candidatura.");
   form.hidden=true;success.hidden=false;
   indicator.textContent="CANDIDATURA RECEBIDA";percent.textContent="100%";progress.style.width="100%";
   success.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
   error(e?.message||"Não foi possível confirmar o envio. Tenta novamente.");
   resetCaptcha();
  }finally {
   submit.textContent="Enviar candidatura →";
   if(captchaToken)submit.disabled=false;
  }
 });
 restart.addEventListener("click",()=>{
  form.reset();submissionKey=crypto.randomUUID();success.hidden=true;form.hidden=false;setStep(1);resetCaptcha();
 });
 loadChallenge();
})();
