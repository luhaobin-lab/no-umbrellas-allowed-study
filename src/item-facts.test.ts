import test from 'node:test';
import assert from 'node:assert/strict';
import {REFERENCE_INSPECTIONS} from './reference-inspections';
import {RECORDED_TRANSACTIONS} from './reference-transactions';
import {auditAppraisal,inspectItem,getItemFacts,conditionCardCandidates,createItemFactRegistry,VIDEO_ITEM_FACT_DEFINITIONS,ITEM_FACT_CONTINUITY_LINKS,valuationForItem,type ItemFactDefinition} from './item-facts';

test('Every recorded tool readout resolves from independent item facts',()=>{
  for(const row of REFERENCE_INSPECTIONS){
    const result=inspectItem(row.transactionId,row.tool);
    assert.equal(result.status,'available',`${row.transactionId}/${row.tool}`);
    assert.equal(result.readout?.asset,row.asset);
    assert.ok(result.readout?.source.some(s=>s.timestamp===row.timestamp));
  }
});

test('Omitted scans remain unknown, non-watch screwdriver remains unsupported',()=>{
  assert.equal(inspectItem('day6-backpack-soldier','gem').status,'unsupported');
  assert.equal(inspectItem('day6-backpack-soldier','screwdriver').status,'unsupported');
  assert.equal(inspectItem('day6-backpack-soldier','xray').status,'unsupported');
  assert.equal(inspectItem('invented-visit','material').status,'unknown');
  assert.equal(inspectItem('day9-umbrella-side-deal','year').readout,undefined);
});

test('Identical titles do not merge bought and gifted AVAC cards',()=>{
  assert.equal(inspectItem('day8-avac-card','year').readout?.year,2079);
  assert.equal(inspectItem('day8-avac-card-sale','year').readout?.year,2077);
  assert.notEqual(getItemFacts('day8-avac-card')?.id,getItemFacts('day8-avac-card-sale')?.id);
});

test('Explicit ownership links reuse facts for the same item, including a later scan',()=>{
  assert.equal(inspectItem('day7-backpack-resale','year').readout?.year,2068);
  assert.equal(inspectItem('day11-rabbit-sale','material').readout?.materialCardId,'wooden');
  assert.equal(inspectItem('day8-my-mom','signature').status,'available');
  assert.ok(inspectItem('day8-my-mom','signature').readout?.source.some(s=>s.timestamp===2743.5));
});

test('A real omitted or wrong material is detected without using recorded final cards',()=>{
  const missing=auditAppraisal('day6-backpack-soldier',['backpack','wrong-material']);
  assert.ok(missing.knownMissing.some(i=>i.field==='material'&&i.expectedCardIds.includes('canvas')));
  const wrong=auditAppraisal('day6-backpack-soldier',['backpack','wrong-material','gold-24k']);
  assert.ok(wrong.knownWrong.some(i=>i.cardId==='gold-24k'&&i.field==='material'));
  assert.equal(inspectItem('day6-backpack-soldier','material').readout?.materialCardId,'canvas');
});

test('Recorded final appraisal can itself be wrong: boots retain a counterfeit brand',()=>{
  const recorded=RECORDED_TRANSACTIONS.find(v=>v.id==='day6-combat-boots')!;
  assert.ok(recorded.states.at(-1)!.tags.includes('brand-easy-enough'));
  const result=auditAppraisal(recorded.id,recorded.states.at(-1)!.tags);
  assert.ok(result.knownWrong.some(i=>i.cardId==='brand-easy-enough'&&i.expectedCardIds.includes('wrong-slogan')));
  assert.equal(valuationForItem(recorded.id),119.9);
});

test('The earlier human texture annotation conflict is preserved, not silently called truth',()=>{
  const facts=getItemFacts('day8-crocodile')!;
  assert.equal(facts.readouts.material?.materialCardId,'paper');
  assert.ok(facts.conflicts?.some(c=>c.field==='material'));
  assert.equal(facts.conflicts?.[0].resolved,true);
});

test('Public and private correct cards have the same correctness, not the same visible price',()=>{
  const cards=['canvas','wrong-material'];
  const visible=auditAppraisal('day6-backpack-soldier',cards);
  const hidden=auditAppraisal('day6-backpack-soldier',[],cards);
  assert.deepEqual(hidden.knownWrong,visible.knownWrong);
  assert.deepEqual(hidden.knownMissing,visible.knownMissing);
  assert.deepEqual(hidden.unknownEvidence,visible.unknownEvidence);
});

