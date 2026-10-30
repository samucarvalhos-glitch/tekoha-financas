const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const script=[...app.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
const start=script.indexOf("const NAV_PAGE_KEY=");
const end=script.indexOf("const seed=",start);
assert.ok(start>=0&&end>start,'Rotinas de navegação ausentes');
const helpers=script.slice(start,end);
const goLine=script.split('\n').find(line=>line.startsWith('function go(page,fromHistory=false)'));
assert.ok(goLine,'go() não preserva origem do histórico');
const namesLine=script.split('\n').find(line=>line.startsWith('const names='));
assert.ok(namesLine,'Tabela de abas ausente');
const names=Function(namesLine.replace(/^const names=/,'return ').replace(/;\s*$/,''))();
const storeKey='tekoha-financas-aba-atual-v1';
function browser({hash='',saved='',historyBlocked=false,storageBlocked=false}={}){
 const records=new Map([['tekoha-financas-registros-v1','{"transactions":[{"id":"SAFE","amount":8}]}']]);
 if(saved)records.set(storeKey,saved);
 const localStorage={
  getItem(key){if(storageBlocked)throw Error('storage blocked');return records.get(key)??null},
  setItem(key,v){if(storageBlocked)throw Error('storage blocked');records.set(key,String(v))}
 };
 const entries=[],window={location:{hash},scrollTo(){},history:{
  pushState(_a,_b,fragment){if(historyBlocked)throw Error('history blocked');window.location.hash=fragment;entries.push(['push',fragment])},
  replaceState(_a,_b,fragment){if(historyBlocked)throw Error('history blocked');window.location.hash=fragment;entries.push(['replace',fragment])}
 }};
 const code=helpers+'\nconst ui={page:initialNavigationPage(),pageNum:3,search:"x",entity:"Todos"};let renderCount=0;function render(){renderCount++}function closeNav(){}'+goLine+'\nrememberNavigationPage(ui.page,"replace");return {ui,go,restoreNavigationFromHistory,renderCount:()=>renderCount};';
 const page=Function('window','localStorage','names',code)(window,localStorage,names);
 return {page,window,localStorage,records,entries};
}
test('Script principal compila',()=>assert.doesNotThrow(()=>Function(script)));
test('Todas as abas permanecem após atualizar',()=>{
 for(const name of Object.keys(names)){
  const first=browser();
  first.page.go(name);
  const second=browser({hash:first.window.location.hash,saved:first.localStorage.getItem(storeKey)});
  assert.equal(second.page.ui.page,name,name);
  assert.equal(second.window.location.hash,'#'+name);
 }
});
test('Reabrir PWA sem fragmento recupera última aba salva',()=>{
 const b=browser({saved:'courtesies'});
 assert.equal(b.page.ui.page,'courtesies');
 assert.equal(b.window.location.hash,'#courtesies');
});
test('Link direto prevalece sobre a aba salva anteriormente',()=>{
 assert.equal(browser({hash:'#resale',saved:'quick'}).page.ui.page,'resale');
});
test('Hash e estado não reconhecidos retornam à aba segura',()=>{
 const b=browser({hash:'#not-a-page',saved:'somewhere'});
 assert.equal(b.page.ui.page,'quick');assert.equal(b.window.location.hash,'#quick');
});
test('Histórico do navegador restaura abas sem novo push',()=>{
 const b=browser();b.page.go('resale');b.page.go('courtesies');
 const count=b.entries.length;b.window.location.hash='#resale';
 b.page.restoreNavigationFromHistory();
 assert.equal(b.page.ui.page,'resale');
 assert.equal(b.entries.length,count);
 assert.equal(b.localStorage.getItem(storeKey),'resale');
});
test('Navegação inválida é ignorada',()=>{
 const b=browser();b.page.go('invalid');
 assert.equal(b.page.ui.page,'quick');
});
test('Nenhum dado financeiro é alterado pela navegação',()=>{
 const b=browser();const financial=b.localStorage.getItem('tekoha-financas-registros-v1');
 for(const tab of Object.keys(names))b.page.go(tab);
 assert.equal(b.localStorage.getItem('tekoha-financas-registros-v1'),financial);
 assert.deepEqual([...b.records.keys()].sort(),['tekoha-financas-registros-v1',storeKey].sort());
});
test('Funciona quando History API não pode escrever, usando armazenamento',()=>{
 const a=browser({historyBlocked:true});a.page.go('withdrawals');
 assert.equal(browser({saved:a.localStorage.getItem(storeKey)}).page.ui.page,'withdrawals');
});
test('Funciona com armazenamento da aba bloqueado, usando URL',()=>{
 const a=browser({storageBlocked:true});a.page.go('data');
 assert.equal(browser({hash:a.window.location.hash,storageBlocked:true}).page.ui.page,'data');
});
test('Os links das abas existem na navegação visível',()=>{
 for(const page of Object.keys(names))assert.ok(app.includes('data-page="'+page+'"'),page);
});
