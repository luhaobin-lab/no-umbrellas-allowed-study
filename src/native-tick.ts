import {getNativeCard} from './native-rules';
import type { NegotiationState } from './negotiation';
import { nativeDraw,pushNative,acceptNative,counterNative,leaveNative } from './native-response';
const sample=(s:NegotiationState,min:number,max:number)=>min+Math.floor(nativeDraw(s)*(max-min));
export function initializeNativeNagging(s:NegotiationState){
 const n=s.native;if(n.nagging)return;const flower=s.flowerType===3||s.flowerType===6;
 const kind=n.family==='Fixie'?'fixie':n.modifier==='Busy'?'busy':n.modifier==='DeceivingAsBusy'?'deceiving':n.modifier==='Junuk'?'junuk':n.modifier==='SingSing'?'singsing':n.modifier==='ConfusedReported'?'confused':n.modifier==='Enthusiast'?'enthusiast':n.nagMode;
 const threshold=kind==='busy'||kind==='deceiving'?Math.round(s.nagIntervals[0]/.2):kind==='confused'?sample(s,120,150):kind==='fixie'?sample(s,40,70):kind==='singsing'?sample(s,200,240):kind==='junuk'?0:kind==='enthusiast'?sample(s,180,220):kind==='by-time'?sample(s,flower?600:450,flower?800:600):kind==='et'?sample(s,120,140):kind==='nagging'?sample(s,flower?80:120,flower?100:150):0;
 n.nagging={kind,threshold,stage:flower&&kind==='nagging'?-1:0,flower};
 s.timeLimitSeconds=kind==='by-time'?threshold*.2:null;
}
/** The original waiting predicates scan independently for their corresponding decline. */
function waiting(s:NegotiationState){
 const player=s.native.context.find(a=>a.type==='PlayerSuggestPrice'||a.type==='CustomerDeclinePrice');
 const customer=s.native.context.find(a=>a.type==='CustomerSuggestPrice'||a.type==='PlayerDeclinePrice');
 return player?.type==='PlayerSuggestPrice'||customer?.type==='CustomerSuggestPrice';
}
const say=(s:NegotiationState,branch:string,ask=true)=>{s.native.sourceBranch=branch;s.lastMessage=branch==='FixieNagging'?'Make an offer.':'Are you ready to make an offer?';if(ask)pushNative(s,{type:'CustomerAskForPrice'});};
/** Advances each native 200ms tick: exact-equality timers must not be skipped by long frame deltas. */
export function advanceNativeTicks(s:NegotiationState,count:number){
 initializeNativeNagging(s);const n=s.native;
 for(let i=0;i<count&&s.status!=='accepted'&&s.status!=='left';i++){
  n.ticks++;
  const due=(n.delayedActions??(n.pending?[n.pending]:[])).find(p=>n.ticks===p.dueTick);
  if(due){n.delayedActions=(n.delayedActions??[due]).filter(p=>p.kind!==due.kind);n.pending=n.delayedActions[0]??null;
   if(n.context.length===due.contextLength){if(due.kind==='accept')acceptNative(s,due.amount,due.source);else if(due.kind==='counter')counterNative(s,due.amount,due.counter!,due.source);else leaveNative(s,due.amount,due.source);}continue;
  }
  if(!n.normalIdle||s.side==='sell')continue;
  const timer=n.nagging!,idle=n.ticks-(n.context[0]?.tick??0),threshold=timer.threshold;
  if(timer.kind==='busy'||timer.kind==='deceiving'||timer.kind==='confused'){
   if(idle!==threshold)continue;
   if(timer.kind!=='deceiving'&&timer.stage===2){leaveNative(s,s.lastOffer??0,timer.kind==='confused'?'ConfusedLeaving':'BusyLeaving','time');continue;}
   say(s,timer.kind==='confused'?'ConfusedJustSaying':timer.stage===0?'BusyNagging':'BusyNaggingAgain');timer.stage++;s.nagStage=timer.stage;
   timer.threshold=timer.kind==='busy'?Math.round(s.nagIntervals[timer.stage]/.2):timer.kind==='confused'?sample(s,80,100):sample(s,40,60);continue;
  }
  if(timer.kind==='fixie'){if(idle===threshold){say(s,'FixieNagging');timer.threshold=sample(s,40,70);}continue;}
  if(timer.kind==='by-time'){
   if(!waiting(s)&&(n.ticks===Math.floor(threshold/(timer.flower?3:2))||timer.flower&&n.ticks===Math.floor(threshold*2/3)))say(s,timer.flower&&n.ticks<threshold/2?'FlowerNagging':'ToSilenceNagging',!(timer.flower&&n.ticks<threshold/2));
   if(n.ticks>=threshold&&idle>=50)leaveNative(s,s.lastOffer??0,'ToSilenceUpset','time');continue;
  }
  if(waiting(s))continue;
  if(timer.kind==='junuk'){if(idle===180||idle===360)say(s,'JunukNagging');else if(idle>=480)leaveNative(s,s.lastOffer??0,'ToSilenceUpset','time');continue;}
  if(timer.kind==='up-down'){
   const points=timer.flower?[100,200,320]:[120,240];
   if(points.includes(idle))say(s,idle===points.at(-1)?'ToSilenceNotice':timer.flower&&idle===200?'FlowerNagging':'ToSilenceNagging');
   else if(idle>=(timer.flower?480:360))leaveNative(s,s.lastOffer??0,'ToSilenceUpset','time');continue;
  }
  if(idle!==threshold)continue;
  if(timer.kind==='enthusiast'||timer.kind==='singsing'){say(s,timer.kind==='singsing'?'SingSingNagging':n.trueCardIds.some(id=>getNativeCard(id)?.category==='figure')&&!n.customerCardIds.some(id=>getNativeCard(id)?.category==='figure')?'enthusiast_maybe_sign':n.trueCardIds.some(id=>getNativeCard(id)?.category==='history')&&!n.customerCardIds.some(id=>getNativeCard(id)?.category==='history')?'enthusiast_maybe_old':'enthusiast_will_wait',false);timer.threshold=timer.kind==='singsing'?sample(s,200,240):sample(s,180,220);continue;}
  if(timer.kind==='et'){say(s,'ToSilenceNagging');timer.threshold=sample(s,120,140);continue;}
  if(timer.stage===2){leaveNative(s,s.lastOffer??0,'ToSilenceUpset','time');continue;}
  say(s,timer.stage===-1?'FlowerNagging':timer.stage===0?'ToSilenceNagging':'ToSilenceNotice',timer.stage!==-1);
  timer.stage++;timer.threshold=timer.stage===0?sample(s,120,150):sample(s,80,100);
 }
 s.idleSeconds=(n.ticks-(n.context[0]?.tick??0))*.2+n.tickRemainder;
}
