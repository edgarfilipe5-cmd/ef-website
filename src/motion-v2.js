import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

let started=false;
const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine=()=>window.matchMedia("(pointer:fine)").matches;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

function reveal(){
  document.body.classList.add("motion-ready");
  const selectors=[
    ".hero-copy>*",".signal-grid>div",".section-head>*",".card",".app-copy>*",".screen-frame",
    ".journey article",".offer-panel>*",".teaser-photo",".teaser-copy>*",".faq-grid>*",
    ".route article",".feature-box",".fit-box",".app-show-copy>*",".app-show-visual",
    ".method-step",".principle",".measure-row span",".belief",".format",".location-band .wrap>*",
    ".final-grid>*"
  ];
  const nodes=[...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))];
  nodes.forEach((el,i)=>{el.dataset.reveal="";el.style.setProperty("--delay",`${Math.min((i%6)*55,275)}ms`)});
  if(reduce()){nodes.forEach(el=>el.classList.add("in-view"));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in-view");io.unobserve(e.target)}}),{threshold:.10,rootMargin:"0px 0px -4% 0px"});
  nodes.forEach(el=>io.observe(el));
}

function tilt(){
  const nodes=[...document.querySelectorAll(".card,.feature-box,.belief,.principle,.format,.fit-box,.route article,.journey article,.method-step,.screen-frame")];
  nodes.forEach(el=>el.classList.add("motion-tilt"));
  if(!fine()||reduce())return;
  nodes.forEach(el=>{
    el.addEventListener("pointermove",e=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      const rx=clamp(-y*7,-5,5), ry=clamp(x*9,-7,7);
      el.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    el.addEventListener("pointerleave",()=>el.style.transform="");
  });
}

function parallax(){
  const photos=[...document.querySelectorAll(".hero-photo,.teaser-photo")];
  photos.forEach(x=>x.classList.add("parallax-photo"));
  if(reduce())return;
  let ticking=false;
  const draw=()=>{
    const vh=innerHeight;
    photos.forEach(box=>{
      const img=box.querySelector("img"); if(!img)return;
      const r=box.getBoundingClientRect();
      if(r.bottom<0||r.top>vh)return;
      const p=(r.top+ r.height/2 - vh/2)/vh;
      img.style.transform=`translateY(${p*-18}px) scale(1.045)`;
    });
    ticking=false;
  };
  addEventListener("scroll",()=>{if(!ticking){requestAnimationFrame(draw);ticking=true}},{passive:true});
  draw();
}

function pointerGlow(){
  if(!fine()||reduce())return;
  addEventListener("pointermove",e=>{
    document.documentElement.style.setProperty("--mx",e.clientX+"px");
    document.documentElement.style.setProperty("--my",e.clientY+"px");
  },{passive:true});
}

function navMotion(){
  const nav=document.querySelector(".site-nav");
  const draw=()=>nav?.classList.toggle("scrolled",scrollY>18);
  addEventListener("scroll",draw,{passive:true}); draw();
}

function magneticButtons(){
  if(!fine()||reduce())return;
  document.querySelectorAll(".btn,.nav-cta").forEach(el=>{
    el.addEventListener("pointermove",e=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-(r.left+r.width/2))*.08;
      const y=(e.clientY-(r.top+r.height/2))*.08;
      el.style.transform=`translate(${x}px,${y}px)`;
    });
    el.addEventListener("pointerleave",()=>el.style.transform="");
  });
}

function orbitalWebGL(){
  const canvas=document.getElementById("orbital-webgl");
  if(!canvas||reduce())return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"})}catch(_){return}
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  camera.position.z=8.2;
  const group=new THREE.Group();
  scene.add(group);

  const gold=new THREE.MeshPhysicalMaterial({color:0xE3BC66,metalness:.98,roughness:.17,clearcoat:1,clearcoatRoughness:.08});
  const gun=new THREE.MeshPhysicalMaterial({color:0x777777,metalness:.94,roughness:.22,clearcoat:.7,transparent:true,opacity:.92});
  const faint=new THREE.MeshStandardMaterial({color:0xE3BC66,metalness:.8,roughness:.26,transparent:true,opacity:.22});

  // Thin metallic orbital rings.
  [[2.08,.012,.84,.12,.16],[1.72,.010,.12,1.10,.36],[2.45,.009,.54,.62,1.10]].forEach(([r,t,rx,ry,rz],i)=>{
    const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,200),i===1?gun:faint);
    m.rotation.set(rx,ry,rz);group.add(m);
  });

  // Orbiting metallic spheres.
  const spheres=[];
  const defs=[
    [2.2,0.14,0,0],[1.75,0.10,1.6,1],[2.55,0.11,3.1,0],
    [2.0,0.08,4.5,1],[1.58,0.075,5.4,0],[2.35,0.095,2.25,1]
  ];
  defs.forEach(([radius,size,angle,silver],i)=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,24,24),silver?gun:gold);
    mesh.userData={radius,angle,speed:.13+i*.017,yamp:.42+(i%3)*.12,phase:i*.8};
    group.add(mesh);spheres.push(mesh);
  });

  // Subtle star field / metallic dust.
  const count=220;
  const pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const r=2.7+Math.random()*2.2,a=Math.random()*Math.PI*2;
    pos[i*3]=Math.cos(a)*r;pos[i*3+1]=(Math.random()-.5)*3.8;pos[i*3+2]=Math.sin(a)*r*.5;
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:0xF6DA8E,size:.018,transparent:true,opacity:.35,sizeAttenuation:true}));
  group.add(pts);

  scene.add(new THREE.AmbientLight(0xffffff,.42));
  const key=new THREE.PointLight(0xffdf91,18,20);key.position.set(3.5,2.6,5);scene.add(key);
  const rim=new THREE.PointLight(0xffffff,8,18);rim.position.set(-3,-2,3);scene.add(rim);

  let tx=0,ty=0,mx=0,my=0;
  if(fine()){
    canvas.parentElement?.addEventListener("pointermove",e=>{
      const r=canvas.getBoundingClientRect();
      tx=(e.clientX-r.left)/r.width-.5;
      ty=(e.clientY-r.top)/r.height-.5;
    },{passive:true});
  }
  const resize=()=>{
    const w=canvas.clientWidth||500,h=canvas.clientHeight||500;
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.05:1.55));
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    group.scale.setScalar(innerWidth<760?.78:1);
  };
  addEventListener("resize",resize,{passive:true});resize();

  const clock=new THREE.Clock();
  function frame(){
    const t=clock.getElapsedTime();
    mx+=(tx-mx)*.025;my+=(ty-my)*.025;
    group.rotation.y=t*.055+mx*.14;
    group.rotation.x=my*-.08;
    group.rotation.z=Math.sin(t*.22)*.022;
    spheres.forEach((s,i)=>{
      const u=s.userData;
      const a=u.angle+t*u.speed;
      s.position.x=Math.cos(a)*u.radius;
      s.position.z=Math.sin(a)*u.radius*.50;
      s.position.y=Math.sin(a*1.15+u.phase)*u.yamp;
    });
    pts.rotation.y=t*.015;
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  frame();
}

export function initMotion(){
  if(started)return; started=true;
  reveal();tilt();parallax();pointerGlow();navMotion();magneticButtons();orbitalWebGL();
}