test('No-signature readout forbids signature cards; an unidentified glyph stays unresolved',()=>{
  const wrong=auditAppraisal('day6-backpack-soldier',['artist-signature']);
  assert.ok(wrong.knownWrong.some(i=>i.cardId==='artist-signature'&&i.field==='signature'));
  const videoRegistry=createItemFactRegistry(VIDEO_ITEM_FACT_DEFINITIONS,ITEM_FACT_CONTINUITY_LINKS);
  const uncertain=videoRegistry.auditAppraisal('day7-golden-glasses',['unidentified-signature']);
  assert.ok(uncertain.unknownEvidence.some(i=>i.field==='signature'));
  assert.ok(!uncertain.knownWrong.some(i=>i.field==='signature'));
});

test('Year scans distinguish archaeological evidence from unproved national relevance',()=>{
  assert.ok(auditAppraisal('day8-gioconda',[]).knownMissing.some(i=>i.expectedCardIds.includes('archaeological')));
  assert.ok(auditAppraisal('day6-backpack-soldier',['archaeological']).knownWrong.some(i=>i.cardId==='archaeological'));
  const videoRegistry=createItemFactRegistry(VIDEO_ITEM_FACT_DEFINITIONS,ITEM_FACT_CONTINUITY_LINKS);
  const national=videoRegistry.auditAppraisal('day6-backpack-soldier',['national-historic']);
  assert.ok(national.unknownEvidence.some(i=>i.cardId==='national-historic'));
  assert.ok(!national.knownWrong.some(i=>i.cardId==='national-historic'));
});

test('Official condition thresholds preserve legitimate overlap and reject invalid input',()=>{
  const examples:[number,string[]][]=[
    [0,['perfect']],[5,['perfect']],[6,['perfect','slightly-damaged']],[15,['perfect','slightly-damaged']],
    [16,['slightly-damaged']],[25,['slightly-damaged']],[26,['slightly-damaged','fairly-damaged']],
    [35,['slightly-damaged','fairly-damaged']],[36,['fairly-damaged']],[50,['fairly-damaged']],
    [51,['fairly-damaged','valueless']],[65,['fairly-damaged','valueless']],[66,['valueless']],[100,['valueless']],
  ];
  for(const [n,expected] of examples)assert.deepEqual(conditionCardCandidates(n),expected,`integrity=${n}`);
  for(const n of [-1,101,NaN,Infinity])assert.deepEqual(conditionCardCandidates(n),[]);
  assert.deepEqual(conditionCardCandidates(10,[{id:'potential-garbage',tier:2}]),['potential-garbage']);
  assert.deepEqual(conditionCardCandidates(5,[{id:'blue_slightdmg',tier:0}]),['perfect','slightly-damaged']);
});

test('Explicit official facts can be admitted without recorded judgments or hardcoded visit prices',()=>{
  const definition:ItemFactDefinition={id:'official:watch-test',name:'Fixture',source:[],readouts:{year:{observation:'2032',year:2032,source:[],confidence:'official-demo'}},constraints:[],officialIntegrity:30,officialConditionCards:[]};
  const registry=createItemFactRegistry([]);
  registry.addVerifiedItemDefinition(definition,['visit:test']);
  assert.equal(registry.inspectItem('visit:test','year').readout?.year,2032);
  for(const id of ['slightly-damaged','fairly-damaged'])assert.equal(registry.auditAppraisal('visit:test',[id]).knownWrong.length,0);
  assert.ok(registry.auditAppraisal('visit:test',['perfect']).knownWrong.some(i=>i.field==='condition'));
  assert.ok(registry.auditAppraisal('visit:test',[]).knownMissing.some(i=>i.field==='condition'));
});

test('Returned evidence cannot mutate the registered item truth',()=>{
  const result=inspectItem('day6-backpack-soldier','year');
  result.readout!.year=9999;
  const facts=getItemFacts('day6-backpack-soldier')!;
  facts.constraints.length=0;
  assert.equal(inspectItem('day6-backpack-soldier','year').readout?.year,2068);
  assert.ok(getItemFacts('day6-backpack-soldier')!.constraints.length>0);
});

test('Official facts fill missing scans and retain independent prices and false signatures',()=>{
  assert.equal(inspectItem('day7-golden-glasses','year').readout?.year,2068);
  assert.equal(inspectItem('day6-backpack-soldier','damage').readout?.integrity,17);
  assert.ok(auditAppraisal('day7-golden-glasses',['signature-jeweler']).knownWrong.some(i=>i.expectedCardIds.includes('unidentified-signature')));
  assert.equal(valuationForItem('day8-rabbit',4),3011.84);
  assert.equal(valuationForItem('day6-backpack-soldier',-1),55.44);
  assert.equal(valuationForItem('day9-umbrella-side-deal'),null);
});
