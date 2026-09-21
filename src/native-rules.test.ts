import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {NATIVE_ITEM_DATA,NATIVE_CARD_DATA} from './native-item-data';
import {createNativeItem,getNativeCard,estimateNativeCards,refineNativeCards,isTrueCard} from './native-rules';
import type {NativeItemInstance} from './native-types';
const oracleFile=new URL('../reference/original-study/items/windows-dll-probe.jsonl',import.meta.url);
const oracle=existsSync(oracleFile)?readFileSync(oracleFile,'utf8').trim().split('\n').map(l=>JSON.parse(l)):[];
const raw=(ids:string[])=>ids.map(id=>NATIVE_CARD_DATA[id]);
function serialized(id:string):NativeItemInstance{const d=NATIVE_ITEM_DATA[id];return {instanceId:id,definitionId:id,cardIds:[...d.cardIds],referenceCardIds:[...d.referenceCardIds],integrity:d.integrity,rngState:1};}
const near=(a:number,b:number,context:string)=>assert.ok(Math.abs(a-b)<1e-8,`${context}: ${a} != ${b}`);
test('complete serialized 609 × 252 appraisal matrix matches original DLL',()=>{
 assert.equal(Object.keys(NATIVE_ITEM_DATA).length,609);assert.equal(Object.keys(NATIVE_CARD_DATA).length,252);
 const grids=oracle.filter(x=>x.kind==='appraisal-grid');assert.equal(grids.length,609);
 let count=0;for(const row of grids){const item=serialized(row.itemId),accepted=new Set(row.acceptedCardIds);for(const card of Object.values(NATIVE_CARD_DATA)){assert.equal(isTrueCard(item,card),accepted.has(card.id),`${row.itemId} / ${card.id}`);count++;}}assert.equal(count,153468);
});
test('all raw affine effects and original factory divergences',()=>{
 for(const row of oracle){if(row.kind==='card'){const card=getNativeCard(row.id)!;for(const sample of row.samples)near(sample.input*card.multiplier+card.addend,sample.output,row.id);}
 if(row.kind==='factory-card'){if(row.error){assert.throws(()=>getNativeCard(row.requestedId,{factory:true}));continue;}const c=getNativeCard(row.requestedId,{factory:true})!;assert.equal(c.id,row.actualId);assert.equal(c.tier,row.tier);near(c.addend,row.at0,c.id);near(100*c.multiplier+c.addend,row.at100,c.id);}}
});
test('all 609 serialized item values and refined source order',()=>{
 const rows=oracle.filter(x=>x.kind==='item');assert.equal(rows.length,609);
 for(const row of rows){near(estimateNativeCards(raw(row.rawCardIds)),row.serializedBaseValue,row.id);if(row.jewelryValuation?.serializedWithGeneratedCard!==undefined){const item=createNativeItem(row.id,{randomizeJewelry:false});near(estimateNativeCards(item.cardIds),row.jewelryValuation.serializedWithGeneratedCard,row.id+' generated');}assert.deepEqual(refineNativeCards(raw(row.rawCardIds)).map(c=>c.id),row.refinedCardIds,row.id);}
 for(const row of oracle.filter(x=>x.kind==='valuation-order')){near(estimateNativeCards(raw(row.ids)),row.value,'valuation-order');assert.deepEqual(refineNativeCards(raw(row.ids)).map(c=>c.id),row.refined.map((c:any)=>c.id));}
});
test('all 1616 original condition boundaries, including exact-card shortcut',()=>{
 const rows=oracle.filter(x=>x.kind==='condition');assert.equal(rows.length,1616);
 for(const row of rows){const item={...serialized('meatShake_t'),integrity:row.integrity,cardIds:[row.truth]};assert.equal(isTrueCard(item,NATIVE_CARD_DATA[row.proposed]),row.accepted,JSON.stringify(row));}
});
test('dynamic jewelry reproduces source price defect and rejects unsupported cuts',()=>{
 for(const row of oracle.filter(x=>x.kind==='jewel-generated'))near(getNativeCard(row.id,{factory:true})!.addend,row.value,row.id);
 for(const row of oracle.filter(x=>x.kind==='jewel-edge'&&x.error))assert.throws(()=>getNativeCard(`green_jewel_${row.jewel}_1_${row.cut}`,{factory:true}));
 const d=Object.values(NATIVE_ITEM_DATA).find(d=>d.hasTier2JewelryInfo&&d.generateRandomTier2JewelryInfo&&d.cardIds.some(id=>NATIVE_CARD_DATA[id]?.category==='jewel'))!;
 const one=createNativeItem(d.id,{seed:42,instanceId:'stock-1'}),same=createNativeItem(d.id,{seed:42,instanceId:'stock-1'});assert.deepEqual(one,same);assert.ok(one.jewel);assert.equal(one.cardIds.filter(id=>id.startsWith('green_jewel_')).length,1);assert.deepEqual(JSON.parse(JSON.stringify(one)),one);
});
