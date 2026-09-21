import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Game,type Card,type State,type Stock,type Visit} from './engine';
import {visits,initialStock} from './data';
import {getItemFacts,nativeCardById,canonicalCardId,auditAppraisal} from './item-facts';
import {SaveRepository,type StorageLike} from './session-store';

/** No recorded result is an oracle. Even runtime reads of these fields fail. */
const forbidden=new Set(['price','final','quotes','sourceCash','sourceCashAfter']);
function guarded(input:Visit[]):Visit[]{return input.map(v=>new Proxy(v,{get(target,key,receiver){
  if(forbidden.has(String(key)))throw Error(`Forbidden recorded-result read: ${target.id}.${String(key)}`);
  return Reflect.get(target,key,receiver);
}}));}
const scenarios=guarded(visits);
const reports:Record<string,unknown>[]=[];
after(()=>{mkdirSync('artifacts/audit',{recursive:true});writeFileSync('artifacts/audit/system-campaigns.json',JSON.stringify({
  generatedAt:new Date().toISOString(),scope:'Engine invariants and deterministic scenario completion; does not establish visual or full-game parity.',
  forbiddenRuntimeFields:[...forbidden],reports,
},null,2));});

function invariants(g:Game,label:string){
  const s=g.state;assert.ok(Number.isSafeInteger(s.cash)&&s.cash>=0,`${label}: nonnegative integral cash`);
  let balance=s.openingCash;const ledgerIds=new Set<string>();
  for(const e of s.cashbook){assert.ok(!ledgerIds.has(e.id),`${label}: duplicated cash event ${e.id}`);ledgerIds.add(e.id);
    assert.ok(Number.isSafeInteger(e.amount));balance+=e.amount;assert.ok(balance>=0);assert.equal(e.balance,balance,`${label}: running cash`);}
  assert.equal(s.cash,balance,`${label}: cash conservation`);
  assert.equal(new Set(s.stock.map(i=>i.id)).size,s.stock.length,`${label}: unique owned instances`);
  const slots=s.stock.filter(i=>i.listing!==null&&i.slot!=null).map(i=>i.slot!);
  assert.ok(slots.every(i=>Number.isInteger(i)&&i>=0&&i<=14));assert.equal(new Set(slots).size,slots.length,`${label}: unique display slots`);
  for(const item of s.stock){assert.ok(Number.isSafeInteger(item.paid)&&item.paid>=0);assert.ok(Number.isSafeInteger(item.value)&&item.value>=0);
    if(item.repairReadyDay)assert.equal(item.listing,null,`${label}: repair cannot remain for sale`);}
  assert.equal(new Set(s.trades.map(t=>t.id)).size,s.trades.length,`${label}: unique trade settlement`);
  for(const trade of s.trades){const entry=s.cashbook.find(e=>e.id===trade.id);assert.ok(entry,`${label}: every trade has cash event`);
    assert.equal(entry.amount,trade.side==='buy'?-trade.price:trade.price);
    if(trade.side==='sell'){assert.equal(trade.profit,trade.costBasis===null?null:trade.price-trade.costBasis);assert.ok(!s.stock.some(i=>i.id===trade.itemId),`${label}: sold item no longer owned`);}}
  assert.equal(new Set(s.closedDays).size,s.closedDays.length);
  for(const summary of s.summaries){const actual=s.cashbook.filter(e=>e.day===summary.day);
    assert.equal(summary.closingCash,summary.openingCash+actual.reduce((n,e)=>n+e.amount,0));
    assert.equal(summary.purchaseCost,Math.abs(actual.filter(e=>e.category==='purchase').reduce((n,e)=>n+e.amount,0)));
    assert.equal(summary.saleRevenue,actual.filter(e=>e.category==='sale').reduce((n,e)=>n+e.amount,0));
    assert.deepEqual(summary.cashFlow,actual,`${label}: day report preserves actual ledger`);}
}
function action<T>(g:Game,label:string,run:()=>T):T{
  const before=g.snapshot(),result=run(),after=g.state;invariants(g,label);
  const newTrades=after.trades.slice(before.trades.length),removed=before.stock.filter(i=>!after.stock.some(j=>j.id===i.id));
  const added=after.stock.filter(i=>!before.stock.some(j=>j.id===i.id));
  assert.deepEqual(removed.map(i=>i.id).sort(),newTrades.filter(t=>t.side==='sell').map(t=>t.itemId).sort(),`${label}: only a sale removes ownership`);
  const gifts=after.performedEvents.filter(e=>!before.performedEvents.includes(e)&&e.startsWith('gift:')).length;
  assert.equal(added.length,newTrades.filter(t=>t.side==='buy').length+gifts,`${label}: only purchase or explicit gift creates ownership`);
  for(const t of newTrades.filter(t=>t.side==='sell')){const item=before.stock.find(i=>i.id===t.itemId)!;
    assert.equal(t.costBasis,item.costKnown===false?null:item.paid,`${label}: cost basis survives transfer`);}
  return result;
}
function quote(g:Game,n:number){g.enterDigit('C');for(const d of String(n))g.enterDigit(d);return g.offer();}
function listAvailable(g:Game){
  for(const item of [...g.state.stock])if(item.listing===null&&!item.repairReadyDay){
    const used=new Set(g.state.stock.filter(i=>i.listing!==null).map(i=>i.slot));
    const slot=Array.from({length:15},(_,i)=>i).find(i=>!used.has(i));if(slot===undefined)break;
    action(g,'list owned stock',()=>g.listStock(item.id,Math.max(1,Math.floor(item.value*.9)),slot));
  }
}
type Strategy='reject'|'reasonable'|'wrong';
interface Driver {seen:Set<number>;prepared:Set<string>;attemptedCards:Set<string>;actions:number;wrongAttempts:number;knownAppraisals:number}
const driver=():Driver=>({seen:new Set(),prepared:new Set(),attemptedCards:new Set(),actions:0,wrongAttempts:0,knownAppraisals:0});
function prepare(g:Game,strategy:Strategy,d:Driver){
  if(d.prepared.has(g.encounter))return;d.prepared.add(g.encounter);
  const facts=getItemFacts(g.visit.id);
  if(strategy==='reasonable'&&facts?.nativeCards){
    d.knownAppraisals++;
    for(const c of [...g.state.tags])if(c.operator!=='base'&&!facts.nativeCards.some(n=>canonicalCardId(n.id)===canonicalCardId(c.id)))action(g,'remove unsupported public claim',()=>g.remove(c.id));
    for(const c of facts.nativeCards)if(g.canInteract(1)&&!d.attemptedCards.has(g.encounter+':'+c.id)){d.attemptedCards.add(g.encounter+':'+c.id);action(g,'apply independently verified native card',()=>g.add(c));if(g.state.phase==='narrative'){d.prepared.delete(g.encounter);break;}}
  }else if(strategy==='wrong'){
    // Deliberately contradict an exhaustive material fact; never use the recording's final cards.
    const material=facts?.constraints.find(c=>c.field==='material'&&c.exhaustive);
    const wrong=Object.values(nativeCardById).find(c=>c.group==='material'&&material&&!material.correctCardIds.includes(canonicalCardId(c.id)));
    if(wrong&&g.active){d.wrongAttempts++;action(g,'deliberate false material appraisal',()=>g.add(wrong));}
  }
}
function step(g:Game,strategy:Strategy,d:Driver){
  assert.ok(++d.actions<2200,'campaign must make progress');d.seen.add(g.state.visit);
  if(g.state.phase==='narrative'){action(g,'story/gift',()=>g.storyView.choices.length?g.chooseStory(g.storyView.choices[0].id):g.completeNarrative());return;}
  if(g.state.phase==='between'){action(g,'end day',()=>g.nextDay());return;}
  if(g.state.phase==='settled'){
    const cash=g.state.cash,stock=g.state.stock.length,trades=g.state.trades.length;
    assert.equal(action(g,'duplicate settlement rejected',()=>g.settle(1)),false);assert.equal(g.state.cash,cash);assert.equal(g.state.stock.length,stock);assert.equal(g.state.trades.length,trades);
    if(strategy!=='reject')listAvailable(g);action(g,'next visitor',()=>g.next());return;
  }
  if(strategy==='reject'){action(g,'decline encounter',()=>g.decline());return;}
  if(g.visit.side==='buy'){
    prepare(g,strategy,d);if(!g.active||g.world.story)return;
    // Keep the documented daily interest reserve; cash is never injected for the campaign.
    const reserve=(12-g.state.day)*25,available=Math.max(0,g.state.cash-reserve);
    if(g.state.counter!==null){if(g.state.counter<=available)action(g,'accept live counter',()=>g.accept());else action(g,'decline unaffordable counter',()=>g.decline());return;}
    const offer=Math.max(1,Math.floor(g.estimate*.7));
    if(offer>available||g.state.offers>=4){action(g,'decline beyond budget',()=>g.decline());return;}
    action(g,'offer from live appraisal',()=>quote(g,offer));
  }else{
    if(g.state.counter!==null)action(g,'accept live buyer counter',()=>g.accept());
    else if(g.state.offers===0)action(g,'present actual listing',()=>g.beginSale());
    else if(g.state.offers<4)action(g,'discount owned listing',()=>quote(g,Math.max(1,Math.floor((g.saleItem?.listing??g.estimate)*.7))));
    else action(g,'leave unsuccessful sale',()=>g.decline());
  }
}
function drive(g:Game,strategy:Strategy,d=driver(),stop?:(g:Game)=>boolean){
  while(!g.state.completed&&!g.state.failure&&!stop?.(g))step(g,strategy,d);
  return d;
}
for(const strategy of ['reject','reasonable','wrong'] as const)test(`System: all 53 story visits with ${strategy} policy, forbidden video answers inaccessible`,()=>{
  const g=new Game(scenarios);g.start(initialStock());const d=driver();
  try{drive(g,strategy,d);assert.equal(g.state.failure,null);assert.equal(g.state.completed,true);assert.equal(d.seen.size,53);
    assert.deepEqual(g.state.closedDays,[6,7,8,9,10,11]);assert.equal(g.state.summaries.length,6);
    assert.equal(g.state.cash,g.state.summaries.at(-1)?.closingCash);
    if(strategy==='reject')assert.equal(g.state.trades.length,0);else assert.ok(g.state.trades.length>0);
    if(strategy==='wrong'){assert.ok(d.wrongAttempts>0);assert.ok(g.state.appraisalReviews.some(r=>r.audit.knownWrong.length>0),'bad appraisals must reach a real subsequent buyer review');}if(strategy==='reasonable')assert.ok(d.knownAppraisals>0);
    reports.push({name:strategy,ok:true,visits:d.seen.size,actions:d.actions,cash:g.state.cash,buys:g.state.trades.filter(t=>t.side==='buy').length,sales:g.state.trades.filter(t=>t.side==='sell').length,wrongAttempts:d.wrongAttempts,knownAppraisals:d.knownAppraisals,owned:g.state.stock.length,reviewedItems:g.state.appraisalReviews.length,wrongReviews:g.state.appraisalReviews.filter(r=>r.audit.knownWrong.length>0).length,reputation:g.state.profile,days:g.state.closedDays});
  }catch(error){reports.push({name:strategy,ok:false,visit:g.visit?.id,phase:g.state.phase,offers:g.state.offers,contextOffers:g.state.contextOffers,script:g.state.negotiation?.native.script,story:g.storyView,visited:d.seen.size,error:String(error)});throw error;}
});

