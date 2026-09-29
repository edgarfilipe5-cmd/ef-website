import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer:fine)").matches;
document.body.classList.add("motion-ready");

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const lerp=(a,b,t)=>a+(b-a)*t;

function setupReveal(){
  const targets=[
    ".problem .sticky",".problem .split>div:last-child",
    "#coaching .sticky","#coaching .feature",
    ".motion-copy",
    "#metodo .sticky","#metodo .step",
    ".section:not(#coaching):not(#metodo):not(#faq) .sticky",
    ".goal-card",".about-copy>*",".presential-copy>*","#faq .faq-grid>div",
    ".final .wrap>*"
  ];
  const nodes=[...new Set(targets.flatMap(s=>[...document.querySelectorAll(s)]))];
  nodes.forEach((el,i)=>{
    el.dataset.reveal="";
    el.style.setProperty("--reveal-delay",`${Math.min((i%6)*55,275)}ms`);
  });
  if(reduce){ nodes.forEach(el=>el.classList.add("in-view")); return; }
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:"0px 0px -5% 0px"});
  nodes.forEach(el=>io.observe(el));
}

function setupScroll(){
  const bar=document.querySelector(".scroll-progress span");
  const nav=document.querySelector(".site-nav");
  const heroBg=document.querySelector(".hero-bg");
  let ticking=false;
  const draw=()=>{
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=clamp(scrollY/max,0,1);
    if(bar) bar.style.transform=`scaleX(${p})`;
    nav?.classList.toggle("scrolled",scrollY>24);
    if(heroBg && !reduce){
      heroBg.style.transform=`translate3d(0,${Math.min(scrollY*.08,42)}px,0) scale(${1+Math.min(scrollY/5000,.035)})`;
    }
    ticking=false;
  };
  addEventListener("scroll",()=>{if(!ticking){requestAnimationFrame(draw);ticking=true}},{passive:true});
  draw();
}

function setupPointer(){
  if(!finePointer || reduce) return;
  addEventListener("pointermove",e=>{
    document.body.style.setProperty("--pointer-x",e.clientX+"px");
    document.body.style.setProperty("--pointer-y",e.clientY+"px");
  },{passive:true});

  document.querySelectorAll(".hero-panel,.goal-card,.brand-core,.experience-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-2px)`;
    });
    card.addEventListener("pointerleave",()=>card.style.transform="");
  });

  document.querySelectorAll(".cta,.nav-apply").forEach(btn=>{
    btn.addEventListener("pointermove",e=>{
      const r=btn.getBoundingClientRect();
      const x=(e.clientX-(r.left+r.width/2))*.10;
      const y=(e.clientY-(r.top+r.height/2))*.10;
      btn.style.transform=`translate(${x}px,${y}px)`;
    });
    btn.addEventListener("pointerleave",()=>btn.style.transform="");
  });
}

