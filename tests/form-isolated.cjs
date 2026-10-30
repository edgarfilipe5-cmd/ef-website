const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
fs.mkdirSync('qa',{recursive:true});
const source=fs.readFileSync('src/candidatura-publica.js','utf8');
function setup(response={ok:true,status:200,data:{ok:true}}){
 const nodes={},calls=[],events={};let challenge;
 function node(id){return nodes[id]??=( {id,value:'',checked:false,hidden:false,disabled:false,textContent:'',style:{},handlers:{},checkValidity(){return this.valid!==false},reportValidity(){this.reported=true},scrollIntoView(){},focus(){},setAttribute(){},addEventListener(n,fn){this.handlers[n]=fn}})}
 const ids=['efApplication','nextButton','backButton','restartButton','feedback','successState','stepIndicator','progressPercent','progressFill','submitButton','securityStatus','goal','situation','experience','frequency','environment','fullName','email','phone','startWhen','commitment','notes','privacyAcknowledged','companyWebsite'];ids.forEach(node);
 const first=['goal','situation','experience','frequency','environment'],second=['fullName','email','phone','commitment','privacyAcknowledged'];
 const stage1=node('stage1'),stage2=node('stage2');stage2.hidden=true;
 stage1.querySelectorAll=()=>first.map(node);stage2.querySelectorAll=()=>second.map(node);stage1.querySelector=stage2.querySelector=()=>node('title');
 const form=node('efApplication');form.companyWebsite=node('companyWebsite');form.querySelector=s=>s.includes('1')?stage1:stage2;form.reset=()=>{};
 node('situation').value='QA fictício sem qualquer contacto real.';node('fullName').value='QA Fictício';node('email').value='qa@example.invalid';node('phone').value='+351900000000';node('privacyAcknowledged').checked=true;
 const window={turnstile:{render(_s,opts){challenge=opts;opts.callback('fake-isolated-token');return 'fake-widget'},reset(){events.reset=true}}};
 const document={getElementById:node,querySelector:()=>null,createElement:()=>({}),head:{appendChild(script){script.onload()}}};
 const fetch=async(url,options)=>{if(url.includes('site.json'))return{ok:true,json:async()=>({site:{turnstile_site_key:'fake-test-site-key'}})};calls.push({url,options});if(response.throw)throw Error('simulated network failure');return {ok:response.ok,status:response.status,json:async()=>{if(response.badJson)throw Error('bad json');return response.data}}};
 class FormData{constructor(){this.entries=()=>ids.filter(id=>!['efApplication'].includes(id)).map(id=>[id,id==='privacyAcknowledged'?(node(id).checked?'on':''):node(id).value])}}
 vm.runInNewContext(source,{document,window,fetch,crypto:{randomUUID:()=> 'fake-test-id'},AbortSignal,URLSearchParams,location:{search:''},FormData,console});
 return {nodes,calls,events,stage1,stage2,get challenge(){return challenge},async ready(){await new Promise(setImmediate)},async submit(){await form.handlers.submit({preventDefault(){}})}};
}
(async()=>{let passed=[];
 let t=setup();await t.ready();t.nodes.goal.valid=false;t.nodes.nextButton.handlers.click();assert.equal(t.stage2.hidden,true);assert.equal(t.nodes.goal.reported,true);passed.push('required fields block next');
 t.nodes.goal.valid=true;t.nodes.nextButton.handlers.click();assert.equal(t.stage2.hidden,false);t.nodes.backButton.handlers.click();assert.equal(t.stage2.hidden,true);assert.ok(t.nodes.situation.value.includes('QA'));passed.push('next/back preserve values');
 t=setup();await t.ready();t.nodes.privacyAcknowledged.valid=false;await t.submit();assert.equal(t.calls.length,0);passed.push('required privacy acknowledgement blocks request');
 t=setup();await t.ready();t.challenge['expired-callback']();await t.submit();assert.equal(t.calls.length,0);assert.equal(t.nodes.submitButton.disabled,true);passed.push('expired captcha blocks submission');
 t=setup();await t.ready();t.nodes.companyWebsite.value='spam';await t.submit();assert.equal(t.calls.length,0);passed.push('honeypot blocks request');
 t=setup();await t.ready();await t.submit();assert.equal(t.calls.length,1);let payload=JSON.parse(t.calls[0].options.body);assert.equal(payload.privacyAcknowledged,true);assert.equal(payload.turnstileToken,'fake-isolated-token');assert.equal(t.nodes.efApplication.hidden,true);assert.equal(t.nodes.successState.hidden,false);passed.push('mock success confirms and displays success');
 for(const [name,response] of [['429',{ok:false,status:429,data:{}}],['network',{throw:true}],['invalid response',{ok:true,status:200,data:{ok:false}}],['invalid JSON',{ok:true,status:200,badJson:true}]]){t=setup(response);await t.ready();await t.submit();assert.equal(t.nodes.feedback.hidden,false);assert.equal(t.nodes.efApplication.hidden,false);assert.equal(t.nodes.submitButton.disabled,true);assert.equal(t.events.reset,true);passed.push('mock '+name+' error is recoverable')}
 fs.writeFileSync('qa/form-isolated.json',JSON.stringify({mode:'isolated frontend with fake DOM, fake Turnstile and fake network; no external submissions',passed},null,2));console.log(passed.length+' isolated form checks passed; zero real requests');
})().catch(e=>{console.error(e);process.exit(1)});