function fixture(id:string,day:number,side:Visit['side']='story',initial:Card[]=[]):Visit{return {id,day,side,initial,title:id,start:0,end:0,base:initial[0]?.value??0,final:[],price:null,estimate:null,attractiveness:0,dialogues:[]};}
function sampleStock(id:string,value=100):Stock{return {id,title:id,paid:20,costKnown:true,value,listing:value,slot:null,cards:[{id:`base-${id}`,label:id,group:'type',operator:'base',value}]};}

test('System: 500 randomized shelf moves, duplicate drops and invalid operations preserve ownership and cash',()=>{
  const g=new Game(guarded([fixture('shelf',6)]));g.start(Array.from({length:18},(_,i)=>({...sampleStock(`owned-${i}`),listing:i<15?100:null,slot:i<15?i:null})));
  const owners=g.state.stock.map(i=>i.id).sort();let seed=7051;
  const random=(n:number)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  for(let i=0;i<500;i++){const id=`owned-${random(18)}`,slot=random(15),price=random(2000);
    assert.equal(action(g,`shelf move ${i}`,()=>g.listStock(id,price,slot)),true);
    const snapshot=g.snapshot();assert.equal(action(g,`repeat shelf drop ${i}`,()=>g.listStock(id,price,slot)),true);
    assert.deepEqual(g.state.stock,snapshot.stock,'same drop must be idempotent');
    assert.equal(action(g,'invalid slot',()=>g.listStock(id,price,15)),false);
    assert.equal(action(g,'invalid price',()=>g.listStock(id,-1,slot)),false);
    assert.equal(action(g,'unknown owner',()=>g.listStock('missing',price,slot)),false);
  }
  assert.deepEqual(g.state.stock.map(i=>i.id).sort(),owners);assert.equal(g.state.cash,258);assert.equal(g.state.cashbook.length,0);
  reports.push({name:'random-shelf',ok:true,operations:2500});
});

