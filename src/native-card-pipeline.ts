import {isNativeHaggleCardTrue} from './native-sale-feedback';
import {getNativeCard,overwriteNativeCard,estimateNativeCards} from './native-rules';
import { ensureNativeState } from './native-migration';
import type { NegotiationState } from './negotiation';
import type { NativeCardAction } from './native-negotiation-types';
import { pushNative,leaveNative,counterNative,nativeGradient,nativeDraw,acceptNative } from './native-response';
import { runNativeScriptCard,applyNativeScriptCardEffects,clearNativeScriptContext,runNativeScriptHide,runNativeScriptTool,assumeNativeScriptCard } from './native-script-hooks';
export interface NativeCardResult { state:NegotiationState; beliefAccepted:boolean; allowHidden:boolean; leave:boolean; branch:string; message:string }
const clone=(s:NegotiationState)=>structuredClone(ensureNativeState(s));
function counts(s:NegotiationState,a:NativeCardAction){if(a.missingCategories!==undefined)s.native.missingCategories=a.missingCategories;if(a.nonCorrectCategories!==undefined)s.native.nonCorrectCategories=a.nonCorrectCategories;if(a.referenceCardIds)s.native.referenceCardIds=[...a.referenceCardIds];}
function result(s:NegotiationState,accepted=false,hidden=false):NativeCardResult{return{state:s,beliefAccepted:accepted,allowHidden:hidden,leave:s.status==='left',branch:s.native.sourceBranch,message:s.lastMessage};}
function missing(s:NegotiationState,key:string){if(!s.native.unknownFacts.includes(key))s.native.unknownFacts.push(key);}
export function assertNativeCard(previous:NegotiationState,a:NativeCardAction):NativeCardResult{
 const s=clone(previous),n=s.native;if(s.status==='accepted'||s.status==='left')return result(s);
 const oldV=s.publicValue,impact=oldV===0?0:(a.proposedPublicValue-oldV)/oldV;
 if(!Number.isFinite(a.proposedPublicValue)||a.proposedPublicValue<0)throw new RangeError('A public appraisal must be nonnegative and finite.');
 const before=[...n.context];s.idleSeconds=0;s.appraisalEvents++;counts(s,a);
 if(a.customerCardIds)n.customerCardIds=[...a.customerCardIds];if(a.playerCardIds)n.playerCardIds=[...a.playerCardIds];
 n.playerCardIds=n.playerCardIds.filter(id=>id!==a.cardId);
 pushNative(s,{type:'PlayerSuggestCard',cardId:a.cardId,category:a.category,correct:a.correct});
 const known=n.customerCardIds.includes(a.cardId);
 const historicalTruth=(id:string,fallback:boolean|null|undefined)=>n.trueCardIds.length&&getNativeCard(id)?isNativeHaggleCardTrue({instanceId:'haggle',definitionId:'haggle',cardIds:n.trueCardIds,referenceCardIds:n.referenceCardIds,integrity:n.itemCondition??0,rngState:0},id,n.customerCardIds):fallback;
 const accept=(branch:string)=>{s.publicValue=a.proposedPublicValue;s.appraisalReaction='accepted';n.sourceBranch=branch;s.lastMessage='All right. I agree with that appraisal.';n.customerCardIds=a.proposedCustomerCardIds?[...a.proposedCustomerCardIds]:[...n.customerCardIds.filter(id=>{const old=getNativeCard(id);return id!==a.cardId&&(!old||old.color===3||old.category!==a.category);}),a.cardId];pushNative(s,{type:'CustomerAcceptCard',cardId:a.cardId,category:a.category,correct:a.correct});pushNative(s,{type:'PriceStamp',amount:s.publicValue});s.counter=null;s.status='open';if(s.publicValue>oldV)s.positiveAppraisals++;return result(s,true);};
 const reject=(branch:string)=>{if(n.customerCardIds.includes(a.cardId)){n.customerCardIds=n.customerCardIds.filter(id=>id!==a.cardId);s.publicValue=estimateNativeCards(n.customerCardIds);}s.appraisalReaction=a.correct===false?'incorrect':'rejected-subjective';n.sourceBranch=branch;s.lastMessage='I disagree with that description.';pushNative(s,{type:'CustomerDeclineCard',cardId:a.cardId,category:a.category,correct:a.correct});return result(s);};
 const script=runNativeScriptCard(s,a);
 if(script.handled){if(script.clearBefore)clearNativeScriptContext(s);if(script.accept===true)accept(script.branch!);else if(script.accept===false)reject(script.branch!);applyNativeScriptCardEffects(s,script);return result(s,script.accept===true);}
 for(const pipe of [...n.cardPipes]){
  if(pipe==='FrustratedReported.Card')return accept(before.some(x=>x.type==='CustomerAcceptCard')?'FrustratedOnCardAgain':'FrustratedOnCard');
  if(pipe==='Enthusiast.Card'&&a.correct===true&&!a.cardId.includes('fakeBrand'))return accept('enthusiast_accept_new_glad');
  if(pipe==='FrightenedReported.Card'){
   const oldAsk=s.counter;const response=accept(impact>0?'FrightenedReSuggestHigh':'FrightenedReSuggestLow');
   if(impact<0)counterNative(s,NaN,.6*s.publicValue,'FrightenedReSuggestLow');else if(oldAsk!==null){s.counter=oldAsk;s.status='countered';}
   response.state=s;return response;
  }
  if(pipe==='AngryReported.Card'&&!known&&impact<0){reject('AngryOnAnyCard');const prior=n.context.find(x=>x.type==='CustomerSuggestPrice')?.amount;if(prior!==undefined)counterNative(s,NaN,prior*1.1,'AngryOnAnyCard');else missing(s,'angryPreviousCounter');return result(s);}
  if(pipe==='RepeatedFalseCards'&&n.context.filter(x=>x.type==='PlayerSuggestCard'&&historicalTruth(x.cardId!,x.correct)===false).length>(n.modifier==='DeceivingAsBusy'||n.modifier==='Busy'?2:3)){reject('QuestionProfessionalism');leaveNative(s,s.lastOffer??0,'QuestionProfessionalism','appraisal');return result(s);}
  if(pipe==='DiscussedCard'&&before.some(x=>(x.type==='PlayerSuggestCard'||x.type==='CustomerDeclareCard')&&x.cardId===a.cardId))return known?accept('AnnoyedSameCard'):reject('AnnoyedSameFalseCard');
  if(pipe==='DiscussedCategory'&&!a.cardId.includes('fakeBrand')){
   const prior=before.find(x=>(x.type==='PlayerSuggestCard'||x.type==='CustomerDeclareCard')&&x.category===a.category);
   if(prior&&a.correct===true){if(historicalTruth(prior.cardId!,prior.correct)===false)return accept(n.customerCardIds.includes(prior.cardId!)?'CategoryFTT':'CategoryFTF');if(n.customerCardIds.includes(prior.cardId!)){const tier=getNativeCard(prior.cardId!)?.tier;if(tier!==undefined&&tier<(a.tier??0))return accept('CategoryTTTH');if(tier===undefined)missing(s,'discussed-card-tier');return nativeGradient(s,impact,-.2,.2)?accept('CategoryTTT'):reject('AnnoyedSameFalseCard');}}
  }
  if(pipe==='ExactCard'&&known)return accept('Agree');
  if(pipe==='Busy.HighImpact'&&a.correct===true&&impact<=-.4){accept('BusyHighImpact');leaveNative(s,s.lastOffer??0,'BusyHighImpact','appraisal');return result(s,true);}
  if(pipe==='Busy.LowImpact'&&a.correct===true&&Math.abs(impact)<=.2)return accept('BusyLowImpact');
  if(pipe==='WaitingForEvidence'&&(!a.cardId.includes('fakeBrand')||a.cardId==='green_fakeBrand'))return reject('AskForEvidence');
  if(pipe==='FakeAgain'&&a.cardId==='green_fakeBrand'){n.cardPipes=n.cardPipes.filter(x=>x!=='FakeAgain');return accept('FakeBrandAgain');}
  if(pipe==='FakeDiscussed'&&a.cardId==='green_fakeBrand')return reject('FakeDiscussed');
  if(pipe==='FakeCorrection'){
   const prior=before.find(x=>(x.type==='PlayerSuggestCard'||x.type==='CustomerDeclareCard')&&x.category===a.category);
   if(prior&&(!n.customerCardIds.includes(prior.cardId!)||!n.referenceCardIds.includes(prior.cardId!)||a.correct!==true))return reject('ToSuggestedWrongFakeGreedy');
  }
  if(pipe==='SitLast.LockCards')return reject('SitLastCard');
  if(pipe.startsWith('Red.')){
   if(pipe==='Red.AvacTarget'&&a.cardId==='red_stuff_avacTarget')return String(n.globals.umbrellaForfeited).toLowerCase()==='true'?accept('AvacAfraid'):reject('AvacNotFriendly');
   if(pipe==='Red.ShopBalance'&&a.cardId==='red_shop_balance'){
    if(n.shopBalance===null){missing(s,'shopBalance');return reject('UnknownShopBalance');}
    accept('RedShopBalance');if(n.family==='Active'&&oldV>n.shopBalance)counterNative(s,NaN,n.shopBalance,'AskForAll');else leaveNative(s,s.lastOffer??0,'RedShopBalanceSorry','appraisal');return result(s,true);
   }
   if(pipe==='Red.ShopPlenty'&&a.cardId==='red_shop_plenty'){
    const values=n.sameTypeStockValues;if(!values||values.length<2){missing(s,'sameTypeStockValues');return reject('UnknownShopPlenty');}
    if(oldV>=Math.max(...values)){reject('RedShopPlentyMad');leaveNative(s,s.lastOffer??0,'RedShopPlentyMad','appraisal');return result(s);}
    return oldV>=values.reduce((x,y)=>x+y,0)/values.length?reject('RedShopPlentyInsistFriendly'):accept('RedShopPlentyAccept');
   }
   const route=pipe==='Red.Once'&&a.cardId==='red_sit_once'?'once':pipe==='Red.Report'&&a.cardId==='red_sit_report'?'report':pipe==='Red.Last'&&a.cardId==='red_sit_last'?'last':null;
   if(route){
    if(!n.redCardRolls){missing(s,'source-global-red-rolls');n.redCardRolls={once:nativeDraw(s),last:nativeDraw(s),report:nativeDraw(s)};}
    if(route!=='last'&&s.lastOffer===null){missing(s,'redLastPlayerPrice');return reject('NeedsPreviousPrice');}
    if(n.redCardRolls[route]>(route==='once'?.3:route==='report'?.4:.1)){
     accept(route==='last'?'SitLastWait':route==='report'?'SitReport':'RedSitOnce');
     if(route==='last'){n.cardPipes.unshift('SitLast.LockCards');n.pricePipes.unshift('SitLast.Price');}else acceptNative(s,s.lastOffer!,route==='report'?'SitReport':'RedSitOnce');
     return result(s,true);
    }
    reject(route==='last'?'SitLastRefuse':route==='report'?'SitReportReject':'RedSitOnceReject');leaveNative(s,s.lastOffer??0,n.sourceBranch,'appraisal');return result(s);
   }
  }
  if(pipe==='Fake'&&a.cardId.includes('fakeBrand')){
   const actual=n.trueCardIds.filter(id=>id.includes('fakeBrand'));
   if(actual.length===0)return reject('RejectFakeBrand');
   if(actual.length===1){
    if(a.cardId!=='green_fakeBrand')return reject('RejectRelevant');
    const brand=n.trueCardIds.map(id=>getNativeCard(id)).find(c=>c?.category==='brand'&&!c.id.includes('fakeBrand'))??n.referenceCardIds.map(id=>getNativeCard(id)).find(c=>c?.category==='brand'&&!c.id.includes('fakeBrand'));
    if(!brand){missing(s,'fakeOriginalBrand');return reject('UnknownFakeBrand');}
    reject('FakeBrandHalf');const id='green_fakeBrandHalf'+brand.id.substring(6);n.customerCardIds=overwriteNativeCard(n.customerCardIds,id).map(c=>c.id);s.publicValue=estimateNativeCards(n.customerCardIds);n.cardPipes=n.cardPipes.filter(p=>p!=='Fake');n.cardPipes.splice(n.cardPipes.indexOf('DiscussedCard'),0,'FakeAgain');n.cardPipes.splice(n.cardPipes.indexOf('DiscussedCategory'),0,'FakeCorrection');return result(s);
   }
   if(a.correct!==true)return reject('RejectRelevant');
   n.cardPipes=n.cardPipes.filter(x=>x!=='WaitingForEvidence');n.pricePipes=n.pricePipes.filter(x=>x!=='WaitingForEvidence');
   if(a.cardId==='green_fakeBrand'){n.cardPipes.unshift('WaitingForEvidence');n.pricePipes.unshift('WaitingForEvidence');return reject('NeedEvidence');}
   n.cardPipes=n.cardPipes.filter(x=>x!=='Fake');n.cardPipes.splice(n.cardPipes.indexOf('DiscussedCategory'),0,'FakeCorrection','FakeDiscussed');return accept('AcceptFakeBrand'+a.cardId.substring('green_fakeBrand'.length));
  }
  if(pipe==='Condition'&&a.category==='condition'&&(a.tier??0)===0){
   if(n.itemCondition===null){missing(s,'itemCondition');return a.correct===true?accept('ConditionAgree'):reject('UnknownCondition');}
   const c=n.itemCondition,minimum:{[id:string]:number}={blue_perfect:-1,blue_slightdmg:5,blue_fairlydmg:25,blue_novalue:50};
   if(minimum[a.cardId]===undefined){missing(s,'unknownConditionCard');return reject('UnknownCondition');}
   if(c<=minimum[a.cardId])return reject('ConditionDisagree');
   const greed=a.cardId==='blue_perfect'&&c>10||a.cardId==='blue_slightdmg'&&c>30||a.cardId==='blue_fairlydmg'&&c>60;
   return accept(greed?'ConditionGreedy':impact>0?'ConditionAgreeGlad':impact<0?'ConditionAgreeDisappointed':'ConditionAgree');
  }
  if((pipe==='FigureJewel'||pipe==='Figure')&&a.cardId==='blue_fakesign'&&n.trueCardIds.includes(a.cardId)){
   if(pipe==='FigureJewel'&&!n.customerCardIds.some(id=>id==='green_queen'||id==='green_oz'))continue;
   return accept(pipe==='FigureJewel'?'FakeSignJewel':n.referenceCardIds.some(id=>getNativeCard(id)?.category==='figure')?'FakeSignWithRef':'FakeSign');
  }
  if(pipe==='Jewel'&&a.category==='jewel'&&a.cardId.includes('cert'))return accept(n.customerCardIds.includes(a.cardId.replace(/_cert$/,''))?nativeDraw(s)>.5?'JewerlyJustCert':'JewerlyJustCertHostile':'CardCorrected');
  if(pipe==='Fixie.Green'&&a.color==='Green')return a.correct===true?accept('FixieAcceptTrueCard'):reject('FixieDeclineFalseCard');
  if(pipe==='Popularity'&&a.category==='popularity'&&(a.tier??0)===0){n.cardPipes=n.cardPipes.filter(x=>x!=='Popularity');return a.correct===true||['blue_minor','blue_pop'].includes(a.cardId)?accept(a.correct?'PopularityCorrect':'PopularityGreedy'):reject('DeclinePopularity');}
  if(pipe==='Rare'&&a.category==='rare'&&(a.tier??0)===0){n.cardPipes=n.cardPipes.filter(x=>x!=='Rare');return a.correct===true||a.cardId==='blue_scarce'?accept(a.correct?'RarityCorrect':'RarityGreedy'):reject('DeclineRarity');}
  if(pipe==='Fixie.Blue'&&a.color==='Blue')return reject('FixieDeclineBlue');
  if(pipe==='Fixie.Red'&&a.color==='Red')return reject('FixieDeclineRed');
  if(pipe==='General.Stopper'||pipe==='Fixie.Stopper'){
   if(a.correct===null){missing(s,'truth:'+a.cardId);return reject('UnknownCardTruth');}
   return a.correct?accept('CorrectedCard'):reject(impact>0?'WrongCardIrritated':'WrongCardMad');
  }
 }
 missing(s,'card-rule:'+a.cardId);return reject('NoMatchingCardPipe');
}
export function hideNativeCard(previous:NegotiationState,a:NativeCardAction):NativeCardResult{
 const s=clone(previous),n=s.native;if(s.status==='accepted'||s.status==='left')return result(s);
 counts(s,a);if(a.playerCardIds)n.playerCardIds=[...a.playerCardIds];
 (n.actionLog??=[]).push({type:'PlayerHideCard',cardId:a.cardId,category:a.category,correct:a.correct,tick:n.ticks});
 const script=runNativeScriptHide(s,a);if(script.handled){if(script.allow)n.playerCardIds=assumeNativeScriptCard(n.playerCardIds,a.cardId);return result(s,false,script.allow);}
 n.playerCardIds=assumeNativeScriptCard(n.playerCardIds,a.cardId);n.sourceBranch='PlayerHideCard';s.lastMessage='';
 if(n.modifier==='Enthusiast'){if(n.hideCount>=3)leaveNative(s,s.lastOffer??0,'enthusiast_leave_on_hide','appraisal');else{n.hideCount++;n.sourceBranch='enthusiast_on_hide';s.lastMessage='Let me see what you found.';}}
 return result(s,false,true);
}
/** A failed tool attempt still reaches the original onToolUse hook. */
export function useNativeTool(previous:NegotiationState,toolId:string):NegotiationState{
 const s=clone(previous);if(s.status==='accepted'||s.status==='left')return s;(s.native.actionLog??=[]).push({type:'PlayerUseTool',toolId,tick:s.native.ticks});s.native.sourceBranch='PlayerUseTool';runNativeScriptTool(s,toolId);return s;
}
export function clearNegotiationContext(previous:NegotiationState):NegotiationState{
 const s=clone(previous);s.native.context=[];s.offers=0;s.customerOffers=0;s.history=[];s.lastOffer=null;s.native.sourceBranch='clearContext';return s;
}
