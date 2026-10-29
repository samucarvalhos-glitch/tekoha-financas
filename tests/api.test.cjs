const test=require('node:test');const assert=require('node:assert/strict');
const api=require('../api/analyze.js');
const base={documentType:'nota_fiscal',merchant:'Mercado',documentDate:'2026-10-29',documentTotal:37.9,paymentMethod:'Pix',confidence:'alta',notes:'',items:[{description:'Água 500mL',quantity:2,unitPrice:3,totalPrice:6,category:'Bebidas',confidence:'alta'},{description:'Café',quantity:1,unitPrice:31.9,totalPrice:31.9,category:'Alimentos',confidence:'media'}]};
function res(){return {statusCode:200,headers:{},data:null,status(c){this.statusCode=c;return this;},setHeader(k,v){this.headers[k]=v;return this;},json(v){this.data=v;return this;}};}
const SECRET='test-access-code-with-32-characters!';
const FAKE_IMG='data:image/jpeg;base64,'+Buffer.alloc(150,255).toString('base64');
async function call(args={},env={}){const oldKey=process.env.OPENAI_API_KEY,oldCode=process.env.TEKOHA_APP_CODE;process.env.OPENAI_API_KEY=env.key??'fake-openai-key';process.env.TEKOHA_APP_CODE=env.code??SECRET;
 try{const r=res();await api({method:'POST',headers:{host:'app.example.com','x-tekoha-code':SECRET,origin:'https://app.example.com',...args.headers},body:{image:FAKE_IMG,destination:'Revenda',...args.body}},r);return r;}finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;if(oldCode===undefined)delete process.env.TEKOHA_APP_CODE;else process.env.TEKOHA_APP_CODE=oldCode;}}
test('auth rejects malformed and wrong codes',()=>{assert.equal(api._test.authOK(SECRET,SECRET),true);assert.equal(api._test.authOK('x',SECRET),false);assert.equal(api._test.authOK('',SECRET),false);});
test('structured extraction preserves line-item count and does not append total',()=>{const e=api._test.normalizeExtraction(base);assert.equal(e.items.length,2);assert.equal(e.documentTotal,37.9);assert.equal(e.items.reduce((n,x)=>n+x.totalPrice,0),37.9);});
test('invalid numeric values remain null',()=>{const x=structuredClone(base);x.items[0].totalPrice=-12;x.items[0].quantity=-1;const e=api._test.normalizeExtraction(x);assert.equal(e.items[0].totalPrice,null);assert.equal(e.items[0].quantity,1);});
test('unauthenticated request is rejected before contacting model',async()=>{const r=await call({headers:{'x-tekoha-code':'wrong'}});assert.equal(r.statusCode,401);});
test('different origin is blocked',async()=>{const r=await call({headers:{origin:'https://evil.example.com'}});assert.equal(r.statusCode,403);});
test('unconfigured key is refused',async()=>{const r=await call({}, {code:'bad'});assert.equal(r.statusCode,503);});
test('malformed image is rejected',async()=>{const r=await call({body:{image:'data:text/plain;base64,ZZZ'}});assert.equal(r.statusCode,400);});
test('invalid destination is rejected',async()=>{const r=await call({body:{destination:'Outra empresa'}});assert.equal(r.statusCode,400);});
test('mocked OpenAI response returns structured items while preserving destination only from client',async()=>{
 const old=global.fetch;global.fetch=async(_url,opt)=>{const payload=JSON.parse(opt.body);assert.equal(payload.store,false);assert.equal(payload.input[1].content[1].type,'input_image');assert.equal(payload.text.format.strict,true);return {ok:true,json:async()=>({model:'mock-model',output:[{content:[{type:'output_text',text:JSON.stringify(base)}]}]})};};
 try{const r=await call();assert.equal(r.statusCode,200);assert.equal(r.data.extraction.items[0].category,'Bebidas');assert.equal(r.data.extraction.items.length,2);assert.equal(r.data.model,'mock-model');}finally{global.fetch=old;}
});
test('model refusal/empty output handled safely',async()=>{const old=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({output:[]})});try{const r=await call();assert.equal(r.statusCode,502);}finally{global.fetch=old;}});
