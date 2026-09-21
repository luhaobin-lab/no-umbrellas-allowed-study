import type { NegotiationState } from './negotiation';
import type { NativeCardAction } from './native-negotiation-types';
import { getNativeCard, estimateNativeCards, sortNativeCards } from './native-rules';
import { acceptNative, counterNative, pushNative, refuseNative } from './native-response';
import { onStoryCard, onStoryOffer, onStoryDecline, type StoryContext } from './story-appraisal';
/** Registry identity is independent from a character's name or base personality. */
export const NATIVE_SCRIPT_REGISTRY = {
 D01_1_haggle_darcy:'D011HaggleDarcy',D01_2_stock_hue:'D012StockHue',D02_firstassess_condition:'D02FirstassessCondition',D03_firstassess_material_after:'D03FirstassessMaterialAfter',
 D03_unwillingSon:'UnWilling',D08_unwillingHusband:'UnWilling',D13_unwillingDaughter:'UnWilling',D18_unwillingWife:'UnWilling',D04_year_archae_after:'D04YearArchaeAfter',D04_year_national_after:'D04YearNationalAfter',D05_sign_after:'D05SignAfter',D06_2_brand_hue:'D062BrandHue',D06_brand_after:'D06BrandAfter',D07_choi:'D07Choi',D08_art_after:'D08ArtAfter',D08_art_hue:'D08ArtHue',D08_yeongi:'D08Yeongi',D11_private_after:'D11PrivateAfter',D11_privateslot_darcy:'D111PrivateDarcy',D20_preAvarice301:'PreAvarice3',D21_preAvarice302:'PreAvarice3',begToBuy2:'BegToBuy2',begToBuyAndWait5_1:'BegToBUyAndWait51',cityChat_angbuilgu:'CityChatAngbuilgu',driver_after:'DriverAfter',forVid:'ForVid',junar1:'junar12',junar2:'junar12',junar3:'junar3',kanasian1:'kanasian1',kanasian2:'kanasian2',kanasian3:'kanasian3',
} as const;
export type NativeScriptEffect = {type:'chunk';id:string};
export interface NativeScriptState { id:string; kind:string; phase:number; priceActive:boolean; cardActive:boolean; magnifier:boolean; screw:boolean; hideCount:number; initialHadCardSuggestion:boolean; legacy:StoryContext|null }
const legacyKinds=['D06BrandAfter','D08ArtHue','D08ArtAfter','D11PrivateAfter'] as const;
const has=(s:NegotiationState,id:string)=>s.native.customerCardIds.includes(id);
const category=(s:NegotiationState,name:string)=>s.native.customerCardIds.some(id=>getNativeCard(id)?.category===name);
const both=(s:NegotiationState,id:string)=>has(s,id)||s.native.playerCardIds.includes(id);
const fullPriceHook=new Set(['D012StockHue','D02FirstassessCondition','D03FirstassessMaterialAfter','D04YearArchaeAfter','D04YearNationalAfter','D05SignAfter','D06BrandAfter','D07Choi','D08ArtHue','D08ArtAfter','D08Yeongi','D11PrivateAfter','UnWilling','DriverAfter','ForVid']);
const fullCardHook=new Set(['D02FirstassessCondition','D03FirstassessMaterialAfter','D04YearArchaeAfter','D04YearNationalAfter','D05SignAfter','D06BrandAfter','D07Choi','D08ArtHue','D08ArtAfter','D11PrivateAfter','UnWilling','DriverAfter','BegToBuy2','BegToBUyAndWait51','CityChatAngbuilgu']);
function sync(s:NegotiationState){const h=s.native.script;if(!h)return;s.native.priceHookActive=h.priceActive||s.native.modifier==='Enthusiast'||s.native.modifier==='SingSing';s.native.cardHookActive=h.cardActive;}
export function initializeNativeScript(s:NegotiationState,id?:string|null){
 if(!id)return;const kind=NATIVE_SCRIPT_REGISTRY[id as keyof typeof NATIVE_SCRIPT_REGISTRY];
 if(!kind){s.native.unknownFacts.push('unknownCustomFunction:'+id);return;}
 const legacy:StoryContext|null=legacyKinds.includes(kind as typeof legacyKinds[number])?{version:1,visitId:'native-script',hook:kind as StoryContext['hook'],left:false,cardHookActive:true,priceHookActive:true,hideHookActive:kind==='D11PrivateAfter',brandPriceMode:'initial',brandInitialOffers:0,brandFakeDiscussed:false,brandWrongReason:false,brandMaterialEstablished:false,artLowCount:0,artArtistCount:0,artBestCount:0,privateNationalCount:0,privatePopularityCount:0,privateInitialOffers:0,suggestedCardIds:[]}:null;
 s.native.script={id,kind,phase:0,priceActive:fullPriceHook.has(kind),cardActive:fullCardHook.has(kind),magnifier:false,screw:false,hideCount:0,initialHadCardSuggestion:s.native.context.some(a=>a.type==='PlayerSuggestCard'),legacy};s.native.scriptEffects??=[];
 if(kind==='D011HaggleDarcy'){s.native.pricePipes=[];s.native.normalIdle=false;s.native.pending=null;s.native.delayedActions=[];}
 s.native.normalIdle=false;s.native.pending=null;s.native.delayedActions=[];sync(s);
}
export function drainNativeScriptEffects(previous:NegotiationState){const state=structuredClone(previous),effects=state.native.scriptEffects??[];state.native.scriptEffects=[];return{state,effects};}
const chunk=(s:NegotiationState,id:string)=>{(s.native.scriptEffects??=[]).push({type:'chunk',id});s.native.sourceBranch=id;s.lastMessage=id;};
/** Source clearContext clears history only, preserving hook closures, status and scheduled tick pipes. */
const clear=(s:NegotiationState)=>{s.native.context=[];};
function declinePrice(s:NegotiationState,p:number,id:string){refuseNative(s,p,id);chunk(s,id);}
function fail(s:NegotiationState,id?:string){s.status='left';s.counter=null;s.acceptedAmount=null;s.native.pending=null;s.native.delayedActions=[];s.departureReason='offers';if(id)chunk(s,id);}
function declineDeal(s:NegotiationState,id?:string){fail(s,id);pushNative(s,{type:'CustomerDeclineDeal'});}
/** Called after the current PlayerSuggestPrice, before modifier hooks and ordinary pipes. */
export function runNativeScriptPrice(s:NegotiationState,p:number):boolean{
 const h=s.native.script;if(!h)return false;const kind=h.kind,V=s.publicValue;
 if(kind==='D011HaggleDarcy'){
  if(h.phase===0){declinePrice(s,p,p===190?'yes':'no');if(p===190){counterNative(s,p,240,'yes');h.phase=1;}}else if(p<189)declinePrice(s,p,'e229');else if(p<199)declinePrice(s,p,'e239');else if(p<239)declineDeal(s,'e299');else declinePrice(s,p,'e301');return true;
 }
 if(h.legacy){const r=onStoryOffer(h.legacy,{amount:p,customerValue:V,customerCardIds:s.native.customerCardIds,playerCardIds:s.native.playerCardIds,playerOffers:s.native.context.filter(a=>a.type==='PlayerSuggestPrice').length-1,customerOffers:s.native.context.filter(a=>a.type==='CustomerSuggestPrice').length,missingCount:s.native.missingCategories});h.legacy=r.context;h.priceActive=r.context.priceHookActive;h.cardActive=r.context.cardHookActive;sync(s);if(r.handled){if(r.outcome==='leave')declineDeal(s,r.branch??undefined);else declinePrice(s,p,r.branch!);if(r.clearContext)clear(s);return true;}}
 if(kind==='UnWilling'){
  if(s.native.context.filter(a=>a.type==='PlayerSuggestPrice'||a.type==='CustomerSuggestPrice').length>1){pushNative(s,{type:'CustomerDeclinePrice',amount:p});declineDeal(s);s.native.sourceBranch='ItemNotAppreciated';s.lastMessage='ItemNotAppreciated';return true;}
  if(s.native.missingCategories===null){if(!s.native.unknownFacts.includes('scriptMissingCategories'))s.native.unknownFacts.push('scriptMissingCategories');}
  else if(s.native.missingCategories>=2){pushNative(s,{type:'CustomerDeclinePrice',amount:p});declineDeal(s);s.native.sourceBranch='AppraisalNeeded';s.lastMessage='AppraisalNeeded';return true;}if(p/V>1.5){pushNative(s,{type:'CustomerDeclinePrice',amount:p});declineDeal(s);s.native.sourceBranch='ItemNotAppreciated';s.lastMessage='ItemNotAppreciated';return true;}return false;
 }
 if(kind.startsWith('kanasian')||kind.startsWith('junar')){const first=s.native.context.filter(a=>a.type==='PlayerSuggestPrice').length===1,r=p/V;if(r<=.5){declinePrice(s,p,first?'under50first':'under50second');if(!first)declineDeal(s);}else if(r<=.7){if(first)declinePrice(s,p,'under70first');else{acceptNative(s,p,'under70second');chunk(s,'under70second');}}else{const id=r<=1?'under100':'over100';acceptNative(s,p,id);chunk(s,id);}return true;}
 if(!h.priceActive)return false;
 switch(kind){
 case 'D012StockHue':if(p<35)chunk(s,'e27');else if(p>=61)chunk(s,'e56');else if(p>=43)chunk(s,'e40');else{acceptNative(s,p,'success');chunk(s,'success');}return true;
 case 'D02FirstassessCondition':declinePrice(s,p,'wait');return true;
 case 'D03FirstassessMaterialAfter':declinePrice(s,p,'price');return true;
 case 'D04YearArchaeAfter':if(!has(s,'gray_poster')){declinePrice(s,p,'price1');return true;}if(!has(s,'blue_archae')){declinePrice(s,p,'price2');clear(s);return true;}return false;
 case 'D04YearNationalAfter':if(!has(s,'blue_nationalhis')){declinePrice(s,p,'needhs');return true;}return false;
 case 'D05SignAfter':declinePrice(s,p,'needP');return true;
 case 'D07Choi':if(p>=2*V){h.phase++;if(h.phase>=3){declinePrice(s,p,'p100_3');declineDeal(s);}else declinePrice(s,p,`p100_${h.phase}`);}else if(p>=30){const id=p>=45?'p45':'p30';acceptNative(s,p,id);chunk(s,id);}else{declinePrice(s,p,'low');declineDeal(s);}return true;
 case 'D08Yeongi':if(p>=2*V){declinePrice(s,p,'300ormore');clear(s);}else if(p>=.65*V){const id=p>=.9*V?'a':'b';acceptNative(s,p,id);chunk(s,id);clear(s);}else{declinePrice(s,p,'c');declineDeal(s);}return true;
 case 'DriverAfter':if(!h.screw){declinePrice(s,p,h.phase++===0?'needDriver1':'needDriver2');return true;}if(!has(s,'green_goodmovement')){declinePrice(s,p,'hue');return true;}return false;
 case 'ForVid':if(p===110){chunk(s,'on110');return true;}return false;
 }
 return false;
}
export interface NativeScriptCardDecision {handled:boolean;accept:boolean|null;leave?:boolean;clearBefore?:boolean;branch?:string;chunk?:boolean}
/** Runs after PlayerSuggestCard; action category/truth/value supplied by original-card evaluator. */
export function runNativeScriptCard(s:NegotiationState,a:NativeCardAction):NativeScriptCardDecision{
 const h=s.native.script;if(!h)return{handled:false,accept:null};const id=a.cardId,kind=h.kind;
 const decide=(branch:string,accept:boolean|null,leave=false,clearBefore=false,emit=true):NativeScriptCardDecision=>({handled:true,accept,branch,leave,clearBefore,chunk:emit});
 if(h.legacy){
  if(kind==='D06BrandAfter'&&h.legacy.brandMaterialEstablished){if(id==='green_fakeBrand')return decide('materialAfter',false);return{handled:false,accept:null};}
  const earlier=s.native.context.slice(1).find(x=>x.type==='PlayerSuggestCard'&&x.category===a.category)?.cardId??null;
  const r=onStoryCard(h.legacy,{nativeCardId:id,hidden:false,correctCard:a.correct,customerCardIds:s.native.customerCardIds,playerCardIds:s.native.playerCardIds,discussedCardId:earlier});h.legacy=r.context;h.priceActive=r.context.priceHookActive;h.cardActive=r.context.cardHookActive;sync(s);
  if(kind==='D06BrandAfter'&&r.context.brandMaterialEstablished){const i=s.native.cardPipes.indexOf('DiscussedCategory');if(!s.native.cardPipes.includes('FakeCorrection'))s.native.cardPipes.splice(Math.max(0,i),0,'FakeCorrection');}
  if(r.handled)return decide(r.branch!,r.acceptBelief,r.leave,r.clearContext);return{handled:false,accept:null};
 }
 if(kind==='UnWilling'&&a.correct===false)return decide('QuestionProfessionalism',false,true,false,false);
 if(kind==='PreAvarice3'&&a.correct===true){if(s.publicValue===0||estimateNativeCards(assumeNativeScriptCard(s.native.customerCardIds,id))>=s.publicValue)return h.phase++===0?decide('high1',true):decide('high2',null);return decide('low',true);}
 if(kind.startsWith('kanasian')||kind.startsWith('junar')){
  if(kind==='junar3'&&id==='green_art_artist'&&has(s,id)&&!h.initialHadCardSuggestion)return decide('green_art_artistAgain',true);
  if(kind.startsWith('kanasian')){const items=kind==='kanasian1'?['green_silver','blue_slightdmg']:kind==='kanasian2'?['green_cotton']:['green_glass','blue_perfect'];if(items.includes(id))return decide(id,true);if(id==='blue_fakesign')return decide('fakesign',false);}
  else{if(id==='blue_perfect')return decide(id,true);if(a.category==='condition'&&a.correct===false)return decide('wrongCondition',null);if(id==='green_art_good')return decide(id,true);if(['green_art_bad','green_art_worst'].includes(id))return decide('green_art_wrong',false);if(['green_art_deceased','green_art_best'].includes(id))return decide('green_art_wrongArtist',false);if(id==='blue_fakesign')return decide(id,true);if(id==='blue_artist')return decide(id,false);if(id==='green_art_artist'){const already=s.native.context.slice(1).some(x=>x.type==='PlayerSuggestCard'&&x.cardId===id);return decide(kind==='junar3'||already?'green_art_artistAccept':'green_art_artistDecline',kind==='junar3'||already);}}
  if(a.correct===false)return decide('wrong',false);return{handled:false,accept:null};
 }
 if(!h.cardActive)return{handled:false,accept:null};
 switch(kind){
 case 'D02FirstassessCondition':if(['blue_slightdmg','blue_perfect'].includes(id))return decide('sdmg',false);if(['blue_novalue','blue_junkpotential'].includes(id))return decide('novalue',false);if(id==='blue_fairlydmg'){h.priceActive=false;h.cardActive=false;sync(s);return decide('fdmg',null);}break;
 case 'D03FirstassessMaterialAfter':return a.category!=='material'?decide('focus',false):!h.magnifier?decide('eye',false):id==='green_24kGold'?decide('gold',false):decide('accept',true);
 case 'D04YearArchaeAfter':if(id==='blue_archae')return decide(has(s,'gray_poster')?'blue_archae2':'blue_archae',has(s,'gray_poster'));break;
 case 'D04YearNationalAfter':if(id==='blue_nationalhis')return decide('hs',false);break;
 case 'D05SignAfter':if(id==='blue_athlete'){if(h.phase++===0)return decide('athlete',false);h.priceActive=false;sync(s);return decide('athlete2',true,false,true);}if(id==='blue_criminal'){h.priceActive=false;sync(s);return decide('criminal',true,false,true);}break;
 case 'D07Choi':if(id==='blue_fakesign')return decide('c',true);break;
 case 'DriverAfter':if(id==='green_goodmovement')return decide(h.screw?'accept':'eye',h.screw);if(id==='green_fakeBrand')return decide('reason',false);if(id.includes('fakeBrand')&&(a.tier??getNativeCard(id)?.tier??0)>=4)return decide('insane',false);break;
 case 'BegToBuy2':if(['blue_fakesign','blue_art_good','blue_art_bad'].includes(id))return decide(id,true);if(['blue_art_artist','blue_art_best','green_art_deceased'].includes(id))return decide('deny',false);break;
 case 'BegToBUyAndWait51':if(['blue_novalue','blue_slightdmg'].includes(id))return decide(id,true);if(id==='blue_perfect')return decide(id,false);break;
 case 'CityChatAngbuilgu':if(a.category==='material')return decide('mat',null);break;
 }
 return{handled:false,accept:null};
}
export function applyNativeScriptCardEffects(s:NegotiationState,d:NativeScriptCardDecision){if(d.chunk&&d.branch)chunk(s,d.branch);if(d.leave)declineDeal(s);}
export function clearNativeScriptContext(s:NegotiationState){clear(s);}
/** Hook result Some replaces the default assume; null means use Infoscreen.assume. */
export function runNativeScriptHide(s:NegotiationState,a:NativeCardAction):{handled:boolean;allow:boolean}{
 const h=s.native.script;if(!h)return{handled:false,allow:true};
 if(h.kind==='D111PrivateDarcy'&&a.cardId!=='green_vertivo'){s.native.playerCardIds=s.native.playerCardIds.filter(id=>id!==a.cardId);return{handled:true,allow:false};}
 if(h.kind==='ForVid'&&h.hideCount<2){chunk(s,h.hideCount++===0?'onHide':'onHide2');return{handled:true,allow:true};}
 if(h.legacy?.hook==='D11PrivateAfter'){const r=onStoryCard(h.legacy,{nativeCardId:a.cardId,hidden:true,correctCard:a.correct,customerCardIds:s.native.customerCardIds,playerCardIds:s.native.playerCardIds});h.legacy=r.context;if(r.handled){if(r.branch)chunk(s,r.branch);return{handled:true,allow:r.allowHidden??false};}}
 return{handled:false,allow:true};
}
/** Original Infoscreen.assume removes the previously matching ID after prepending. Repeating an identical ID therefore removes it. */
export function assumeNativeScriptCard(current:readonly string[],id:string):string[]{
 const card=getNativeCard(id);if(!card)return [...new Set([...current,id])];
 const nonRed=current.map(c=>getNativeCard(c)).filter(c=>c);
 if(new Set(nonRed.map(c=>c!.category)).size!==nonRed.length)return [...current];
 const old=current.find(c=>{const v=getNativeCard(c);return v&&((v.category===card.category&&v.color!==3)||(v.color===0&&card.color===0));});
 return sortNativeCards([id,...current].filter(c=>c!==old)).map(c=>c.id);
}
export function runNativeScriptTool(s:NegotiationState,toolId:string){const h=s.native.script;if(!h)return;if(h.kind==='D03FirstassessMaterialAfter'&&toolId==='magnifier')h.magnifier=true;if(h.kind==='DriverAfter'&&toolId==='screw')h.screw=true;}
export function runNativeScriptAccept(s:NegotiationState):boolean{if(s.native.script?.kind!=='D011HaggleDarcy')return false;declineDeal(s,'accept');return true;}
export function declineNativeDeal(previous:NegotiationState):{state:NegotiationState;handled:boolean}{
 const s=structuredClone(previous),h=s.native.script;if(s.status==='accepted'||s.status==='left')return{state:s,handled:true};
 if(!h){fail(s);return{state:s,handled:false};}const kind=h.kind;let id:string|undefined;
 if(h.legacy){const r=onStoryDecline(h.legacy,{customerCardIds:s.native.customerCardIds,playerCardIds:s.native.playerCardIds});h.legacy=r.context;if(r.handled){if(r.branch)chunk(s,r.branch);if(r.failImmediately)fail(s);return{state:s,handled:true};}}
 switch(kind){
 case 'D012StockHue':case 'D03FirstassessMaterialAfter':case 'D04YearNationalAfter':id='playerGiveUp';break;
 case 'D02FirstassessCondition':if(!category(s,'condition'))id='playerGiveUpWithoutDamage';break;
 case 'D04YearArchaeAfter':if(!has(s,'gray_poster'))id='playerGiveUpOnMindows';else if(!has(s,'gray_poster')&&has(s,'blue_archae'))id='playerGiveUpWithoutArchae';break;
 case 'D05SignAfter':if(!category(s,'figure'))id='playerGiveUpWithoutFigure';break;
 case 'D062BrandHue':if(!['green_everbrown','blue_junkpotential','blue_reput_hurt','green_everbrown_wikatanus'].every(x=>has(s,x)))id='playerGiveUpWithoutDetail';break;
 case 'D07Choi':id='low';break;
 case 'DriverAfter':if(!has(s,'green_goodmovement'))id='playerGiveUpWithoutMovement';break;
 default:if(kind.startsWith('junar')||kind.startsWith('kanasian')){id=s.native.context.some(a=>a.type==='PlayerSuggestPrice')?'refuseWithHaggle':s.native.context.some(a=>a.type==='PlayerSuggestCard')?'refuseWithAppraisal':'refuseWithoutAppraisal';chunk(s,id);fail(s);return{state:s,handled:true};}
 }
 if(id)chunk(s,id);else fail(s);return{state:s,handled:true};
}
