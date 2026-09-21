/** Source tool readouts; these return measurements, never mutate customer beliefs. */
import {getNativeItem,getNativeCard,resolveNativeItem,sortNativeCards,nativeCardId} from './native-rules';
import {NATIVE_MATERIAL_SPRITES} from './native-item-data';
import type {NativeCard,NativeItemQuery,NativeSprite} from './native-types';
export type NativeTool='damage'|'material'|'signature'|'year'|'gem'|'screwdriver';
export interface NativeToolContext {currentBookPage?:string;shift?:boolean;manualEnabled?:boolean;privateCardIds?:readonly string[];customerCardIds?:readonly string[];open?:boolean}
export interface NativeToolReading {
 status:'available'|'unsupported'|'failed'|'source-error';tool:NativeTool;sourceToolId:string;definitionId:string;reason:string;
 activation:'hover'|'click';bookPage?:string;deselect:boolean;toolUseHook:boolean;usedEvent:boolean;
 observation?:string;year?:number;integrity?:number;needleAngle?:number;settleSeconds?:number;
 sprite?:NativeSprite;materialCardId?:string;materialTint?:{r:number;g:number;b:number;a:number};hasSignature?:boolean;
 revealedCard?:NativeCard;assumedCard?:NativeCard;printSeconds?:number;fadeSeconds?:number;open?:boolean;
}
const sourceIds:Record<NativeTool,string>={damage:'brush',material:'magnifier',signature:'sign',year:'year',gem:'jewelscan',screwdriver:'screw'};
export const NATIVE_TOOL_UNLOCKS:Record<NativeTool,string>={damage:'tool.brush',material:'tool.magnifier',signature:'tool.sign',year:'tool.year',gem:'tool.jewel',screwdriver:'tool.screw'};
/** Source auto-navigation preserves related comparison pages, and respects either Shift key. */
export function nativeToolBookTarget(tool:NativeTool,year:number,context:NativeToolContext={}):string|undefined{
 if(context.shift||context.manualEnabled===false)return undefined;
 const page=context.currentBookPage??'';
 switch(tool){case 'damage':return 'Status';case 'material':return page.startsWith('Brands_')?undefined:'Materials';case 'signature':return page.startsWith('Figures')?undefined:'FigureList';case 'year':return ['Brands_','Figures','History'].some(prefix=>page.startsWith(prefix))?undefined:year<=1999?'Historic':year>=2048?'History_Timeline2':'History_Timeline1';case 'gem':return 'Jewel';case 'screwdriver':return 'WatchMovement';}
}
export function inspectNativeItem(query:NativeItemQuery,tool:NativeTool,context:NativeToolContext={}):NativeToolReading{
 const item=resolveNativeItem(query),definition=getNativeItem(item.definitionId)!;
 const reading:NativeToolReading={status:'available',tool,sourceToolId:sourceIds[tool],definitionId:definition.id,reason:'Original Windows 1.0.5 tool rule.',activation:tool==='gem'||tool==='screwdriver'?'click':'hover',deselect:false,toolUseHook:true,usedEvent:true};
 const cards=sortNativeCards(item.cardIds);
 reading.bookPage=nativeToolBookTarget(tool,definition.year,context);
 if(tool==='damage')return {...reading,observation:`Integrity ${item.integrity}`,integrity:item.integrity,needleAngle:52.7-105.4*Math.max(0,Math.min(1,item.integrity/100)),settleSeconds:.5};
 if(tool==='year')return {...reading,observation:String(definition.year).padStart(4,'0'),year:definition.year};
 if(tool==='signature')return {...reading,observation:definition.signature?.name??'No Signature Found',hasSignature:!!definition.signature,sprite:definition.signature};
 if(tool==='material'){
  // Unity takes first serialized material, before tier refinement.
  const material=item.cardIds.map(id=>getNativeCard(id,{factory:true})).find(c=>c?.category==='material'),sprite=material?NATIVE_MATERIAL_SPRITES[material.id]:undefined;
  if(!sprite)return {...reading,status:'source-error',reason:'Original MagnifierTool.OnUse dereferences null loadedSprite for this definition.',bookPage:undefined,usedEvent:false,toolUseHook:false};
  return {...reading,observation:material!.name,materialCardId:material!.id,sprite,materialTint:definition.materialTint};
 }
 if(tool==='screwdriver')return definition.openSprite?{...reading,deselect:true,open:!context.open,sprite:context.open?definition.sprite:definition.openSprite}:{...reading,status:'unsupported',reason:'Item has no source OpenSprite.',bookPage:undefined,deselect:true,usedEvent:false};
 if((context.privateCardIds?.length??0)>=2)return {...reading,status:'failed',reason:'Two private card slots are already occupied.',bookPage:undefined,deselect:true};
 const jewels=cards.filter(c=>c.category==='jewel');
 let result=jewels.length>1?(jewels[0].tier<=jewels[1].tier?jewels[1]:jewels[0]):jewels[0];
 if(!result)return {...reading,status:'unsupported',reason:'Item has no jewel card.',bookPage:undefined,deselect:true};
 if(result.tier===0)result={...result,id:result.id+'_cert',tier:1};
 if([...(context.privateCardIds??[]),...(context.customerCardIds??[])].some(id=>nativeCardId(id)===result.id))return {...reading,status:'failed',reason:'Scanner certificate already belongs to player or customer.',bookPage:undefined,deselect:true};
 // Unity converts the revealed ID back through Card.FromID before assumeCard (tier can become 0).
 return {...reading,observation:result.name,revealedCard:result,assumedCard:getNativeCard(result.id,{factory:true}),printSeconds:.75,fadeSeconds:.25};
}
