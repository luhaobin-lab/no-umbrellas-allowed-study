import {nativeModifierOutcome} from './native-outcome';
import {evaluateNativeSaleFeedback} from './native-sale-feedback';
import {getNativeCard,getNativeItem} from './native-rules';
import {nativeSaleValues} from './native-sale-value';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNegotiation,offer,tick,assertNativeCard,hideNativeCard,useNativeTool,clearNegotiationContext,acceptNativeSaleCounter,type NegotiationInput } from './negotiation';
import { generateNativeBeliefs,NATIVE_BELIEF_MISTAKES } from './native-beliefs';
import { selectNativeModifier } from './native-pipelines';
import type { NativeCardInfo,NativeModifier } from './native-negotiation-types';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/native-negotiation-original.json',import.meta.url),'utf8'));
const rows=fixture.records as any[];
const aliases:Record<string,NegotiationInput['personality']>={Active:'active',Emotional:'emotional',WishyWashy:'wishy-washy',Cautious:'cautious',Fixie:'fixie'};
const base:NegotiationInput={side:'buy',fairValue:100,publicValue:100,initialPublicValue:100,personality:'active',seed:1,reputation:0,native:{feelSorry:false}};
const make=(x:Partial<NegotiationInput>={})=>createNegotiation({...base,...x});
const sourceOutcome=(x:any)=>x.status==='Success'?'accepted':x.status==='Fail'?'left':x.context.slice(0,x.context.findIndex((a:string)=>a.startsWith('PlayerSuggestPrice'))).some((a:string)=>a.startsWith('CustomerSuggestPrice'))?'counter':'rejected';
test('external original DLL: all 540 initial quote cases including 1V helper boundaries',()=>{
 assert.equal(fixture.sourceAssemblySha256,'8fd9303d81d3a086fd0aade914c0eea31c1017f7865e1a94fc7451a6a3ed56c3');
 let n=0;for(const r of rows.filter(r=>r.kind==='initial-price')){const state=make({personality:aliases[r.personality],fairValue:r.value,publicValue:r.value,initialPublicValue:r.value});const res=offer(state,r.offered);assert.equal(res.outcome,sourceOutcome(r.state),`${r.personality} V${r.value} p${r.offered}`);const q=r.state.context.find((a:string)=>a.startsWith('CustomerSuggestPrice'));if(res.outcome==='counter')assert.equal(res.counter,Number(q.substring(21)));n++;}assert.equal(n,540);
});
test('external original DLL: all 108 modifier quote results and actual counter values',()=>{
 let n=0;for(const r of rows.filter(r=>r.kind==='modifier-offer')){const cx=r.state.context,pi=cx.findIndex((a:string)=>a.startsWith('PlayerSuggestPrice'));const opening=cx.slice(pi+1).find((a:string)=>a.startsWith('CustomerSuggestPrice'));const state=make({native:{entryPoint:'io',modifier:r.modifier,initialCounter:opening?Number(opening.substring(21)):undefined,nonCorrectCategories:0,missingCategories:0,feelSorry:false}});const res=offer(state,r.amount);assert.equal(res.outcome,sourceOutcome(r.state),`${r.modifier} p${r.amount}`);const q=cx.slice(0,pi).find((a:string)=>a.startsWith('CustomerSuggestPrice'));if(res.outcome==='counter')assert.equal(res.counter,Number(q.substring(21)));n++;}assert.equal(n,108);
});
test('controller accepts visible frightened offer; raw IO exercises the separate refusal pipe',()=>{
 const input={native:{modifier:'FrightenedReported' as NativeModifier}};assert.equal(offer(make(input),60).outcome,'accepted');assert.equal(offer(make({native:{...input.native,entryPoint:'io'}}),60).outcome,'left');
});
test('external original DLL: eleven modifier public/private evidence sequences',()=>{
 let checked=0;for(const r of rows.filter(r=>r.kind==='modifier-evidence-sequence')){
  const start=()=>make({fairValue:70,native:{modifier:r.modifier,nonCorrectCategories:3,missingCategories:3,feelSorry:false}});
  let state=start();for(const [i,step] of r.hiddenSteps.entries()){state=hideNativeCard(state,{cardId:step.card,category:'research_'+String.fromCharCode(97+i),color:'Blue',tier:0,correct:true,proposedPublicValue:state.publicValue}).state;assert.equal(state.status==='left',step.state.status==='Fail',`${r.modifier} hide${i}`);assert.deepEqual(state.native.playerCardIds,step.hidden);}
  state=start();for(const [i,step] of r.publicSteps.entries()){state=assertNativeCard(state,{cardId:step.card,category:'research_'+String.fromCharCode(97+i),color:'Blue',tier:0,correct:true,proposedPublicValue:state.publicValue+(i===1?-50:10)}).state;assert.equal(state.status==='left',step.state.status==='Fail',`${r.modifier} public${i}`);assert.equal(state.publicValue,step.state.value);}
  checked++;
 }assert.equal(checked,11);
});
test('wrong-card consequences count suggestions even after removing the live label',()=>{
 let state=make();for(let i=0;i<4;i++){const result=assertNativeCard(state,{cardId:'wrong_'+i,category:'type',correct:false,proposedPublicValue:10,customerCardIds:[]});state=result.state;assert.equal(result.leave,i===3);}assert.equal(state.publicValue,100);assert.equal(state.native.context.filter(a=>a.type==='PlayerSuggestCard').length,4);
});
test('unknown truth is retained explicitly and cannot silently lower public value',()=>{
 const res=assertNativeCard(make(),{cardId:'unknown',category:'material',correct:null,proposedPublicValue:1});assert.equal(res.beliefAccepted,false);assert.equal(res.state.publicValue,100);assert.ok(res.state.native.unknownFacts.includes('truth:unknown'));
});
test('Wishy delayed decision is serialized and resolves exactly once at its due tick',()=>{
 let state=offer(make({personality:'wishy-washy'}),40).state;state=offer(state,56).state;assert.ok(state.native.pending);const saved=JSON.parse(JSON.stringify(state));const seconds=(state.native.pending!.dueTick-state.native.ticks)*.2;
 const before=tick(state,seconds-.2);assert.ok(before.native.pending);const after=tick(state,seconds);assert.equal(after.native.pending,null);assert.deepEqual(after,tick(saved,seconds));if(after.status==='accepted'||after.status==='left')assert.deepEqual(tick(after,100),after);
});
test('new evidence interrupts scheduled price response, and source clear resets actual context',()=>{
 let s=offer(make({personality:'wishy-washy'}),40).state;s=offer(s,56).state;assert.ok(s.native.pending);
 s=assertNativeCard(s,{cardId:'truth',category:'material',correct:true,proposedPublicValue:50}).state;assert.ok(s.native.pending);s=tick(s,8);assert.equal(s.native.pending,null);assert.equal(s.status,'open');
 s=useNativeTool(s,'jewelscan');assert.equal(s.native.actionLog?.at(-1)?.toolId,'jewelscan');const c=clearNegotiationContext(s);assert.equal(c.native.context.length,0);assert.equal(c.offers,0);assert.equal(c.customerOffers,0);assert.equal(c.publicValue,50);
});
test('source cheap-sale gate is certain at 90% for 200 independent local seeds',()=>{
 for(let seed=0;seed<200;seed++){const r=offer(make({side:'sell',listingPrice:90,seed,sale:{mandatoryFeedback:null}}),90);assert.equal(r.outcome,'accepted');assert.equal(r.state.acceptedAmount,90);}
});
test('both bundle response paths are real plans and preserve RNG across saves',()=>{
 const paths=new Set<string>();for(let seed=0;seed<100;seed++){const input:Partial<NegotiationInput>={side:'sell',listingPrice:200,seed,sale:{itemId:'a',definitionId:'A',visitors:2,mandatoryFeedback:null,eligibleSecondItems:[{instanceId:'b',definitionId:'B',fairValue:100,publicValue:100,listingPrice:150,available:true}]}};const state=make(input),r=offer(state,200);assert.deepEqual(r,offer(JSON.parse(JSON.stringify(state)),200));assert.equal(r.outcome,'counter');assert.ok(r.state.salePlan);paths.add(r.state.salePlan!.kind);const accepted=acceptNativeSaleCounter(r.state);assert.equal(accepted.outcome,'accepted');assert.equal(accepted.state.acceptedAmount,r.counter);assert.equal(acceptNativeSaleCounter(accepted.state).outcome,'rejected');}
 assert.deepEqual(paths,new Set(['bundle','counter-then-additional']));
});
test('bundle requires another available definition and never chains from additional sale',()=>{
 for(const extra of [{definitionId:'A',available:true},{definitionId:'B',available:false},{definitionId:'B',available:true}]){const r=offer(make({side:'sell',listingPrice:200,sale:{itemId:'a',definitionId:'A',visitors:2,isAdditionalSale:extra.available&&extra.definitionId==='B',mandatoryFeedback:null,eligibleSecondItems:[{instanceId:'b',fairValue:100,publicValue:100,listingPrice:150,...extra}]}}),200);assert.equal(r.state.salePlan?.kind,'single');}
});
test('generated belief filtering matches all five original DLL color/tier/category fixtures',()=>{
 assert.equal(Object.keys(NATIVE_BELIEF_MISTAKES).length,55);for(const r of rows.filter(r=>r.kind==='generated-belief-filter')){const cards=r.input as NativeCardInfo[];const res=generateNativeBeliefs({cards,references:[],cardCatalog:Object.fromEntries(cards.map(c=>[c.id,c])),personality:r.personality,day:6,seed:5});assert.deepEqual(res.cards.map(c=>c.id),r.output);}
});
test('candidate eligibility differs from final choice, and unreachable original routes remain absent',()=>{
 const found=new Set<string>();for(let seed=0;seed<500;seed++){const result=selectNativeModifier({day:21,actualFake:false,appraiseProportion:1,nonCorrectCategories:0,hasUnappraisedPositiveCard:true,globals:{'AzikScore':40,'Report.week':1,addCustomerToday1:1}},'Active',1000,seed);assert.equal(result.eligible.includes('Rain'),false);assert.notEqual(result.applied,'DarcyFriend');assert.deepEqual(result,selectNativeModifier({day:21,actualFake:false,appraiseProportion:1,nonCorrectCategories:0,hasUnappraisedPositiveCard:true,globals:{'AzikScore':40,'Report.week':1,addCustomerToday1:1}},'Active',1000,seed));if(result.applied)found.add(result.applied);}assert.ok(found.has('Busy')&&found.has('Enthusiast')&&found.has('SingSing'));
});

