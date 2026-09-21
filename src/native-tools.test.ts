import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {NATIVE_ITEM_DATA,NATIVE_CARD_DATA} from './native-item-data';
import {NATIVE_MANUAL_PAGES,NATIVE_MANUAL_FONTS,NATIVE_MANUAL_INLINE_SPRITES} from './native-manual-data';
import {createNativeItem} from './native-rules';
import {inspectNativeItem,nativeToolBookTarget} from './native-tools';
test('all 609 definitions expose source tool capabilities and actual images',()=>{
 let signatures=0,openable=0,mainImages=0,material=0;
 for(const d of Object.values(NATIVE_ITEM_DATA)){
  const item=createNativeItem(d.id,{randomizeJewelry:false});
  assert.equal(inspectNativeItem(item,'year').year,d.year);assert.equal(inspectNativeItem(item,'damage').integrity,d.integrity);
  const sign=inspectNativeItem(item,'signature');assert.equal(sign.hasSignature,!!d.signature);if(d.signature)signatures++;
  const screw=inspectNativeItem(item,'screwdriver');assert.equal(screw.status==='available',!!d.openSprite);if(d.openSprite)openable++;
  if(inspectNativeItem(item,'material').status==='available')material++;
  for(const image of [d.sprite,d.zoomSprite,d.hoverSprite,d.signature,d.openSprite])if(image)assert.ok(existsSync(new URL('../public'+image.asset,import.meta.url)),image.asset);
  if(d.sprite)mainImages++;
 }
 assert.equal(signatures,204);assert.equal(openable,59);assert.equal(mainImages,606);assert.equal(material,593);
});
test('source book navigation respects preserved pages and Shift',()=>{
 assert.equal(nativeToolBookTarget('damage',0),'Status');assert.equal(nativeToolBookTarget('material',0,{currentBookPage:'Brands_EasyEnough'}),undefined);
 assert.equal(nativeToolBookTarget('year',1999),'Historic');assert.equal(nativeToolBookTarget('year',2000),'History_Timeline1');assert.equal(nativeToolBookTarget('year',2048),'History_Timeline2');
 assert.equal(nativeToolBookTarget('signature',0,{currentBookPage:'Figures_1'}),undefined);assert.equal(nativeToolBookTarget('gem',0,{shift:true}),undefined);
});
test('scanner private capacity and repeat certificate failures do not reveal NPC truth',()=>{
 const d=Object.values(NATIVE_ITEM_DATA).find(d=>d.cardIds.includes('green_garnet')&&!d.hasTier2JewelryInfo)!;
 const item=createNativeItem(d.id,{randomizeJewelry:false}),copy=structuredClone(item);
 const first=inspectNativeItem(item,'gem');assert.equal(first.revealedCard?.tier,1);assert.equal(first.assumedCard?.tier,0);assert.equal(first.assumedCard?.addend,NATIVE_CARD_DATA.green_garnet.addend);
 assert.equal(inspectNativeItem(item,'gem',{privateCardIds:['blue_perfect','green_paper']}).status,'failed');
 assert.equal(inspectNativeItem(item,'gem',{customerCardIds:[first.revealedCard!.id]}).status,'failed');assert.deepEqual(item,copy);
});
test('all 77 native pages and inline atlas dependencies exist with source targets',()=>{
 assert.equal(NATIVE_MANUAL_PAGES.length,77);assert.equal(Object.keys(NATIVE_MANUAL_INLINE_SPRITES).length,10);
 for(const font of Object.values(NATIVE_MANUAL_FONTS)){assert.ok(font.characters.length);assert.ok(font.glyphs.length);for(const path of [...font.atlasAssets,...font.alphaAtlasAssets])assert.ok(existsSync(new URL('../public'+path,import.meta.url)),path);}
 for(const page of NATIVE_MANUAL_PAGES){const queue=[page.root];while(queue.length){const node=queue.pop()!;queue.push(...node.children);if(node.image?.sprite)assert.ok(existsSync(new URL('../public'+node.image.sprite.asset,import.meta.url)),node.image.sprite.asset);for(const c of node.conditions??[])if(c.kind==='EnableByContext')for(const t of c.targets??[])assert.ok(t.nodeId,`${page.id}/${node.name}/${t.id}`);}}
});
