import raw from './native-street-scene-data.json';
import rawDoors from './native-street-hotspots-data.json';
import gem from './native-gem-dialogue-data.json';
import {testCondition,type Contexts} from './native-scheduler';
export interface NativeSceneSprite {id:string;name:string;image:string;width:number;height:number;rect:{width:number;height:number};pivot:{x:number;y:number};textureOffset:{x:number;y:number};textureSize:{x:number;y:number};ppu:number;border:{left:number;bottom:number;right:number;top:number}}
interface Complex {trueIfAllOf:string[]|string;trueIfAnyOf:string[]|string;falseIfAllOf:string[]|string;falseIfAnyOf:string[]|string}
interface Gate {controller:number;nodeIds:number[];controlsRenderer:boolean;invert:boolean;complex:boolean;predicate:string;complexPredicate:Complex}
export interface NativeSceneRenderer {id:string;gameObject:number;path:string;sprite:string;active:boolean;activeChain:{id:number;active:boolean}[];enabled:boolean;matrix:number[];z:number;color:{r:number;g:number;b:number;a:number};sortingLayer:number;sortingLayerID:number;sortingOrder:number;flipX:boolean;flipY:boolean;drawMode:number;size:{x:number;y:number};gates:Gate[];existence:{id:number;data:{predicate:string;useComplexPredicate:boolean|number;complexPredicate:Complex}}[]}
interface Scene {id:string;renderers:NativeSceneRenderer[];cameras:{id:string;path:string;position:{x:number;y:number;z:number};lens:{OrthographicSize:number}}[]}
export const NATIVE_STREET_SCENE=raw as unknown as {sourceVersion:string;flowerLayout:{source:string;slots:number[][];hidden:number[];originals:{type:number;gameObject:number;matrix:number[]}[]};scenes:Scene[];sprites:Record<string,NativeSceneSprite>;errors:unknown[];dynamicSpriteSlots:unknown[]};
export const NATIVE_STREET_DOORS=rawDoors;
export const NATIVE_GEM_DIALOGUE=gem;
/** English StreetEvent_props table entries42–50, supplied Windows1.0.5 Demo. */
export const NATIVE_STREET_STORE_LABELS:Readonly<Record<string,string>>={Scented:'SCENTED',GemByJ:'GEM byJ',CityChat:'CITY CHAT',JunkJunk:'JunkJunk',HiddenV:'HiddenV',NiceT:'NiceT',AjikHair:'AjikHair',BestRoof:'BestRoof',RepairShop:'RepairShop'};
export function nativeGemDialogue(day:number,choiceIndex:number){return gem.groups.filter(g=>g.condition===(day<=5?'day <= 5':'day > 5'))[Math.abs(Math.trunc(choiceIndex))%2].lines;}
function complex(c:Complex,contexts:Contexts){const list=(v:string[]|string)=>Array.isArray(v)?v:v?[v]:[];const all=list(c.trueIfAllOf),any=list(c.trueIfAnyOf),noAll=list(c.falseIfAllOf),noAny=list(c.falseIfAnyOf);return all.every(p=>testCondition(p,contexts))&&(!any.length||any.some(p=>testCondition(p,contexts)))&&(!noAll.length||!noAll.every(p=>testCondition(p,contexts)))&&!noAny.some(p=>testCondition(p,contexts));}
export function nativeSceneVisible(r:Pick<NativeSceneRenderer,'activeChain'|'enabled'|'gates'|'existence'>,contexts:Contexts){
 const nodes=new Map(r.activeChain.map(n=>[n.id,n.active]));let enabled=r.enabled;
 for(const g of r.gates){const yes=g.complex?complex(g.complexPredicate,contexts):testCondition(g.predicate,contexts),active=g.invert?!yes:yes;for(const id of g.nodeIds)nodes.set(id,active);if(g.controlsRenderer)enabled=active;}
 return enabled&&[...nodes.values()].every(Boolean)&&r.existence.every(e=>e.data.useComplexPredicate?complex(e.data.complexPredicate,contexts):testCondition(e.data.predicate,contexts));
}
export const nativeStreetRenderers=NATIVE_STREET_SCENE.scenes.flatMap(s=>s.renderers).sort((a,b)=>a.sortingLayer-b.sortingLayer||a.sortingOrder-b.sortingOrder||b.z-a.z);
/** Exact source Unity world coordinates; renderer projection is explicit and independently adjustable. */
export const NATIVE_STREET_PROJECTION={pixelsPerUnit:300,stripOffsetX:-2364,doorY:460,floors:{b1:-.149,b2:-2.1,b3:-4.01}} as const;
export const sourceWorldToStreetX=(x:number)=>x*NATIVE_STREET_PROJECTION.pixelsPerUnit+NATIVE_STREET_PROJECTION.stripOffsetX;
export const streetXToSourceWorld=(x:number)=>(x-NATIVE_STREET_PROJECTION.stripOffsetX)/NATIVE_STREET_PROJECTION.pixelsPerUnit;
/** Serialized interactive bounds. Logic-only purchase nodes intentionally have no clickable rectangle. */
export {default as NATIVE_STREET_INTERACTIONS} from './native-street-interactions-data.json';
export function nativeStreetStoreOpen(storeId:string,contexts:Contexts){const door=NATIVE_STREET_DOORS.find(d=>d.destinationPath.startsWith(`Stores/${storeId}/`));if(!door)return false;return door.enableControllers.every(c=>c.useComplexPredicate?complex(c.complexPredicate as Complex,contexts):testCondition(c.predicate,contexts));}

export function nativeFlowerTranslation(path:string,display:readonly number[]|undefined):{x:number;y:number;shown:boolean}|null{const match=path.match(/^Stores\/Scented\/StoreItems\/flower_(\d+)(?:\/|$)/);if(!match||!display)return null;const type=Number(match[1]),slot=display.indexOf(type);if(slot<0)return{x:0,y:0,shown:false};const layout=NATIVE_STREET_SCENE.flowerLayout,from=layout.originals.find(f=>f.type===type)?.matrix,to=layout.slots[slot];return from&&to?{x:to[4]-from[4],y:to[5]-from[5],shown:true}:{x:0,y:0,shown:false};}
