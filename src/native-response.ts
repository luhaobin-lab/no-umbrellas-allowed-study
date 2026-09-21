import type { NegotiationResponse, NegotiationState } from './negotiation';
import type { NativeHaggleAction } from './native-negotiation-types';
import { nextNativeRandom } from './native-random';
export const nativeDraw=(s:NegotiationState)=>{const [seed,value]=nextNativeRandom(s.rngState);s.rngState=seed;return value;};
export const nativeGradient=(s:NegotiationState,value:number,low:number,high:number)=>value>=high?true:value<=low?false:nativeDraw(s)<(value-low)/(high-low);
export const pushNative=(s:NegotiationState,a:Omit<NativeHaggleAction,'tick'>)=>{s.native.context.unshift({...a,tick:s.native.ticks});};
export function acceptNative(s:NegotiationState,p:number,branch:string){s.status='accepted';s.acceptedAmount=p;s.counter=null;s.native.pending=null;s.native.delayedActions=[];s.native.sourceBranch=branch.startsWith('PlayerAccepted')?branch:s.native.modifier==='Junuk'?p>=.7*s.native.originalFairValue?'Junuk_satisfied':'Junuk_unsatisfied':s.native.modifier==='SingSing'?s.native.nonCorrectCategories===0?'SingSing_satisfied':'SingSing_unsatisfied':branch;s.lastMessage='All right. We have a deal.';pushNative(s,{type:'CustomerAcceptDeal',amount:p});}
export function refuseNative(s:NegotiationState,p:number,branch:string){
 if(s.status==='accepted')return;
 if(!s.native.priceHookActive&&!s.native.cardHookActive&&Math.abs(p-s.publicValue)<2){acceptNative(s,p,'1VanaAccept');return;}
 s.status='open';s.counter=null;s.native.sourceBranch=branch;s.lastMessage='No. Please reconsider your offer.';pushNative(s,{type:'CustomerDeclinePrice',amount:p});
}
export function counterNative(s:NegotiationState,p:number,counter:number,branch:string){
 if(s.status==='accepted')return;const q=Math.max(0,Math.floor(counter));
 const last=s.native.context.find(a=>a.type==='PlayerSuggestPrice'||a.type==='CustomerSuggestPrice');
 if(last?.type==='PlayerSuggestPrice'&&Math.abs(q-last.amount!)<1){acceptNative(s,q,'1VanaAccept');return;}
 s.status='countered';s.counter=q;s.customerOffers++;s.native.sourceBranch=branch;s.lastMessage=`Could you make it ${q}V?`;pushNative(s,{type:'CustomerSuggestPrice',amount:q});
}
export function leaveNative(s:NegotiationState,p:number,branch:string,reason:NegotiationState['departureReason']='offers'){
 refuseNative(s,p,branch);s.status='left';s.counter=null;s.native.pending=null;s.native.delayedActions=[];s.departureReason=reason;s.native.sourceBranch=branch;s.lastMessage="We cannot agree. I'm leaving.";pushNative(s,{type:'CustomerDeclineDeal'});
}
export function finishNative(s:NegotiationState,p?:number):NegotiationResponse{
 const outcome=s.status==='accepted'?'accepted':s.status==='left'?'left':s.status==='countered'?'counter':'rejected';
 if(p!==undefined)s.history.push({amount:p,outcome,counter:s.counter});return{state:s,outcome,counter:s.counter,message:s.lastMessage};
}
export function priceContext(s:NegotiationState,recent=false){const a=s.native.context;const end=recent?a.findIndex(e=>e.type==='PlayerSuggestCard'||e.type==='CustomerDeclareCard'):-1;return(end<0?a:a.slice(0,end)).filter(e=>e.type==='PlayerSuggestPrice'||e.type==='CustomerSuggestPrice');}