test('external original DLL: condition boundaries, fake evidence, jewels, signatures and deterministic red cards',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./fixtures/native-card-original.json',import.meta.url),'utf8'));let checked=0;
 for(const r of data.records.filter((r:any)=>Array.isArray(r.truth)&&Array.isArray(r.steps))){assert.notEqual(r.kind,'error');let s=make({personality:aliases[r.personality],publicValue:r.initial.value,initialPublicValue:r.initial.value,native:{feelSorry:false,trueCardIds:r.truth,customerCardIds:r.beliefs,referenceCardIds:r.references??[],itemCondition:r.condition,shopBalance:r.balance,globals:{openRedCard:true,umbrellaForfeited:true}}});
 for(const [i,step] of r.steps.entries()){const card=getNativeCard(step.card)!;const res=assertNativeCard(s,{cardId:card.id,category:card.category,color:(['Gray','Green','Blue','Red','Yellow','Pink'] as const)[card.color],tier:card.tier,correct:step.correct,proposedPublicValue:step.proposed});s=res.state;const label=`${r.kind} ${r.personality} ${r.condition} step${i}:${step.card}`;assert.equal(s.publicValue,step.state.value,label);assert.deepEqual([...s.native.customerCardIds].sort(),[...step.state.customerCardIds].sort(),label);assert.equal(s.status==='left',step.state.status==='Fail',label);assert.equal(s.status==='accepted',step.state.status==='Success',label);checked++;}
 }assert.ok(checked>=90);
});