function sellLive(g:Game){
  for(let i=0;i<8&&g.active;i++){
    if(g.state.counter!==null)action(g,'accept sale counter',()=>g.accept());
    else action(g,'offer available sale price',()=>quote(g,Math.max(1,Math.floor((g.saleItem?.listing??1)*(i?0.6:1)))));
  }
  assert.equal(g.state.result,'sold');
}

function lockedBuyerFixture(){
  const a:Stock={...sampleStock('buyer-target-A',1000),paid:100,listing:2000,slot:0};
  const b:Stock={id:'inventory-choice-B',definitionId:'day9-seoul-stamp',title:'Stamp B',paid:40,costKnown:true,value:97,listing:120,slot:1,cards:structuredClone(getItemFacts('day9-seoul-stamp')!.nativeCards!)};
  const g=new Game(guarded([fixture(a.title,9,'sell',a.cards)]));g.start([a,b]);
  action(g,'establish actual buyer counter for A',()=>g.beginSale());
  assert.equal(g.active,true);assert.ok(g.state.counter!==null,'fixture needs an unresolved live counter');
  return {g,a,b};
}

test('System: selecting and repricing inventory B cannot replace an active buyer target A',()=>{
  const {g,a,b}=lockedBuyerFixture(),counter=g.state.counter!,negotiation=structuredClone(g.state.negotiation);
  assert.equal(g.state.saleTargetId,a.id);assert.equal(g.saleItem?.id,a.id);
  action(g,'inventory UI selects B',()=>{g.state.selectedStock=b.id;});
  assert.equal(g.inventorySelection?.id,b.id);assert.equal(g.saleItem?.id,a.id);
  assert.equal(action(g,'inventory UI changes B listing',()=>g.listStock(b.id,55)),true);
  assert.equal(g.state.saleTargetId,a.id);assert.equal(g.state.counter,counter);assert.deepEqual(g.state.negotiation,negotiation);
  assert.equal(g.saleItem?.listing,2000);assert.equal(g.inventorySelection?.listing,55);
  const restored=new Game(g.visits);assert.deepEqual(restored.restore(g.snapshot()),{ok:true});
  assert.equal(restored.saleItem?.id,a.id);assert.equal(restored.inventorySelection?.id,b.id);
  for(const session of [g,restored]){
    const before=session.state.cash;assert.equal(action(session,'accept A counter with B selected',()=>session.accept()),true);
    assert.equal(session.state.cash,before+counter);assert.equal(session.state.trades.at(-1)?.itemId,a.id);assert.equal(session.state.trades.at(-1)?.costBasis,a.paid);
    assert.equal(session.state.stock.some(i=>i.id===a.id),false);assert.equal(session.state.stock.find(i=>i.id===b.id)?.listing,55);
  }
  assert.deepEqual(comparable(g),comparable(restored));
  reports.push({name:'locked-buyer-inventory-selection',ok:true,counter,sold:a.id,retained:b.id});
});

