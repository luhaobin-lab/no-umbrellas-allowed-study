import {nativeCardById} from './item-facts';
import {REFERENCE_INVENTORY_BY_TITLE} from './reference-inventory';
import {REFERENCE_BALANCES} from './reference-balances';
import {RECORDED_TAGS,RECORDED_TRANSACTIONS,RECORDED_INITIAL_STOCK, type PixelBox} from './reference-transactions';
import {REF_BOOK_TAGS,REF_BOOK_RECORDED_TAG_ALIASES} from './reference-book-data';
import type {Card,Visit,Stock,Patch} from './engine';
export const box=(b:PixelBox):[number,number,number,number]=>[b.x,b.y,b.width,b.height];
export const cards:Card[]=RECORDED_TAGS.map(t=>({id:t.id,label:t.text,group:t.group==='material-brand'?'brand':t.group,operator:t.operation,value:t.value,asset:t.asset,source:t.timestamp}));
export const cardById=Object.fromEntries(cards.map(t=>[t.id,t]));
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
export const bookCards:Record<string,Card>=Object.fromEntries(REF_BOOK_TAGS.map(t=>[t.id,cardById[REF_BOOK_RECORDED_TAG_ALIASES[t.id as keyof typeof REF_BOOK_RECORDED_TAG_ALIASES]]||cards.find(c=>normalize(c.label)===normalize(t.label)||c.id===t.id)||{id:t.id,label:t.label,group:t.group,operator:nativeCardById[t.id]?.operator??t.operator,value:nativeCardById[t.id]?.value??t.value,source:t.sourceTimestamp}]));
function patch(asset:string|null,b:PixelBox|null):Patch|undefined{return asset&&b?{asset,rect:box(b)}:undefined;}
export const visits:Visit[]=RECORDED_TRANSACTIONS.filter(t=>['buy','sell','gift','story'].includes(t.saleType)).map(t=>{
 const all=t.states.at(-1)?.tags||t.initialTags;const attraction=RECORDED_TAGS.filter(c=>c.group==='shop'&&c.timestamp<=t.end).sort((a,b)=>b.timestamp-a.timestamp)[0];
 return {id:t.id,day:t.day||6,start:t.start,end:t.end,side:t.saleType as Visit['side'],title:t.item?.name||'',base:t.item?.baseValue||0,initial:t.initialTags.map(id=>cardById[id]).filter(Boolean),final:all.map(id=>cardById[id]).filter(Boolean),attractiveness:t.attractiveness??attraction?.value??-1,expertness:t.expertness??4,price:t.finalPrice,quotes:t.quotes,estimate:t.states.at(-1)?.appraisedValue??null,npc:patch(t.npc.asset,t.npc.bbox),item:patch(t.item?.asset||null,t.item?.bbox||null),titlePatch:t.item?.titleAsset?{asset:t.item.titleAsset,rect:[91,350,285,61]}:undefined,dialogues:t.dialogues.map(d=>({text:d.text,timestamp:d.timestamp,asset:d.asset||undefined,rect:d.bbox?box(d.bbox):undefined})),sourceCash:REFERENCE_BALANCES[t.id]?.cash??t.states[0]?.cash??undefined,sourceCashAfter:t.states.at(-1)?.cash??undefined};
});
export function initialStock():Stock[]{return RECORDED_INITIAL_STOCK.filter(s=>s.name!=='Backpack of Soldier').sort((a,b)=>{const x=REFERENCE_INVENTORY_BY_TITLE[a.name]?.rect,y=REFERENCE_INVENTORY_BY_TITLE[b.name]?.rect;return (x?x[1]*2000+x[0]:0)-(y?y[1]*2000+y[0]:0);}).map(s=>({id:s.id,title:s.name,paid:s.boughtAt||0,costKnown:s.boughtAt!==null&&s.boughtAt!==undefined,value:s.appraisedValue||s.askPrice||0,listing:s.askPrice,originalListing:s.askPrice,sourceListing:true,slot:s.bbox?Math.round((s.bbox.y-307)/210)*4+([112,336,1008,1232].findIndex(x=>Math.abs(x-s.bbox!.x)<10)):null,cards:[],patch:patch(s.asset,s.bbox)}));}
export const recordedById=Object.fromEntries(RECORDED_TRANSACTIONS.map(v=>[v.id,v]));
