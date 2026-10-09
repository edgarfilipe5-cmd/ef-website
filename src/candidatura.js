/* EF Candidatura / QA: only fictitious identities may be submitted. */
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
 const demo=document.getElementById("demoFillButton");
 const api="https://twbriibfrrfcrksnsypd.supabase.co/functions/v1/ef-website-candidatura-qa";
 let submittedKey=crypto.randomUUID();
 function setStep(step){
  stage1.hidden=step!==1;stage2.hidden=step!==2;
  indicator.textContent="ETAPA 0"+step+" / 02";percent.textContent=(step===1?50:100)+"%";
  progress.style.width=(step===1?50:100)+"%";feedback.hidden=true;
  const heading=(step===1?stage1:stage2).querySelector("h3");
  heading?.setAttribute("tabindex","-1");heading?.focus({preventScroll:true});
 }
 function validateStep(el){
  for(const field of el.querySelectorAll("[required]")){
   if(!field.checkValidity()){field.reportValidity();return false;}
  }return true;
 }
 function showError(msg){feedback.textContent=msg;feedback.hidden=false;feedback.scrollIntoView({block:"nearest"});}
 if(demo){
  demo.addEventListener("click",()=>{
   const test={
    goal:"Recomposição corporal",situation:"Teste fictício do formulário EF sem informações pessoais.",
    experience:"Iniciante",frequency:"3",environment:"Ginásio",
    fullName:"TESTE EF — Candidatura QA",email:"ef-candidatura-qa-20261009@example.com",
    phone:"+351900000001",startWhen:"Nas próximas 2 semanas",
    commitment:"Sim, estou preparado(a)",notes:"QA: não contactar nem faturar."
   };
   Object.entries(test).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value;});
   document.getElementById("privacyAcknowledged").checked=true;
   showError("Dados fictícios preenchidos. Podes agora percorrer as etapas e testar o envio.");
  });
 }
 next.addEventListener("click",()=>{if(!validateStep(stage1))return;if(document.getElementById("situation").value.trim().length<12){showError("Descreve um pouco melhor a dificuldade.");return;}setStep(2);});
 back.addEventListener("click",()=>setStep(1));
 form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!validateStep(stage1)){setStep(1);return;}
  if(!validateStep(stage2))return;
  if(form.companyWebsite.value.trim()){showError("Não foi possível concluir o teste.");return;}
  const obj=Object.fromEntries(new FormData(form).entries());
  const email=String(obj.email||"").toLowerCase();
  if(!email.endsWith("@example.com")||!String(obj.fullName||"").toUpperCase().startsWith("TESTE EF")){
   showError("Pré-visualização: utiliza o botão de dados fictícios. Candidaturas reais continuam no website oficial.");
   return;
  }
  const payload={...obj,submissionKey:submittedKey,privacyAcknowledged:obj.privacyAcknowledged==="on"};
  submit.disabled=true;submit.textContent="A enviar teste…";feedback.hidden=true;
  try{
   const res=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(35000)});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.message|| (res.status===429?"Limite de testes atingido, tenta mais tarde.":"Não foi possível registar a candidatura de teste."));
   form.hidden=true;success.hidden=false;indicator.textContent="TESTE REGISTADO";percent.textContent="100%";progress.style.width="100%";
   const detail=success.querySelector("p");
   if(detail)detail.textContent=data.duplicate
    ?"O registo fictício já existe. Não foi criado um segundo lead. Podes reiniciar para validar a interface."
    :data.notified
     ?"Candidatura fictícia guardada. O CRM e o aviso por email foram confirmados."
     :"Candidatura fictícia guardada no servidor. A notificação por email ainda está pendente de autorização Gmail.";
   success.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){showError(err?.message||"Falha ao enviar. Nenhum sucesso foi confirmado.");}
  finally{submit.disabled=false;submit.innerHTML='Enviar candidatura de teste <span aria-hidden="true">→</span>';}
 });
 restart.addEventListener("click",()=>{form.reset();submittedKey=crypto.randomUUID();success.hidden=true;form.hidden=false;setStep(1);});
})();
