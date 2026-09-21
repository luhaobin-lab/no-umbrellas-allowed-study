/** Full original Windows 1.0.5 source sprite registry; generated assets retain source IDs. */
import {NATIVE_ITEM_DATA,NATIVE_MATERIAL_SPRITES,NATIVE_TOOL_SPRITES} from './native-item-data';
import type {NativeSprite} from './native-types';
const compact=(s:NativeSprite)=>({asset:s.asset,name:s.name,size:[s.width,s.height]});
export const DEMO_MATERIAL_SPRITES=Object.fromEntries(Object.entries(NATIVE_MATERIAL_SPRITES).map(([k,v])=>[k,compact(v)]));
export const DEMO_SIGNATURE_SPRITES:Record<string,{asset:string;name:string;size:number[]}>=Object.fromEntries(Object.values(NATIVE_ITEM_DATA).filter(i=>i.signature).map(i=>[i.signature!.sourceId.split(':').at(-1)!,compact(i.signature!)]));
export const DEMO_TOOL_FRAMES=Object.fromEntries(Object.entries(NATIVE_TOOL_SPRITES).filter(([,v])=>v).map(([k,v])=>[k,compact(v)]));
