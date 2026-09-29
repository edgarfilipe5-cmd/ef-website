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
    ".goal-card",".avatar-story-copy",".avatar-window",".about-copy>*",".presential-copy>*","#faq .faq-grid>div",
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

  document.querySelectorAll(".hero-panel,.goal-card,.avatar-stage,.avatar-window").forEach(card=>{
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
  camera.position.set(0,0,8);

  const group=new THREE.Group();
  group.position.set(2.7,.2,0);
  scene.add(group);

  const coreGeo=new THREE.IcosahedronGeometry(1.12,4);
  const coreMat=new THREE.MeshPhysicalMaterial({
    color:0xd4af37,
    metalness:.92,
    roughness:.24,
    clearcoat:1,
    clearcoatRoughness:.18,
    transparent:true,
    opacity:.94
  });
  const core=new THREE.Mesh(coreGeo,coreMat);
  group.add(core);

  const wire=new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.17,2),
    new THREE.MeshBasicMaterial({color:0xffefb0,wireframe:true,transparent:true,opacity:.11})
  );
  group.add(wire);

  const ringMat=new THREE.MeshStandardMaterial({
    color:0xc9a227,
    metalness:.9,
    roughness:.28,
    transparent:true,
    opacity:.72
  });
  [
    [1.82,.018,0,0,.25],
    [1.55,.013,Math.PI/2,.45,.2],
    [2.10,.012,.55,Math.PI/2,.8]
  ].forEach(([radius,tube,rx,ry,rz])=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,180),ringMat);
    ring.rotation.set(rx,ry,rz);
    group.add(ring);
  });

  const count=260;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const radius=2.25+Math.random()*2.5;
    const theta=Math.random()*Math.PI*2;
    const phi=Math.acos(2*Math.random()-1);
    positions[i*3]=radius*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1]=radius*Math.sin(phi)*Math.sin(theta);
    positions[i*3+2]=radius*Math.cos(phi);
  }
  const ptsGeo=new THREE.BufferGeometry();
  ptsGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const pts=new THREE.Points(ptsGeo,new THREE.PointsMaterial({
    color:0xf6e2a0,size:.018,transparent:true,opacity:.52,sizeAttenuation:true
  }));
  group.add(pts);

  scene.add(new THREE.AmbientLight(0xffffff,.46));
  const key=new THREE.PointLight(0xffdc75,18,20);
  key.position.set(4,3,5);
  scene.add(key);
  const rim=new THREE.PointLight(0xffffff,9,20);
  rim.position.set(-3,-2,3);
  scene.add(rim);

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
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.35:1.8));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    group.position.x=w<900?1.45:2.75;
    group.position.y=w<700?.9:.15;
    group.scale.setScalar(w<700?.68:w<1000?.82:1);
  };
  addEventListener("resize",resize,{passive:true});
  resize();

  const clock=new THREE.Clock();
  const animate=()=>{
    const t=clock.getElapsedTime();
    mx=lerp(mx,tx,.035); my=lerp(my,ty,.035);
    core.rotation.x=t*.16+my*.35;
    core.rotation.y=t*.22+mx*.5;
    wire.rotation.x=-t*.10;
    wire.rotation.y=t*.14;
    group.rotation.z=Math.sin(t*.28)*.05;
    group.rotation.y=mx*.12+scrollY*.00025;
    group.position.y+=( (innerWidth<700?.9:.15) - scrollY*.00065 - group.position.y)*.04;
    pts.rotation.y=t*.018;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  };
  animate();
}

setupReveal();
setupScroll();
setupPointer();
setup3D();
