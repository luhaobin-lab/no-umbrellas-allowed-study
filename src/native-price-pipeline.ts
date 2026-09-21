import type { NegotiationState, NegotiationResponse } from './negotiation';
import { acceptNative,refuseNative,counterNative,leaveNative,finishNative,pushNative,priceContext,nativeDraw,nativeGradient } from './native-response';
import { runNativeScriptPrice,runNativeScriptAccept } from './native-script-hooks';
/** Ordered source predicates, independent implementation; no recorded transaction outcomes. */
export function runNativePricePipeline(previous:NegotiationState,p:number):NegotiationResponse {
 const s=structuredClone(previous),n=s.native,V=s.publicValue,r=V===0?0:p/V;
 const wasPlayerWaiting=n.context.find(a=>a.type==='PlayerSuggestPrice'||a.type==='CustomerDeclinePrice')?.type==='PlayerSuggestPrice';const waiting=wasPlayerWaiting?n.pending:null;s.offers++;s.lastOffer=p;s.idleSeconds=0;
 pushNative(s,{type:'PlayerSuggestPrice',amount:p});
 // The controller/UI accepts a currently visible customer offer without re-running price hooks.
 if(n.entryPoint==='controller'&&previous.counter!==null&&p===previous.counter){if(!runNativeScriptAccept(s))acceptNative(s,p,'PlayerAcceptedCounter');return finishNative(s,p);}
 if(runNativeScriptPrice(s,p))return finishNative(s,p);
 const all=priceContext(s),recent=priceContext(s,true),players=all.filter(x=>x.type==='PlayerSuggestPrice');
 const rp=recent.filter(x=>x.type==='PlayerSuggestPrice'),lastCustomer=all.find(x=>x.type==='CustomerSuggestPrice')?.amount;
 const compromise=recent[0]?.type==='PlayerSuggestPrice'&&recent[1]?.type==='CustomerSuggestPrice'&&recent[2]?.type==='PlayerSuggestPrice';
 const q=recent[2]?.amount??0,c=recent[1]?.amount??0,t=compromise?(p-q)/(c-q):NaN;
 const counter=(amount:number,branch:string)=>{refuseNative(s,p,branch);counterNative(s,p,amount,branch);};
 const delayed=(kind:'accept'|'counter'|'leave',ticks:number,branch:string,amount=p,ask?:number)=>{if(s.status==='accepted'||s.status==='left')return;s.status='open';s.counter=null;n.pending={kind,amount,dueTick:n.ticks+ticks,counter:ask,source:branch,contextLength:n.context.length};n.delayedActions=[n.pending,...n.delayedActions??[]];n.sourceBranch=branch;s.lastMessage='Give me a moment to think.';};
 // Special modifier price hooks precede the ordinary tubing.
 if(n.modifier==='Enthusiast'||n.modifier==='SingSing'){
  if(n.nonCorrectCategories===null){if(!n.unknownFacts.includes('nonCorrectCategories'))n.unknownFacts.push('nonCorrectCategories');}
  else if(n.nonCorrectCategories>2){if(n.warningUsed)leaveNative(s,p,`${n.modifier}.MissingAgain`);else{n.warningUsed=true;refuseNative(s,p,`${n.modifier}.NeedAppraisal`);}return finishNative(s,p);}
  else if(n.modifier==='Enthusiast'&&n.nonCorrectCategories===0&&p>=.53*V){acceptNative(s,p,'enthusiast_accept_generous');return finishNative(s,p);}
 }
 for(const pipe of [...n.pricePipes]){
  let handled=true;
  switch(pipe){
   case 'SingSing.Initial':if(all.length!==1){handled=false;break;}if(p>=.7*V)acceptNative(s,p,'SingSingInitialAccept');else if(p<=.3*V){refuseNative(s,p,'AskForExplanation');pushNative(s,{type:'CustomerAskForCard'});}else counter(.7*V,'singsing_mention_club');break;
   case 'WaitingForEvidence':refuseNative(s,p,'AskForEvidencePrice');pushNative(s,{type:'CustomerAskForCard'});break;
   case 'SitLast.Price':if(nativeGradient(s,r,.5,.7))acceptNative(s,p,'SitLastAccept');else leaveNative(s,p,'SitLastReject');break;
   case 'Frustrated.Price':if(Math.trunc(p)>=Math.trunc(.2*V))acceptNative(s,p,'FrustratedOnEnough');else counter(.2*V,'FrustratedOnLow');break;
   case 'Frightened.High':if(p>=V)leaveNative(s,p,'FrightenedHigh');else handled=false;break;
   case 'Frightened.Higher':if(lastCustomer!==undefined&&p>lastCustomer)acceptNative(s,p,'FrightenedHigher');else handled=false;break;
   case 'Frightened.Lower':if(lastCustomer!==undefined&&p<=lastCustomer)leaveNative(s,p,'FrightenedLower');else handled=false;break;
   case 'Angry.Price':if(lastCustomer===undefined){n.unknownFacts.push('angryPreviousCounter');handled=false;}else if(p>=lastCustomer)acceptNative(s,p,'AngryOnEnough');else counter(lastCustomer*1.1,'AngryOnLow');break;
   case 'Confused.Price':
    if(p<.65*V){handled=false;break;}
    if(n.confusedPrevious===null){n.confusedPrevious=p;refuseNative(s,p,'ConfusedFakeRefuse');}
    else if(Math.trunc(p)===Math.trunc(n.confusedPrevious))acceptNative(s,p,'ConfusedFakeRefuseAgain');
    else delayed('counter',30,'ConfusedFakeRefuseBefore',p,n.confusedPrevious);
    break;
   case 'Active.FeelSorry':
    if(players.length!==3||lastCustomer===undefined){handled=false;break;}
    n.pricePipes=n.pricePipes.filter(x=>x!=='Active.FeelSorry');
    {const values=all.map(x=>x.amount!/V),change=values.slice(1).reduce((a,v,i)=>a+Math.abs(v-values[i]),0)/(values.length-1);if(nativeGradient(s,change,0,.1))leaveNative(s,p,'FeelSorry.Exhausted');else{refuseNative(s,p,'FeelSorry.Tower');counterNative(s,p,lastCustomer,'FeelSorry.Tower');}}
    break;
   case 'Minus':if(V<0)acceptNative(s,p,'Minus');else handled=false;break;
   case 'Cheap':if(V<4&&p>0&&p<V)acceptNative(s,p,'AcceptTry');else handled=false;break;
   case 'Fixie.RepeatedSuggest':if(all.length>3){if(p>=.8*V)acceptNative(s,p,'FixieAcceptPrice');else leaveNative(s,p,'FixieDeclineDeal');}else handled=false;break;
   case 'Fixie.Stopper':if(p>=.8*V)acceptNative(s,p,'FixieAcceptPrice');else counter(.8*V,'FixieCounter');break;
   case 'Active.RepeatedSuggests':if(all.length>5){if(nativeGradient(s,r,.6,.7))acceptNative(s,p,'AcceptRepeated');else leaveNative(s,p,'DeclineRepeated');}else handled=false;break;
   case 'Busy.RepeatedSuggests':if(all.length>=4){if(nativeGradient(s,r,.6,.7))acceptNative(s,p,'BusyAccept');else leaveNative(s,p,'BusyDecline');}else handled=false;break;
   case 'Wishy.RepeatedSuggests':if(all.length>3){if(p>=.65*V)acceptNative(s,p,'WishyRepeatedAccept');else leaveNative(s,p,'WishyRepeatedDecline');}else handled=false;break;
   case 'Active.OnChangedGuideline':{
    const stamps=n.context.filter(a=>a.type==='PriceStamp');const delta=stamps.length>1?stamps[0].amount!-stamps[1].amount!:0;
    if(recent.length!==1||r<=.51||r>=.8||!(delta>0&&delta*3>=V||delta<0&&Math.abs(delta)>=V)){handled=false;break;}
    if(delta>0){const v=(V-delta)/delta;if(v>.3||v>.1&&nativeGradient(s,v,.1,.2))acceptNative(s,p,'GladOnIncreasedGuide');else if(v>0)refuseNative(s,p,'GreedyOnIncreasedGuide');else counter(.7*V,'MentionMarginOnIncreasedGuide');}
    else {const v=V/(V-delta);if(v<.2){if(nativeGradient(s,V,20,100))leaveNative(s,p,'LeavingOnLoweredGuide');else refuseNative(s,p,'GivingOnLoweredGuide');}else if(nativeGradient(s,v,.3,.5))refuseNative(s,p,'DisappointedOnLoweredGuide');else counter(V,'CompensateOnLoweredGuide');}
    break;
   }
   case 'Active.InitialSuggest':case 'Wishy.InitialSuggest':
    if(all.length!==1){handled=false;break;}
    if(p>=V||p>=V*(n.family==='WishyWashy'?.8:.7))acceptNative(s,p,'InitialAccept');
    else if(s.flowerType===1&&(n.family==='Active'?nativeGradient(s,r,.65,.7):r>=.7))acceptNative(s,p,'FlowerInitialAccept');
    else if(p<=.3*V){refuseNative(s,p,'AskForExplanation');pushNative(s,{type:'CustomerAskForCard'});}
    else if(n.family==='WishyWashy'){refuseNative(s,p,'AskForMoreGenerous');pushNative(s,{type:'CustomerAskForPrice'});}
    else counter(.7*V,'ActiveInitialCounter');
    break;
   case 'Wishy.OnHesitate':
    if(!waiting){handled=false;break;}
    if(n.modifier==='ConfusedReported'){if(Math.trunc(p)===Math.trunc(n.confusedPrevious!))acceptNative(s,p,'ConfusedFakeRefuseJoke');else if(nativeDraw(s)>.5)acceptNative(s,p,'ConfuseConfuseAccept');else leaveNative(s,p,'ConfusedConfusedRefuse');break;}
    if(Number(n.globals.playerHesitates??0)>=3){leaveNative(s,p,"Won'tBeDriven");break;}
    if(waiting.kind==='accept'){if(rp.slice(1).some(a=>a.amount!>p)&&r<.64)leaveNative(s,p,'WasGoingToAcceptCurtail');else acceptNative(s,p,'WasGoingToAcceptAnyway');}
    else if(rp.slice(1).some(a=>a.amount!>p))leaveNative(s,p,'WasGoingToDeclineAnyway');
    else if(nativeGradient(s,r,.55,.65))acceptNative(s,p,'HesitateAccept');else{refuseNative(s,p,'HesitateNeedsMore');pushNative(s,{type:'CustomerAskForPrice'});}
    break;
   case 'PlayerCurtail':if(rp.slice(1).some(a=>a.amount!>p)){if(n.family==='WishyWashy'&&p>=.6*V)counter(players[1].amount!,'BeforeCurtail');else leaveNative(s,p,'PriceInsulted');}else handled=false;break;
   case 'Active.PlayerInsists':case 'Wishy.PlayerInsists':
    if(players.length<2||players[1].amount!==p){handled=false;break;}
    if(Number(n.globals.playerInsists??0)>=3)leaveNative(s,p,"Won'tAcceptYourInsists");
    else if(nativeGradient(s,r,.55,.67))acceptNative(s,p,'AcceptInsistence');else leaveNative(s,p,'DeclineInsistence');
    break;
   case 'Active.CompromisedSuggest':case 'Wishy.CompromisedSuggest':
    if(!compromise||n.family==='Active'&&q<.5*V){handled=false;break;}
    if(t<.1){refuseNative(s,p,'MakeProperOffer');pushNative(s,{type:'CustomerAskForPrice'});}
    else if(n.family==='WishyWashy'){
     if(t>=.48)acceptNative(s,p,t>=.65?'AppreciateCompromise':'CanCompromise');else counter(t<.2?c:(c+q)/2,t<.2?'Insist':'ShouldveMetInMean');
    }else if(t>=.5||t>=.35&&nativeGradient(s,t,.35,.5))acceptNative(s,p,'CompromiseAccepted');else counter(t<.35?c:(c+q)/2,t<.35?'Insist':'ShouldveMetInMean');
    break;
   case 'CounterSuggest':
    if(recent[1]?.type!=='CustomerSuggestPrice'){handled=false;break;}
    if(p>=.7*V)acceptNative(s,p,'CounterAccepted');else if(p<=.3*V){refuseNative(s,p,'AskForExplanation');pushNative(s,{type:'CustomerAskForCard'});}else counter((p+recent[1].amount!)/2,'MeetInMean');
    break;
   case 'Wishy.PlayerResuggest':
    if(recent[1]?.type!=='PlayerSuggestPrice'||p<=recent[1].amount!){handled=false;break;}
    if(p>=.64*V)acceptNative(s,p,'AppreciateGenerosity');
    else if(p>=.55*V){const chance=nativeDraw(s),delay=20+Math.floor(nativeDraw(s)*20);delayed(chance<.4?'accept':chance<.7?'counter':'leave',delay,'Wishy.Thinking',p,p+.05*V);}
    else {refuseNative(s,p,'AskForMoreGenerous');pushNative(s,{type:'CustomerAskForPrice'});}
    break;
   case 'General.Stopper':if(p>=.8*V||p>=.7*V&&nativeDraw(s)>.7)acceptNative(s,p,'Accept');else refuseNative(s,p,'DeclinePrice');break;
   default:handled=false;
  }
  if(handled)return finishNative(s,p);
 }
 refuseNative(s,p,'NoMatchingPipe');return finishNative(s,p);
}