test('System: taking down buyer target A rejects the sale even when listed inventory B is selected',()=>{
  for(const response of ['accept','offer'] as const){
    const {g,a,b}=lockedBuyerFixture(),cash=g.state.cash;
    action(g,'inventory UI selects B',()=>{g.state.selectedStock=b.id;});
    action(g,'display UI takes down A',()=>{const item=g.state.stock.find(i=>i.id===a.id)!;item.listing=null;item.slot=null;});
    assert.equal(g.inventorySelection?.id,b.id);assert.equal(g.saleItem?.id,a.id);assert.equal(g.validSale(),false);
    const result=action(g,`attempt ${response} after target removed`,()=>response==='accept'?g.accept():quote(g,2000));
    assert.equal(result,false);assert.equal(g.state.cash,cash);assert.equal(g.state.trades.length,0);assert.equal(g.state.result,'declined');
    assert.deepEqual(g.state.stock.map(i=>i.id).sort(),[a.id,b.id].sort());assert.equal(g.state.stock.find(i=>i.id===b.id)?.listing,b.listing);
  }
  reports.push({name:'withdraw-locked-buyer-target',ok:true});
});

test('System: repair uses the inventory selection while an active buyer remains bound to another item',()=>{
  const {g,a,b}=lockedBuyerFixture(),counter=g.state.counter!,negotiation=structuredClone(g.state.negotiation),beforeA=structuredClone(g.saleItem);
  action(g,'inventory UI selects damaged B for repair',()=>{g.state.selectedStock=b.id;});
  const choice=g.inventorySelection;assert.ok(choice);assert.equal(choice.id,b.id);assert.equal(g.repairInfo(choice).eligible,true);
  assert.equal(action(g,'repair the selected inventory object B',()=>g.repair(choice.id)),true);
  assert.equal(g.inventorySelection?.repaired,true);assert.equal(g.inventorySelection?.listing,null);
  assert.equal(g.saleItem?.id,a.id);assert.deepEqual(g.saleItem,beforeA);assert.equal(g.state.counter,counter);assert.deepEqual(g.state.negotiation,negotiation);
  assert.equal(g.state.cashbook.at(-1)?.itemId,b.id);assert.equal(action(g,'complete original A purchase after B repair',()=>g.accept()),true);
  assert.equal(g.state.trades.at(-1)?.itemId,a.id);assert.equal(g.state.stock.find(i=>i.id===b.id)?.repaired,true);
  reports.push({name:'repair-independent-inventory-selection',ok:true,repaired:b.id,sold:a.id});
});

