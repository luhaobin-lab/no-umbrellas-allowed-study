import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_CARDS,type DemoCard} from './demo-item-data';
import {analyzeDemoRecommendation,scoreFromDemoCards} from './rep-data-helper';

test('Exact native IDs and native objects yield the same recommendation score',()=>{
  const ids=['gray_backpack','green_canvas'];
  assert.equal(scoreFromDemoCards(ids,{itemId:'ordinary'}),0);
  assert.equal(scoreFromDemoCards(ids.map(id=>DEMO_CARDS[id]),{itemId:'ordinary'}),0);
  assert.equal(scoreFromDemoCards(ids,{itemId:'ordinary_t'}),-2);
  assert.equal(scoreFromDemoCards(ids),null);
  assert.equal(scoreFromDemoCards(['a backpack'],{itemId:'ordinary'}),null);
});

test('Brand tiers use native category and source ID, with no visual-name heuristics',()=>{
  const native=['gray_backpack','green_sas'];
  const result=analyzeDemoRecommendation(native,{itemId:'ordinary'});
  assert.equal(result.facts?.brandTier,'A');
  assert.equal(result.score,2); // Value 1220 = +1, SAS tier A = +1.
  const disguised={...DEMO_CARDS.green_sas,label:'Definitely not a brand',id:'a-new-ui-alias'};
  assert.equal(scoreFromDemoCards([DEMO_CARDS.gray_backpack,disguised],{itemId:'ordinary'}),2);
  const noBrand={...DEMO_CARDS.green_sas,category:'material'};
  assert.equal(analyzeDemoRecommendation([DEMO_CARDS.gray_backpack,noBrand],{itemId:'ordinary'}).facts?.brandTier,'other');
});

test('Repaired inventory uses the new true condition before applying the recommendation penalty',()=>{
  const result=analyzeDemoRecommendation(['gray_backpack','blue_fairlydmg'],{itemId:'ordinary',repaired:true});
  assert.equal(result.facts?.trueValue,56);
  assert.equal(result.facts?.repaired,true);
  assert.equal(result.score,-2);
});

test('Unrounded value matters at the cheap-item boundary; unresolved values stay unknown',()=>{
  const base:DemoCard={...DEMO_CARDS.gray_backpack,value:30.9};
  assert.equal(scoreFromDemoCards([base],{itemId:'ordinary'}),0);
  assert.equal(scoreFromDemoCards([{...base,value:30}],{itemId:'ordinary'}),-1);
  assert.equal(scoreFromDemoCards([{...base,value:null}],{itemId:'ordinary'}),null);
});

test('Highest-category tier is used and equal tiers follow original last-card replacement',()=>{
  const value=analyzeDemoRecommendation(['gray_backpack','green_canvas','green_silver'],{itemId:'ordinary'}).facts?.trueValue;
  assert.equal(value,140);
  const reverse=analyzeDemoRecommendation(['gray_backpack','green_silver','green_canvas'],{itemId:'ordinary'}).facts?.trueValue;
  assert.equal(reverse,70);
});
