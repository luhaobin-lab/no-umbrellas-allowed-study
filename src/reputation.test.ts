import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appraisalPoints,initialFromRates,rates,tiers,reviewAppraisal,reviewSatisfaction,reviewRecommendation,recommendationScore,type ReputationState,type RecommendationFacts} from './reputation';

const evidence=JSON.parse(readFileSync(new URL('../reference/research/demo-reputation-results.json',import.meta.url),'utf8')).cases as Record<string,any>[];
const state=(values:Partial<ReputationState>={}):ReputationState=>({expertnessRaw:0,attractivenessRaw:0,wittinessRaw:0,...values});

test('All 618 possible raw ratings match direct official DLL percentages and tiers',()=>{
  let checked=0;
  for(const row of evidence){
    const key=row.kind==='appraised'?'expertness':row.kind==='trusted'?'attractiveness':row.kind==='recommended'?'wittiness':null;
    if(!key)continue;
    const s=state({[`${key}Raw`]:row.raw});
    assert.equal(rates(s)[key],row.percent,`${key} raw ${row.raw}`);
    assert.equal(tiers(s)[key],row.tier,`${key} tier at raw ${row.raw}`);
    checked++;
  }
  assert.equal(checked,618);
});

test('Every satisfaction boundary and clamp matches the DLL',()=>{
  const rows=evidence.filter(row=>row.kind==='trusted');
  for(const row of rows){
    const s=state({attractivenessRaw:row.raw});
    assert.equal(reviewSatisfaction(s,'satisfied').state.attractivenessRaw,row.successRaw);
    assert.equal(reviewSatisfaction(s,'unsatisfied').state.attractivenessRaw,row.failRaw);
    assert.equal(s.attractivenessRaw,row.raw);
  }
  assert.equal(rows.length,201);
});

test('Appraisal scoring matches 15 official DLL probes across all five tiers',()=>{
  const rows=evidence.filter(row=>row.kind==='appraisal-points');
  for(const row of rows){
    const s=state({expertnessRaw:row.raw});
    assert.equal(appraisalPoints(row.errors,0,tiers(s).expertness),row.delta);
    assert.equal(reviewAppraisal(s,{wrongCategories:row.errors,missingCategories:0,complete:true}).pointDelta,row.delta);
  }
  assert.equal(rows.length,15);
});

test('A percentage screenshot provides a range, not an invented exact hidden rating',()=>{
  const seed=initialFromRates(4,-1,0);
  assert.deepEqual(seed.intervals,{expertnessRaw:[36,44],attractivenessRaw:[-3,-2],wittinessRaw:[0,0]});
  assert.deepEqual(rates(seed.state),{expertness:4,attractiveness:-1,wittiness:0});
  assert.equal(seed.inferred,true);
  const changed=reviewAppraisal(seed.state,{wrongCategories:0,missingCategories:0,complete:true});
  assert.equal(changed.rawDelta,2);
  assert.equal(rates(changed.state).expertness,4);
});

test('Incomplete facts never earn an all-correct reward or cause an unproved penalty',()=>{
  const s=initialFromRates(4,-1,0).state;
  assert.equal(reviewAppraisal(s,{wrongCategories:0,missingCategories:0,complete:false}).applied,false);
  assert.equal(reviewAppraisal(s,{wrongCategories:1,missingCategories:0,complete:false}).applied,false);
  assert.equal(reviewAppraisal(s,{wrongCategories:2,missingCategories:0,complete:false}).pointDelta,-3);
  assert.equal(reviewAppraisal(s,{wrongCategories:0,missingCategories:0,complete:true,alreadyEvaluated:true}).applied,false);
  assert.equal(reviewAppraisal(s,{wrongCategories:0,missingCategories:0,complete:true,enabled:false}).applied,false);
});

test('Recommendation score and level changes match 48 official synthetic-item probes',()=>{
  const rows=evidence.filter(row=>row.kind==='recommendation-points');
  for(const row of rows){
    const facts:RecommendationFacts={trueValue:row.price,popularity:'neutral',figure:'other',brandTier:'other',limited:false,historical:false,fake:false,repaired:row.repaired,pickedUp:false};
    const score=recommendationScore(facts);
    assert.equal(score,row.score);
    assert.equal(reviewRecommendation(state({wittinessRaw:row.raw}),{recommended:true,score}).state.wittinessRaw,row.after);
  }
  assert.equal(rows.length,48);
});

test('High-quality and negative traits combine; ordinary shelves never change recommendation rating',()=>{
  const facts:RecommendationFacts={trueValue:3000,popularity:'all',figure:'world-historic',brandTier:'AA',limited:true,historical:true,fake:false,repaired:false,pickedUp:false};
  assert.equal(recommendationScore(facts),11);
  assert.equal(recommendationScore({...facts,fake:true,repaired:true,pickedUp:true}),6);
  assert.equal(recommendationScore({...facts,figure:null}),null);
  assert.equal(reviewRecommendation(state(),{recommended:false,score:11}).applied,false);
  assert.equal(reviewRecommendation(state(),{recommended:true,score:null}).applied,false);
});