test('external original DLL: all 25 price sequences are reachable including their counter values',()=>{
 let checked=0;for(const r of rows.filter(r=>r.kind==='sequence')){
  const reachable=Array.from({length:128},(_,seed)=>{let s=make({personality:aliases[r.personality],seed,native:{entryPoint:'io',feelSorry:r.steps[0].state.pricePipes.includes('FeelSorry')}});return r.steps.every((step:any)=>{s=offer(s,step.amount).state;const expected=sourceOutcome(step.state),actual=s.status==='accepted'?'accepted':s.status==='left'?'left':s.status==='countered'?'counter':'rejected';const split=step.state.context.findIndex((a:string)=>a.startsWith('PlayerSuggestPrice'));const q=step.state.context.slice(0,split).find((a:string)=>a.startsWith('CustomerSuggestPrice'));return expected===actual&&(expected!=='counter'||s.counter===Number(q.substring(21)));});}).some(Boolean);
  assert.ok(reachable,`${r.personality} sequence ${r.offers}`);checked++;
 }assert.equal(checked,25);
});
test('external original DLL: 32 delayed outcomes replay source random schedule inputs and cancel on context mutation',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('./fixtures/native-card-original.json',import.meta.url),'utf8')).records;let count=0;
 for(const r of records.filter((r:any)=>r.kind==='delay')){
  let s=make({personality:r.variant==='wishy'?'wishy-washy':'active',fairValue:r.value,publicValue:r.value,initialPublicValue:r.value,native:{feelSorry:false,modifier:r.variant==='confused'?'ConfusedReported':null,itemCondition:0,customerCardIds:['gray_ring'],trueCardIds:['gray_ring']}});
  for(const p of r.quotes)s=offer(s,p).state;
  const source=r.pipes.find((p:any)=>['AcceptWishy','SuggestForLast','DeclineWishy'].includes(p.name));assert.ok(source);assert.ok(s.native.pending);
  // Replaying the captured random *schedule parameters*, independently of expected outcome.
  const kind=source.name==='AcceptWishy'?'accept':source.name==='SuggestForLast'?'counter':'leave';s.native.pending={...s.native.pending!,kind,dueTick:source.closure.tickForSchedule,counter:kind==='counter'?(r.variant==='confused'?r.quotes[0]:r.value*(r.quotes[1]/r.value+.05)):undefined};s.native.delayedActions=[s.native.pending];
  if(r.interrupt)s=assertNativeCard(s,{cardId:'blue_perfect',category:'condition',tier:0,color:'Blue',correct:false,proposedPublicValue:r.before.value}).state;
  s=tick(s,8);assert.equal(s.status==='accepted',r.state.status==='Success');assert.equal(s.status==='left',r.state.status==='Fail');assert.equal(s.publicValue,r.state.value);
  const q=r.state.context.find((a:string)=>a.startsWith('CustomerSuggestPrice'));if(kind==='counter'&&!r.interrupt)assert.equal(s.counter,Number(q.substring(21)));if(r.interrupt)assert.equal(s.native.pending,null);count++;
 }assert.equal(count,32);
});
test('external original DLL: pre-sampled Busy timers and absolute normal timeout ticks',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('./fixtures/native-card-original.json',import.meta.url),'utf8')).records;let count=0;
 for(const r of records.filter((r:any)=>r.kind==='tick'&&(r.modifier==='Busy'||r.pipes[0].closureType.includes('f@51-75')))){
  const c=r.pipes[0].closure;let s=make({native:{feelSorry:false,modifier:r.modifier==='Busy'?'Busy':null}});
  if(r.modifier==='Busy'){s.nagIntervals=[c.t,c.f.n2,c.f.f2.n3].map((v:number)=>v*.2);s.native.nagging={kind:'busy',threshold:c.t,stage:0,flower:false};}else s.native.nagging={kind:'by-time',threshold:c.tick,stage:0,flower:false};
  let previous=0;for(const step of r.steps){s=tick(s,(step.tick-previous)*.2);assert.equal(s.status==='left',step.status==='Fail');assert.equal(s.native.ticks,step.tick);previous=step.tick;}count++;
 }assert.ok(count>=2);
});
test('external original DLL: all 3654 mandatory-feedback cases across the entire 609-item catalog',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('./fixtures/native-sale-feedback-original.json',import.meta.url),'utf8'));
 for(const r of records){const actual=evaluateNativeSaleFeedback({item:{instanceId:r.id,definitionId:r.id,cardIds:r.truth,referenceCardIds:[],integrity:r.integrity,rngState:1},appraisalCardIds:r.appraisal,evaluated:r.evaluated,buyingPrice:50,listingPrice:100});assert.deepEqual(actual.mandatoryFeedback,r.mandatory,`${r.id} ${r.evaluated} ${r.appraisal}`);assert.deepEqual(actual.conditionFeedback,r.condition);}
 assert.equal(records.length,3654);
});
test('external original DLL: all 6090 buyer valuations and counter-ratio denominators',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('./fixtures/native-sale-value-original.json',import.meta.url),'utf8'));
 for(const r of records){const values=nativeSaleValues({item:{instanceId:r.id,definitionId:r.id,cardIds:getNativeItem(r.id)!.cardIds,integrity:getNativeItem(r.id)!.integrity,referenceCardIds:[],rngState:1},appraisalCardIds:r.appraisal,appraisedTier:r.appraisedTier,recommendedTier:r.recommendedTier});assert.ok(Math.abs(values.fairValue-r.fairValue)<1e-8,`${r.id} tier${r.appraisedTier}/${r.recommendedTier}: ${values.fairValue} vs ${r.fairValue}`);assert.ok(Math.abs(values.ratioValue-r.ratioValue)<1e-8);}
 assert.equal(records.length,6090);
});

test('external original DLL: all 24 Junuk/SingSing outcome contexts, day gates and score bounds',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('./fixtures/native-card-original.json',import.meta.url),'utf8')).records.filter((r:any)=>r.kind==='modifier-outcome');
 for(const r of records){const s=make({native:{modifier:r.modifier,day:r.day,globals:{AzikScore:r.score,[r.modifier+'Failed']:2}}});const patch=nativeModifierOutcome(s,r.success);const actual={AzikScore:r.score,[r.modifier+'Failed']:2,...patch};assert.equal(actual.AzikScore,Number(r.globals.AzikScore));assert.equal(actual[r.modifier+'Failed'],Number(r.globals[r.modifier+'Failed']));}assert.equal(records.length,24);
});