function setup3D(){
  const canvas=document.getElementById("ef3d");
  if(!canvas || reduce) return;

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
  }catch(_){ return; }

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);
  camera.position.set(0,0,9);

  const group=new THREE.Group();
  scene.add(group);

  const knotMat=new THREE.MeshPhysicalMaterial({
    color:0xd4af37,
    metalness:.96,
    roughness:.18,
    clearcoat:1,
    clearcoatRoughness:.12,
    transparent:true,
    opacity:.94
  });
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(1.28,.16,220,26,2,3),knotMat);
  knot.rotation.set(.55,.35,.1);
  group.add(knot);

  const ringMat=new THREE.MeshStandardMaterial({
    color:0xe4c55f,
    metalness:.88,
    roughness:.25,
    transparent:true,
    opacity:.38
  });
  [
    [2.08,.016,.9,.1,.1],
    [1.72,.012,.1,1.22,.4],
    [2.48,.010,.55,.72,1.2]
  ].forEach(([radius,tube,rx,ry,rz])=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,220),ringMat);
    ring.rotation.set(rx,ry,rz);
    group.add(ring);
  });

  const shardMat=new THREE.MeshPhysicalMaterial({
    color:0xffffff,
    metalness:.72,
    roughness:.28,
    transparent:true,
    opacity:.16
  });
  for(let i=0;i<7;i++){
    const g=new THREE.BoxGeometry(.035+Math.random()*.025,.55+Math.random()*.6,.035+Math.random()*.025);
    const m=new THREE.Mesh(g,shardMat);
    const a=(i/7)*Math.PI*2;
    const r=2.0+Math.random()*.65;
    m.position.set(Math.cos(a)*r,(Math.random()-.5)*2.3,Math.sin(a)*r*.55);
    m.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
    group.add(m);
  }

  const count=360;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const radius=2.5+Math.random()*3.2;
    const theta=Math.random()*Math.PI*2;
    const y=(Math.random()-.5)*4.8;
    positions[i*3]=Math.cos(theta)*radius;
    positions[i*3+1]=y;
    positions[i*3+2]=Math.sin(theta)*radius*.52;
  }
  const ptsGeo=new THREE.BufferGeometry();
  ptsGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const pts=new THREE.Points(ptsGeo,new THREE.PointsMaterial({
    color:0xf6e2a0,size:.018,transparent:true,opacity:.42,sizeAttenuation:true
  }));
  group.add(pts);

  scene.add(new THREE.AmbientLight(0xffffff,.38));
  const key=new THREE.PointLight(0xffd969,22,24);
  key.position.set(4,3,6);
  scene.add(key);
  const fill=new THREE.PointLight(0xffffff,9,20);
  fill.position.set(-3,-2,4);
  scene.add(fill);

  let tx=0,ty=0,mx=0,my=0;
  if(finePointer){
    addEventListener("pointermove",e=>{
      tx=(e.clientX/innerWidth-.5);
      ty=(e.clientY/innerHeight-.5);
    },{passive:true});
  }

  const resize=()=>{
    const w=canvas.clientWidth||innerWidth;
    const h=canvas.clientHeight||innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.2:1.7));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    group.position.x=w<1000?1.0:2.9;
    group.position.y=w<700?.45:.25;
    group.scale.setScalar(w<700?.54:w<1000?.70:.92);
  };
  addEventListener("resize",resize,{passive:true});
  resize();

  const clock=new THREE.Clock();
  const animate=()=>{
    const t=clock.getElapsedTime();
    mx=lerp(mx,tx,.025); my=lerp(my,ty,.025);
    knot.rotation.x=.55+t*.12+my*.22;
    knot.rotation.y=.35+t*.18+mx*.34;
    group.rotation.z=Math.sin(t*.24)*.025;
    group.rotation.y=mx*.10+scrollY*.00018;
    group.position.y+=( (innerWidth<700?.45:.25) - scrollY*.00028 - group.position.y)*.035;
    pts.rotation.y=t*.012;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  };
  animate();
}

function setupBrandExperience(){
  const core=document.querySelector(".brand-core");
  const cards=[...document.querySelectorAll(".experience-card")];
  if(!reduce && core){
    core.animate([
      {opacity:0,transform:"translate(-50%,-46%) rotateY(-15deg) rotateX(7deg) scale(.90)"},
      {opacity:1,transform:"translate(-50%,-50%) rotateY(-7deg) rotateX(3deg) scale(1)"}
    ],{duration:1100,delay:160,easing:"cubic-bezier(.2,.75,.2,1)",fill:"both"});
  }
  if(!reduce){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.animate(
            [{opacity:.15,transform:"translateY(34px) scale(.985)"},{opacity:1,transform:"translateY(0) scale(1)"}],
            {duration:720,easing:"cubic-bezier(.2,.75,.2,1)",fill:"both"}
          );
          io.unobserve(entry.target);
        }
      });
    },{threshold:.16});
    cards.forEach(c=>io.observe(c));
  }
}

setupBrandExperience();
setupReveal();
setupScroll();
setupPointer();
setup3D();
