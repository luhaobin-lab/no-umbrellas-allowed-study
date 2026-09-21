/** Windows 1.0.5 core rules; source DLL oracle is exercised by native-rules.test.ts. */
import {NATIVE_CARD_DATA,NATIVE_CARD_ALIASES,NATIVE_ITEM_DATA} from './native-item-data';
import {nativeRandom} from './native-random';
import type {NativeCard,NativeItemQuery,NativeItemInstance,NativeItemCreationOptions,NativeItemDefinition} from './native-types';
export type NativeCardQuery=string|NativeCard;
export const nativeCardId=(id:string)=>NATIVE_CARD_ALIASES[id]??id;
export function getNativeItem(id:string):NativeItemDefinition|undefined{return NATIVE_ITEM_DATA[id];}
const gems:Record<string,number>={emerald:1000,ruby:800,grandidierite:1200,taaffeite:1500};
const cuts:Record<string,number>={emerald:1,round:1.5,oval:1.7,pear:2,heart:1.6,cushion:2.1};
const dynamic=(id:string,category:string,addend:number,multiplier=1,tier=0):NativeCard=>({id,name:id,category,tier,color:category==='jewel'||category==='brand'?1:5,addend,multiplier,shortEffect:'',collectible:false});
/** Raw serialized cards and factory products differ (notably garnet certificates). */
export function getNativeCard(id:string,options:{factory?:boolean}={}):NativeCard|undefined{
 id=nativeCardId(id);if(!options.factory&&NATIVE_CARD_DATA[id])return NATIVE_CARD_DATA[id];
 const pink=id.match(/pink_(appraised|recommended|trusted)_?(-?[\d.]+)/);
 if(pink){const percent=Math.trunc(Number(pink[2]));return dynamic(`pink_${pink[1]}_${percent}`,pink[1],0,1+percent/100);}
 if(id.includes('green_jewel')){const parts=id.split('_'),kind=parts[2],carat=Number(parts[3]),cut=parts[4];
  if(!Object.hasOwn(gems,kind)||!Object.hasOwn(cuts,cut)||!Number.isInteger(carat))throw new RangeError('Original jewelry factory rejects '+id);
  return dynamic(id,'jewel',gems[kind]*cuts[cut],1,2);
 }
 if(id.includes('green_fakeBrandHalf')){const base=NATIVE_CARD_DATA['green_'+id.substring(19)];if(!base)throw new RangeError('Original half-brand factory cannot find '+id);return dynamic(id,'brand',base.addend/2,1,3);}
 if(/^green_(cubic|amethyst|garnet|topaz|pearl|quartz)_cert$/.test(id)){const base=NATIVE_CARD_DATA[id.replace(/_cert$/,'')];return {...base,id};}
 if(NATIVE_CARD_DATA[id])return NATIVE_CARD_DATA[id];
 if(options.factory){const color=id.includes('gray')?0:1;return {...dynamic((color===0?'gray':'green')+'_lost','lost',0),color};}
 return undefined;
}
export function requireNativeCard(c:NativeCardQuery):NativeCard{
 if(typeof c!=='string')return c;
 const card=getNativeCard(c,{factory:true});if(!card)throw new RangeError('Unknown card '+c);return card;
}
export function sortNativeCards(cards:readonly NativeCardQuery[]):NativeCard[]{return cards.map(requireNativeCard).sort((a,b)=>a.color-b.color||(a.category<b.category?-1:a.category>b.category?1:0));}
export function overwriteNativeCard(current:readonly NativeCardQuery[],incoming:NativeCardQuery):NativeCard[]{
 const list=current.map(requireNativeCard),card=requireNativeCard(incoming);
 const old=list.find(c=>(c.category===card.category&&c.color!==3)||(c.color===0&&card.color===0));
 if(old&&old.tier>card.tier)return list;
 return [card,...list.filter(c=>!old||c.id!==old.id)];
}
export function refineNativeCards(cards:readonly NativeCardQuery[]):NativeCard[]{return sortNativeCards(cards.reduce<NativeCard[]>((list,c)=>overwriteNativeCard(list,c),[]));}
export function estimateNativeCards(cards:readonly NativeCardQuery[]):number{
 if(!cards.length)return 0;return Math.max(1,refineNativeCards(cards).reduce((price,c)=>price*c.multiplier+c.addend,0));
}
export function combineNativeCards(shared:readonly NativeCardQuery[],privateCards:readonly NativeCardQuery[]):NativeCard[]{const priv=privateCards.map(requireNativeCard);return sortNativeCards([...shared.map(requireNativeCard).filter(c=>!priv.some(p=>p.category===c.category)),...priv]);}
export function createNativeItem(id:string,options:NativeItemCreationOptions={}):NativeItemInstance{
 const d=getNativeItem(id);if(!d)throw new RangeError('Unknown original item '+id);
 const rng=nativeRandom(options.seed??1),cardIds=[...(options.cardIds??d.cardIds)];let jewel:NativeItemInstance['jewel'];
 const base=cardIds.map(c=>getNativeCard(c)).find(c=>c?.category==='jewel');
 if(base&&d.hasTier2JewelryInfo&&!cardIds.some(c=>c.startsWith('green_jewel_'))){
  let carat=d.jewelryCarat,cut=d.jewelryCut;
  if(d.generateRandomTier2JewelryInfo&&options.randomizeJewelry!==false){carat=Math.round(1+3*rng.next());cut=['none','emerald','cushion','heart','pear','oval','round'][Math.floor(7*rng.next())];}
  if(carat===0)carat=1;if(cut==='none')cut='round';
  const kind=base.id.split('_')[1],cardId=`green_jewel_${kind}_${carat}_${cut}`;
  getNativeCard(cardId,{factory:true});cardIds.push(cardId);jewel={kind,carat,cut,cardId};
 }
 return {instanceId:options.instanceId??id,definitionId:id,cardIds,referenceCardIds:[...d.referenceCardIds],integrity:options.integrity??d.integrity,...(jewel?{jewel}:{}),rngState:rng.state};
}
export function resolveNativeItem(query:NativeItemQuery):NativeItemInstance{
 if(typeof query==='string')return createNativeItem(query,{randomizeJewelry:false});
 return 'definitionId' in query?query:createNativeItem(query.id,{cardIds:query.cardIds,integrity:query.integrity,randomizeJewelry:false});
}
/** Reproduces permissive source exceptions, including any high-tier jewel and half-brand. */
export function isTrueCard(query:NativeItemQuery,proposed:NativeCardQuery):boolean{
 const item=resolveNativeItem(query),card=typeof proposed==='string'?getNativeCard(proposed):proposed;
 if(!card)return false;if(['trusted','appraised','recommended','repair'].includes(card.category))return true;
 const actual=sortNativeCards(item.cardIds).filter(c=>c.category===card.category);if(!actual.length)return false;
 const highest=actual.reduce((a,b)=>b.tier>a.tier?b:a);
 if(card.category==='condition'){
  if(actual.length===1&&actual[0].id===card.id)return true;
  if(highest.tier!==0)return highest.id===card.id;
  const n=item.integrity,ids=n<=5?['blue_perfect']:n<=15?['blue_perfect','blue_slightdmg']:n<=25?['blue_slightdmg']:n<=35?['blue_slightdmg','blue_fairlydmg']:n<=50?['blue_fairlydmg']:n<=65?['blue_fairlydmg','blue_novalue']:['blue_novalue'];return ids.includes(card.id);
 }
 if(card.category==='jewel'&&(card.tier>=1||card.id.includes('cert')))return true;
 if(card.category==='brand'&&(card.id.includes('fakeBrandHalf')||(card.id.includes('fakeBrand')&&actual.some(c=>c.id===card.id))))return true;
 return highest.id===card.id;
}
/** Book drag substitution in PickupMaterialContextProvider; only the active material is promoted. */
export function resolveNativePickupCard(id:string,pickupMaterialId:number):string{
 id=nativeCardId(id);const pickup:Record<string,number>={green_paper:1,green_glass:2,green_aluminum:3,green_basemetal:4,green_stainlesssteel:5,green_surgical:5,green_silver:6,green_plastic:7};
 return pickup[id]===pickupMaterialId?id+'1':id;
}
