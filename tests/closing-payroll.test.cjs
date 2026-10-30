const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const js=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
function section(begin,end){const a=js.indexOf(begin),b=js.indexOf(end,a);assert.ok(a>=0&&b>a,begin+' not found');return js.slice(a,b);}
const core=section('const STAFF_TYPES=','function monthOptions(');
const saveStaff=section('function saveStaffExpense(e){','function deleteStaffExpense(id){');
const saveClosing=section('function saveClosing(e){','function deleteClosing(){');
const baseRecord=section('function asBaseRecord(', 'function saveItem(t){');
const purchase={id:'REV',area:'Compras para revenda',entity:'Tekoha Hub',kind:'despesa',status:'Registrado',date:'2026-10-15',month:'2026-10',amount:1000,method:'Pix',paymentStatus:'Pago'};
const employee={id:'STAFF0',area:'Rotina',entity:'Tekoha Hub',kind:'despesa',staffExpense:true,staffType:'Diária',employeeName:'Músico de apoio',date:'2026-10-28',month:'2026-10',amount:500,method:'Pix',paymentStatus:'Pago',status:'Registrado'};
const operation={id:'OP',area:'Rotina',entity:'Tekoha Hub',kind:'despesa',date:'2026-10-28',month:'2026-10',amount:200,method:'Pix',paymentStatus:'Pago',status:'Registrado'};
const personal={id:'PESS',area:'Rotina',entity:'Pessoal',kind:'despesa',date:'2026-10-28',month:'2026-10',amount:100,status:'Registrado',method:'Pix',account:'Conta PJ',paymentStatus:'Pago'};
const reform={id:'REF',area:'Reforma e aquisições',entity:'Tekoha Hub',kind:'despesa',date:'2026-10-28',month:'2026-10',amount:5000,status:'Registrado'};
const directIncome={id:'REC',area:'Rotina',entity:'Tekoha Hub',kind:'receita',date:'2026-10-29',month:'2026-10',amount:4000,status:'Registrado'};
const monthly={gross:5000,net:4500,received:4000,notes:''};
function analysis(){
 const items=[purchase,employee,operation,personal,reform,directIncome];
 const monthlyClosings={'2026-10':monthly},salesRevenue={'2026-10':5000};
 const stockWithdrawals=[{purchaseId:'REV',date:'2026-10-27',amount:50}],stockCourtesies=[{purchaseId:'REV',date:'2026-10-28',amount:80},{purchaseId:'',date:'2026-10-28',amount:30}],cashWithdrawals=[{status:'Ativa',sourceAccount:'CNPJ/PJ',date:'2026-10-29',amount:50}];
 const code='const items=cfg.items,monthlyClosings=cfg.closings,salesRevenue=cfg.sales,stockWithdrawals=cfg.withdrawals,stockCourtesies=cfg.courtesies,cashWithdrawals=cfg.cash;'+
 'const moneyRound=v=>Math.round((Number(v)||0)*100)/100;const sum=(a,k="amount")=>moneyRound(a.reduce((v,t)=>v+(Number(t[k])||0),0));'+
 'const getMonth=t=>t.month||t.date?.slice(0,7);const realized=t=>t.status!=="Orçamento"&&t.includeInAnalysis!==false&&t.kind!=="ajuste";'+
 'const isCredit=t=>String(t.method||"").includes("Crédito");const paymentOwner=account=>/CNPJ|Conta PJ/i.test(String(account||""))?"PJ":/CPF|Conta PF/i.test(String(account||""))?"PF":"Não informado";const safeMonth=s=>/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(s);'+
 'const courtesyTotal=m=>sum(stockCourtesies.filter(w=>w.date.slice(0,7)===m));const courtesyUnlinkedTotal=m=>sum(stockCourtesies.filter(w=>!w.purchaseId&&w.date.slice(0,7)===m));'+
 'const stockTotalPersonal=m=>sum(stockWithdrawals.filter(w=>w.date.slice(0,7)===m));const stockLinkedPersonal=m=>sum(stockWithdrawals.filter(w=>w.purchaseId&&w.date.slice(0,7)===m));'+
 'const billRows=()=>[{month:"2026-10",entity:"Tekoha Hub",amount:150,paid:true}];'+core+
 'return {companyMonthlyStatement,validMonthlyClosings,staffRecords};';
 return Function('cfg',code)({items,closings:monthlyClosings,sales:salesRevenue,withdrawals:stockWithdrawals,courtesies:stockCourtesies,cash:cashWithdrawals});
}
function forms(){
 const items=[],monthlyClosings={},salesRevenue={},ui={staffEdit:'',staffMonth:'2026-10',closeMonth:'2026-10'},warnings=[];
 const fields={
 'staff-name':'Pessoa A','staff-payee':'Funcionário','staff-event':'Evento do bar','staff-type':'Diária','staff-amount':'125,50','staff-date':'2026-10-30','staff-competence':'2026-10',
 'staff-method':'Pix','staff-owner':'PJ','staff-status':'Pago','staff-notes':'Evento','staff-parts':'1','staff-first':'2026-11',
 'close-gross':'10000','close-net':'8500','close-received':'8000','close-notes':'Taxas descontadas'
 };
 const code='const items=cfg.items,monthlyClosings=cfg.closings,salesRevenue=cfg.sales,ui=cfg.ui;'+
 'const STAFF_TYPES=["Salário","Diária","Bônus","Cachê","Ajuda de custo","Outro pagamento"],PAYEE_TYPES=["Funcionário","Músico(a)","DJ","Banda / grupo","Artista / atração","Equipe técnica","Outro prestador"],STAFF_METHODS=["Pix","Crédito","Débito","Dinheiro","Transferência","Boleto","Não informado"];'+
 'const $=id=>({value:cfg.fields[id]??""});const moneyRound=v=>Math.round((Number(v)||0)*100)/100;'+
 'const asMoney=v=>{const s=String(v??"").replace(",",".");return Number(s)};const smartDate=v=>/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)?v:"";'+
 'const safeMonth=v=>/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(v);const paymentAccount=(method,owner)=>owner==="PJ"?"Conta PJ":owner==="PF"?"Conta PF":"Não informado";'+
 'const saveItem=t=>{const n=items.findIndex(x=>x.id===t.id);if(n>=0)items[n]=t;else items.unshift(t);};'+
 'const save=()=>{cfg.saved++},render=()=>{cfg.rendered++},toast=t=>cfg.warnings.push(t);const confirm=()=>true;'+
 baseRecord+saveStaff+saveClosing+
 'return {saveStaffExpense,saveClosing};';
 const state={items,closings:monthlyClosings,sales:salesRevenue,ui,fields,saved:0,rendered:0,warnings};
 const f=Function('cfg',code)(state);return {state,...f};
}
test('main Javascript compiles',()=>assert.doesNotThrow(()=>new vm.Script(js)));
test('navigation includes both new tabs',()=>{assert.ok(html.includes('data-page="staff"'));assert.ok(html.includes('data-page="closing"'));});
test('payroll and closing forms exist',()=>{assert.ok(js.includes('id="staff-form"'));assert.ok(js.includes('id="closing-form"'));});
test('gross/net and actual receipt are separate fields',()=>{assert.ok(js.includes('id="close-gross"'));assert.ok(js.includes('id="close-net"'));assert.ok(js.includes('id="close-received"'));});
test('monthly cost excludes personal and reform and avoids duplicated courtesy',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');assert.equal(x.operating,200);assert.equal(x.personnel,500);assert.equal(x.inventory,1000);assert.equal(x.complimentaryEstimated,30);assert.equal(x.personalTransferFromResale,50);assert.equal(x.cost,1680);assert.equal(x.expensesCount,3);
});
test('profit from declared net minus recorded company expenses',()=>assert.equal(analysis().companyMonthlyStatement('2026-10').estimatedResult,2820));
test('individual income not double counted',()=>assert.equal(analysis().companyMonthlyStatement('2026-10').unreconciledIncomes,4000));
test('cash from received minus confirmed payments is partial',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');assert.equal(x.confirmedCash,1700);assert.equal(x.confirmedBills,150);assert.equal(x.personalByCompany,100);assert.equal(x.ownerWithdrawals,50);assert.equal(x.confirmedOut,2000);assert.equal(x.estimatedCashBalance,2000);
});
test('missing revenue does not fabricate profit',()=>assert.equal(analysis().companyMonthlyStatement('2026-11').estimatedResult,null));
test('closing validates gross/net relationship',()=>{
 const x=analysis().validMonthlyClosings;assert.equal(x({'2026-10':{gross:100,net:110}}),false);assert.equal(x({'2026-10':{gross:0,net:0,received:0}}),true);
});
test('salary/daily/bonus register as a single company expense',()=>{
 const x=forms();x.saveStaffExpense({preventDefault(){}});
 assert.equal(x.state.items.length,1);const t=x.state.items[0];assert.equal(t.staffExpense,true);assert.equal(t.staffType,'Diária');assert.equal(t.amount,125.5);assert.equal(t.entity,'Tekoha Hub');assert.equal(t.area,'Rotina');assert.equal(t.account,'Conta PJ');assert.equal(t.paymentStatus,'Pago');assert.equal(t.month,'2026-10');assert.equal(t.payeeType,'Funcionário');assert.equal(t.staffEvent,'Evento do bar');
});
test('editing payroll preserves the same ID and does not duplicate expense',()=>{
 const x=forms();x.saveStaffExpense({preventDefault(){}});const id=x.state.items[0].id;
 x.state.ui.staffEdit=id;x.state.fields['staff-amount']='185,90';x.state.fields['staff-type']='Bônus';x.saveStaffExpense({preventDefault(){}});
 assert.equal(x.state.items.length,1);assert.equal(x.state.items[0].id,id);assert.equal(x.state.items[0].amount,185.9);assert.equal(x.state.items[0].staffType,'Bônus');
});
test('invalid payroll amount is blocked',()=>{const x=forms();x.state.fields['staff-amount']='-1';x.saveStaffExpense({preventDefault(){}});assert.equal(x.state.items.length,0)});
test('credit payroll supports installments without assuming paid bill',()=>{
 const x=forms();x.state.fields['staff-method']='Crédito';x.state.fields['staff-parts']='2';x.state.fields['staff-first']='2026-11';
 x.saveStaffExpense({preventDefault(){}});const t=x.state.items[0];assert.equal(t.installments,2);assert.equal(t.firstBillMonth,'2026-11');assert.equal(t.paymentStatus,'A pagar');
});
test('monthly closing saves one record and mirrors legacy gross',()=>{
 const x=forms();x.saveClosing({preventDefault(){}});
 assert.equal(Object.keys(x.state.closings).length,1);assert.equal(x.state.closings['2026-10'].gross,10000);assert.equal(x.state.closings['2026-10'].net,8500);assert.equal(x.state.closings['2026-10'].received,8000);assert.equal(x.state.sales['2026-10'],10000);assert.equal(x.state.items.length,0);
});
test('monthly closing editing overwrites same period',()=>{
 const x=forms();x.saveClosing({preventDefault(){}});x.state.fields['close-net']='8200';x.saveClosing({preventDefault(){}});
 assert.equal(Object.keys(x.state.closings).length,1);assert.equal(x.state.closings['2026-10'].net,8200);
});
test('invalid closing is rejected without altering data',()=>{
 const x=forms();x.state.fields['close-net']='12500';x.saveClosing({preventDefault(){}});
 assert.equal(Object.keys(x.state.closings).length,0);assert.equal(x.state.saved,0);
});
test('full backups include closing; no bank transactions auto-created',()=>{
 assert.ok(js.includes('schema:7,app:'));assert.ok(js.includes('transactions:items,salesRevenue,monthlyClosings'));assert.ok(js.includes('validMonthlyClosings(x.monthlyClosings)'));
});
test('XLSX exports company closing and payroll separately',()=>{
 assert.ok(js.includes("name:'Fechamento Mensal'"));assert.ok(js.includes("name:'Equipe e Funcionários'"));
});

