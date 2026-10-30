import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const dist="dist";
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
for(const page of ["index.html","coaching.html","app.html","metodo.html","sobre.html","presencial.html","candidatura.html","candidatura-publica.html","privacidade-candidatura.html"]){
  if(fs.existsSync(page))fs.copyFileSync(page,path.join(dist,page));
}
fs.mkdirSync(path.join(dist,"src"),{recursive:true});
fs.cpSync("src",path.join(dist,"src"),{recursive:true});
fs.mkdirSync(path.join(dist,"content"),{recursive:true});
fs.copyFileSync("content/site.json",path.join(dist,"content/site.json"));
if(fs.existsSync("public/assets")){fs.mkdirSync(path.join(dist,"assets"),{recursive:true});fs.cpSync("public/assets",path.join(dist,"assets"),{recursive:true});}
if(fs.existsSync("edit"))fs.cpSync("edit",path.join(dist,"edit"),{recursive:true});
// Render the public pages at build time: useful content and the hero image arrive in HTML.
const data=JSON.parse(fs.readFileSync('content/site.json','utf8'));
const client=fs.readFileSync('src/site-v2.js','utf8');
const template=client.slice(0,client.indexOf("fetch('./content/site.json'"));
const pages={"index.html":['home','home'],"coaching.html":['coaching','coaching'],"app.html":['app','appPage'],"metodo.html":['method','methodPage'],"sobre.html":['about','aboutPage'],"presencial.html":['presential','presencialPage']};
for(const [name,[page,fn]] of Object.entries(pages)){
 const html=vm.runInNewContext(template+`\n${fn}(siteContent)`,{document:{getElementById:()=>null,body:{dataset:{page}}},URL,location:{href:'https://www.edgarfilipe.pt/'},siteContent:data});
 const file=path.join(dist,name);
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('<div id="site-root"></div>',()=>`<div id="site-root">${html}</div>`));
}
console.log("EF website built to dist/ with static public content");