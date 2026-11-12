const ROOT=document.getElementById('site-root');
const PAGE=document.body.dataset.page||'home';
const esc=(v='')=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const planURL=weeks=>`./candidatura.html?plano=${encodeURIComponent(String(weeks))}#candidatura`;
const applicationURL=d=>{try{const u=new URL(d.site.application_url,location.href);return u.hostname==='www.edgarfilipe.pt'&&u.pathname==='/candidatura.html'?'./candidatura.html':u.href}catch{return './candidatura.html'}};
const path=v=>v&&v.startsWith('/')?'.'+v:v;
const img=(src,alt='',cls='')=>`<img class="${cls}" src="${path(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const btn=(href,label,cls='btn-gold')=>`<a class="btn ${cls}" href="${href}">${esc(label)}</a>`;
function nav(d){
  const links=[['./coaching.html','Online'],['./app.html','App EF'],['./presencial.html','Presencial'],['./sobre.html','O Edgar']];
  return `<a class="skip-link" href="#conteudo">Saltar para o conteúdo</a><header class="site-nav"><div class="nav-inner">
    <a class="brand" href="./"><img src="./assets/brand/ef-horizontal-white.svg" alt="Edgar Filipe Personal Trainer"></a>
    <nav class="nav-links">${links.map(x=>`<a href="${x[0]}"${({coaching:"Online",app:"App EF",presential:"Presencial",about:"O Edgar"})[PAGE]===x[1]?' aria-current="page"':''}>${x[1]}</a>`).join('')}<a class="nav-cta" href="${applicationURL(d)}">Candidatar-me</a></nav>
    <button class="menu-btn" aria-label="Abrir menu de navegação" aria-controls="site-menu" aria-expanded="false">MENU</button>
  </div></header>
  <div class="drawer" id="site-menu" aria-hidden="true">${links.map(x=>`<a href="${x[0]}"${({coaching:"Online",app:"App EF",presential:"Presencial",about:"O Edgar"})[PAGE]===x[1]?' aria-current="page"':''}>${x[1]}</a>`).join('')}<a class="apply" href="${applicationURL(d)}">Candidatar-me</a></div>`;
}
function footer(d){
  return `<footer class="footer"><div class="wrap footer-inner"><img src="./assets/brand/ef-horizontal-white.svg" alt="Edgar Filipe Personal Trainer"><div><a href="./metodo.html">Método EF</a> · <a href="./privacidade-candidatura.html">Privacidade</a> · <a href="${d.site.instagram_url}" target="_blank" rel="noopener">Instagram</a></div></div></footer>
  <a class="mobile-apply" href="${applicationURL(d)}"><span>Quero acompanhamento</span><b>→</b></a>`;
}
function faq(d){return `<section class="section paper"><div class="wrap faq-grid"><div><div class="eyebrow">FAQ</div><h2>Antes de te candidatares.</h2></div><div>${d.faq.map(x=>`<details><summary>${esc(x.question)}</summary><p>${esc(x.answer)}</p></details>`).join('')}</div></div></section>`}
function finalCTA(d,title='Se queres deixar de improvisar, começa pela candidatura.'){return `<section class="final-cta"><div class="wrap final-grid"><h2>${title}</h2><div><p>Primeiro percebo o teu contexto. Se fizer sentido avançarmos, tratamos do resto a partir daí.</p>${btn(applicationURL(d),'Quero candidatar-me','btn-dark')}</div></div></section>`}
function offerChoices(d){
 const offers=d.site.offers;
 return `<section class="section paper" id="planos-online"><div class="wrap">
 <div class="section-head"><h2>Escolhe o teu programa</h2><p>Em todas as durações tens plano de treino personalizado, acesso à App EF, check-ins, feedback e ajustes pelo treinador.</p></div>
 <nav class="program-compare" aria-label="Comparação rápida dos programas">
 ${offers.map(o=>`<a class="${o.recommended?'compare-recommended':''}" href="#programa-${o.weeks}"><span>${esc(o.name)}</span><strong>${esc(o.price)}</strong><small>${o.weeks} semanas</small></a>`).join('')}
 </nav>
 <div class="programs">${offers.map(o=>`<article id="programa-${o.weeks}" class="program ${o.recommended?'program-featured':''}">
 <h3>${esc(o.name)}</h3>${o.recommended?'<p class="program-value">Menor preço por semana</p>':''}
 <strong>${esc(o.price)}</strong><p>${o.weeks} semanas · ${esc(o.weekly)}</p>
 ${btn(planURL(o.weeks),'Escolher '+o.weeks+' semanas',o.recommended?'btn-gold':'btn-outline')}
 </article>`).join('')}</div>
 <p class="program-note">Preço total por programa. O pagamento só é combinado após o contacto.</p>
 </div></section>`;
}
function appScreen(){
 return `<figure class="app-device"><div class="app-device-shell"><img src="./assets/media/ef-app-online-atual.webp" width="600" height="840" alt="App EF Online no iPhone com o treino do dia, botão para retomar a sessão e acesso à evolução" loading="lazy" decoding="async"></div><figcaption>Captura da App EF Online no iPhone</figcaption></figure>`;
}
function experience(){
 const slides=[
  ['Método EF','Acompanhamento personalizado','Construo o treino à tua medida e ajusto-o com base na tua evolução.','./metodo.html','Conhecer o método',`<img src="./assets/media/edgar-metodo-drive.webp" alt="Edgar Filipe a treinar remada no estúdio" loading="lazy" decoding="async">`],
  ['App EF Online','O teu treino na App EF','Tens o plano, os registos de treino e os check-ins num só lugar.','./app.html','Conhecer a App EF',appScreen()],
  ['Programas EF','Escolhe o teu programa','O acompanhamento é igual nas três durações.','#planos-online','Comparar programas','<ul class="experience-prices"><li>4 semanas <b>99 €</b></li><li>8 semanas <b>149 €</b></li><li>12 semanas <b>199 €</b></li></ul>'],
  ['Candidatura','Começa a tua transformação','Escolhe o programa e envia a candidatura. Analiso as tuas respostas e falo contigo antes de começarmos.','#planos-online','Escolher programa','<ol class="experience-steps"><li>Escolher programa</li><li>Enviar candidatura</li><li>Falar com o Edgar</li><li>Iniciar o acompanhamento</li></ol>']
 ];
 return `<section class="experience" id="acompanhamento" aria-labelledby="experience-title">
 <div class="wrap experience-heading"><h2 id="experience-title">Como vais treinar com a EF</h2></div>
 <div class="experience-stage" role="region" aria-label="Carrossel da experiência EF" tabindex="0">
 ${slides.map(([label,title,body,href,cta,visual],i)=>`<article class="experience-slide" data-slide="${i}"><div class="experience-copy"><p class="eyebrow">${label}</p><h3>${title}</h3><p>${body}</p>${btn(href,cta,'btn-light')}</div><div class="experience-visual">${visual}</div></article>`).join('')}
 </div>
 <div class="experience-controls" hidden><button type="button" data-step="-1" aria-label="Cartão anterior">←</button><span class="experience-status" aria-live="polite"></span><button type="button" data-step="1" aria-label="Cartão seguinte">→</button></div>
 </section>`;
}
function home(d){
 return `${nav(d)}<main id="conteudo">
 <section class="hero ef-intro"><div class="wrap hero-grid">
 <div class="hero-copy"><div class="eyebrow">Personal training online</div><h1>O teu treino.<br><span>Comigo a acompanhar.</span></h1>
 <p class="hero-sub">Treina no ginásio ou em casa com um plano feito para ti, acompanhamento do teu treinador e a App EF.</p>
 <div class="actions">${btn('#planos-online','Ver os 3 programas')}${btn('#acompanhamento','Explorar o acompanhamento','btn-light')}</div>
 <p class="hero-note">Desde 99 € · candidatura gratuita</p></div>
 <figure class="hero-human"><img src="./assets/media/retrato-ef-drive.webp" srcset="./assets/media/retrato-ef-drive-mobile.webp 480w, ./assets/media/retrato-ef-drive.webp 880w" sizes="(max-width:760px) calc(100vw - 40px), 480px" alt="Edgar Filipe, Personal Trainer" fetchpriority="high" decoding="async" width="880" height="1564"><figcaption><strong>Edgar Filipe</strong><span>Personal Trainer</span></figcaption></figure>
 </div></section>
 ${experience()}
 ${offerChoices(d)}
 <section class="section dark" id="como-funciona"><div class="wrap app-grid"><div class="app-copy"><div class="eyebrow">Incluída nos três programas</div><h2>O teu plano sempre à mão</h2><p class="lead">O teu plano, o treino em curso e a tua evolução ficam no mesmo lugar.</p><ul class="app-actions"><li>Ver o treino do dia</li><li>Retomar a sessão</li><li>Consultar a evolução</li></ul>${btn('./app.html','Ver a App EF')}</div>${appScreen()}</div></section>
 <section class="section paper"><div class="wrap grid-2 coaching-example"><div><div class="eyebrow">Exemplo de um check-in</div><h2>O plano acompanha a tua semana</h2></div><p>Imagina que só consegues treinar duas vezes numa semana em que tinhas três sessões. No check-in, revemos o que fizeste e ajusto as duas sessões seguintes aos exercícios prioritários e ao tempo que tens disponível.</p></div></section>
 <section class="section paper"><div class="wrap grid-2"><div class="teaser-photo">${img(d.home.about_teaser.image,'Edgar Filipe, Personal Trainer')}</div><div class="teaser-copy"><h2>Sou o Edgar Filipe</h2><p class="lead">Sou licenciado em Ciências do Desporto e trabalho com treino personalizado online e presencial. O teu objetivo e a tua rotina orientam o plano. O que registas no treino e o teu feedback ajudam-me a decidir quando progredir ou ajustar.</p><div class="actions">${btn('./sobre.html','Conhecer o Edgar','btn-dark')}<a class="text-link" href="./metodo.html">Ver o Método EF →</a></div></div></div></section>
 ${faq(d)}
 <section class="presential-note"><div class="wrap"><h3>Preferes treinar presencialmente em Miramar?</h3><a class="text-link" href="./presencial.html">Conhecer o presencial →</a></div></section>
 ${finalCTA(d,'Vamos falar sobre o teu treino?')}
 </main>${footer(d)}`;
}

function coaching(d){
 return `${nav(d)}<main id="conteudo">
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">Acompanhamento online</div><h1>Treino feito para ti. <span>Acompanhado online.</span></h1><p>Se queres ganhar força, melhorar a composição corporal ou voltar a treinar com consistência, construo um plano para o teu objetivo, rotina e equipamento.</p><div class="actions">${btn('#planos-online','Ver programas')}${btn('#rota','Como funciona','btn-light')}</div></div><div class="hero-photo">${img('/assets/media/edgar-online-drive.webp','Edgar Filipe a treinar na polia')}</div></div></section>
 ${offerChoices(d)}
 <section class="section" id="rota"><div class="wrap"><div class="section-head"><h2>Da candidatura ao primeiro treino</h2></div><ol class="coaching-steps">
 <li><h3>Escolhe um programa</h3><p>Seleciona 4, 8 ou 12 semanas e envia a candidatura com o teu objetivo.</p></li>
 <li><h3>Falamos sobre o teu treino</h3><p>Analiso o teu contexto e entro em contacto. Se avançarmos, combinamos o pagamento e o início.</p></li>
 <li><h3>Começa na App EF</h3><p>Recebes o plano personalizado. Revemos os teus registos e o teu feedback para ajustar o treino ao longo do programa.</p></li>
 </ol></div></section>
 <section class="section dark"><div class="wrap app-grid"><div><h2>Da sessão ao feedback</h2><p class="lead">Na App EF consultas o treino e partilhas os teus registos comigo. Nos check-ins revemos como correu a semana e o que precisa de ser ajustado.</p>${btn('./app.html','Conhecer a App EF')}</div>${appScreen()}</div></section>
 ${faq(d)}${finalCTA(d,'Queres começar a treinar com acompanhamento?')}
 </main>${footer(d)}`;
}
function appPage(d){
 return `${nav(d)}<main id="conteudo">
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">Incluída em todos os programas</div><h1>O teu treino na <span>App EF</span></h1><p>Abre o treino do dia, retoma uma sessão em curso e consulta a tua evolução. O plano que preparo para ti está sempre à mão.</p><div class="actions">${btn('./coaching.html#planos-online','Ver programas')}</div></div>${appScreen()}</div></section>
 <section class="section paper"><div class="wrap"><div class="section-head"><h2>Do plano à tua evolução</h2></div><div class="benefits-grid">
 <article class="card"><h3>Treino do dia</h3><p>Consulta o plano que preparei e os exercícios da sessão.</p></article>
 <article class="card"><h3>Retomar a sessão</h3><p>Vê quantos exercícios já concluíste e continua o treino em curso.</p></article>
 <article class="card"><h3>Progresso</h3><p>Consulta a consistência das sessões e a evolução ao longo do plano.</p></article>
 <article class="card"><h3>Feedback</h3><p>Uso os teus registos para orientar a progressão e ajustar o plano.</p></article>
 </div></div></section>
 ${finalCTA(d,'Treina com um plano feito para ti')}
 </main>${footer(d)}`;
}
function methodPage(d){
 const m=d.method;
 return `${nav(d)}<main id="conteudo">
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(m.hero.eyebrow)}</div><h1 style="max-width:10ch">${m.hero.title}</h1><p>${esc(m.hero.subtitle)}</p><div class="actions">${btn(applicationURL(d),'Candidatar-me')}${btn('#passos','Ver o método','btn-light')}</div></div><div class="hero-photo">${img('/assets/media/edgar-metodo-drive.webp','Edgar Filipe a executar uma remada com halter')}</div></div></section>
 <section class="section paper" id="passos"><div class="wrap"><div class="section-head"><h2>Quatro decisões. Um processo.</h2><p>O objetivo não é complicar o treino. É garantir que cada decisão tem uma razão.</p></div><div class="method-steps">${m.steps.map((x,i)=>`<article class="method-step"><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><h2>O que orienta as decisões.</h2><p>A ciência dá princípios. O acompanhamento transforma esses princípios em decisões úteis para uma pessoa real.</p></div><div class="principles">${m.principles.map(x=>`<article class="principle"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section"><div class="wrap"><div class="section-head"><h2>O que observamos.</h2><p>Não dependemos de uma única métrica. Cruzamos informação de acordo com o objetivo.</p></div><div class="measure-row">${m.measure.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></section>
 ${finalCTA(d,'Não precisas de mais complexidade. Precisas de direção.')} </main>${footer(d)}`;
}
function aboutPage(d){
 const a=d.about;
 return `${nav(d)}<main id="conteudo">
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(a.hero.eyebrow)}</div><h1>${a.hero.title}</h1><p>${esc(a.hero.subtitle)}</p><div class="actions">${btn(applicationURL(d),'Candidatar-me')}${btn('./metodo.html','Conhecer o Método EF','btn-light')}</div></div><div class="hero-photo">${img(a.hero.image,'Edgar Filipe')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><h2>${esc(a.bio_title)}</h2><div class="bio-list">${a.bio.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap"><div class="section-head"><h2>O que valorizo no acompanhamento.</h2><p>Não procuro impressionar com complexidade. Procuro tornar as decisões mais claras e o processo mais sustentável.</p></div><div class="beliefs">${a.beliefs.map(x=>`<article class="belief"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section paper"><div class="wrap grid-2"><h2>${esc(a.why_title)}</h2><p class="lead muted">${esc(a.why_body)}</p></div></section>
 ${finalCTA(d,'Se procuras acompanhamento com contexto, começa por me contar onde estás.')} </main>${footer(d)}`;
}
function presencialPage(d){
 const p=d.presential;
 return `${nav(d)}<main id="conteudo">
 <section class="page-hero"><div class="wrap page-hero-grid"><div><div class="eyebrow">${esc(p.hero.eyebrow)}</div><h1>${p.hero.title}</h1><p>${esc(p.hero.subtitle)}</p><div class="actions">${btn(d.site.instagram_url,'Pedir disponibilidade')}${btn('#formatos','Ver formatos','btn-light')}</div></div><div class="hero-photo">${img(p.hero.image,'Personal Training EF')}</div></div></section>
 <div class="location-band"><div class="wrap"><strong>${esc(p.location)}</strong><span>Sessões por marcação · disponibilidade limitada pelo horário presencial.</span></div></div>
 <section class="section paper" id="formatos"><div class="wrap"><div class="section-head"><h2>Escolhe o contexto. O acompanhamento mantém-se.</h2><p>O formato muda; a atenção à execução, progressão e contexto continua.</p></div><div class="formats">${p.formats.map((x,i)=>`<article class="format"><div class="eyebrow">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section"><div class="wrap"><div class="section-head"><h2>Como funciona.</h2><p>O presencial também segue uma rota clara para não transformar cada sessão numa aula isolada.</p></div><div class="journey">${p.process.map((x,i)=>`<article><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div></div></section>
 <section class="section dark"><div class="wrap grid-2"><h2>${esc(p.closing_title)}</h2><div><p class="lead">${esc(p.closing_body)}</p>${btn(d.site.instagram_url,'Falar comigo no Instagram')}</div></div></section>
<section class="section paper"><div class="wrap training-video-grid"><div><div class="eyebrow">Edgar Filipe · em treino</div><h2>Preparar.<br>Executar.<br>Repetir com intenção.</h2><p class="lead muted">Um pouco do meu treino no estúdio. No teu acompanhamento, os exercícios e a organização são escolhidos para ti.</p></div><figure class="training-video"><video controls playsinline muted loop preload="none" poster="./assets/media/treino-poster.jpg" aria-label="Edgar a preparar a polia, executar uma remada e treinar com bola"><source src="./assets/media/edgar-treino-web.mp4" type="video/mp4">O teu navegador não suporta vídeo.</video><figcaption>Imagens do meu treino · vídeo sem áudio.</figcaption></figure></div></section> </main>${footer(d)}`;
}
function wireExperience(){
 const stage=document.querySelector('.experience-stage');
 if(!stage)return;
 const slides=[...stage.querySelectorAll('.experience-slide')];
 const controls=document.querySelector('.experience-controls');
 const status=controls.querySelector('.experience-status');
 let current=0;
 let start=null;
 function show(index){
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
   let offset=i-current;
   if(offset>2)offset-=slides.length;
   if(offset<-1)offset+=slides.length;
   slide.dataset.position=String(offset);
   slide.inert=offset!==0;
   slide.setAttribute('aria-hidden',String(offset!==0));
  });
  status.textContent=`${current+1} de ${slides.length} · ${slides[current].querySelector('h3').textContent}`;
 }
 stage.classList.add('is-interactive');
 controls.hidden=false;
 show(0);
 controls.querySelectorAll('button').forEach(button=>{
  button.addEventListener('click',()=>show(current+Number(button.dataset.step)));
 });
 stage.addEventListener('keydown',event=>{
  const keys={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:slides.length-1};
  if(!Object.hasOwn(keys,event.key))return;
  event.preventDefault();
  stage.focus({preventScroll:true});
  show(keys[event.key]);
 });
 stage.addEventListener('touchstart',event=>{
  start=event.touches.length===1?event.touches[0]:null;
 },{passive:true});
 stage.addEventListener('touchcancel',()=>{start=null});
 stage.addEventListener('touchend',event=>{
  if(!start)return;
  const touch=event.changedTouches[0];
  const dx=touch.clientX-start.clientX;
  const dy=touch.clientY-start.clientY;
  start=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){
   if(stage.contains(document.activeElement))stage.focus({preventScroll:true});
   show(current+(dx<0?1:-1));
  }
 },{passive:true});
}
function wireMenu(){
 const b=document.querySelector('.menu-btn'),d=document.querySelector('.drawer');
 if(!b||!d)return;
 b.addEventListener('click',()=>{const o=d.classList.toggle('open');b.setAttribute('aria-expanded',String(o));d.setAttribute('aria-hidden',String(!o))});
 d.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{d.classList.remove('open');b.setAttribute('aria-expanded','false');d.setAttribute('aria-hidden','true')}));
}
if(ROOT.querySelector('main')){
 wireMenu();
 wireExperience();
}