test('DJ receives cachê and is classified as attraction',()=>{
 const x=forms();x.state.fields['staff-name']='DJ convidado';x.state.fields['staff-payee']='DJ';x.state.fields['staff-type']='Cachê';x.state.fields['staff-amount']='750,00';
 x.saveStaffExpense({preventDefault(){}});
 const t=x.state.items[0];assert.equal(x.state.items.length,1);assert.equal(t.payeeType,'DJ');assert.equal(t.staffType,'Cachê');assert.equal(t.amount,750);assert.equal(t.category,'Atrações / Cachê');
});
test('Band or group is one expense, not each member duplicated',()=>{
 const x=forms();x.state.fields['staff-name']='Banda convidada';x.state.fields['staff-payee']='Banda / grupo';x.state.fields['staff-type']='Cachê';x.state.fields['staff-amount']='1200,00';x.saveStaffExpense({preventDefault(){}});
 assert.equal(x.state.items.length,1);assert.equal(x.state.items[0].amount,1200);
});
test('unknown beneficiary type is blocked',()=>{
 const x=forms();x.state.fields['staff-payee']='Qualquer outro';x.saveStaffExpense({preventDefault(){}});assert.equal(x.state.items.length,0);
});
test('insights page exists and shows shares and margins',()=>{
 for(const token of ['function insightsByCostsView()','insight-month','profitMarginNet','attractionShare','totalGrossCompanySpend'])assert.ok(js.includes(token),token);assert.ok(html.includes('data-page="costinsights"'));
});
test('financial close XLSX includes percentages, attractions and payee names',()=>{
 for(const token of ["name:'Insights de Custos'",'Atrações / despesas (%)',"t.payeeType||'Funcionário'","name:'Fechamento Mensal'"])assert.ok(js.includes(token),token);
});

