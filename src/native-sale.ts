import { ensureNativeState } from './native-migration';
import type { NegotiationResponse, NegotiationState } from './negotiation';
import { nativeDraw,acceptNative,finishNative,leaveNative } from './native-response';
/** Separate sale rules: source 1.0.5 Sale.playerSuggests. Controller owns inventory/cash. */
export function runNativeSale(previous:NegotiationState,amount:number):NegotiationResponse{
 const s=structuredClone(ensureNativeState(previous)),sale=s.sale??{},W=s.fairValue;
 if(s.status==='countered')return{state:s,outcome:'rejected',counter:s.counter,message:`My offer is ${s.counter}V. Take it or leave it.`};
 if(amount!==s.listingPrice)return{state:s,outcome:'rejected',counter:s.counter,message:'This request is for the displayed price.'};
 s.offers++;s.lastOffer=amount;
 const margin=W===0?Infinity:(amount-W)/W,ratio=(sale.ratioValue??s.publicValue)===0?Infinity:amount/(sale.ratioValue??s.publicValue);
 const firstId=sale.itemId??'current';
 const accept=(branch:string)=>{acceptNative(s,amount,branch);s.salePlan={kind:'single',itemIds:[firstId],total:amount};return finishNative(s,amount);};
 // Undefined is an unknown evaluator, null is an explicitly evaluated non-match.
 if(sale.mandatoryFeedback===undefined&&!s.native.unknownFacts.includes('saleMandatoryFeedback'))s.native.unknownFacts.push('saleMandatoryFeedback');
 let accepted:boolean|undefined,branch='';
 if(sale.mandatoryFeedback){accepted=sale.mandatoryFeedback.accept;branch=sale.mandatoryFeedback.branch;}
 else if(sale.totallyWrecked){accepted=false;branch='totallyWrecked';}
 else if(amount===0){accepted=true;branch='byFree';}
 else if(margin<=-.1){accepted=true;branch='ifCheap';}
 else if(sale.definitionId?.endsWith('_t')&&margin>0&&nativeDraw(s)<.4){accepted=false;branch='trash';}
 else if((sale.gatherTrashCount??0)>=20&&margin>0&&nativeDraw(s)<.4){accepted=false;branch='trash20';}
 else if(sale.conditionFeedback&&nativeDraw(s)<.5){accepted=sale.conditionFeedback.accept;branch=sale.conditionFeedback.branch;}
 else{accepted=nativeDraw(s)-.3+(s.appraisedTier>=2?.1:0)>=margin;branch=accepted?'sold':'denyPrice';}
 if(accepted)return accept(branch);
 if(W===0){leaveNative(s,amount,'NoSaleValue');return finishNative(s,amount);}
 const secondCandidates=(sale.eligibleSecondItems??[]).filter(i=>i.available&&i.instanceId!==firstId&&i.definitionId!==sale.definitionId);
 const canAdd=!sale.isAdditionalSale&&(sale.visitors??0)>=2&&secondCandidates.length>0;
 const second=canAdd?secondCandidates.map(item=>({item,sort:nativeDraw(s)})).sort((a,b)=>a.sort-b.sort)[0].item:undefined;
 let quote:number;
 if(second){
  if(nativeDraw(s)>.5){quote=W+second.fairValue*(1+(nativeDraw(s)-.5)*.4);s.salePlan={kind:'bundle',itemIds:[firstId,second.instanceId],second,total:Math.floor(quote)};}
  else {quote=ratio<=1.2?W*(ratio-.01-nativeDraw(s)*.2):W*(1+(nativeDraw(s)-.5)*.4);s.salePlan={kind:'counter-then-additional',itemIds:[firstId],second,total:Math.floor(quote)};}
 }else{
  quote=ratio<=1.1?W*(ratio-.01-nativeDraw(s)*.1):W*(1+(nativeDraw(s)-.5)*(W>1000?.2:.4));
  if(quote>=amount)return accept('sold');
  s.salePlan={kind:'single',itemIds:[firstId],total:Math.floor(quote)};
 }
 s.status='countered';s.counter=Math.max(0,Math.floor(quote));s.salePlan.total=s.counter;s.customerOffers++;s.native.sourceBranch=branch;
 s.lastMessage=s.salePlan.kind==='bundle'?`I'll buy both for ${s.counter}V.`:`I will pay ${s.counter}V.`;
 return finishNative(s,amount);
}
export function acceptNativeSaleCounter(previous:NegotiationState):NegotiationResponse{
 const s=structuredClone(ensureNativeState(previous));
 if(s.side!=='sell'||s.status!=='countered'||s.counter===null)return{state:s,outcome:'rejected',counter:s.counter,message:'There is no pending sale offer.'};
 const amount=s.counter;acceptNative(s,amount,'PlayerAcceptedSale');return finishNative(s);
}