test('System: same-day loan repayment, reborrowing and next-day interest use actual ledger balances',()=>{
  const liquidity=sampleStock('liquidity',3000),input=guarded([fixture('liquidity',8,'sell',liquidity.cards),fixture('day9',9),fixture('day10',10),fixture('day11',11),fixture('day12',12)]);
  const g=new Game(input);g.start([liquidity]);sellLive(g);
  assert.equal(action(g,'repay old Darcy principal',()=>g.repay('darcy')),true);
  assert.equal(action(g,'duplicate repayment',()=>g.repay('darcy')),false);
  assert.equal(action(g,'borrow Executor',()=>g.borrow('executor')),true);assert.equal(g.getLoan('executor')?.principal,1500);
  assert.equal(g.repayment('executor'),1950,'first-period repayment includes one 30% interest payment');
  const cash=g.state.cash;assert.equal(action(g,'same-day Executor repay',()=>g.repay('executor')),true);assert.equal(g.state.cash,cash-1950);
  assert.equal(action(g,'Executor can be borrowed again after repayment',()=>g.borrow('executor')),true);
  assert.equal(action(g,'active institution cannot duplicate loan',()=>g.borrow('executor')),false);
  assert.equal(action(g,'AVAC not yet unlocked',()=>g.borrow('avac')),false);
  action(g,'finish day8 visitor',()=>g.next());action(g,'day8 settlement',()=>g.nextDay());
  assert.equal(g.state.day,9);assert.equal(g.state.cashbook.filter(e=>e.category==='interest').length,0,'three-day loan not due on first day');
  action(g,'day9 story',()=>g.completeNarrative());action(g,'day9 settlement',()=>g.nextDay());assert.equal(g.state.day,10);
  const beforeDue=g.state.cash;action(g,'day10 story',()=>g.completeNarrative());action(g,'day10 settlement',()=>g.nextDay());
  assert.equal(g.state.day,11);assert.equal(g.state.cash,beforeDue-450);assert.equal(g.repayment('executor'),1500);
  assert.equal(action(g,'AVAC opens day11',()=>g.borrow('avac')),true);assert.equal(g.repayment('avac'),5500);
  assert.deepEqual([g.getLoan('avac')?.principal,g.getLoan('avac')?.rate,g.getLoan('avac')?.cycleDays],[5000,.1,2]);
  assert.equal(action(g,'same-day Ajik investor payoff',()=>g.repay('avac')),true);
  const afterInvestorPayoff=g.state.cash;assert.equal(action(g,'one-time Ajik investor loan cannot become Bluebird capital',()=>g.borrow('avac')),false);
  assert.equal(g.state.cash,afterInvestorPayoff);
  reports.push({name:'loan-lifecycle',ok:true,cash:g.state.cash,ledger:g.state.cashbook});
});