test('shares add up to 100 percent before personal reclassification',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');
 assert.equal(x.totalGrossCompanySpend,1730);
 assert.equal(x.breakdown.reduce((a,b)=>a+b.value,0),1730);
 assert.ok(Math.abs(x.breakdown.reduce((a,b)=>a+b.share,0)-100)<0.15);
});
test('artistic fees and payroll are distinct inside the total spend',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');
 assert.equal(x.team,500);assert.equal(x.attractions,0);assert.equal(x.personnel,x.team+x.attractions);
});
test('margins are percent of declared revenue and estimated result',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');
 assert.equal(x.profitMarginNet,Math.round((2820/4500)*10000)/100);
 assert.equal(x.profitMarginGross,Math.round((2820/5000)*10000)/100);
 assert.equal(x.costShareNet,Math.round((1680/4500)*10000)/100);
});
test('investments included in company total but excluded from operational profit',()=>{
 const x=analysis().companyMonthlyStatement('2026-10');
 assert.equal(x.investments,5000);assert.equal(x.totalCompanyOutlays,6730);
 assert.equal(x.estimatedResult,2820);
});
test('insights include spend categories and profit percentage in exported XLSX',()=>{
 for(const token of ["name:'Insights de Custos'", "'Atrações / despesas (%)'",'profitMarginGross','profitMarginNet','totalCompanyOutlays'])assert.ok(js.includes(token),token);
});
