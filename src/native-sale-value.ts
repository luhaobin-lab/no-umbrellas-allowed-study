import {getNativeCard,resolveNativeItem,sortNativeCards,refineNativeCards,estimateNativeCards} from './native-rules';
import type {NativeItemQuery,NativeCard} from './native-types';
const badFigures=new Set(['blue_criminal','blue_businessman','blue_politician','blue_scholar','blue_fakesign']);
const ignore=(c:NativeCard)=>({...c,multiplier:1,addend:0});
/** Source Display.estimateInvenPriceForSale and Infoscreen.itemCardsWithReputation are distinct valuations. */
export function nativeSaleValues(input:{item:NativeItemQuery;appraisalCardIds:readonly string[];appraisedTier:number;recommendedTier:number}){
 const item=resolveNativeItem(input.item),truth=sortNativeCards(item.cardIds),appraisal=input.appraisalCardIds.map(id=>getNativeCard(id)!).filter(Boolean),pink=appraisal.filter(c=>c.color===5),recommended=appraisal.some(c=>c.id.includes('pink_recommended'));
 const ratioValue=estimateNativeCards([...truth,...pink]);let cards=sortNativeCards([...truth,...pink]);
 if(truth.some(c=>c.id.includes('fakeBrand'))&&appraisal.some(c=>c.category==='brand'&&c.id.includes('fakeBrand'))){const brand=appraisal.find(c=>c.category==='brand')!;cards=refineNativeCards([brand,...cards.filter(c=>c.category!=='brand')]);}else cards=refineNativeCards(cards);
 const condition=appraisal.find(c=>c.category==='condition'&&c.tier===0),damage=item.integrity;
 if(condition&&!truth.some(c=>c.category==='condition'&&c.tier>0)){
  const fits=condition.id==='blue_perfect'?damage<=15:condition.id==='blue_slightdmg'?damage>5&&damage<=35:condition.id==='blue_fairlydmg'?damage>25&&damage<=65:condition.id==='blue_novalue'?damage>50:false;
  if(fits)cards=sortNativeCards([condition,...cards.filter(c=>c.category!=='condition')]);
 }
 if(!recommended)cards=cards.filter(c=>!c.id.includes('pink_recommended'));
 cards=cards.map(original=>{let c={...original};const negative=()=>c.color!==5&&100*c.multiplier+c.addend<100;
  if(input.appraisedTier===1&&(c.id==='blue_pop'||c.id==='blue_perfect'))c=ignore(c);
  if(input.appraisedTier>=4&&badFigures.has(c.id))c=ignore(c);
  if(input.appraisedTier===5&&c.category==='condition'&&negative())c=ignore(c);
  if(recommended&&input.recommendedTier>=3&&c.category==='popularity'){
   if(negative())c=ignore(c);else if(c.color!==5&&100*c.multiplier+c.addend>100)c=c.color<2?{...c,multiplier:1,addend:c.addend*2}:{...c,multiplier:1+(c.multiplier+c.addend-1)*2,addend:0};
  }
  // Source constructs recTier52 (halve penalties) but never composes it into the applied function.
  return c;
 });return {fairValue:estimateNativeCards(cards),ratioValue};
}
