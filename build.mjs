import fs from "node:fs";
import path from "node:path";

const dist = "dist";
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});

fs.copyFileSync("index.html",path.join(dist,"index.html"));
fs.mkdirSync(path.join(dist,"src"),{recursive:true});
fs.cpSync("src",path.join(dist,"src"),{recursive:true});
fs.mkdirSync(path.join(dist,"content"),{recursive:true});
fs.copyFileSync("content/site.json",path.join(dist,"content/site.json"));

if (fs.existsSync("public/assets")) {
  fs.mkdirSync(path.join(dist,"assets"),{recursive:true});
  fs.cpSync("public/assets",path.join(dist,"assets"),{recursive:true});
}

console.log("EF website built to dist/");