test('System: overnight repair blocks display and sale, then preserves corrected cards and original cost on resale',()=>{
  const cards=structuredClone(getItemFacts('day8-picked-hoverboard-sale')!.nativeCards!);
  const stamp:Stock={id:'repair-instance',definitionId:'day8-picked-hoverboard-sale',title:'repaired-stamp-sale',paid:30,costKnown:true,value:24,listing:120,slot:2,cards,
    appraisal:{publicCards:structuredClone(cards),hiddenCards:[],acquiredValue:97,acquiredDay:9}};
  const g=new Game(guarded([fixture('repair-day9',9),fixture('repair-day10',10),fixture('repaired-stamp-sale',10,'sell',cards)]));g.start([stamp]);
  const quoteBefore=g.repairInfo(g.state.stock[0]);assert.equal(quoteBefore.eligible,true);assert.equal(quoteBefore.cost,54);assert.equal(quoteBefore.mode,'overnight');
  assert.equal(action(g,'send stamp to repair',()=>g.repair(stamp.id)),true);assert.equal(g.state.cash,204);
  assert.equal(action(g,'repair duplicate',()=>g.repair(stamp.id)),false);assert.equal(action(g,'repair cannot be listed',()=>g.listStock(stamp.id,150,0)),false);
  action(g,'end repair day',()=>g.completeNarrative());action(g,'deliver following day',()=>g.nextDay());
  const repaired=g.state.stock.find(i=>i.id===stamp.id)!;assert.equal(repaired.repaired,true);assert.equal(repaired.repairReadyDay,undefined);
  assert.equal(repaired.cards.find(c=>c.group==='condition')?.id,'slightly-damaged');assert.equal(repaired.paid,30);assert.ok(repaired.value>stamp.value);
  assert.equal(action(g,'display repaired stamp',()=>g.listStock(stamp.id,150,0)),true);
  action(g,'next buyer for repaired item',()=>g.completeNarrative());sellLive(g);
  const trade=g.state.trades.at(-1)!;assert.equal(trade.itemId,stamp.id);assert.equal(trade.costBasis,30);assert.equal(trade.profit,trade.price-30);
  assert.equal(g.state.stock.length,0);assert.equal(action(g,'cannot repair sold item',()=>g.repair(stamp.id)),false);
  reports.push({name:'repair-resale',ok:true,quote:quoteBefore,trade});
});

class MemoryStorage implements StorageLike {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}}
function comparable(g:Game){const s=g.snapshot();s.revision=0;return s;}
test('System: whole campaign save/restore continuation matches uninterrupted state including random negotiation',()=>{
  const original=new Game(scenarios);original.start(initialStock());const d=driver();
  drive(original,'reasonable',d,g=>g.state.visit>=20&&g.state.phase==='settled');
  assert.ok(!original.state.completed);const repo=new SaveRepository<State>(new MemoryStorage());
  const saved=repo.saveDay(original.state.day,original.snapshot());assert.equal(saved.ok,true);
  const loaded=repo.loadLatest();assert.ok(loaded.ok&&loaded.value);
  const restored=new Game(scenarios);assert.deepEqual(restored.restore(loaded.value.snapshot),{ok:true});assert.deepEqual(comparable(restored),comparable(original));
  drive(original,'reasonable',d);drive(restored,'reasonable');
  assert.equal(original.state.completed,true);assert.equal(restored.state.completed,true);assert.deepEqual(comparable(restored),comparable(original));
  reports.push({name:'save-campaign-continuation',ok:true,savedVisit:loaded.value.snapshot.visit,finalCash:restored.state.cash});
});
test('System: partially appraised live negotiation, tool/book and loan state survive save and replay',()=>{
  const g=new Game(scenarios);g.start(initialStock());action(g,'inspect before save',()=>g.inspect('material'));
  action(g,'known canvas before save',()=>g.add(nativeCardById.canvas));action(g,'counter before save',()=>quote(g,1));
  assert.ok(g.active,'fixture must save an active negotiation');
  const repo=new SaveRepository<State>(new MemoryStorage());assert.equal(repo.save(g.snapshot()).ok,true);const saved=repo.loadLatest();assert.ok(saved.ok&&saved.value);
  const restored=new Game(scenarios);assert.deepEqual(restored.restore(saved.value.snapshot),{ok:true});assert.deepEqual(comparable(restored),comparable(g));
  for(const engine of [g,restored]){action(engine,'time after restore',()=>engine.tick(1.2));if(engine.active&&engine.state.counter!==null)action(engine,'accept restored counter',()=>engine.accept());else if(engine.active)action(engine,'decline restored conversation',()=>engine.decline());}
  assert.deepEqual(comparable(restored),comparable(g));
  reports.push({name:'save-active-negotiation',ok:true});
});

