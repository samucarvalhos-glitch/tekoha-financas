'use strict';
(function runTests(){
 const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
 const js=scripts.sort((a,b)=>b.length-a.length)[0];
 const cut=(a,b)=>{const i=js.indexOf(a),j=js.indexOf(b,i);assert.ok(i>=0&&j>i,`Ausente ${a}`);return js.slice(i,j)};
 const helpers=cut('function stockPurchases()','function validCashWithdrawals('),monthlyFn=cut("function monthly(m,area=",'function monthOptions'),validation=cut('function validCourtesies(','function validWithdrawals('),courtesyUI=cut('function courtesyView()','function stockWithdrawalView()');
 const lot={id:'L1',area:'Compras para revenda',entity:'Tekoha Hub',kind:'despesa',quantity:20,amount:100,unitCost:5,date:'2026-10-10',month:'2026-10',status:'Registrado',account:'Cartão CNPJ'};
 const personal={id:'RET1',purchaseId:'L1',description:'Bebida',date:'2026-10-20',quantity:2,unitCost:5,amount:10,sourceAccount:'CNPJ/PJ'};
 const courtesy={id:'COR1',purchaseId:'L1',description:'Bebida',date:'2026-10-21',sourceMode:'vinculado',quantity:1,unitCost:5,amount:5,sourceAccount:'CNPJ/PJ',kind:'Cortesia',destination:'Empresa Tekoha',beneficiary:'Músico',cashEffect:0,reconciled:true};
 const env=(personalRows=[personal],courtesyRows=[courtesy])=>new Function('lot','personalRows','courtesyRows',`
 let items=[lot],stockWithdrawals=personalRows,stockCourtesies=courtesyRows;
 const moneyRound=v=>Math.round((Number(v)||0)*100)/100;
 const sum=(a,k='amount')=>moneyRound(a.reduce((v,t)=>v+(Number(t[k])||0),0));
 const smartDate=v=>/^\\d{4}-\\d{2}-\\d{2}$/.test(v)?v:'';
 const validItem=t=>t.includeInAnalysis!==false&&t.kind!=='ajuste';
 const realized=t=>validItem(t)&&t.status!=='Orçamento';
 const getMonth=t=>t.month||t.date?.slice(0,7);
 const paymentOwner=s=>s==='Cartão CNPJ'?'PJ':s==='Cartão CPF'?'PF':'Não informado';
 const billRows=()=>[];const sourceCash=()=>false;
 ${helpers}\n${validation}\n${monthlyFn}
 return {stockQtyAvailable,stockQtyTaken,stockInventoryRemaining,monthly,validCourtesies};`)(lot,personalRows,courtesyRows);
 test('Script principal compila sem erros',()=>assert.doesNotThrow(()=>new vm.Script(js)));
 test('Nova aba, formulários e eventos estão presentes',()=>{
  for(const token of ['data-page="courtesies"','id="courtesy-linked-form"','id="courtesy-free-form"',"submitCourtesyLinked(e)","submitCourtesyFree(e)","undoCourtesy(b.dataset.id)"])assert.ok(html.includes(token),token);
 });
 test('Retirada pessoal e cortesia compartilham saldo',()=>{const r=env();assert.equal(r.stockQtyTaken('L1'),3);assert.equal(r.stockQtyAvailable(lot),17);assert.equal(r.stockInventoryRemaining(),85)});
 test('Destino pessoal e empresa reconciliam os R$ 100 originais',()=>{const r=env().monthly('2026-10');assert.equal(r.personal,10);assert.equal(r.business,90);assert.equal(r.courtesyCost,5);assert.equal(r.resaleAllocated,85);assert.equal(r.purchases,0)});
 test('Cortesia não causa saída de caixa ou parcelamento adicional',()=>{const r=env().monthly('2026-10');assert.equal(r.cash,0);assert.equal(r.credit,0);assert.equal(courtesy.cashEffect,0)});
 test('Validação aceita cortesia vinculada válida',()=>assert.equal(env().validCourtesies([courtesy],[lot],[personal]),true));
 test('Validação bloqueia consumo e cortesia acima do lote',()=>assert.equal(env().validCourtesies([{...courtesy,quantity:19,amount:95}],[lot],[personal]),false));
 test('Avulsa mantém estoque sem alteração e custo sem conciliação',()=>{const av={...courtesy,purchaseId:'',sourceMode:'avulso',reconciled:false};const r=env([],[av]);assert.equal(r.stockQtyAvailable(lot),20);assert.equal(r.monthly('2026-10').courtesyUnlinked,5);assert.equal(r.monthly('2026-10').business,105)});
 test('Estorno libera unidades vinculadas ao lote',()=>assert.equal(env([],[]).stockQtyAvailable(lot),20));
 test('Compra antiga e retirada atual têm competências diferentes',()=>{const r=env([{...personal,date:'2026-11-05'}],[{...courtesy,date:'2026-11-06'}]);assert.equal(r.monthly('2026-10').business,100);assert.equal(r.monthly('2026-11').business,-10);assert.equal(r.monthly('2026-11').personal,10);assert.equal(r.monthly('2026-11').courtesyCost,5)});
 test('Exportação inclui abas de cortesias e colunas de reconciliação mensal',()=>{for(const token of ["{name:'Cortesias e Permutas'","'Cortesias vinculadas no mês (R$)'","'Consumo pessoal no mês (R$)'","'Valor revenda líquido no mês (R$)'"])assert.ok(js.includes(token),token)});
 test('Backup persistente e restauro incluem cortesias',()=>{for(const token of ['stockWithdrawals,stockCourtesies,cashWithdrawals','localStorage.setItem(COURTESY_LS','validCourtesies(x.stockCourtesies'])assert.ok(js.includes(token),token)});
})();
