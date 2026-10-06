const ROOT=document.getElementById('site-root');
const PAGE=document.body.dataset.page||'home';
const esc=(v='')=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const path=v=>v&&v.startsWith('/')?'.'+v:v;
const img=(src,alt='',cls='')=>`<img class="${cls}" src="${path(src)}" alt="${esc(alt)}" loading="lazy">`;
const btn=(href,label,cls='btn-gold')=>`<a class="btn ${cls}" href="${href}">${esc(label)}</a>`;
const list=(items)=>items.map(x=>`<span>${esc(x)}</span>`).join('');
const cards=(items,dark=false)=>items.map((x,i)=>`<article class="card"><div class="num">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('');
function nav(d){
  const links=[['./coaching.html','Coaching'],['./app.html','App EF'],['./metodo.html','Método EF'],['./presencial.html','Presencial'],['./sobre.html','Sobre']];
  return `<header class="site-nav"><div class="nav-inner">
    <a class="brand" href="./index.html"><img src="./assets/brand/ef-horizontal-white.svg" alt="Edgar Filipe Personal Trainer"></a>
    <nav class="nav-links">${links.map(x=>`<a href="${x[0]}">${x[1]}</a>`).join('')}<a class="nav-cta" href="${d.site.application_url}">Candidatar-me</a></nav>
    <button class="menu-btn" aria-expanded="false">MENU</button>
  </div></header>
  <div class="drawer" aria-hidden="true">${links.map(x=>`<a href="${x[0]}">${x[1]}</a>`).join('')}<a class="apply" href="${d.site.application_url}">Candidatar-me</a></div>`;
}
function footer(d){
  return `<footer class="footer"><div class="wrap footer-inner"><img src="./assets/brand/ef-horizontal-white.svg" alt="Edgar Filipe Personal Trainer"><div><a href="${d.site.instagram_url}" target="_blank" rel="noopener">Instagram</a></div></div></footer>
  <a class="mobile-apply" href="${d.site.application_url}"><span>Candidatar-me</span><b>→</b></a>`;
}
function faq(d){return `<section class="section paper"><div class="wrap faq-grid"><div><div class="eyebrow">FAQ</div><h2>Antes de te candidatares.</h2></div><div>${d.faq.map(x=>`<details><summary>${esc(x.question)}</summary><p>${esc(x.answer)}</p></details>`).join('')}</div></div></section>`}
function finalCTA(d,title='Se queres deixar de improvisar, começa pela candidatura.'){return `<section class="final-cta"><div class="wrap final-grid"><h2>${title}</h2><div><p>Primeiro percebo o teu contexto. Se fizer sentido avançarmos, tratamos do resto a partir daí.</p>${btn(d.site.application_url,'Quero candidatar-me','btn-dark')}</div></div></section>`}
function home(d){
 const h=d.home;
 return `${nav(d)}
 <main>
 <section class="hero"><div class="wrap hero-grid"><div class="hero-copy"><div class="eyebrow">${esc(h.hero.eyebrow)}</div><h1>${h.hero.title}</h1><p class="hero-sub">${esc(h.hero.subtitle)}</p><div class="hero-meta"><span>PLANO PERSONALIZADO</span><span>APP EF</span><span>CHECK-INS</span><span>AJUSTES PELO PT</span></div><div class="actions">${btn(d.site.application_url,'Quero candidatar-me')}${btn('./coaching.html','Ver como funciona','btn-light')}</div></div><div class="hero-visual-3d" id="ef-orbital">
  <canvas class="orbital-webgl" id="orbital-webgl" aria-hidden="true"></canvas>
  <div class="orbital-stage">
    <div class="orbital-system" aria-hidden="true">
      <div class="orbital-glow"></div>
      <div class="orbit orbit-1">
        <i class="orbital-dot lg" style="--x:180px;--y:-5px;--z:22px"></i>
        <i class="orbital-dot silver sm" style="--x:-156px;--y:18px;--z:-8px"></i>
      </div>
      <div class="orbit orbit-2">
        <i class="orbital-dot silver" style="--x:120px;--y:-68px;--z:20px"></i>
        <i class="orbital-dot sm" style="--x:-92px;--y:92px;--z:-14px"></i>
      </div>
      <div class="orbit orbit-3">
        <i class="orbital-dot" style="--x:190px;--y:55px;--z:28px"></i>
        <i class="orbital-dot silver sm" style="--x:-190px;--y:-50px;--z:0px"></i>
        <i class="orbital-dot sm" style="--x:24px;--y:-120px;--z:34px"></i>
      </div>
      <div class="orbit orbit-4">
        <i class="orbital-dot silver" style="--x:38px;--y:154px;--z:18px"></i>
        <i class="orbital-dot sm" style="--x:-52px;--y:-154px;--z:0px"></i>
      </div>
      <div class="orbital-core"><img src="./assets/brand/ef-monogram-gold.svg" alt=""></div>
    </div>
  </div>
  <div class="orbital-label"><span>EF / PERFORMANCE SYSTEM</span><b>MÉTODO · APP · COACHING</b></div>
  <div class="hero-price"><b>${esc(d.site.price)}</b><span>${esc(d.site.duration)} · ${esc(d.site.payment_label)}</span></div>
</div></div></section>
 <div class="signal-strip"><div class="wrap signal-grid"><div><b>MÉTODO EF</b><span>Decisões com lógica</span></div><div><b>APP EF</b><span>Processo ligado</span></div><div><b>ACOMPANHAMENTO</b><span>Contexto real</span></div><div><b>12 SEMANAS</b><span>Tempo para aprender e ajustar</span></div></div></div>
 <section class="section paper"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${esc(h.problem.eyebrow)}</div><h2>${esc(h.problem.title)}</h2></div><p>${esc(h.problem.intro)}</p></div><div class="cards-3">${cards(h.problem.items)}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${esc(h.mechanism.eyebrow)}</div><h2>${esc(h.mechanism.title)}</h2></div><p>${esc(h.mechanism.intro)}</p></div><div class="cards-3">${h.mechanism.items.map(x=>`<article class="card mechanism-card"><div class="label">${esc(x.label)}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><a class="text-link" href="${x.link}">Saber mais →</a></article>`).join('')}</div></div></section>
 <section class="section app-preview"><div class="wrap app-grid"><div class="app-copy"><div class="eyebrow">${esc(h.app_teaser.eyebrow)}</div><h2>${esc(h.app_teaser.title)}</h2><p class="lead">${esc(h.app_teaser.body)}</p><div class="bullet-list">${list(h.app_teaser.bullets)}</div>${btn('./app.html','Conhecer a App EF')}</div><div class="screen-frame">${img(h.app_teaser.image,'App EF — treino do dia')}</div></div></section>
 <section class="section"><div class="wrap"><div class="section-head"><div><div class="eyebrow">${esc(h.journey.eyebrow)}</div><h2>${esc(h.journey.title)}</h2></div><p>Tu vês clareza. Por trás existe um processo que recolhe contexto e transforma essa informação em melhores decisões.</p></div><div class="journey">${h.journey.items.map((x,i)=>`<article><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div><a class="text-link" href="./coaching.html" style="margin-top:24px">Ver a rota completa de acompanhamento →</a></div></section>
 <section class="section dark"><div class="wrap offer-panel"><div><div class="eyebrow">${esc(h.offer.eyebrow)}</div><h2>${esc(h.offer.title)}</h2><p class="lead">${esc(h.offer.body)}</p><div class="price-row"><div><strong>${esc(d.site.price)}</strong><small>${esc(d.site.duration)} · ${esc(d.site.payment_label)}</small></div>${btn(d.site.application_url,'Candidatar-me')}</div></div><div class="offer-included">${h.offer.included.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><div class="teaser-photo">${img(h.about_teaser.image,'Edgar Filipe')}</div><div class="teaser-copy"><div class="eyebrow">${esc(h.about_teaser.eyebrow)}</div><h2>${esc(h.about_teaser.title)}</h2><p class="lead">${esc(h.about_teaser.body)}</p><a class="text-link" href="./sobre.html">Conhecer o Edgar →</a></div></div></section>
 <section class="section"><div class="wrap grid-2"><div class="teaser-copy"><div class="eyebrow">${esc(h.presential_teaser.eyebrow)}</div><h2>${esc(h.presential_teaser.title)}</h2><p class="lead">${esc(h.presential_teaser.body)}</p><a class="text-link" href="./presencial.html">Conhecer o Personal Training →</a></div><div class="teaser-photo">${img(h.presential_teaser.image,'Personal Training EF')}</div></div></section>
 ${faq(d)}${finalCTA(d)} </main>${footer(d)}`;
}
function coaching(d){
 const c=d.coaching;
 return `${nav(d)}<main>
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(c.hero.eyebrow)}</div><h1>${c.hero.title}</h1><p>${esc(c.hero.subtitle)}</p><div class="actions">${btn(d.site.application_url,'Quero candidatar-me')}${btn('#rota','Ver a rota','btn-light')}</div></div><div class="hero-photo">${img(c.hero.image,'EF Coaching')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><div><div class="eyebrow">A proposta</div><h2>${esc(c.promise.title)}</h2></div><p class="lead muted">${esc(c.promise.body)}</p></div></section>
 <section class="section" id="rota"><div class="wrap"><div class="section-head"><div><div class="eyebrow">Rota de acompanhamento</div><h2>Do primeiro contacto às decisões semanais.</h2></div><p>O objetivo é saberes sempre o que está a acontecer e qual é o próximo passo.</p></div><div class="route">${c.route.map((x,i)=>`<article><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><div><div class="eyebrow">O que recebes</div><h2>Um sistema completo durante 12 semanas.</h2></div><p>O plano, a App e o acompanhamento existem para funcionar em conjunto.</p></div><div class="feature-grid">${c.included.map((x,i)=>`<article class="feature-box"><div class="eyebrow">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section paper"><div class="wrap fit-grid"><div class="fit-box"><div class="eyebrow">Para quem é</div><h3>${esc(c.fit.good_title)}</h3><ul>${c.fit.good.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="fit-box"><div class="eyebrow">Limites claros</div><h3>${esc(c.fit.bad_title)}</h3><ul>${c.fit.bad.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></section>
 <section class="section dark"><div class="wrap offer-panel"><div><div class="eyebrow">EF Coaching</div><h2>${esc(d.site.duration)} de acompanhamento.</h2><p class="lead">Primeiro candidatas-te. Só avançamos se o acompanhamento fizer sentido para ti.</p></div><div><div class="price-row"><div><strong>${esc(d.site.price)}</strong><small>${esc(d.site.payment_label)}</small></div>${btn(d.site.application_url,'Preencher candidatura')}</div></div></div></section>
 ${faq(d)}${finalCTA(d,'Treino personalizado. Acompanhamento real. Uma direção clara.')} </main>${footer(d)}`;
}
function appPage(d){
 const a=d.app;
 return `${nav(d)}<main>
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(a.hero.eyebrow)}</div><h1>${a.hero.title}</h1><p>${esc(a.hero.subtitle)}</p><div class="actions">${btn(d.site.application_url,'Candidatar-me ao EF Coaching')}${btn('#experiencia','Ver a experiência','btn-light')}</div></div><div class="screen-frame">${img(a.hero.image,'App EF')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><h2>${esc(a.intro_title)}</h2><p class="lead muted">${esc(a.intro_body)}</p></div></section>
 <div id="experiencia">${a.screens.map((x,i)=>`<section class="app-section ${i%2?'paper':''}"><div class="wrap app-show"><div class="app-show-copy"><div class="eyebrow">${esc(x.label)}</div><h2>${esc(x.title)}</h2><p class="lead">${esc(x.text)}</p></div><div class="app-show-visual"><div class="screen-frame">${img(x.image,x.title)}</div></div></div></section>`).join('')}</div>
 <section class="section dark"><div class="wrap grid-2"><h2>${esc(a.closing_title)}</h2><p class="lead">${esc(a.closing_body)}</p></div></section>
 ${finalCTA(d,'A App EF está incluída no acompanhamento.')} </main>${footer(d)}`;
}
function methodPage(d){
 const m=d.method;
 return `${nav(d)}<main>
 <section class="page-hero"><div class="wrap"><div class="eyebrow">${esc(m.hero.eyebrow)}</div><h1 style="max-width:10ch">${m.hero.title}</h1><p>${esc(m.hero.subtitle)}</p><div class="actions">${btn(d.site.application_url,'Candidatar-me')}${btn('#passos','Ver o método','btn-light')}</div></div></section>
 <section class="section paper" id="passos"><div class="wrap"><div class="section-head"><h2>Quatro decisões. Um processo.</h2><p>O objetivo não é complicar o treino. É garantir que cada decisão tem uma razão.</p></div><div class="method-steps">${m.steps.map((x,i)=>`<article class="method-step"><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><h2>O que orienta as decisões.</h2><p>A ciência dá princípios. O acompanhamento transforma esses princípios em decisões úteis para uma pessoa real.</p></div><div class="principles">${m.principles.map(x=>`<article class="principle"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section"><div class="wrap"><div class="section-head"><h2>O que observamos.</h2><p>Não dependemos de uma única métrica. Cruzamos informação de acordo com o objetivo.</p></div><div class="measure-row">${m.measure.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></section>
 ${finalCTA(d,'Não precisas de mais complexidade. Precisas de direção.')} </main>${footer(d)}`;
}
function aboutPage(d){
 const a=d.about;
 return `${nav(d)}<main>
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(a.hero.eyebrow)}</div><h1>${a.hero.title}</h1><p>${esc(a.hero.subtitle)}</p><div class="actions">${btn(d.site.application_url,'Candidatar-me')}${btn('./metodo.html','Conhecer o Método EF','btn-light')}</div></div><div class="hero-photo">${img(a.hero.image,'Edgar Filipe')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><h2>${esc(a.bio_title)}</h2><div class="bio-list">${a.bio.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><h2>O que valorizo no acompanhamento.</h2><p>Não procuro impressionar com complexidade. Procuro tornar as decisões mais claras e o processo mais sustentável.</p></div><div class="beliefs">${a.beliefs.map(x=>`<article class="belief"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><h2>${esc(a.why_title)}</h2><p class="lead muted">${esc(a.why_body)}</p></div></section>
 ${finalCTA(d,'Se procuras acompanhamento com contexto, começa por me contar onde estás.')} </main>${footer(d)}`;
}
function presencialPage(d){
 const p=d.presential;
 return `${nav(d)}<main>
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(p.hero.eyebrow)}</div><h1>${p.hero.title}</h1><p>${esc(p.hero.subtitle)}</p><div class="actions">${btn(d.site.instagram_url,'Pedir disponibilidade')}${btn('#formatos','Ver formatos','btn-light')}</div></div><div class="hero-photo">${img(p.hero.image,'Personal Training EF')}</div></div></section>
 <div class="location-band"><div class="wrap"><strong>${esc(p.location)}</strong><span>Sessões por marcação · disponibilidade limitada pelo horário presencial.</span></div></div>
 <section class="section paper" id="formatos"><div class="wrap"><div class="section-head"><h2>Escolhe o contexto. O acompanhamento mantém-se.</h2><p>O formato muda; a atenção à execução, progressão e contexto continua.</p></div><div class="formats">${p.formats.map((x,i)=>`<article class="format"><div class="eyebrow">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section"><div class="wrap"><div class="section-head"><h2>Como funciona.</h2><p>O presencial também segue uma rota clara para não transformar cada sessão numa aula isolada.</p></div><div class="journey">${p.process.map((x,i)=>`<article><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap grid-2"><h2>${esc(p.closing_title)}</h2><div><p class="lead">${esc(p.closing_body)}</p>${btn(d.site.instagram_url,'Falar comigo no Instagram')}</div></div></section>
 </main>${footer(d)}`;
}
function wireOrbital(){
 const stage=document.querySelector('#ef-orbital .orbital-stage');
 if(!stage||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(window.matchMedia('(pointer:fine)').matches){
   const host=document.getElementById('ef-orbital');
   host.addEventListener('pointermove',e=>{
     const r=host.getBoundingClientRect();
     const x=(e.clientX-r.left)/r.width-.5;
     const y=(e.clientY-r.top)/r.height-.5;
     stage.style.setProperty('--tilt-y',(x*7).toFixed(2)+'deg');
     stage.style.setProperty('--tilt-x',(-y*5).toFixed(2)+'deg');
   });
   host.addEventListener('pointerleave',()=>{
     stage.style.setProperty('--tilt-y','0deg');
     stage.style.setProperty('--tilt-x','0deg');
   });
 }
}
function wireMenu(){
 const b=document.querySelector('.menu-btn'),d=document.querySelector('.drawer');
 if(!b||!d)return;
 b.addEventListener('click',()=>{const o=d.classList.toggle('open');b.setAttribute('aria-expanded',String(o));d.setAttribute('aria-hidden',String(!o))});
 d.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{d.classList.remove('open');b.setAttribute('aria-expanded','false');d.setAttribute('aria-hidden','true')}));
}
fetch('./content/site.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
 document.title=PAGE==='home'?d.site.title:`${PAGE[0].toUpperCase()+PAGE.slice(1)} — EF`;
 const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=d.site.description;
 const render={home,coaching,app:appPage,method:methodPage,about:aboutPage,presential:presencialPage}[PAGE]||home;
 ROOT.innerHTML=render(d);wireMenu();wireOrbital();
 import('./src/motion-v2.js').then(m=>m.initMotion?.()).catch(()=>{});
}).catch(()=>{ROOT.innerHTML='<p style="padding:40px">Não foi possível carregar o website.</p>'});
