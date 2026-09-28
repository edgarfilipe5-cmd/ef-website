let data;
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const esc=(s='')=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=(sel,v)=>{const el=q(sel);if(el)el.innerHTML=v||''};
const resolvePath=p=>p?.startsWith('/')?'.'+p:p;

async function loadData(){
  data=await fetch('./content/site.json',{cache:'no-store'}).then(r=>r.json());
  render();
}

function mediaStyle(el,cfg){
  if(!el)return;
  el.style.objectPosition=`${cfg.focus_x??50}% ${cfg.focus_y??50}%`;
  el.style.transform=`scale(${(cfg.zoom??100)/100})`;
}

function loopVideo(el,cfg){
  if(!el)return;
  const start=+cfg.start||0;
  const configuredEnd=+cfg.end||999;
  el.addEventListener('loadedmetadata',()=>{
    const end=Math.min(configuredEnd,el.duration||configuredEnd);
    if(start<end)el.currentTime=start;
  });
  el.addEventListener('timeupdate',()=>{
    const end=Math.min(configuredEnd,el.duration||configuredEnd);
    if(el.currentTime>=end){
      el.currentTime=start;
      el.play().catch(()=>{});
    }
  });
}

function rows(items,type='feature'){
  return items.map((x,i)=>type==='feature'
    ? `<article class="feature"><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`
    : `<article class="step"><div class="n">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`
  ).join('');
}

function render(){
  const s=data.site;
  document.title=s.title;
  const meta=document.querySelector('meta[name="description"]');
  if(meta)meta.content=s.description;

  ['applyTop','applyHero','applyOnline','applyAbout','applyFinal'].forEach(id=>q('#'+id).href=s.application_url);
  q('#instagram').href=s.instagram_url;

  text('#heroTag',data.hero.tag);
  text('#heroTitle',data.hero.title);
  text('#heroSub',data.hero.subtitle);
  const hi=q('#heroImage');
  hi.src=resolvePath(data.hero.image);
  mediaStyle(hi,data.hero);
  q('#priceHero').textContent=s.price;
  q('#durationHero').textContent=s.duration;

  const goalBtns=qa('.goal-btn');
  const goalCopy=q('#goalCopy');
  goalBtns.forEach((b,i)=>{
    b.textContent=data.goals[i]?.title||'';
    b.onclick=()=>{
      goalBtns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      goalCopy.textContent=data.goals[i]?.text||'';
    };
  });
  goalCopy.textContent=data.goals[0]?.text||'';

  text('#problemTitle',data.problem.title);
  text('#problemBody',data.problem.body);
  text('#problemAccent',data.problem.accent);

  q('#onlineFeatures').innerHTML=rows(data.online.features);
  text('#onlineIntro',data.online.intro);

  const mv=q('#motionVideo');
  mv.poster=resolvePath(data.motion.poster||data.hero.image);
  if(data.motion.video){
    mv.src=resolvePath(data.motion.video);
    loopVideo(mv,data.motion);
  } else {
    mv.removeAttribute('src');
    mv.load();
  }
  mediaStyle(mv,data.motion);
  text('#motionTitle',data.motion.title);
  text('#motionBody',data.motion.body);

  text('#methodIntro',data.method.intro);
  q('#methodSteps').innerHTML=rows(data.method.steps,'step');

  text('#fitIntro',data.fit.intro);
  q('#fitSteps').innerHTML=rows(data.fit.items,'step');

  q('#processSteps').innerHTML=rows(data.process);

  text('#progressIntro',data.progress.intro);
  q('#progressCards').innerHTML=data.progress.items.map((x,i)=>
    `<article class="goal-card"><div class="num">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`
  ).join('');

  text('#aboutTitle',data.about.title);
  text('#aboutBody',data.about.body);
  const ai=q('#aboutImage');
  ai.src=resolvePath(data.about.image);
  mediaStyle(ai,data.about);
  q('#aboutPrice').textContent=s.price;
  q('#aboutDuration').textContent=s.duration;

  text('#presentialTitle',data.presential.title);
  text('#presentialBody',data.presential.body);
  const pv=q('#presentialVideo');
  pv.poster=resolvePath(data.presential.poster||data.about.image);
  if(data.presential.video){
    pv.src=resolvePath(data.presential.video);
    loopVideo(pv,data.presential);
  } else {
    pv.removeAttribute('src');
    pv.load();
  }
  mediaStyle(pv,data.presential);

  q('#faqList').innerHTML=data.faq.map(x=>
    `<details><summary>${esc(x.question)}</summary><p>${esc(x.answer)}</p></details>`
  ).join('');

  text('#finalTitle',data.final.title);
  text('#finalBody',data.final.body);
}

loadData();
