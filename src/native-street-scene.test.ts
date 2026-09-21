import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_STREET_DOORS,NATIVE_STREET_SCENE,nativeFlowerTranslation,nativeStreetStoreOpen,sourceWorldToStreetX,streetXToSourceWorld} from './native-street-data';
import {nativeInteriorProductHotspots,nativeInteriorInteractionHotspots,type NativeStreetCamera} from './native-street-view';
import {StreetWorld,type StreetFloor} from './street';
const camera:NativeStreetCamera={worldX:110,worldY:.675,pixelsPerUnit:400,width:1920,height:1080};
const xOf=(id:string)=>sourceWorldToStreetX(NATIVE_STREET_DOORS.find(d=>d.destinationPath.startsWith(`Stores/${id}/`))!.worldPosition.x);
class LoadedImage {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;naturalWidth=1;complete=true;set src(_value:string){queueMicrotask(()=>this.onload?.());}}
function street(floor:StreetFloor,x:number,day:number){globalThis.Image=LoadedImage as unknown as typeof Image;const s=new StreetWorld();s.restore({floor,later:false,x,direction:'right',searchedBins:[],shopsOpen:true});s.setContexts({day,morning:true,evening:false});return s;}
test('street E actions apply the source day boundary, night closure and shared GEM/CityChat doorway',()=>{
 for(const [store,day]of [['RepairShop',9],['HiddenV',18],['BestRoof',12]]as const){const floor=store==='BestRoof'?'b3':'b2',s=street(floor,xOf(store),day-1);assert.equal(s.interact(),`street:notice:${store}`);s.setContexts({day,morning:true});assert.equal(s.interact(),`nav:store:${store}`);s.setContexts({day,morning:false,evening:true});assert.equal(s.interact(),`street:notice:${store}`);}
 for(const day of [1,5,6,9,10,15,16,20,21]){const s=street('b1',xOf('GemByJ'),day);assert.equal(s.interact(),day>=21?'nav:store:CityChat':day<=5||day>=10&&day<=15?'nav:store:GemByJ':'street:notice:GemByJ');}
 const junk=street('b2',xOf('JunkJunk'),4);assert.equal(junk.interact(),'nav:store:JunkJunk');junk.setContexts({day:4,morning:true,hanjaHurt:true});assert.equal(junk.interact(),'street:notice:JunkJunk');
});
test('B2 walking reaches both original right-hand doors and B3 connects back by its right stair',()=>{
 const s=street('b2',1134,20);for(let i=0;i<40;i++)s.update(.1,new Set(['ArrowRight']));assert.ok(s.state().x>2900);const restore=street('b2',xOf('RepairShop'),20);assert.equal(restore.interact(),'nav:store:RepairShop');restore.enter('street-b3-east');assert.equal(restore.state().floor,'b3');assert.equal(restore.interact(),'nav:street-b2-east');restore.enter('street-b2-east');assert.equal(restore.state().floor,'b2');assert.equal(restore.interact(),'nav:street-east');
});
test('nine source doorway transforms round-trip under the source PixelPerfect street projection',()=>{
 assert.equal(NATIVE_STREET_DOORS.length,9);for(const door of NATIVE_STREET_DOORS)assert.ok(Math.abs(streetXToSourceWorld(sourceWorldToStreetX(door.worldPosition.x))-door.worldPosition.x)<1e-10);
 assert.equal(nativeStreetStoreOpen('RepairShop',{day:8,morning:true}),false);assert.equal(nativeStreetStoreOpen('RepairShop',{day:9,morning:true}),true);
});
test('SetFlowers reparents the selected tuple into its three serialized positions and moves other product roots away',()=>{
 const display=[5,1,3];assert.equal(NATIVE_STREET_SCENE.flowerLayout.source,'level58:2271');assert.equal(NATIVE_STREET_SCENE.flowerLayout.slots.length,3);
 for(let type=1;type<=6;type++){const shift=nativeFlowerTranslation(`Stores/Scented/StoreItems/flower_${type}/plant`,display)!;assert.equal(shift.shown,display.includes(type));if(shift.shown){const base=NATIVE_STREET_SCENE.flowerLayout.originals.find(f=>f.type===type)!.matrix,expectedX=[109.14300000667572,109.4559999704361,110.56199997663498][display.indexOf(type)];assert.ok(Math.abs(base[4]+shift.x-expectedX)<1e-9);assert.ok(Math.abs(base[5]+shift.y-.10499999299645424)<1e-9);}}
 assert.equal(nativeFlowerTranslation('scented/room_main/flower_2',display),null);
});
test('displayed flower hotspot moves with its source renderer while logic-only purchases never become fake shelf hotspots',()=>{
 const a=nativeInteriorProductHotspots('Scented',{...camera,flowerDisplay:[1,3,5]}),b=nativeInteriorProductHotspots('Scented',{...camera,flowerDisplay:[3,5,1]});assert.equal(a.length,3);assert.equal(b.length,3);
 for(const spot of a){const moved=b.find(x=>x.id===spot.id)!;const oldSlot=[1,3,5].indexOf(Number(spot.path.split('_').at(-1))),newSlot=[3,5,1].indexOf(Number(spot.path.split('_').at(-1))),positions=NATIVE_STREET_SCENE.flowerLayout.slots;assert.ok(Math.abs((moved.bounds[0]-spot.bounds[0])-(positions[newSlot][4]-positions[oldSlot][4])*400)<1e-7);assert.ok(spot.bounds[2]>0&&spot.bounds[3]>0);}
 for(const store of ['NiceT','AjikHair','RepairShop','HiddenV'])assert.deepEqual(nativeInteriorProductHotspots(store,camera),[]);
 assert.equal(nativeInteriorProductHotspots('CityChat',camera).length,3);assert.equal(nativeInteriorProductHotspots('BestRoof',camera).length,3);
});

test('interior interaction helper keeps source NPC/exit regions and suppresses automatic entry-only trigger bounds',()=>{
 const gemCamera={...camera,worldX:50},regions=nativeInteriorInteractionHotspots('GemByJ',gemCamera,{day:1,morning:true});assert.ok(regions.some(x=>x.id==='level58:2145'&&x.kind==='StreetTrigger'));assert.ok(regions.some(x=>x.id==='level58:2606'&&x.kind==='StreetInteractible'));assert.equal(regions.some(x=>x.id==='level58:2259'),false);for(const r of regions)assert.ok(r.bounds[2]>0&&r.bounds[3]>0);
 const ordinary=nativeInteriorInteractionHotspots('Scented',camera,{day:1,morning:true}),challenge=nativeInteriorInteractionHotspots('Scented',camera,{day:1,morning:true,ChallengeMode:true});assert.equal(ordinary.some(x=>x.id==='level58:2608'),true);assert.equal(challenge.some(x=>x.id==='level58:2608'),false);
});
