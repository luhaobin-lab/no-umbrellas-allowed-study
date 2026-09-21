import test from 'node:test';
import assert from 'node:assert/strict';
import fixtures from './fixtures/native-script-original.json';
import {createNegotiation,offer,assertNativeCard,hideNativeCard,useNativeTool,tick,drainNativeScriptEffects,declineNativeDeal,NATIVE_SCRIPT_REGISTRY} from './negotiation';
import {getNativeCard,estimateNativeCards} from './native-rules';
import {nativeNegotiationFacts} from './native-sale-feedback';
for(const [index,f] of fixtures.entries())test(`original script DLL ${index}: ${f.input.id}`,()=>{
 const item={instanceId:'probe',definitionId:'probe',integrity:f.input.condition,cardIds:f.input.truth,referenceCardIds:[],rngState:0};
 let s=createNegotiation({side:'buy',fairValue:estimateNativeCards(f.input.truth),publicValue:f.initial.value,initialPublicValue:f.initial.value,personality:'active',seed:1,reputation:0,native:{scriptId:f.input.id,entryPoint:'io',feelSorry:false,trueCardIds:f.input.truth,customerCardIds:f.input.beliefs,itemCondition:f.input.condition,...nativeNegotiationFacts(item,f.input.beliefs)}});
 assert.ok(s.native.script);const seen:string[]=[];
 for(const step of f.steps){const a=step.action as {type:string;id?:string;amount?:number};
  if(a.type==='price')s=offer(s,a.amount!).state;
  if(a.type==='card'||a.type==='hide'){const card=getNativeCard(a.id!)!;const before=step.before as {correct:boolean;proposed:number}|null;const action={cardId:a.id!,category:card.category,tier:card.tier,correct:before?.correct??true,proposedPublicValue:before?.proposed??s.publicValue};s=(a.type==='card'?assertNativeCard(s,action):hideNativeCard(s,action)).state;}
  if(a.type==='tool')s=useNativeTool(s,a.id!);
  if(a.type==='decline')s=declineNativeDeal(s).state;
  const drained=drainNativeScriptEffects(s);s=drained.state;seen.push(...drained.effects.map(e=>e.id));
  assert.equal(s.status==='accepted'?'Success':s.status==='left'?'Fail':'NotFinished',step.state.status,JSON.stringify(a));
  assert.ok(Math.abs(s.publicValue-step.state.value)<1e-8,`${JSON.stringify(a)} value ${s.publicValue} != ${step.state.value}`);
  assert.deepEqual([...s.native.customerCardIds].sort(),[...step.state.customer].sort(),JSON.stringify(a)+' public');
  assert.deepEqual([...s.native.playerCardIds].sort(),[...step.state.hidden].sort(),JSON.stringify(a)+' hidden');
  assert.deepEqual(seen,step.state.chunks,JSON.stringify(a)+' chunks');
  assert.deepEqual(s.native.context.map(a=>a.type).filter(t=>t!=='CustomerAcceptDeal'),step.state.context.map(a=>a.split(/\s/)[0]).filter(t=>t!=='CustomerAcceptDeal'),JSON.stringify(a)+' context');
  const facts=nativeNegotiationFacts(item,s.native.customerCardIds,s.native.playerCardIds);s.native.missingCategories=facts.missingCategories;s.native.nonCorrectCategories=facts.nonCorrectCategories;
 }
});
test('all 32 source registry identities have independent original-DLL sequences',()=>{assert.equal(Object.keys(NATIVE_SCRIPT_REGISTRY).length,32);assert.deepEqual([...new Set(fixtures.map(f=>f.input.id))].sort(),Object.keys(NATIVE_SCRIPT_REGISTRY).sort());});
test('script closures and pending effects survive save/load, and drain consumes once',()=>{let s=createNegotiation({side:'buy',fairValue:100,publicValue:50,initialPublicValue:50,personality:'active',seed:1,reputation:0,native:{scriptId:'D01_1_haggle_darcy'}});s=offer(s,190).state;assert.deepEqual(offer(s,198),offer(JSON.parse(JSON.stringify(s)),198));const drained=drainNativeScriptEffects(s);assert.equal(drained.effects.length,1);assert.equal(drainNativeScriptEffects(drained.state).effects.length,0);assert.equal(tick(s,200).status,s.status);});
import endFixtures from './fixtures/native-end-effects-original.json';
import {nativeHaggleOutcomeEffects} from './native-haggle-effects';
test('144 independent original IO success/fail end-state cases: reporting, appraisal flags, fraud, visitors and persistence',()=>{
 for(const f of endFixtures){const i=f.input;
  const s=createNegotiation({side:'buy',fairValue:estimateNativeCards(i.truth),publicValue:f.state.value,initialPublicValue:f.state.value,personality:i.fixie?'fixie':'active',seed:1,reputation:0,native:{day:i.day,trueCardIds:i.truth,customerCardIds:i.beliefs,playerCardIds:['green_silver'],globals:i.globals}});
  s.acceptedAmount=20;s.native.context=[...i.history].reverse().map(a=>({...a,type:a.type as typeof s.native.context[number]['type'],tick:0}));
  const e=nativeHaggleOutcomeEffects(s,i.success),actual={...i.globals,...e.contexts},expected=f.state.globals as unknown as Record<string,string>;
  const relevant=['buyBackPromise','precise','visitorsToAdd','fraud','fixieFraud','dealWithFixieSuccess','dealWithFixieFail','dealWithFixieCount','redUsed','under75','playerInsists','InsistStack','lastInsisted','playerShakes','report','meReportedSettled','firstFake'];
  const selected=Object.fromEntries(Object.entries(actual).filter(([k])=>relevant.includes(k)).map(([k,v])=>[k,String(v)]));
  assert.deepEqual(selected,expected,JSON.stringify(i));assert.equal(e.visitorsDelta,f.state.visitors,JSON.stringify(i));
 }
});