test('System: original challenge starts day15 at3000; full 30-purchase scheduler is verified in native-progression',()=>{
 const g=new Game(scenarios);g.start([],'challenge',90521);assert.equal(g.state.cash,3000);assert.equal(g.state.day,15);assert.equal(g.state.loans.length,0);assert.equal(g.visit.side,'buy');assert.equal(g.world.challenge?.purchaseAttempts,1);assert.equal(g.world.scheduler.queue.filter(x=>x==='@purchase').length,30);assert.equal(g.world.scheduler.queue.filter(x=>x==='@sale').length,33);assert.ok(g.world.challenge?.contentScope.includes('day15'));invariants(g,'challenge native bootstrap');
});

test('System: challenge completes normally overnight repairs immediately, as the official Demo specifies',()=>{
  const cards=structuredClone(getItemFacts('day8-picked-hoverboard-sale')!.nativeCards!);
  const item:Stock={id:'challenge-repair',definitionId:'day8-picked-hoverboard-sale',title:'Challenge hoverboard',paid:20,costKnown:true,value:24,listing:null,cards};
  const g=new Game(scenarios);g.start([item],'challenge',5021);
  assert.equal(g.repairInfo(g.state.stock[0]).mode,'overnight');
  assert.equal(action(g,'challenge repair request',()=>g.repair(item.id)),true);
  reports.push({name:'challenge-immediate-repair',ok:g.state.stock[0].repairReadyDay===undefined&&g.state.stock[0].repaired===true,repairReadyDay:g.state.stock[0].repairReadyDay??null});
  assert.equal(g.state.stock[0].repairReadyDay,undefined,'source challenge repair override delivers immediately');
  assert.equal(g.state.stock[0].repaired,true);assert.equal(g.state.cash,2946);
  assert.equal(action(g,'repaired challenge item can be displayed',()=>g.listStock(item.id,150,0)),true);
});

test('System: unaffordable offers are harmless and three missed interest periods terminate progression',()=>{
  const g=new Game(guarded([{...visits[0],id:'ordinary-budget-test'},...visits.slice(1)]));g.start(initialStock());const starting=g.state.cash;
  assert.equal(action(g,'unaffordable offer',()=>quote(g,starting+1)),false);assert.equal(g.state.cash,starting);assert.equal(g.state.trades.length,0);
  // A deliberate full-cash offer is a permitted bad decision, not a cash injection.
  for(let attempt=0;attempt<4&&g.active&&g.state.cash>0;attempt++)action(g,'spend full available cash',()=>quote(g,starting));
  if(g.active&&g.state.counter!==null)action(g,'accept resulting live counter',()=>g.accept());
  assert.equal(g.state.cash,0,'fixture must expose the missed-payment route');
  drive(g,'reject');assert.ok(g.state.failure?.includes('three payment periods'));assert.equal(g.state.day,8);
  assert.deepEqual(g.state.closedDays,[6,7,8]);assert.equal(g.getLoan('darcy')?.overdue,3);assert.equal(g.active,false);
  const visit=g.state.visit,cash=g.state.cash;assert.equal(action(g,'failed campaign cannot advance day',()=>g.nextDay()),false);
  assert.equal(g.state.visit,visit);assert.equal(g.state.cash,cash);
  const restored=new Game(scenarios);assert.deepEqual(restored.restore(g.snapshot()),{ok:true});assert.deepEqual(comparable(restored),comparable(g));
  reports.push({name:'missed-interest-failure',ok:true,day:g.state.day,failure:g.state.failure,cash:g.state.cash});
});

test('System: appraisal error probes are grounded in known facts rather than observed final player choices',()=>{
  const facts=getItemFacts('day6-backpack-soldier')!;
  assert.equal(facts.completeCardEvidence,true);
  const correct=auditAppraisal('day6-backpack-soldier',facts.nativeCards!);assert.equal(correct.knownWrong.length,0);
  const falseMaterial=[...facts.nativeCards!.filter(c=>c.group!=='material'),nativeCardById['gold-24k']];
  const incorrect=auditAppraisal('day6-backpack-soldier',falseMaterial);assert.ok(incorrect.knownWrong.some(e=>e.field==='material'));
});
