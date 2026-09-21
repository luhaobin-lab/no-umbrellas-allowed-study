import {createCuration,curateNativeItem,priceNativeCuration,curationSuccessContexts,curationLine,type CurationItem} from './native-curation';
import {generationDifficulty,selectNativeGeneration,tomorrowUmbrellaContext} from './native-generation';
import {NATIVE_STREET_PURCHASES} from './native-street-purchases-data';
import {executeStreetCallbacks,streetProductNumber,streetStoreOpen,styleBoughtIndex} from './native-street-purchases';
import {NATIVE_SCRIPT_REGISTRY,drainNativeScriptEffects,declineNativeDeal,runNativeScriptAccept} from './native-script-hooks';
import {nativeHaggleOutcomeEffects} from './native-haggle-effects';
import {evaluateNativeSaleFeedback,nativeNegotiationFacts,isNativeHaggleCardTrue} from './native-sale-feedback';
import {nativeSaleValues} from './native-sale-value';
import {offerRental,rentalHopePrice} from './native-rental';
import {NATIVE_CAMPAIGN} from './native-campaign-data';
import {scheduleDay,triggeredEvent,testCondition,evaluateExpression,randomUnit,type Contexts,type StoryOp,type SourceEvent} from './native-scheduler';
import {createStory,advanceStory} from './native-story';
import {createWorld,FLOWERS,flowerDisplay,visitorIncrement,reportScore,housingRent,isBroke,ageCardIds,adamCondition,rentalParameters,rentalQuote,rentalReturn,auctionEligibility,auctionResult,challengeScore,type NativeWorld} from './native-services';
import {getNativeItem,getNativeCard,estimateNativeCards,createNativeItem,isTrueCard} from './native-rules';
import type {NativeItemInstance} from './native-types';
import {generateNativeBeliefs} from './native-beliefs';
import type {NativePersonality,NativeCardInfo} from './native-negotiation-types';
import {createStoryContext,onStoryCard,onStoryOffer,type StoryContext} from './story-appraisal';
import {getDemoCustomer} from './demo-customer-data';
import {storyPriceResponse} from './story-negotiation';
import {scoreFromDemoCards} from './rep-data-helper';
import {DEMO_ITEMS,DEMO_CARDS} from './demo-item-data';
import {initialFromRates,rates,tiers,reviewAppraisal,reviewSatisfaction,reviewRecommendation,type ReputationState} from './reputation';
import {postCash,summarizeDay,validateCashbook,type CashCategory,type CashEntry,type TradeEntry,type DaySummary} from './accounting';
import {createNegotiation,offer as negotiate,tick as tickNegotiation,updateAppraisal,assertNativeCard,hideNativeCard,useNativeTool,clearNegotiationContext,acceptNativeSaleCounter,type NegotiationState,type NegotiationPersonality} from './negotiation';
import {getItemFacts,auditAppraisal,nativeCardById,ITEM_FACT_CONTINUITY_LINKS,type AppraisalAudit} from './item-facts';
import {loanLimit,quoteRepayment,accrueInterest,repairQuote,type LoanAccount,type RepairCondition} from './economy';

export type Side='buy'|'sell'|'gift'|'story';
export interface Card {id:string;nativeId?:string;label:string;group:string;operator:'add'|'percent'|'multiply'|'none'|'base';value:number|null;asset?:string;source?:number;description?:string}
export interface Patch {asset:string;rect:[number,number,number,number]}
export interface Visit {
 id:string;day:number;start:number;end:number;side:Side;title:string;base:number;
 initial:Card[];final:Card[];attractiveness:number;expertness?:number;price:number|null;estimate:number|null;
 npc?:Patch;item?:Patch;titlePatch?:Patch;dialogues:{text:string;timestamp?:number;asset?:string;rect?:[number,number,number,number]}[];
 inspected?:Record<string,Patch>;year?:number;quotes?:{timestamp:number;amount:number;accepted:boolean|null;speaker:string}[];sourceCash?:number;sourceCashAfter?:number;
 personality?:NegotiationPersonality;sourceEventId?:string;sourceCharacterId?:string;sourceCharacterRef?:string;definitionId?:string;generated?:boolean;
}
export interface Stock {
 id:string;definitionId?:string;title:string;paid:number;costKnown?:boolean;value:number;listing:number|null;cards:Card[];
 patch?:Patch;slot?:number|null;originalListing?:number|null;sourceListing?:boolean;acquiredDay?:number;
 /** The buyer's appraisal stays with this instance; inspection truth is stored separately. */
 appraisal?:{publicCards:Card[];hiddenCards:Card[];acquiredValue:number;acquiredDay:number};
 audit?:AppraisalAudit;repaired?:boolean;repairReadyDay?:number;nativeItem?:NativeItemInstance;rented?:boolean;auctioned?:boolean;locked?:boolean;rentedCount?:number;
}
export interface State {
 mode:'menu'|'shop'|'sales'|'street'|'summary'|'calendar'|'loans'|'flower'|'gem-shop';phase:'appraise'|'offer'|'settled'|'between'|'narrative';
 visit:number;order:number[];campaign:'story'|'challenge'|'demo';seed:number;cash:number;openingCash:number;day:number;dayOpeningCash:number;
 cashbook:CashEntry[];trades:TradeEntry[];summaries:DaySummary[];closedDays:number[];loans:LoanAccount[];
 tags:Card[];hidden:Card[];privateUnlocked:boolean;gemUnlocked:boolean;quote:string;counter:number|null;
 tool:string|null;inspected:string[];book:string|null;stock:Stock[];dialogue:string;dialogueIndex:number;cashDelta:number;selectedStock:string|null;saleTargetId:string|null;
 loan:number;reputation:number;reputationState:ReputationState;profile:{expertness:number;attractiveness:number;wittiness:number};negotiation:NegotiationState|null;customerCards:Card[];storyContext:StoryContext|null;contextOffers:{player:number;customer:number};
 offers:number;result:'bought'|'sold'|'declined'|null;revision:number;sequence:number;
 completed:boolean;failure:string|null;plantDays:number;reportedVisitors:string[];reportToday:number;
 pendingAdditionalSale?:string;nativeInspection?:{open:boolean;gemPending?:boolean};world?:NativeWorld;activeNativeItem?:NativeItemInstance;generatedVisits?:Visit[];performedEvents:string[];appraisalReviews:{visit:string;itemId:string;audit:AppraisalAudit}[];
}
const clone=<T>(x:T):T=>structuredClone(x);
const seedStep=(s:number)=>(Math.imul(s,1664525)+1013904223)>>>0;
/** Single source of business state. Video timestamps and final prices are reference metadata only. */
export class Game {
 state:State;visits:Visit[];private originalVisits:Visit[];
 // Kept for old diagnostics: business play has no reference balance checkpoints.
 readonly sourceCheckpoints=false;readonly checkpointLog:unknown[]=[];
 constructor(visits:Visit[],_options:{sourceCheckpoints?:boolean}={}){this.originalVisits=visits.slice();this.visits=visits.slice();this.state=this.initial();}
 initial():State {return {
  mode:'menu',phase:'appraise',visit:0,order:this.visits.map((_,i)=>i),campaign:'story',seed:105,
  cash:258,openingCash:258,day:6,dayOpeningCash:258,cashbook:[],trades:[],summaries:[],closedDays:[],
  loans:[{id:'darcy',principal:500,rate:.05,cycleDays:1,startedDay:1,status:'active',overdue:0}],
  tags:[],hidden:[],privateUnlocked:false,gemUnlocked:false,quote:'',counter:null,tool:null,inspected:[],book:null,
  stock:[],dialogue:'',dialogueIndex:0,cashDelta:0,selectedStock:null,saleTargetId:null,loan:500,reputation:6,
  reputationState:initialFromRates(4,-1,0).state,profile:{expertness:4,attractiveness:-1,wittiness:0},negotiation:null,customerCards:[],storyContext:null,contextOffers:{player:0,customer:0},offers:0,result:null,revision:0,sequence:0,
  completed:false,failure:null,plantDays:0,reportedVisitors:[],reportToday:0,performedEvents:[],appraisalReviews:[],
 };}
 get visit(){return this.visits[this.state.order[this.state.visit]];}
 get allowedInteractions(){const c=this.world.curation;if(c&&c.stage!=='settled'&&!this.world.story){if(c.pending.length||c.waitingLine)return 0;return c.stage==='select'?8|16|32:c.stage==='counter'?4|8:2|8;}const base=this.state.phase==='narrative'?32|128|Number(this.world.story?.waiting?.interactionsToAllow??0):['appraise','offer'].includes(this.state.phase)?511:0;return (base|Number(this.world.contexts.allowedInteractions??0))&~Number(this.world.contexts.disallowedInteractions??0);}
 get active(){return !this.state.failure&&!this.state.completed&&this.allowedInteractions!==0;}
 canInteract(flag:number){return this.active&&(this.allowedInteractions&flag)!==0;}
 get encounter(){return `${this.state.campaign}:${this.state.visit}`;}
 get saleItem(){return this.state.stock.find(i=>i.id===this.state.saleTargetId);}
 get inventorySelection(){return this.state.stock.find(i=>i.id===this.state.selectedStock);}
 start(stock:Stock[]=[],campaign:State['campaign']='story',seed=105){
  this.visits=this.originalVisits.slice();this.state=this.initial();this.state.world=createWorld(seed,campaign==='demo'?1:campaign==='challenge'?15:6);this.state.generatedVisits=[];this.state.stock=clone(stock);this.state.campaign=campaign;this.state.seed=seed>>>0;
  if(campaign==='demo'){
   Object.assign(this.state,{day:1,cash:1000,openingCash:1000,dayOpeningCash:1000,order:[],stock:[],loans:[{id:'darcy',principal:1500,rate:.01,cycleDays:1,startedDay:1,status:'active',overdue:0}],reputationState:{expertnessRaw:0,attractivenessRaw:0,wittinessRaw:0}});
   this.refreshReputation();this.world.estates=[1000];this.world.balances=[1000];this.beginNativeDay(1);return;
  }
  if(campaign==='challenge'){
   Object.assign(this.state,{day:15,cash:3000,openingCash:3000,dayOpeningCash:3000,order:[],loans:[],privateUnlocked:true,gemUnlocked:true});
   for(const key of ['integrity','material','year','signature','screw','jewel','manual','reputation'])this.world.contexts[`Mechanic.${key}`]=true;
   for(const key of ['dayOneItemDiff', 'Mechanic.calculator', 'Mechanic.infoscreen', 'Mechanic.manual', 'Mechanic.privateInfoscreen', 'Mechanic.cardbook', 'tool.brush', 'tool.magnifier', 'tool.sign', 'tool.year', 'tool.jewel', 'tool.screw', 'Manual.Popularity', 'Manual.Rarity', 'Manual.Signature', 'Manual.Brands', 'Manual.Brands.AsyncAwait', 'Manual.Brands.EmeraldOfOz', 'Manual.Brands.RealBird', 'Manual.Brands.Besch', 'Manual.Brands.QueenOfHearts', 'Manual.Brands.Vertivo', 'Manual.Brands.SAS', 'Manual.Brands.CasualCatastrophe', 'Manual.Brands.BenBrown', 'Manual.Brands.Melted', 'Manual.Brands.Gretels', 'Manual.Brands.EasyEnough', 'Manual.Brands.BLike', 'Manual.Brands.ChirpLight', 'Manual.Brands.KitchenMu', 'Manual.Brands.DramaticDilemma', 'Manual.Brands.Everbrown', 'Manual.Brands.SwishSwing', 'Manual.Brands.ArcadeXO', 'Manual.Brands.LovelyDuckling', 'Manual.Brands.FxxxFxxx', 'Manual.Brands.Rivier', 'Manual.Brands.FuzzFly', 'Manual.Jewel', 'Manual.WatchMovement', 'Manual.Artwork', 'Manual.Historic', 'Manual.Timeline', 'openRedCard', 'openYellowCard'])this.world.contexts[key]=true;this.world.contexts.ChallengeMode=true;this.world.contexts.TotalPurchases=30;this.world.contexts.CurrentPurchases=0;
   this.world.challenge={purchaseAttempts:0,saleAttempts:0,bought:0,sold:0,correct:0,goodBuy:0,goodSell:0,streetStops:0,scored:false,score:0,contentScope:NATIVE_CAMPAIGN.limitations[1]};
   this.world.limitations.push(NATIVE_CAMPAIGN.limitations[1]);this.world.scheduler.queue=Array.from({length:30},(_,i)=>['@purchase','@sale',...((i+1)%5===0&&i<29?['@street']:[]),...((i+1)%2===0?['@challenge-day']:[])]).flat().concat(['@challenge-day','@sale','@sale','@sale','@challenge-end']);this.advanceNativeSchedule();return;
  }
  this.loadVisit(0);
 }
 loadVisit(index:number,_unused=false){
  this.world.story=null;this.world.suspendedStories=[];
  delete this.world.contexts.onlyAssertableCard;this.world.contexts.nativeHaggleFinished=false;
  if(this.state.campaign==='story')delete this.state.activeNativeItem;
  const v=this.visits[this.state.order[index]];if(!v){this.finish();return;}
  Object.assign(this.state,{visit:index,day:v.day,mode:v.side==='sell'?'sales':'shop',
   phase:['story','gift'].includes(v.side)?'narrative':'appraise',tags:clone(v.initial),hidden:[],quote:'',counter:null,tool:null,
   inspected:[],book:null,dialogue:'',dialogueIndex:0,cashDelta:0,offers:0,result:null,selectedStock:null,saleTargetId:null,negotiation:null,customerCards:[],storyContext:null,contextOffers:{player:0,customer:0}});
  // These unlocks are documented story events, not elapsed real time.
  if(v.id==='day11-private-slot-tutorial')this.state.privateUnlocked=true;
  if(v.id==='day11-meaningful-paper')this.state.gemUnlocked=true;
  if(v.side==='sell'&&!(v.sourceEventId&&NATIVE_CAMPAIGN.events[v.sourceEventId]?.eventType>=4)){
   const definition=v.definitionId??ITEM_FACT_CONTINUITY_LINKS[v.id]?.definitionId;
   const candidate=this.state.stock.find(i=>(definition?(i.definitionId??i.id)===definition:i.title===v.title)&&i.listing!==null&&!i.repairReadyDay&&!i.rented&&!i.auctioned&&!i.locked);
   const item=candidate??(this.state.campaign!=='story'?this.state.stock.find(i=>i.listing!==null&&!i.repairReadyDay&&!i.rented&&!i.auctioned&&!i.locked):undefined);
   if(!item){this.state.phase='settled';this.state.result='declined';this.state.dialogue="That item isn't on sale. I'll come back another time.";}
   else{this.state.selectedStock=item.id;this.state.saleTargetId=item.id;this.state.tags=clone(item.cards);this.createHaggle(item);}
  }else if(v.side==='buy')this.createHaggle();
  this.touch();
 }
 touch(){this.state.revision++;}
 value(cards=this.state.tags,shopRate=this.state.profile.attractiveness){
  if(cards.length&&cards.every(c=>getNativeCard(c.nativeId??nativeCardById[c.id]?.nativeId??c.id)))return Math.max(0,Math.floor(estimateNativeCards(this.nativeIds(cards).map(id=>id==='green_fakeBrandHalf'?getNativeCard(id)!:id))*(1+shopRate/100)));
  let base=cards.filter(c=>c.operator==='base'||c.operator==='add').reduce((n,c)=>n+(c.value||0),0);
  for(const c of cards){if(c.operator==='percent')base*=1+(c.value||0)/100;else if(c.operator==='multiply')base*=c.value||1;}
  return Math.max(0,Math.floor(base*(1+shopRate/100)+1e-7));
 }
 preciseValue(cards=this.state.tags,rate=this.state.profile.attractiveness){return cards.length&&cards.every(c=>getNativeCard(c.nativeId??nativeCardById[c.id]?.nativeId??c.id))?estimateNativeCards(this.nativeIds(cards).map(id=>id==='green_fakeBrandHalf'?getNativeCard(id)!:id))*(1+rate/100):this.value(cards,rate);}
 get estimate(){return this.value();}
 /** Unknown facts remain explicitly unknown; this fallback never reads a recorded final answer. */
 trueValue(query:string,cards:Card[]=this.state.tags){
  if(this.state.activeNativeItem&&(query===this.visit?.id||query===this.visit?.definitionId))return estimateNativeCards(this.state.activeNativeItem.cardIds);
  const def=getNativeItem(query);if(def)return estimateNativeCards(def.cardIds);
  const facts=getItemFacts(query) as ReturnType<typeof getItemFacts>&{nativeValue?:number;nativeCards?:Card[]};
  if(facts?.nativeCards)return this.value(facts.nativeCards,0);
  return facts?.nativeValue??this.value(cards,0);
 }
 trueStockValue(item:Stock){
  if(item.nativeItem)return estimateNativeCards(item.nativeItem.cardIds);
  const native=getItemFacts(item.definitionId??item.id)?.nativeCards;
  if(item.repaired&&native)return this.value([...native.filter(c=>c.group!=='condition'),{id:'slightly-damaged',label:'',group:'condition',operator:'percent',value:-20}],0);
  return this.trueValue(item.definitionId??item.id,item.cards.length?item.cards:[{id:'known-initial-value',label:'',group:'type',operator:'base',value:item.value}]);
 }
 get inventoryTrueTotal(){return this.state.stock.reduce((n,i)=>n+this.trueStockValue(i),0);}
 createHaggle(item?:Stock){
  this.state.seed=seedStep(this.state.seed);
  const v=this.visit,customer=getDemoCustomer(v.id),scriptKey=v.sourceEventId??customer.eventId,scriptId=scriptKey&&scriptKey in NATIVE_SCRIPT_REGISTRY?scriptKey:null,def=getNativeItem(v.definitionId??getItemFacts(v.id)?.nativeDefinitionId??''),source=NATIVE_CAMPAIGN.events[v.sourceEventId??''];
  if(!item&&def&&!this.state.activeNativeItem)this.state.activeNativeItem=createNativeItem(def.id,{instanceId:`active-${this.encounter}`,seed:this.state.seed});
  const nativeItem=item?.nativeItem??this.state.activeNativeItem,assumptions=(source?.defaultCards??customer.defaultAssumptionIds).map(id=>DEMO_CARDS[id]).filter(Boolean);
  const personality=v.personality??customer.personality??'active',nativePersonality:NativePersonality=({'wishy-washy':'WishyWashy',active:'Active',cautious:'Cautious',emotional:'Emotional',fixie:'Fixie'} as Record<string,NativePersonality>)[personality]??'Active';
  if(v.generated&&v.side==='buy'&&nativeItem){const ids=[...nativeItem.cardIds,...nativeItem.referenceCardIds];const catalog=Object.fromEntries(Object.keys(DEMO_CARDS).flatMap(id=>this.nativeInfo([id]).map(c=>[id,c])));const belief=generateNativeBeliefs({cards:this.nativeInfo(nativeItem.cardIds),references:this.nativeInfo(nativeItem.referenceCardIds),cardCatalog:catalog,personality:nativePersonality,day:this.state.day,seed:this.state.seed});this.state.customerCards=this.cardsFromNative(belief.cards.map(c=>c.id));this.state.tags=clone(this.state.customerCards);this.state.seed=belief.rngState;}
  else this.state.customerCards=clone(item?item.cards:assumptions.length?assumptions:this.state.tags);
  this.state.storyContext=!scriptId&&this.state.campaign==='story'&&v.side==='buy'?createStoryContext(v.id):null;
  const publicValue=this.preciseValue(item?item.cards:this.state.customerCards,item?this.state.profile.expertness:this.state.profile.attractiveness),audit=auditAppraisal(nativeItem??item?.definitionId??v.definitionId??v.id,item?.cards??this.state.customerCards),trueIds=nativeItem?.cardIds??def?.cardIds??[];
  const saleNative=item&&(nativeItem??def),repTiers=tiers(this.state.reputationState),saleValues=saleNative?nativeSaleValues({item:saleNative,appraisalCardIds:this.nativeIds(item!.cards),appraisedTier:repTiers.expertness,recommendedTier:repTiers.wittiness}):null,saleFeedback=saleNative?evaluateNativeSaleFeedback({item:saleNative,appraisalCardIds:this.nativeIds(item!.cards),evaluated:!!item!.audit,buyingPrice:item!.paid,listingPrice:item!.listing??item!.value}):undefined;
  this.world.redCardRolls??={once:randomUnit(this.world),last:randomUnit(this.world),report:randomUnit(this.world)};
  this.state.negotiation=createNegotiation({side:v.side as 'buy'|'sell',fairValue:item?saleValues?.fairValue??this.trueStockValue(item):this.trueValue(v.definitionId??v.id),publicValue,
   initialPublicValue:publicValue,...(item?{listingPrice:item.listing??item.value}:{}),personality,seed:this.state.seed,reputation:this.state.reputation,flower:this.world.flower.life>0?this.world.flower.type:this.state.plantDays>0?1:0,appraisedTier:tiers(this.state.reputationState).expertness,
   native:{scriptId,itemCondition:nativeItem?.integrity,shopBalance:this.state.cash,sameTypeStockValues:this.state.stock.filter(i=>{const gray=trueIds.find(id=>getNativeCard(id)?.color===0);return !!gray&&this.nativeIds(i.cards).includes(gray);}).map(i=>this.trueStockValue(i)),redCardRolls:this.world.redCardRolls,personality:nativePersonality,autoSelectModifier:!!v.generated,challenge:this.state.campaign==='challenge',day:this.state.day,globals:this.getContexts(),trueCardIds:trueIds,referenceCardIds:nativeItem?.referenceCardIds??def?.referenceCardIds??[],customerCardIds:this.nativeIds(this.state.customerCards),playerCardIds:this.nativeIds(this.state.hidden),actualFake:trueIds.some(id=>id.includes('fake')),missingCategories:audit.complete?new Set(audit.knownMissing.map(x=>x.field)).size:null,nonCorrectCategories:audit.complete?new Set(audit.knownWrong.map(x=>x.field)).size:null,priceHookActive:!!this.state.storyContext,cardHookActive:!!this.state.storyContext,normalIdle:customer.normalIdleTimers!==false,...(nativeItem?nativeNegotiationFacts(nativeItem,this.nativeIds(this.state.customerCards),this.nativeIds(this.state.hidden)):{})},
   ...(item?{sale:{itemId:item.id,definitionId:item.definitionId,visitors:this.world.visitors,...(saleValues?{ratioValue:saleValues.ratioValue}:{}),...(saleFeedback?{mandatoryFeedback:saleFeedback.mandatoryFeedback,conditionFeedback:saleFeedback.conditionFeedback}:{}),eligibleSecondItems:this.state.stock.filter(i=>i.id!==item.id&&this.isAvailable(i)&&i.listing!==null).map(i=>({instanceId:i.id,definitionId:i.definitionId??i.id,fairValue:this.trueStockValue(i),publicValue:i.value,listingPrice:i.listing!,available:true}))}}:{})});
  this.state.counter=this.state.negotiation.counter;this.state.contextOffers={player:0,customer:this.state.counter===null?0:1};
 }
 nativeIds(cards:Card[]){return cards.map(c=>c.nativeId??nativeCardById[c.id]?.nativeId??c.id);}
 clearConversation(){if(this.state.negotiation){this.state.negotiation=clearNegotiationContext(this.state.negotiation);this.state.negotiation.native.priceHookActive=!!this.state.storyContext?.priceHookActive||!!this.state.negotiation.native.script?.priceActive||['Enthusiast','SingSing'].includes(this.state.negotiation.native.modifier??'');this.state.negotiation.native.cardHookActive=!!this.state.storyContext?.cardHookActive||!!this.state.negotiation.native.script?.cardActive;}this.state.contextOffers={player:0,customer:0};this.state.counter=this.state.negotiation?.counter??null;}
 sourceCardCorrect(card:Card):boolean|null{
  if(this.state.activeNativeItem)return isNativeHaggleCardTrue(this.state.activeNativeItem,card.nativeId??nativeCardById[card.id]?.nativeId??card.id,this.nativeIds(this.state.customerCards));
  const facts=getItemFacts(this.visit.definitionId??this.visit.id),native=nativeCardById[card.id];if(!facts?.nativeDefinitionId||!native)return null;const item=DEMO_ITEMS[facts.nativeDefinitionId];
  const id=native.nativeId.replace(/_(cert)$/,'');if(id.includes('green_jewel_'))return true;
  if(item.referenceCardIds.includes(id)&&!this.nativeIds(this.state.customerCards).some(id=>id.includes('fakeBrand')))return true;
  const audit=auditAppraisal(this.state.activeNativeItem??this.visit.definitionId??this.visit.id,[card]);return audit.complete?audit.knownWrong.length===0:null;
 }
 updateHaggle(){
  const n=this.state.negotiation;if(!n||this.visit.side!=='buy')return;
  const audit=auditAppraisal(this.state.activeNativeItem??this.visit.definitionId??this.visit.id,this.state.tags,this.state.hidden);
  this.state.negotiation=updateAppraisal(n,{fairValue:this.trueValue(this.visit.id),publicValue:this.preciseValue(),incorrectPublicCards:audit.knownWrong.filter(e=>this.state.tags.some(c=>c.id===e.cardId)).length});
  this.state.counter=this.state.negotiation.counter;
  if(this.state.negotiation.status==='left')this.decline(this.state.negotiation.lastMessage);
 }
 add(card:Card,hidden=false){
  if(!this.canInteract(1)||this.visit.side!=='buy'||(hidden&&!this.state.privateUnlocked)||(card.operator==='base'&&hidden))return false;
  const sourceCardId=card.nativeId??nativeCardById[card.id]?.nativeId??card.id;if(this.world.contexts.onlyAssertableCard&&this.world.contexts.onlyAssertableCard!==sourceCardId)return false;
  const beforeTags=clone(this.state.tags),beforeHidden=clone(this.state.hidden),own=hidden?this.state.hidden:this.state.tags,other=hidden?this.state.tags:this.state.hidden;

  const category=(c:Card)=>['question','brand-reason'].includes(c.group)?'brand':c.group;
  const same=own.findIndex(c=>category(c)===category(card));if(hidden&&same<0&&own.length>=2)return false;
  const story=this.state.storyContext?onStoryCard(this.state.storyContext,{nativeCardId:card.nativeId??nativeCardById[card.id]?.nativeId??card.id,hidden,correctCard:this.sourceCardCorrect(card),customerCardIds:this.nativeIds(this.state.customerCards),playerCardIds:this.nativeIds(hidden?beforeHidden:beforeHidden.filter(c=>c.id!==card.id))}):null;
  if(story){this.state.storyContext=story.context;if(story.clearContext)this.clearConversation();if(story.message)this.state.dialogue=story.message;
   if(story.leave){this.decline(story.message);return false;}
   if(hidden&&story.allowHidden===false||!hidden&&story.handled&&story.acceptBelief===false){this.touch();return false;}
  }
  const i=other.findIndex(c=>c.id===card.id||!hidden&&category(c)===category(card));if(i>=0)other.splice(i,1);
  if(same>=0)own.splice(same,1,clone(card));else own.push(clone(card));
  const rank:Record<string,number>={type:0,artwork:1,brand:1,question:1,'brand-reason':1,material:2,condition:3,history:4,signature:5,popularity:6};own.sort((a,b)=>(rank[a.group]??7)-(rank[b.group]??7));
  if(story?.handled&&story.acceptBelief===true&&this.state.negotiation){this.state.negotiation.publicValue=this.preciseValue();this.state.negotiation.fairValue=this.trueValue(this.visit.id);this.state.negotiation.appraisalReaction='accepted';}
  else if(this.state.negotiation){const id=card.nativeId??nativeCardById[card.id]?.nativeId??card.id,info=this.nativeInfo([id])[0],audit=auditAppraisal(this.state.activeNativeItem??this.visit.definitionId??this.visit.id,this.state.tags,this.state.hidden),action={...info,cardId:id,category:info?.category??card.group,correct:this.sourceCardCorrect(card),proposedPublicValue:this.preciseValue(),proposedCustomerCardIds:this.nativeIds(this.state.tags),customerCardIds:this.nativeIds(beforeTags),playerCardIds:this.nativeIds(hidden?beforeHidden:this.state.hidden),missingCategories:audit.complete?new Set(audit.knownMissing.map(a=>a.field)).size:null,referenceCardIds:this.state.activeNativeItem?.referenceCardIds,...(this.state.activeNativeItem?nativeNegotiationFacts(this.state.activeNativeItem,this.nativeIds(this.state.tags),this.nativeIds(this.state.hidden)):{})};if(hidden){this.state.negotiation.native.customerCardIds=this.nativeIds(this.state.tags);this.state.negotiation.publicValue=this.preciseValue();}const r=hidden?hideNativeCard(this.state.negotiation,action):assertNativeCard(this.state.negotiation,action);this.state.negotiation=r.state;if(hidden&&r.allowHidden)this.state.hidden=this.cardsFromNative(r.state.native.playerCardIds);this.state.counter=r.state.counter;if(r.message)this.state.dialogue=r.message;if(r.state.status==='accepted'&&r.state.acceptedAmount!==null){this.state.customerCards=this.cardsFromNative(r.state.native.customerCardIds);this.state.tags=clone(this.state.customerCards);this.settle(r.state.acceptedAmount);this.consumeScriptEffects();return true;}if(r.leave){this.decline(r.message);this.consumeScriptEffects();return false;}if(hidden?r.allowHidden===false:!r.beliefAccepted){this.state.tags=this.cardsFromNative(r.state.native.customerCardIds);this.state.customerCards=clone(this.state.tags);this.state.hidden=hidden?this.cardsFromNative(r.state.native.playerCardIds):beforeHidden;this.consumeScriptEffects();this.touch();return false;}}
  else this.updateHaggle();
  if(['incorrect','rejected-negative','rejected-subjective'].includes(this.state.negotiation?.appraisalReaction??'')&&!story?.handled){this.state.tags=beforeTags;this.state.hidden=beforeHidden;this.state.dialogue=this.state.negotiation?.lastMessage??'';this.touch();return false;}
  this.state.customerCards=clone(this.state.tags);this.signalStory(hidden?'PlayerHideCard':'PlayerAssertCard',sourceCardId);this.consumeScriptEffects();if(this.world.story?.waiting)this.continueStory();this.touch();return true;
 }
 remove(id:string){if(!this.active||this.visit.side!=='buy')return;this.state.tags=this.state.tags.filter(c=>c.id!==id||c.operator==='base');this.state.hidden=this.state.hidden.filter(c=>c.id!==id);this.state.customerCards=clone(this.state.tags);this.updateHaggle();this.touch();}
 inspect(tool:string,options:{bookPage?:string|null;toolUseHook?:boolean;usedEvent?:boolean;deselect?:boolean}={}){if(!this.canInteract(128))return;const map:Record<string,string>={damage:'integrity',material:'material',year:'year',signature:'signature',gem:'jewel',screwdriver:'screw'};if(this.state.campaign==='demo'&&this.getContext(`Mechanic.${map[tool]??tool}`)!==true)return;if(this.state.negotiation&&options.toolUseHook!==false)this.state.negotiation=useNativeTool(this.state.negotiation,({damage:'brush',material:'magnifier',signature:'sign',gem:'jewelscan',screwdriver:'screw',year:'year'} as Record<string,string>)[tool]??tool);this.state.tool=options.deselect?null:tool;if(options.usedEvent!==false){if(!this.state.inspected.includes(tool))this.state.inspected.push(tool);this.signalStory(({damage:'ToolUsed_Integrity',material:'ToolUsed_Magnifier',year:'ToolUsed_Year',signature:'ToolUsed_Sign',gem:'ToolUsed_Jewel',screwdriver:'ToolUsed_Screw'} as Record<string,string>)[tool]??`ToolUsed_${tool}`);}const pages:Record<string,string>={damage:'condition',material:'material',year:'chronology-recent',signature:'celebrity-index',gem:'index',screwdriver:'index'};this.state.book=options.bookPage===undefined?pages[tool]:options.bookPage;this.consumeScriptEffects();if(this.world.story?.waiting)this.continueStory();this.touch();}
 enterDigit(d:string){if(!this.active)return;if(d==='C')this.state.quote='';else if(d==='E')this.state.quote=this.state.quote.slice(0,-1);else if(/^\d$/.test(d)&&this.state.quote.length<7)this.state.quote=(this.state.quote==='0'?'':this.state.quote)+d;this.touch();}
 offer(){
  if(this.world.curation?.stage==='price')return this.offerCurationPrice(Number(this.state.quote));
  if(this.world.rentalRequest&&['offer','counter'].includes(this.world.rentalRequest.stage))return this.offerRentalPrice(Number(this.state.quote));
  if(!this.canInteract(2)||!/^\d+$/.test(this.state.quote)||!this.state.negotiation)return false;
  const amount=Number(this.state.quote);
  if(!Number.isSafeInteger(amount)||amount<0||(this.visit.side==='buy'&&amount>this.state.cash)){this.state.dialogue="You don't have enough cash for that offer.";this.touch();return false;}
  if(this.visit.side==='sell'&&!this.validSale()){this.decline('This item is no longer available.');return false;}
  if(this.visit.side==='sell')this.reviewSale();
  this.state.offers++;
  if(this.state.storyContext){
   const audit=auditAppraisal(this.state.activeNativeItem??this.visit.definitionId??this.visit.id,this.state.customerCards,this.state.hidden);
   const response=onStoryOffer(this.state.storyContext,{amount,customerValue:this.state.negotiation.publicValue,customerCardIds:this.nativeIds(this.state.customerCards),playerCardIds:this.nativeIds(this.state.hidden),playerOffers:this.state.contextOffers.player,customerOffers:this.state.contextOffers.customer,missingCount:audit.complete?new Set(audit.knownMissing.map(i=>i.field)).size:null});
   this.state.storyContext=response.context;
   if(response.handled){this.state.contextOffers.player++;this.state.negotiation.offers++;this.state.negotiation.lastOffer=amount;this.state.dialogue=response.message;
    this.state.negotiation.history.push({amount,outcome:response.outcome==='leave'?'left':'rejected',counter:null});
    if(response.clearContext)this.clearConversation();
    if(response.outcome==='leave')this.decline(response.message);else{this.state.phase='offer';this.touch();}return false;
   }
  }
  const scripted=this.state.campaign==='story'&&!this.state.negotiation.native.script?storyPriceResponse(this.visit.id,{offer:amount,customerValue:this.state.negotiation.publicValue,priorOffers:this.state.offers-1}):{handled:false};
  if(scripted.handled&&'outcome' in scripted){const n=this.state.negotiation;this.state.contextOffers.player++;n.offers++;n.lastOffer=amount;n.counter=null;this.state.counter=null;n.history.push({amount,outcome:scripted.outcome==='accept'?'accepted':scripted.outcome==='decline-deal'?'left':'rejected',counter:null});
   if('clearContext' in scripted&&scripted.clearContext)this.clearConversation();
   if(scripted.outcome==='accept')return this.settle(amount);
   const message=scripted.outcome==='decline-offer'?"That's too much. Please make a reasonable offer.":"I can't agree to that price. Goodbye.";n.lastMessage=message;this.state.dialogue=message;
   if(scripted.outcome==='decline-deal'){n.status='left';this.decline(message);}else{this.state.phase='offer';this.touch();}return false;
  }
  this.state.contextOffers.player++;const response=negotiate(this.state.negotiation,amount);if(response.counter!==null)this.state.contextOffers.customer++;this.state.negotiation=response.state;
  this.state.counter=response.counter;this.state.dialogue=this.saleFeedback()+response.message;
  if(response.outcome==='accepted'){const settled=this.settle(response.state.acceptedAmount??amount);this.consumeScriptEffects();return settled;}
  if(response.outcome==='left'){this.decline(response.message);this.consumeScriptEffects();return false;}
  this.state.phase='offer';this.consumeScriptEffects();this.touch();return false;
 }
 beginSale(){
  if(!this.active||this.visit.side!=='sell'||!this.saleItem)return false;
  if(this.state.offers>0)return true;this.state.quote=String(this.saleItem.listing);return this.offer();
 }
 accept(){if(this.world.curation?.stage==='counter')return this.acceptCurationCounter();if(this.world.rentalRequest?.stage==='counter')return this.acceptRentalCounter();if(!this.canInteract(4)||this.state.counter===null)return false;if(this.state.negotiation&&runNativeScriptAccept(this.state.negotiation)){this.decline(this.state.negotiation.lastMessage);this.consumeScriptEffects();return false;}if(this.visit.side==='sell'&&this.state.negotiation)this.state.negotiation=acceptNativeSaleCounter(this.state.negotiation).state;return this.settle(this.state.counter);}
 validSale(){const i=this.saleItem;return !!i&&i.listing!==null&&!i.repairReadyDay&&!i.rented&&!i.auctioned&&!i.locked;}
 reviewSale(){
  const item=this.saleItem;if(!item||this.state.appraisalReviews.some(r=>r.visit===this.encounter))return;
  const audit=auditAppraisal(item.nativeItem??item.definitionId??item.id,item.appraisal?.publicCards??item.cards,item.appraisal?.hiddenCards??[]);
  if(!item.appraisal&&!item.cards.length){audit.knownWrong=[];audit.knownMissing=[];audit.complete=false;}
  if(item.repaired){audit.knownWrong=audit.knownWrong.filter(i=>i.field!=='condition');audit.knownMissing=audit.knownMissing.filter(i=>i.field!=='condition');}
  this.state.appraisalReviews.push({visit:this.encounter,itemId:item.id,audit});item.audit=audit;
  const update=reviewAppraisal(this.state.reputationState,{wrongCategories:new Set(audit.knownWrong.map(i=>i.field)).size,missingCategories:new Set(audit.knownMissing.map(i=>i.field)).size,complete:audit.complete,alreadyEvaluated:this.state.appraisalReviews.some(r=>r.itemId===item.id&&r.visit!==this.encounter)});
  this.state.reputationState=update.state;this.refreshReputation();
  if(audit.knownWrong.length)this.state.dialogue=`Your appraisal has ${audit.knownWrong.length} incorrect attribute(s).`;
 }
 settle(amount:number){
  if(!this.active||!Number.isSafeInteger(amount)||amount<0||!['buy','sell'].includes(this.visit.side))return false;
  const buy=this.visit.side==='buy',item=this.saleItem;
  if(!buy&&this.state.negotiation?.salePlan?.kind==='bundle')return this.settleBundle(amount);
  if(!buy&&!this.validSale()){this.decline('This item is no longer available.');return false;}
  const cash=this.cashEvent(`trade:${this.encounter}`,buy?-amount:amount,buy?'purchase':'sale',buy?this.visit.title:item!.title,item?.id);
  if(!cash){this.state.dialogue="You don't have enough cash.";this.touch();return false;}
  let transferred:Stock;
  if(buy){
   const cards=clone([...this.state.tags,...this.state.hidden]),value=this.value(cards,this.state.profile.expertness);
   transferred={id:`item-${++this.state.sequence}`,definitionId:this.visit.definitionId??this.visit.id,...(this.state.activeNativeItem?{nativeItem:clone(this.state.activeNativeItem)}:{}),title:this.visit.title,paid:amount,costKnown:true,value,listing:null,cards,
    ...(this.visit.item?{patch:clone(this.visit.item)}:{}),acquiredDay:this.state.day,
    appraisal:{publicCards:clone(this.state.tags),hiddenCards:clone(this.state.hidden),acquiredValue:value,acquiredDay:this.state.day}};
   if(transferred.nativeItem)transferred.nativeItem.instanceId=transferred.id;this.state.stock.unshift(transferred);
  }else{transferred=item!;this.reviewSale();const facts=getItemFacts(item!.definitionId??item!.id),native=facts?.nativeDefinitionId?DEMO_ITEMS[facts.nativeDefinitionId]:null;const score=native?scoreFromDemoCards(native.cardIds,{itemId:native.id,repaired:item!.repaired,trueValue:this.trueStockValue(item!)}):null;this.state.reputationState=reviewRecommendation(this.state.reputationState,{recommended:item!.slot===14,score}).state;this.refreshReputation();this.state.stock=this.state.stock.filter(i=>i.id!==item!.id);}
  this.state.trades.push({id:`trade:${this.encounter}`,day:this.state.day,itemId:transferred.id,title:transferred.title,side:buy?'buy':'sell',price:amount,
   costBasis:buy?amount:transferred.costKnown===false?null:transferred.paid,appraisedValue:transferred.value,
   profit:buy||transferred.costKnown===false?null:amount-transferred.paid});
  if(buy){this.state.reputationState=reviewSatisfaction(this.state.reputationState,this.state.negotiation?.personality==='fixie'?'neutral':'satisfied').state;this.refreshReputation();}
  Object.assign(this.state,{phase:'settled',result:buy?'bought':'sold',tool:null,book:null,counter:null,cashDelta:buy?-amount:amount,
   dialogue:buy?`Agreed. ${amount}U. The item is yours.`:this.saleFeedback()+`Agreed. I'll take it for ${amount}U.`});
  if(this.state.negotiation){this.state.negotiation.status='accepted';this.state.negotiation.acceptedAmount=amount;}
  if(!buy&&this.state.negotiation?.salePlan?.kind==='counter-then-additional')this.state.pendingAdditionalSale=this.state.negotiation.salePlan.second?.instanceId;
  this.afterNativeTrade(buy,amount,transferred);if(this.world.story?.waiting){this.state.phase='narrative';this.continueStory();}this.touch();return true;
 }
 private settleBundle(amount:number){
  const plan=this.state.negotiation!.salePlan!,items=plan.itemIds.map(id=>this.state.stock.find(i=>i.id===id));if(items.length!==2||items.some(i=>!i||!this.isAvailable(i)||i.listing===null)||new Set(plan.itemIds).size!==2)return false;
  const [first,second]=items as [Stock,Stock],totalValue=this.trueStockValue(first)+this.trueStockValue(second),firstPrice=totalValue>0?Math.floor(amount*this.trueStockValue(first)/totalValue):Math.floor(amount/2),prices=[firstPrice,amount-firstPrice];
  if(this.state.cashbook.some(e=>e.id===`trade:${this.encounter}:0`||e.id===`trade:${this.encounter}:1`))return false;this.cashEvent(`trade:${this.encounter}:0`,prices[0],'sale',first.title,first.id);this.cashEvent(`trade:${this.encounter}:1`,prices[1],'sale',second.title,second.id);this.reviewSale();
  items.forEach((item,index)=>{const i=item!,facts=getItemFacts(i.definitionId??i.id),native=facts?.nativeDefinitionId?DEMO_ITEMS[facts.nativeDefinitionId]:null;this.state.reputationState=reviewRecommendation(this.state.reputationState,{recommended:i.slot===14,score:native?scoreFromDemoCards(native.cardIds,{itemId:native.id,repaired:i.repaired,trueValue:this.trueStockValue(i)}):null}).state;this.state.trades.push({id:`trade:${this.encounter}:${index}`,day:this.state.day,itemId:i.id,title:i.title,side:'sell',price:prices[index],costBasis:i.costKnown===false?null:i.paid,appraisedValue:i.value,profit:i.costKnown===false?null:prices[index]-i.paid});this.afterNativeTrade(false,prices[index],i);});
  this.state.stock=this.state.stock.filter(i=>!plan.itemIds.includes(i.id));this.refreshReputation();this.state.negotiation!.status='accepted';this.state.negotiation!.acceptedAmount=amount;Object.assign(this.state,{phase:'settled',result:'sold',counter:null,cashDelta:amount,dialogue:`Agreed. Both items for ${amount}U.`});this.touch();return true;
 }
 requestDecline(){
  if(this.world.curation&&this.world.curation.stage!=='settled')return this.declineCuration();
  if(this.world.rentalRequest&&['offer','counter'].includes(this.world.rentalRequest.stage)){this.declineRental();return true;}
  if(!this.canInteract(8))return false;if(this.state.negotiation?.native.script){const result=declineNativeDeal(this.state.negotiation);this.state.negotiation=result.state;if(result.handled){if(result.state.status==='left')this.decline(result.state.lastMessage);this.consumeScriptEffects();return result.state.status==='left';}}const customer=getDemoCustomer(this.visit.id),source=NATIVE_CAMPAIGN.events[this.visit.sourceEventId??customer.eventId??''],known=this.nativeIds(this.state.customerCards),all=[...known,...this.nativeIds(this.state.hidden)];
  const chunk=customer.scriptHookId==='D06BrandAfter'&&!known.includes('green_fakeBrandMaterial')?'playerGiveUpWithoutFakeMaterial':customer.scriptHookId==='D08ArtAfter'&&!known.some(id=>getNativeCard(id)?.category==='art')?'playerGiveUpWithoutArt':customer.scriptHookId==='D11PrivateAfter'&&(!all.includes('blue_pop')||!all.includes('blue_nationalhis'))?'playerGiveUpWithoutPopHist':null;
  if(chunk&&this.runCallableChunk(chunk))return false;if(source?.playerCanDecline===false){this.state.dialogue='Finish this appraisal before ending the tutorial transaction.';this.touch();return false;}this.decline();return true;
 }
 decline(message='No deal. Goodbye.'){
  if(this.world.curation&&this.world.curation.stage!=='settled'){this.declineCuration();return;}
  if(!this.active||this.world.story&&this.state.negotiation?.status!=='left')return;if(this.world.rentalRequest&&['offer','counter'].includes(this.world.rentalRequest.stage)){this.declineRental();return;}if(this.state.negotiation&&this.visit.side==='buy')this.applyNativeOutcome(false);if(this.visit.side==='buy'){this.state.reputationState=reviewSatisfaction(this.state.reputationState,this.state.negotiation?.personality==='fixie'?'neutral':'unsatisfied').state;this.refreshReputation();}Object.assign(this.state,{phase:'settled',result:'declined',cashDelta:0,tool:null,book:null,counter:null,dialogue:message});this.touch();
 }
 saleFeedback(){const review=this.state.appraisalReviews.find(r=>r.visit===this.encounter);if(!review)return '';const wrong=review.audit.knownWrong.map(i=>i.field),missing=review.audit.knownMissing.map(i=>i.field);return wrong.length?`The ${[...new Set(wrong)].join(', ')} appraisal is wrong. `:missing.length?`You missed ${[...new Set(missing)].join(', ')}. `:'';}
 tick(seconds:number){
  if(!this.active||this.state.phase==='narrative'||!this.state.negotiation||this.state.campaign==='story'&&getDemoCustomer(this.visit.id).normalIdleTimers===false)return;
  const previous=this.state.negotiation,n=tickNegotiation(previous,seconds);this.state.negotiation=n;
  if(n.status==='accepted'&&n.acceptedAmount!==null)this.settle(n.acceptedAmount);else if(n.status==='left')this.decline(n.lastMessage);else if(n.lastMessage!==previous.lastMessage){this.state.dialogue=n.lastMessage;this.touch();}this.consumeScriptEffects();
 }
 refreshReputation(){
  this.state.profile=rates(this.state.reputationState);
  for(const i of this.state.stock)if(i.cards.length)i.value=this.value(i.cards,this.state.profile.expertness);
  this.touch();
 }
 next(){
  if(this.world.story)return;
  if(this.state.phase==='settled'&&this.state.pendingAdditionalSale){const id=this.state.pendingAdditionalSale;delete this.state.pendingAdditionalSale;const item=this.state.stock.find(i=>i.id===id);if(item&&this.isAvailable(item)&&item.listing!==null){const v:Visit={id:`additional-sale-${++this.state.sequence}`,generated:true,sourceCharacterId:this.randomCustomerId(),definitionId:item.definitionId,day:this.state.day,start:0,end:0,side:'sell',title:item.title,base:0,initial:clone(item.cards),final:[],attractiveness:this.state.profile.attractiveness,price:null,estimate:null,personality:'active',dialogues:[{text:'I would also like this item.'}]};this.visits.push(v);this.state.generatedVisits??=[];this.state.generatedVisits.push(v);this.state.order.splice(this.state.visit+1,0,this.visits.length-1);this.loadVisit(this.state.visit+1);this.state.saleTargetId=item.id;this.state.selectedStock=item.id;this.createHaggle(item);this.state.negotiation!.sale.isAdditionalSale=true;return;}}
  if(this.state.campaign!=='story'){if(this.state.phase==='settled')this.finishNativeEncounter();return;}
  if(!['settled','between'].includes(this.state.phase))return;
  const n=this.visits[this.state.order[this.state.visit+1]];
  if(!n)this.finish();else if(this.state.campaign==='story'&&n.day!==this.state.day){this.state.mode='shop';this.state.phase='between';}
  else this.loadVisit(this.state.visit+1);this.touch();
 }
 nextDay(){
  if(this.state.campaign!=='story'){if(this.state.phase!=='between'||this.state.completed)return false;this.closeDay();if(this.state.failure)return false;if(this.state.campaign==='demo')this.beginNativeDay(this.state.day+1);else this.advanceNativeSchedule();return true;}
  if(this.state.phase!=='between'||this.state.completed)return false;
  this.closeDay();if(this.state.failure)return false;
  const next=this.visits[this.state.order[this.state.visit+1]];if(!next){this.finish();return false;}
  this.state.dayOpeningCash=this.state.cash;this.state.reportToday=0;this.state.plantDays=this.world.flower.life;
  this.loadVisit(this.state.visit+1);
  for(const i of this.state.stock)if(i.repairReadyDay&&i.repairReadyDay<=this.state.day){delete i.repairReadyDay;this.applyRepair(i);}
  return true;
 }
 closeDay(){
  if(this.state.closedDays.includes(this.state.day))return;
  const result=accrueInterest(this.state.loans,this.state.cash,this.state.day);
  if(result.paidTotal)this.cashEvent(`interest:${this.state.day}`,-result.paidTotal,'interest','Loan interest');
  this.state.loans=result.loans;if(result.failure)this.state.failure='A loan is three payment periods overdue.';
  this.closeNativeDay();
  this.state.summaries.push(summarizeDay(this.state.day,this.state.dayOpeningCash,this.state.cashbook,this.state.trades));
  this.state.closedDays.push(this.state.day);this.touch();
 }
 finish(){this.closeDay();this.state.completed=true;this.state.mode='summary';this.state.phase='between';this.touch();}
 get daySummary(){return this.state.summaries.find(s=>s.day===this.state.day)??summarizeDay(this.state.day,this.state.dayOpeningCash,this.state.cashbook,this.state.trades);}
 completeNarrative(){
  if(this.world.story){this.continueStory();return;}
  if(this.state.phase!=='narrative')return;
  if(this.visit.side==='gift'&&!this.state.performedEvents.includes(`gift:${this.encounter}`)){
   // Gift knowledge is the presented appraisal, not proof of intrinsic truth.
   const cards=clone(this.visit.initial.length?this.visit.initial:(getItemFacts(this.visit.id)?.nativeCards??[])),value=this.value(cards,this.state.profile.expertness);
   this.state.stock.unshift({id:`item-${++this.state.sequence}`,definitionId:this.visit.id,title:this.visit.title,paid:0,costKnown:true,value,listing:null,cards,
    ...(this.visit.item?{patch:clone(this.visit.item)}:{}),appraisal:{publicCards:clone(cards),hiddenCards:[],acquiredValue:value,acquiredDay:this.state.day}});
   this.state.performedEvents.push(`gift:${this.encounter}`);
  }
  this.state.phase='settled';this.next();
 }
 listStock(id:string,price:number,slot?:number){
  const item=this.state.stock.find(i=>i.id===id);if(!item||!this.isAvailable(item)||!Number.isSafeInteger(price)||price<0||price>9999999)return false;
  if(slot!==undefined&&(!Number.isInteger(slot)||slot<0||slot>14))return false;
  if(slot!==undefined){const occupied=this.state.stock.find(i=>i.id!==id&&i.slot===slot&&i.listing!==null);if(occupied){occupied.slot=item.slot??null;if(occupied.slot===null)occupied.listing=null;}item.slot=slot;}
  item.listing=price;this.signalStory('ItemDisplayed');this.signalStory('StockOpened');this.touch();return true;
 }
 cashEvent(id:string,amount:number,category:CashCategory,label:string,itemId?:string){
  const result=postCash(this.state,{id,day:this.state.day,amount,category,label,...(itemId?{itemId}:{})});if(result.ok)this.touch();return result.ok;
 }
 getLoan(id:string){return this.state.loans.find(l=>l.id===id);}
 repayment(id:string){const l=this.getLoan(id);return l?quoteRepayment(l,this.state.day):null;}
 darcyLimit(){return loanLimit(this.state.cash,this.inventoryTrueTotal,this.state.loans);}
 loanOffers(){const w=this.world,capitalCount=Number(w.contexts['Loan.capital.count']??0),capital=[5000,8000,12000,17000,23000][Math.min(capitalCount,4)];return [
  {id:'darcy',principal:this.darcyLimit(),rate:.05,cycleDays:1,available:!this.getLoan('darcy')||this.getLoan('darcy')?.status==='repaid'},
  {id:'executor',principal:1500,rate:.3,cycleDays:3,available:this.state.day>=8&&this.state.day<25},
  {id:'gran',principal:600,rate:0,cycleDays:1,available:this.state.day<25&&this.getContext('LoanOffer.gran')===true},
  {id:'avac',principal:5000,rate:.1,cycleDays:2,available:this.state.day>=11&&!this.getLoan('avac')},
  {id:'central',principal:5000,rate:.1,cycleDays:1,available:this.getContext('Loan.central.available')===true},
  {id:'capital',principal:capital,rate:capitalCount===0?.01:.1,cycleDays:capitalCount===0?1:2,available:this.getContext('Loan.capital.available')===true},
 ].map(p=>({...p,available:p.available&&this.getLoan(p.id)?.status!=='active'}));}
 borrow(id:string){const d=this.loanOffers().find(l=>l.id===id&&l.available);if(!d)return false;const n=++this.state.sequence;if(!this.cashEvent(`loan:${id}:${n}`,d.principal,'loan',`${id} loan`))return false;this.state.loans=this.state.loans.filter(l=>l.id!==id);this.state.loans.push({id,principal:d.principal,rate:d.rate,cycleDays:d.cycleDays,startedDay:this.state.day,status:'active',overdue:0});if(id==='capital')this.world.contexts['Loan.capital.count']=Number(this.world.contexts['Loan.capital.count']??0)+1;this.touch();return true;}
 repay(id:string){
  const l=this.getLoan(id),quote=this.repayment(id);if(!l||quote===null)return false;
  if(!this.cashEvent(`repay:${id}:${l.startedDay}:${++this.state.sequence}`,-quote,'repayment',`${id} loan payoff`))return false;
  l.status='repaid';this.touch();return true;
 }
 buyFlower(type=1){const p=this.flowerProducts().find(p=>p.type===type&&p.available);if(!p||!this.cashEvent(`flower:${this.state.day}:${++this.state.sequence}`,-p.price,'flower',p.name))return false;this.world.flower={...this.world.flower,type,life:3};this.state.plantDays=3;this.touch();return true;}
 report(){
  if(this.state.day<11||this.state.phase==='between'||this.state.reportedVisitors.includes(this.encounter))return false;
  const reward=reportScore(this.state.day,this.state.reportToday,this.world.reportWeek);this.cashEvent(`report:${this.encounter}`,reward,'fee','Report reward');this.world.reportWeek++;this.world.reportTotal++;this.state.reportedVisitors.push(this.encounter);this.state.reportToday++;this.touch();return true;
 }
 repairInfo(item:Stock){
  const facts=getItemFacts(item.definitionId??item.id),trueCondition=facts?.nativeCards?.find(c=>c.group==='condition')?.id??facts?.constraints.find(c=>c.field==='condition')?.correctCardIds[0]??null;
  const appraised=item.cards.find(c=>c.group==='condition')?.id;
  if(!trueCondition||!appraised)return {eligible:false,cost:0,mode:'unavailable' as const,reason:'Facts are not established.'};
  return repairQuote({trueValue:this.trueValue(item.definitionId??item.id,item.cards),trueCondition:trueCondition as RepairCondition,appraisedCondition:appraised as RepairCondition,alreadyRepaired:item.repaired,beingRepaired:!!item.repairReadyDay,rented:item.rented,auctioned:item.auctioned});
 }
 repair(id:string){return this.repairMany([id]);}
 repairMany(ids:string[]){
  if(this.state.campaign!=='challenge'&&this.state.day<9)return false;if(!ids.length||ids.length>2||new Set(ids).size!==ids.length||this.world.repair.used&&this.world.repair.usedDay===this.state.day)return false;
  const items=ids.map(id=>this.state.stock.find(i=>i.id===id));if(items.some(i=>!i))return false;const quotes=items.map(i=>this.repairInfo(i!));if(quotes.some(q=>!q.eligible))return false;
  if(!this.cashEvent(`repair-batch:${this.state.day}:${++this.state.sequence}`,-quotes.reduce((n,q)=>n+q.cost,0),'repair','Repair service',ids.length===1?ids[0]:undefined))return false;
  items.forEach((item,i)=>{item!.listing=null;item!.slot=null;if(quotes[i].mode==='overnight'&&this.state.campaign!=='challenge')item!.repairReadyDay=this.state.day+1;else this.applyRepair(item!);});this.world.repair={usedDay:this.state.day,used:true};this.touch();return true;
 }
 applyRepair(item:Stock){
  if(item.nativeItem)item.nativeItem.cardIds=[...item.nativeItem.cardIds.filter(id=>getNativeCard(id)?.category!=='condition'&&id!=='blue_repaired'),'blue_slightdmg','blue_repaired'];
  item.cards=item.cards.filter(c=>c.group!=='condition'&&c.id!=='repaired-item');
  item.cards.push({id:'slightly-damaged',label:'Slightly Damaged',group:'condition',operator:'percent',value:-20,asset:'/assets/reference-tags/slightly-damaged.png'},
   {id:'repaired-item',label:'Repaired Item',group:'status',operator:'none',value:null,asset:'/assets/ui/tag-repaired.png'});
  item.repaired=true;item.value=this.value(item.cards,this.state.profile.expertness);
  if(item.appraisal){item.appraisal.publicCards=clone(item.cards);item.appraisal.hiddenCards=[];}this.touch();
 }
 private randomCustomerId(){const pool=['random_female_1020', 'random_female_3040', 'random_female_5060', 'random_male_1020', 'random_male_3040', 'random_male_5060'];return pool[Math.floor(randomUnit(this.world)*pool.length)];}
 get world():NativeWorld {if(!this.state.world)this.state.world=createWorld(this.state.seed,this.state.day);return this.state.world;}
 isAvailable(item:Stock){return !item.repairReadyDay&&!item.rented&&!item.auctioned&&!item.locked&&this.getContext(`forSale.${item.definitionId??item.id}`)!==false;}
 cardsFromNative(ids:string[]):Card[]{return ids.flatMap(id=>{const d=DEMO_CARDS[id],n=getNativeCard(id);return d?[{...d,id:d.id}]:n?[{id,label:n.name,group:n.category==='product'?'type':n.category,operator:n.addend!==0?(n.color===0?'base':'add'):n.multiplier!==1?'multiply':'none',value:n.addend!==0?n.addend:n.multiplier!==1?n.multiplier:null} as Card]:[];});}
 nativeInfo(ids:string[]):NativeCardInfo[]{const colors=['Gray','Green','Blue','Red','Yellow','Pink'] as const;return ids.flatMap(id=>{const c=getNativeCard(id);return c?[{id,category:c.category,color:colors[c.color],tier:c.tier}]:[];});}
 getContexts():Contexts {
  const w=this.world,t=tiers(this.state.reputationState),day=this.state.day,ctx:Contexts={...w.contexts,day,date:day,ChallengeMode:this.state.campaign==='challenge',week:Math.floor((day-1)/5)+1,balance:this.state.cash,visitors:w.visitors,displayedItems:this.state.stock.filter(i=>i.listing!==null&&!i.rented&&!i.auctioned).length,'Flower.type':w.flower.type,'Flower.life':w.flower.life,'Reputation.appraised':this.state.reputationState.expertnessRaw,'Reputation.trusted':this.state.reputationState.attractivenessRaw,'Reputation.recommended':this.state.reputationState.wittinessRaw,'Reputation.appraisedTier':t.expertness,'Reputation.trustedTier':t.attractiveness,'Reputation.recommendedTier':t.wittiness,'Repair.availableToday':!w.repair.used||w.repair.usedDay!==day,'Repair.boughtToday':w.repair.used&&w.repair.usedDay===day,'Rental.requirement':t.expertness+t.attractiveness>=8,'Rental.opened':Boolean(w.contexts['Rental.opened']),'Rental.requestCount':w.rentalRequests,'Rental.recentRatio':w.rentalRequests?w.rentalAccepted/w.rentalRequests:0,'Report.today':this.state.reportToday,'Report.week':w.reportWeek,'Report.total':w.reportTotal,itemBought:this.state.result==='bought',boughtItem:this.state.result==='bought',soldItem:this.state.result==='sold',customerGaveUp:w.contexts.nativeHaggleFinished?!!w.contexts.customerGaveUp:this.state.negotiation?.status==='left',playerGaveUp:w.contexts.nativeHaggleFinished?!!w.contexts.playerGaveUp:this.state.result==='declined',morning:w.contexts.morning??false,evening:w.contexts.evening??false,'Mechanic.private':this.state.privateUnlocked,'Mechanic.jewel':this.state.gemUnlocked};
  for(const [mechanic,tool] of Object.entries({integrity:'brush',material:'magnifier',signature:'sign',year:'year',screw:'screw',jewel:'jewel'}))ctx[`Mechanic.${mechanic}`]=ctx[`tool.${tool}`]??ctx[`Mechanic.${mechanic}`]??false;
  ['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach((d,i)=>ctx[d]=(day-1)%5===i);
  if(this.state.campaign==='story')for(const k of ['manual','integrity','material','signature','year','reputation'])ctx[`Mechanic.${k}`]??=true;
  for(const event of w.scheduler.played){ctx[`Event.${event}`]=true;ctx[event]??=true;}
  for(const i of this.state.stock){const id=i.definitionId??i.id;ctx[`Item.${id}.have`]=true;ctx[`Item.${id}.had`]=true;ctx[`Item.${id}.onDisplay`]=i.listing!==null&&!i.rented&&!i.auctioned;}
  for(const trade of this.state.trades){const def=this.state.stock.find(s=>s.id===trade.itemId)?.definitionId;if(def)ctx[`Item.${def}.had`]=true;}
  if(this.state.negotiation){ctx['Customer.Offers']=this.state.contextOffers.customer;ctx['Player.Offers']=this.state.contextOffers.player;ctx['Haggle.price']=this.state.negotiation.lastOffer??0;ctx['Customer.Estimate']=this.state.negotiation.publicValue;}
  return ctx;
 }
 getContext(key:string):string|number|boolean|undefined{return this.getContexts()[key];}
 setContext(key:string,value:string|number|boolean){
  const field:keyof ReputationState|null=key==='Reputation.appraised'?'expertnessRaw':key==='Reputation.trusted'?'attractivenessRaw':key==='Reputation.recommended'?'wittinessRaw':null;
  if(field){const bounds=field==='expertnessRaw'?[-15,375]:field==='attractivenessRaw'?[-100,100]:[0,25];this.state.reputationState[field]=Math.min(bounds[1],Math.max(bounds[0],Math.trunc(Number(value)||0)));this.refreshReputation();}
  else this.world.contexts[key]=value;
  if(key==='Mechanic.private'||key==='Mechanic.privateCard'||key==='Mechanic.privateInfoscreen')this.state.privateUnlocked=Boolean(value);
  if(key==='Mechanic.jewel'||key==='tool.jewel')this.state.gemUnlocked=Boolean(value);
  this.touch();
 }
 get storyView(){const s=this.world.story;return {eventId:s?.eventId??null,line:s?.line??this.state.dialogue,choices:s?.choices.map(({id,label})=>({id,label}))??[],waiting:s?.waiting?{name:s.waiting.GameplayEventToWait?.name??'',requirement:s.waiting.requirement??'',interactions:s.waiting.interactionsToAllow}:null,unsupported:s?.unsupported??[],stage:s?.stage??null};}
 signalStory(name:string,value?:string){const signal=value===undefined?name:`${name}:${value}`;if(!this.world.signals.includes(signal))this.world.signals.push(signal);}
 continueStory(){const story=this.world.story;if(!story){if(this.world.curation?.waitingLine){this.world.curation.waitingLine=false;this.pumpCuration();return true;}return false;}advanceStory(story,this.storyHost());this.syncStory();return true;}
 chooseStory(id:string){const story=this.world.story;if(!story||!story.choices.some(c=>c.id===id))return false;advanceStory(story,this.storyHost(),id);this.syncStory();return true;}
 runCallableChunk(id:string){return this.runCallableChunks([id]);}
 private runCallableChunks(ids:string[]){const e=NATIVE_CAMPAIGN.events[this.world.activeSourceEvent??getDemoCustomer(this.visit.id).eventId??''];if(!e)return false;const valid=ids.filter(id=>{if(e.chunks[id])return true;this.world.limitations.push(`Missing callable chunk ${e.id}.${id}`);return false;});if(!valid.length)return false;const s=createStory(e,'chunk',this.world.rng,valid[0]);s.queue=clone(valid.flatMap(id=>e.chunks[id]));s.instance=++this.state.sequence;s.returnPhase=this.state.phase;if(this.world.story)(this.world.suspendedStories??=[]).push(this.world.story);this.world.story=s;this.state.phase='narrative';this.continueStory();return true;}
 private consumeScriptEffects(){const n=this.state.negotiation;if(n?.native.script){this.state.contextOffers={player:n.native.context.filter(a=>a.type==='PlayerSuggestPrice').length,customer:n.native.context.filter(a=>a.type==='CustomerSuggestPrice').length};n.offers=this.state.contextOffers.player;n.customerOffers=this.state.contextOffers.customer;}if(!n?.native.scriptEffects?.length)return false;const {state,effects}=drainNativeScriptEffects(n);this.state.negotiation=state;return this.runCallableChunks(effects.map(e=>e.id));}
 private storyHost(){return {contexts:()=>this.getContexts(),set:(key:string,value:string|number|boolean)=>this.setContext(key,value),effect:(op:StoryOp,key:string)=>this.applyStoryEffect(op,`${this.encounter}:${key}${this.world.story?.instance?':'+this.world.story.instance:''}`),signal:(name:string,op:StoryOp)=>{if(op.isContextRequirement)return testCondition(op.requirement,this.getContexts());const signal=op.hasRequirement?`${name}:${op.requirement}`:name,index=this.world.signals.indexOf(signal);if(index>=0){this.world.signals.splice(index,1);return true;}const n=name.toLowerCase();return /stock.*open|inventory.*open/.test(n)?this.state.mode==='sales'||this.world.signals.includes('StockOpened'):/display|pricetag/.test(n)?this.world.signals.includes('ItemDisplayed'):/item.*bought|purchase.*end/.test(n)?this.state.result==='bought':false;}};}
 private syncStory(){const s=this.world.story;if(!s)return;this.world.rng=s.rng;this.state.dialogue=s.line;this.state.phase='narrative';this.touch();if(!s.done)return;this.world.story=null;
  if(s.stage==='chunk'){const suspended=this.world.suspendedStories?.pop();if(suspended){this.world.story=suspended;this.state.phase='narrative';this.state.dialogue=suspended.line;}else{this.state.phase=this.world.contexts.nativeHaggleFinished?'settled':(s.returnPhase as State['phase'])??'appraise';if(this.world.curation){if(this.world.contexts.nativeHaggleFinished){this.world.curation.stage='settled';this.world.curation.pending=[];}else this.pumpCuration();}}return;}
  const e=NATIVE_CAMPAIGN.events[s.eventId];if(this.world.contexts.nativeAbortCharacter){this.markNativePlayed(e);this.advanceNativeSchedule();return;}if(s.stage==='intro'&&e?.eventType>=4&&!this.world.contexts.nativeHaggleFinished&&!this.world.contexts.nativeCancelHaggle){this.world.curation=createCuration(e.id,e.eventType===4?'item':e.cardMode==='any'?'or':'and',e.eventType===4?e.acceptableItems:e.requiredCards,!!e.skipCurationHaggle);this.world.eventPhase='haggle';this.state.phase='appraise';this.state.mode='sales';this.state.dialogue='Choose an item to show the customer.';this.touch();return;}if(s.stage==='intro'&&!this.world.contexts.nativeHaggleFinished&&!this.world.contexts.nativeCancelHaggle&&e?.doHaggle&&((e.eventType===3&&this.world.activeItemDefinition)||(e.eventType>=4&&this.saleItem))){this.world.eventPhase='haggle';this.state.phase='appraise';if(!this.state.negotiation)this.createHaggle();return;}
  if(s.stage==='intro'){this.beginStory(e,'outro');return;}this.markNativePlayed(e);this.advanceNativeSchedule();
 }
 private beginStory(e:SourceEvent,stage:'intro'|'outro'){this.world.eventPhase=stage;this.world.signals=[];this.world.story=createStory(e,stage,this.world.rng);this.world.story.constructionCash=Number(this.world.contexts.nativeEventConstructionCash??this.state.cash);this.state.phase='narrative';this.continueStory();}
 private applyStoryEffect(op:StoryOp,key:string){
  if(this.state.performedEvents.includes(key))return;this.state.performedEvents.push(key);
  const target=(value:any)=>value?.name??null;const itemId=op.specifyItemByContext?String(this.getContext(op.ContextWithItemIDToStock??op.ContextWithItemIDToUnStock??op.ContextWithItemIDToLoad)??''):target(op.itemToStock??op.itemToSell??op.item)??this.world.activeItemDefinition;
  switch(op.type){
   case'AdjustBalanceEventData':{const amount=op.adjustMode===1?op.sourceAmount??Math.trunc(this.state.cash*op.percentage/100):Math.trunc(op.amount);if(!this.cashEvent(key,amount,'fee','Story balance adjustment'))this.world.limitations.push(`Unfunded story adjustment ${key}`);break;}
   case'ItemLoadEventData':if(itemId&&getNativeItem(itemId)){this.world.activeItemDefinition=itemId;this.state.activeNativeItem=createNativeItem(itemId,{instanceId:`active-${this.encounter}`,seed:this.world.rng});}break;
   case'ItemUnloadEventData':break;
   case'StockItemEventData':if(itemId)this.grantStock(itemId,Math.trunc(op.buyingPrice??0),key);break;
   case'UnstockItemEventData':{const item=this.state.stock.find(i=>i.definitionId===itemId);if(item&&this.cashEvent(key,Math.trunc(op.sellingPrice??0),'sale',item.title,item.id))this.state.stock=this.state.stock.filter(i=>i.id!==item.id);break;}
   case'CustomerAssertCardEventData':{const id=op.useStringID?op.cardID:target(op.card),card=this.cardsFromNative([id])[0];if(card){this.state.tags=this.state.tags.filter(c=>c.group!==card.group).concat(card);this.state.customerCards=clone(this.state.tags);if(this.state.negotiation){this.state.negotiation.publicValue=this.preciseValue();this.state.negotiation.native.customerCardIds=this.nativeIds(this.state.tags);}}break;}
   case'JournalEntryEventData':this.world.journal.push({id:op.ID,text:op.LocalizedJournalEntry??'',day:this.state.day});break;
   case'AddCalendarEntryEventData':this.world.calendar=this.world.calendar.filter(x=>x.id!==op.id).concat({id:op.id,text:op.content??op.displayName??'',start:op.startDate+(op.startDateIsRelative?this.state.day:0),interval:op.repeating?op.interval:0,end:op.hasEndDate?op.endDate+(op.endDateIsRelative?this.state.day:0):null,checked:false});break;
   case'CheckCalendarEventData':{const c=this.world.calendar.find(c=>c.id===op.id);if(c)c.checked=true;break;}
   case'RemoveCalendarEntries':this.world.calendar=this.world.calendar.filter(c=>c.id!==op.id);break;
   case'SetOnlyAssertableCard':this.world.contexts.onlyAssertableCard=target(op.card)??'';break;
   case'SetSpeciallyAllowedInteractions':this.world.contexts.allowedInteractions=op.interactionsToAllow;this.world.contexts.disallowedInteractions=op.interactionsToDisallow;break;
   case'ExecuteCommandData':{const command=Number(op.command??op.Command);if(command===0){this.world.story!.queue=[];this.world.contexts.nativeAbortCharacter=true;}else if(command===1){this.world.contexts.nativeCancelHaggle=true;}else if(command===5){this.world.contexts.nativeCharacterLeaves=false;}else if(command===2){this.state.tags=[];this.state.hidden=[];this.clearConversation();}else if(command===3){this.setContext('storeBrokenLevel',0);this.setContext('storeBrokenType',0);}else if(command===6)this.world.scheduler.cursor=this.world.scheduler.queue.length;break;}
   case'FinishCurationHaggleManually':this.world.contexts.nativeHaggleFinished=true;if(this.world.curation){this.world.curation.stage='settled';this.world.curation.pending=[];}this.state.result=op.sold?'sold':'declined';for(const [k,v] of Object.entries({'Curation.sold':!!op.sold,'Curation.soldPrice':Number(op.soldPrice),'Curation.playerGaveUp':!!op.playerGaveUp,playerGaveUp:!!op.playerGaveUp,'Curation.customerGaveUp':!!op.customerGaveUp,customerGaveUp:!!op.customerGaveUp}))this.setContext(k,v);break;
   case'FinishPurchaseHaggleManually':if(this.state.negotiation){this.state.negotiation.status=op.itemBought?'accepted':'left';this.state.negotiation.counter=null;this.state.counter=null;}this.world.contexts.nativeHaggleFinished=true;this.state.result=op.itemBought?'bought':'declined';this.setContext('customerGaveUp',!!op.customerGaveUp);this.setContext('playerGaveUp',!!op.playerGaveUp);break;
   case'TutorialEventData':this.world.contexts.tutorial=target(op.TutorialPrefab)??'';break;
   case'UnityEventData':{const calls=op.EventToPlay?.m_PersistentCalls?.m_Calls??[];for(const c of calls){const n=c.m_Target?.name??'',method=c.m_MethodName,args=c.m_Arguments??{};if(method==='Raise'){this.signalStory(n);if(n==='OnHaggleTutorialEnd')this.world.contexts['Prefs.canSkipHaggleTuto']=true;}else if(method==='RunCallableChunk')this.world.story?.queue.unshift(...(NATIVE_CAMPAIGN.events[this.world.activeSourceEvent??'']?.chunks[args.m_StringArgument]??[]));else if(method==='set_Value'){this.world.contexts[n]=c.m_Mode===6?!!args.m_BoolArgument:c.m_Mode===3?Number(args.m_IntArgument):c.m_Mode===4?Number(args.m_FloatArgument):String(args.m_StringArgument??'');}else this.world.limitations.push(`Unity callback pending: ${n}.${method}`);}break;}
   case'PlayCutsceneEvent':this.world.contexts.lastCutscene=op.cutsceneName??op.CutsceneName??'';if(/gameover|ending|demoend/i.test(String(this.world.contexts.lastCutscene))){this.state.failure=String(this.world.contexts.lastCutscene);this.world.scheduler.ended=true;}else this.world.limitations.push(`Cutscene presentation pending: ${this.world.contexts.lastCutscene}`);break;
   case'AddLoanOfferData':this.world.contexts[`LoanOffer.${op.id??op.ID??op.loanID}`]=true;break;
   default:this.world.limitations.push(`Unimplemented source operation: ${op.type}`);this.world.story?.unsupported.push(op.type);
  }
 }
 private grantStock(definitionId:string,paid:number,key:string){const def=getNativeItem(definitionId);if(!def)return false;const native=createNativeItem(definitionId,{instanceId:`item-${++this.state.sequence}`,seed:this.world.rng});if(paid&&!this.cashEvent(`${key}:purchase`,-paid,'purchase',def.name,native.instanceId))return false;const cards=this.cardsFromNative(native.cardIds),value=this.value(cards,this.state.profile.expertness);this.state.stock.unshift({id:native.instanceId,definitionId,title:def.name,paid,costKnown:true,value,listing:null,cards,nativeItem:native,acquiredDay:this.state.day,appraisal:{publicCards:clone(cards),hiddenCards:[],acquiredValue:value,acquiredDay:this.state.day}});this.world.contexts[`Item.${definitionId}.had`]=true;return true;}
 private appendNativeVisit(v:Visit){this.visits.push(v);this.state.generatedVisits??=[];this.state.generatedVisits.push(v);this.state.order.push(this.visits.length-1);this.loadVisit(this.state.order.length-1);}
 private beginNativeDay(day:number){if(day>3){this.finish();return;}this.state.day=day;this.state.dayOpeningCash=this.state.cash;this.state.reportToday=0;this.world.signals=[];for(const key of Object.keys(this.world.contexts))if(key.startsWith('Day.')||key.startsWith('Level.'))delete this.world.contexts[key];scheduleDay(this.world.scheduler,NATIVE_CAMPAIGN,day,Number(this.getContext('storeBrokenLevel')??0));for(const kv of NATIVE_CAMPAIGN.levels[`day0${day}`].startingContexts)this.setContext(kv.Key,evaluateExpression(kv.Value,this.getContexts()));this.advanceNativeSchedule();}
 private markNativePlayed(e?:SourceEvent){if(e&&!this.world.scheduler.played.includes(e.id))this.world.scheduler.played.push(e.id);this.world.activeSourceEvent=null;this.world.activeItemDefinition=null;this.world.curation=null;this.world.eventPhase='none';delete this.state.activeNativeItem;}
 private finishNativeEncounter(){if(this.world.rentalRequest&&['accepted','declined'].includes(this.world.rentalRequest.stage))this.world.rentalRequest=null;const e=NATIVE_CAMPAIGN.events[this.world.activeSourceEvent??''];if(e){this.beginStory(e,'outro');return;}this.advanceNativeSchedule();}
 private startSourceEvent(e:SourceEvent,triggered=false){if(!e.repeatable&&this.world.scheduler.played.includes(e.id)||!triggered&&e.condition&&!testCondition(e.condition,this.getContexts()))return false;
  this.world.curation=null;this.world.contexts.nativeEventConstructionCash=this.state.cash;this.world.contexts.nativeHaggleFinished=false;this.world.contexts.nativeCancelHaggle=false;this.world.contexts.nativeAbortCharacter=false;this.world.activeSourceEvent=e.id;this.world.activeItemDefinition=e.itemFromContext?String(this.getContext(e.itemFromContext)??''):e.item?.name??null;for(const kv of e.startingContexts)this.setContext(kv.Key,evaluateExpression(kv.Value,this.getContexts()));const definition=getNativeItem(this.world.activeItemDefinition??'');const cardIds=e.defaultCards;this.state.activeNativeItem=definition?createNativeItem(definition.id,{instanceId:`active-${++this.state.sequence}`,seed:this.world.rng}):undefined;
  const side:Side=e.eventType===3&&definition&&e.doHaggle?'buy':e.eventType>=4?'sell':'story';
  this.appendNativeVisit({id:`native-${e.id}-${++this.world.scheduler.serial}`,sourceEventId:e.id,sourceCharacterId:e.customer?.name,sourceCharacterRef:e.customer?.ref,definitionId:definition?.id,day:this.state.day,start:0,end:0,side,title:definition?.name??e.id,base:0,initial:this.cardsFromNative(cardIds),final:[],attractiveness:this.state.profile.attractiveness,price:null,estimate:null,personality:(['wishy-washy','active','cautious','emotional','fixie'] as const)[e.personality]??'active',dialogues:[]});this.beginStory(e,'intro');return true;
 }
 private advanceNativeSchedule(){let budget=600;const w=this.world;w.story=null;while(budget--){const token=w.scheduler.queue[w.scheduler.cursor++];if(!token){if(this.state.campaign==='demo'){this.state.phase='between';this.state.mode='shop';}else this.finish();return;}
   if(token==='@day-end'){this.state.phase='between';this.state.mode='shop';if(this.state.day===3)this.finish();this.touch();return;}
   if(token==='@purchase'){if(this.generateNativePurchase())return;continue;}
   if(token==='@sale'){if(this.generateNativeSale())return;continue;}
   if(token==='@rental'){if(this.considerRentalRequest())return;if(w.scheduler.cursor/w.scheduler.queue.length>.666)this.resolveRentals();continue;}
   if(token==='@rental-returns'){this.resolveRentals(true);continue;}
   if(token==='@report-end'){if(this.state.day>=11&&this.state.day%5===0&&w.reportWeek<=2)this.cashEvent(`no-report:${this.state.day}`,90+Math.floor(randomUnit(w)*10),'fee','Weekly no-report bonus');continue;}
   if(token==='@trigger'||token==='@trigger-last'){const e=triggeredEvent(w.scheduler,NATIVE_CAMPAIGN,this.getContexts());if(e){if(token==='@trigger-last')w.scheduler.cursor--;if(this.startSourceEvent(e,true))return;}else if(token==='@trigger-last'&&Object.entries(w.scheduler.countdowns).some(([id,count])=>count>0&&!w.scheduler.played.includes(id)&&count<NATIVE_CAMPAIGN.events[id].triggerCountdown))w.scheduler.cursor--;continue;}
   if(token==='@street'){w.challenge!.streetStops++;w.repair.used=false;w.auctionCount=0;this.state.mode='street';this.state.phase='settled';this.state.dialogue='Challenge street break. Manage repairs, flowers, or auctions, then continue.';this.touch();return;}
   if(token==='@challenge-day'){this.closeDay();this.state.day++;this.state.dayOpeningCash=this.state.cash;this.state.reportToday=0;continue;}
   if(token==='@challenge-end'){this.finishChallenge();return;}
   const event=NATIVE_CAMPAIGN.events[token];if(event&&this.startSourceEvent(event))return;
  }w.limitations.push('Scheduler execution budget exhausted.');this.state.phase='between';
 }
 get curationView(){const c=this.world.curation;return c?{stage:c.stage,eventId:c.eventId,selectedItemId:c.selectedItemId,counter:c.counter,waiting:!!this.world.story||!!c.waitingLine||c.pending.length>0,lineId:c.lastLineId??null}:null;}
 getCurationCandidates(){return this.world.curation?.stage==='select'?this.state.stock.filter(i=>i.nativeItem||getNativeItem(i.definitionId??i.id)).map(i=>({id:i.id,definitionId:i.definitionId??i.id,title:i.title,appraisedValue:i.value,listing:i.listing,rented:!!i.rented,auctioned:!!i.auctioned,locked:!!i.locked})):[];}
 private curationItem(item:Stock):CurationItem{const native=item.nativeItem??createNativeItem(item.definitionId??item.id,{randomizeJewelry:false}),t=tiers(this.state.reputationState);return {definitionId:native.definitionId,cardIds:native.cardIds,appraisalIds:this.nativeIds(item.cards),saleValue:nativeSaleValues({item:native,appraisalCardIds:this.nativeIds(item.cards),appraisedTier:t.expertness,recommendedTier:t.wittiness}).fairValue};}
 submitCurationItem(id:string){const c=this.world.curation,item=this.state.stock.find(i=>i.id===id);if(!c||c.stage!=='select'||c.pending.length||c.waitingLine||this.world.story||!item||!this.getCurationCandidates().some(i=>i.id===id))return false;c.selectedItemId=id;c.pending=curateNativeItem(c,this.curationItem(item));this.state.selectedStock=id;this.state.saleTargetId=id;this.state.activeNativeItem=item.nativeItem?clone(item.nativeItem):createNativeItem(item.definitionId??item.id,{randomizeJewelry:false});this.state.tags=clone(item.cards);this.state.customerCards=clone(item.cards);this.state.negotiation=null;this.pumpCuration();return true;}
 offerCurationPrice(amount:number){const c=this.world.curation,item=this.state.stock.find(i=>i.id===c?.selectedItemId);if(!c||c.stage!=='price'||c.pending.length||c.waitingLine||this.world.story||!item||!Number.isSafeInteger(amount)||amount<0)return false;this.state.quote=String(amount);c.pending=priceNativeCuration(c,this.curationItem(item),amount);this.pumpCuration();return true;}
 acceptCurationCounter(){const c=this.world.curation;if(!c||c.stage!=='counter'||c.counter===null||c.pending.length||c.waitingLine||this.world.story)return false;return this.settleCuration(c.counter);}
 declineCuration(){const c=this.world.curation;if(!c||c.stage==='settled'||c.pending.length||c.waitingLine||this.world.story)return false;this.finishCuration(false,true);return true;}
 private finishCuration(customer:boolean,player:boolean){const c=this.world.curation;if(!c)return;c.stage='settled';c.pending=[];c.waitingLine=false;Object.assign(this.world.contexts,{'Curation.sold':false,'Curation.playerGaveUp':player,playerGaveUp:player,'Curation.customerGaveUp':customer,customerGaveUp:customer,nativeHaggleFinished:true});Object.assign(this.state,{phase:'settled',result:'declined',counter:null,cashDelta:0,dialogue:'The transaction is over.'});this.touch();}
 private settleCuration(amount:number){const c=this.world.curation,item=this.state.stock.find(i=>i.id===c?.selectedItemId);if(!c||c.stage==='settled'||!item||!Number.isSafeInteger(amount)||amount<0)return false;if(!this.cashEvent(`curation:${this.encounter}`,amount,'sale',item.title,item.id))return false;this.state.trades.push({id:`curation:${this.encounter}`,day:this.state.day,itemId:item.id,title:item.title,side:'sell',price:amount,costBasis:item.costKnown===false?null:item.paid,appraisedValue:item.value,profit:item.costKnown===false?null:amount-item.paid});this.state.stock=this.state.stock.filter(i=>i.id!==item.id);Object.assign(this.world.contexts,curationSuccessContexts(c,item.definitionId??item.id),{'Curation.sold':true,'Curation.soldPrice':amount,'Curation.playerGaveUp':false,playerGaveUp:false,'Curation.customerGaveUp':false,customerGaveUp:false,nativeHaggleFinished:true});c.stage='settled';c.pending=[];c.waitingLine=false;Object.assign(this.state,{phase:'settled',result:'sold',counter:null,cashDelta:amount,dialogue:`Agreed. ${amount}U.`});this.touch();return true;}
 private pumpCuration(){const c=this.world.curation;if(!c||c.stage==='settled'||this.world.story||c.waitingLine)return;while(c.pending.length){const action=c.pending.shift()!;c.history.push(action);if(action.type==='say'){c.lastLineId=action.id;c.waitingLine=true;this.state.phase='narrative';this.state.dialogue=curationLine(action.id);this.touch();return;}if(action.type==='chunk'){if(this.runCallableChunk(action.id))return;continue;}if(action.type==='declineItem'){c.declines++;c.selectedItemId=null;c.stage='select';this.world.contexts['Curation.matched']=false;this.state.saleTargetId=null;this.state.selectedStock=null;}else if(action.type==='acceptItem'){c.stage='price';Object.assign(this.world.contexts,{'Curation.matched':true,'Curation.playerGaveUp':false,playerGaveUp:false,'Curation.customerGaveUp':false,customerGaveUp:false});if(c.skipHaggle){this.settleCuration(0);return;}}else if(action.type==='leave'||action.type==='declinePrice'){this.finishCuration(true,false);return;}else if(action.type==='suggestPrice'){c.counter=Math.trunc(action.price);this.state.counter=c.counter;c.stage='counter';}else if(action.type==='acceptPrice'){this.settleCuration(Math.trunc(action.price));return;}}
  this.state.phase=c.stage==='select'?'appraise':'offer';this.state.mode=c.stage==='select'?'sales':'shop';this.touch();
 }
 private generateNativePurchase(){
  const w=this.world,generated=Number(w.contexts.Gen_Haggle??0),challenge=this.state.campaign==='challenge',history=(w.generationHistory??[]).filter(r=>r.day+4>this.state.day),wrongRatio=history.length&&!history.some(r=>r.wrong===null)?history.filter(r=>r.wrong).length/history.length:NaN,[min,max]=generationDifficulty(this.state.day,w.contexts,challenge,wrongRatio);
  const candidates=NATIVE_CAMPAIGN.items.filter(i=>i.random).map(i=>getNativeItem(i.id)).filter(i=>i&&i.difficulty>=min&&i.difficulty<=max&&!w.contexts[`RandomItem.${i.id}.used`]).map(i=>{const instance=createNativeItem(i!.id,{seed:w.rng});w.rng=instance.rngState;const value=estimateNativeCards(instance.cardIds);return {id:i!.id,cardIds:instance.cardIds,price:Math.trunc(value),trueValue:value};});
  const choice={rng:w.generationChoiceRng??((this.state.seed^0x9e3779b9)>>>0)};let selection;try{selection=selectNativeGeneration({day:this.state.day,contexts:w.contexts,challenge,candidates,draw:()=>randomUnit(w),choose:()=>randomUnit(choice)});}catch(error){w.limitations.push(`Original item selector: ${String(error)}`);return false;}w.generationChoiceRng=choice.rng;Object.assign(w.contexts,selection.contexts);w.lastGeneration={branch:selection.branch,eligibleIds:selection.eligibleIds,target:selection.target};
  const def=getNativeItem(selection.candidate.id)!;w.contexts[`RandomItem.${def.id}.used`]=true;w.contexts.Gen_Haggle=generated+1;w.activeSourceEvent=null;w.activeItemDefinition=def.id;this.state.activeNativeItem=createNativeItem(def.id,{instanceId:`active-${++this.state.sequence}`,seed:w.rng});w.rng=this.state.activeNativeItem.rngState;
  const personalities:NegotiationPersonality[]=['active','wishy-washy','emotional'];const personality=personalities[Math.floor(randomUnit(w)*personalities.length)];this.appendNativeVisit({id:`generated-${++w.scheduler.serial}`,generated:true,sourceCharacterId:this.randomCustomerId(),definitionId:def.id,day:this.state.day,start:0,end:0,side:'buy',title:def.name,base:0,initial:[],final:[],attractiveness:this.state.profile.attractiveness,price:null,estimate:null,personality,dialogues:[{text:def.randomLine||'Would you buy this?'}]});if(w.challenge){w.challenge.purchaseAttempts++;w.contexts.CurrentPurchases=w.challenge.purchaseAttempts;}return true;
 }
 private generateNativeSale(){const w=this.world;this.updateVisitors();if(this.state.campaign==='challenge')w.visitors++;if(w.visitors<1||w.visitors<2&&randomUnit(w)<=.6)return false;const threshold=this.state.day===1?3:4,purchases=this.state.trades.filter(t=>t.day===this.state.day&&t.side==='buy').length;const stock=this.state.stock.filter(i=>this.isAvailable(i)&&i.listing!==null&&(purchases>=threshold||(i.acquiredDay??0)<this.state.day));if(!stock.length)return false;const item=stock[Math.floor(randomUnit(w)*stock.length)];w.visitors-=1;w.activeSourceEvent=null;w.activeItemDefinition=item.definitionId??null;this.state.activeNativeItem=item.nativeItem?clone(item.nativeItem):undefined;this.appendNativeVisit({id:`generated-sale-${++w.scheduler.serial}`,generated:true,sourceCharacterId:this.randomCustomerId(),definitionId:item.definitionId,day:this.state.day,start:0,end:0,side:'sell',title:item.title,base:0,initial:clone(item.cards),final:[],attractiveness:this.state.profile.attractiveness,price:null,estimate:null,personality:'active',dialogues:[{text:'How much for this item?'}]});if(w.challenge)w.challenge.saleAttempts++;return true;}
 private updateVisitors(){const stock=this.state.stock.filter(i=>this.isAvailable(i)&&i.listing!==null),gray=(i:Stock)=>this.nativeIds(i.cards).find(id=>getNativeCard(id)?.color===0),recommended=stock.find(i=>i.slot===14),t=tiers(this.state.reputationState);this.world.visitors+=visitorIncrement({day:this.state.day,displayCount:stock.length,distinctGray:new Set(stock.map(gray)).size,appraisedTier:t.expertness,recommendedTier:t.wittiness,sameGrayAsRecommended:recommended?stock.filter(i=>i!==recommended&&gray(i)===gray(recommended)).length:0,flowerType:this.world.flower.type,flowerLife:this.world.flower.life,brokenLevel:Number(this.getContext('storeBrokenLevel')??0),topReporter:!!this.getContext('Report.topReporter')});}
 private applyNativeOutcome(success:boolean){const key=`outcome:${this.encounter}`;if(!this.state.negotiation||this.state.performedEvents.includes(key))return;const effects=nativeHaggleOutcomeEffects(this.state.negotiation,success,this.getContexts());this.state.performedEvents.push(key);Object.assign(this.world.contexts,effects.contexts);this.world.visitors+=effects.visitorsDelta;}
 private afterNativeTrade(buy:boolean,amount:number,item:Stock){if(buy){const audit=auditAppraisal(item.nativeItem??item.definitionId??item.id,item.appraisal?.publicCards??item.cards,item.appraisal?.hiddenCards??[]);(this.world.generationHistory??=[]).push({day:this.state.day,itemId:item.id,wrong:audit.complete?!!(audit.knownWrong.length||audit.knownMissing.length):null});}if(buy&&this.state.negotiation)this.applyNativeOutcome(true);const c=this.world.challenge;if(c){if(buy){c.bought++;const trueValue=this.trueStockValue(item),audit=auditAppraisal(item.nativeItem??item.definitionId??item.id,item.appraisal?.publicCards??item.cards,item.appraisal?.hiddenCards??[]);if(audit.complete&&!audit.knownMissing.length&&!audit.knownWrong.length)c.correct++;if(amount/trueValue<=.7)c.goodBuy++;if(amount/trueValue<=1.4)c.goodSell++;}else{c.sold++;if(item.paid>0)c.soldMarginTotal=(c.soldMarginTotal??0)+(amount-item.paid)/item.paid;}}
  if(buy&&item.nativeItem&&this.world.flower.type===4&&this.world.flower.life>0){const conditions=item.nativeItem.cardIds.filter(id=>getNativeCard(id)?.category==='condition'),known=this.nativeIds(this.state.customerCards);if(conditions.length===1&&known.includes(conditions[0])){const changed=adamCondition(conditions[0],this.world);item.nativeItem.cardIds=item.nativeItem.cardIds.map(id=>id===conditions[0]?changed:id);item.cards=this.cardsFromNative([...this.nativeIds(item.cards).filter(id=>getNativeCard(id)?.category!=='condition'),changed]);item.value=this.value(item.cards,this.state.profile.expertness);}}
  this.world.contexts[`Item.${item.definitionId??item.id}.had`]=true;this.signalStory(buy?'ItemBought':'ItemSold');
 }
 private closeNativeDay(){const w=this.world;for(const domain of ['Hair','Clothes']){w.contexts[`${domain}.boughtToday`]=false;for(let i=0;i<Math.max(0,this.state.day+1-34);i++)w.contexts[`${domain}.${i}.available`]=true;}const hi=styleBoughtIndex(this.getContexts(),'Hair'),ci=styleBoughtIndex(this.getContexts(),'Clothes');if(hi===ci&&hi>0&&!w.contexts['Hair.boughtNew']&&!w.contexts['Clothes.boughtNew'])w.contexts.HairClothesOutOfSync=true;w.contexts.grayToday='[]';w.contexts.brandToday='[]';w.contexts.broke=isBroke(this.state.cash,this.inventoryTrueTotal);w.weeklyProfit+=this.state.trades.filter(t=>t.day===this.state.day).reduce((n,t)=>n+(t.profit??0),0);
  const hurt=!!w.contexts['Mechanic.Reputation.trusted']&&this.state.stock.some(i=>this.nativeIds(i.cards).includes('blue_reput_hurt1'));if(hurt)this.setContext('Reputation.trusted',this.state.reputationState.attractivenessRaw+3);
  for(const item of this.state.stock){if(item.nativeItem){item.nativeItem.cardIds=ageCardIds(item.nativeItem.cardIds,hurt);item.cards=this.cardsFromNative(ageCardIds(this.nativeIds(item.cards),hurt));item.value=this.value(item.cards,this.state.profile.expertness);}if(item.repairReadyDay&&item.repairReadyDay<=this.state.day+1){delete item.repairReadyDay;this.applyRepair(item);}}
  w.estates.push(Math.trunc(this.state.cash+this.inventoryTrueTotal)-this.state.loans.filter(l=>l.status==='active').reduce((n,l)=>n+l.principal,0));w.balances.push(this.state.cash);w.flower.life=Math.max(0,w.flower.life-1);this.state.plantDays=w.flower.life;flowerDisplay(w,this.state.day+1);Object.assign(w.contexts,tomorrowUmbrellaContext(this.state.day+1,w.contexts,()=>randomUnit(w)));w.repair={usedDay:this.state.day+1,used:false};
  if(w.contexts.payingRent&&Number(w.contexts['Home.type']??0)<1){const rent=housingRent(this.state.day+1);if(!this.cashEvent(`rent:${this.state.day}`,-rent,'fee','Housing rent')){w.contexts.failToPay=true;this.cashEvent(`rent-shortfall:${this.state.day}`,rent-this.state.cash,'fee','Source rent shortfall balance rule');}}
  if(this.state.day%5===0){for(const n of [1,2,3])w.contexts[`CityChat.${n}.bought`]=false;w.contexts['CityChat.bought.new']=false;w.contexts['Auction.numOpenings']=2;w.reportWeek=0;w.weeklyProfit=0;w.auctionCount=0;w.auctionWeek++;}
  if(w.estates.at(-1)!>=10000)w.contexts['Loan.capital.available']=true;if(w.estates.length>=6&&(w.estates.at(-1)!-w.estates.at(-6)!)/5>=300)w.contexts['Loan.central.available']=true;
 }
 private finishChallenge(){const c=this.world.challenge;if(!c||c.scored)return;c.remainingBeforeLiquidation=this.state.stock.length;for(const i of [...this.state.stock])if(!i.rented&&!i.auctioned){this.cashEvent(`challenge-liquidate:${i.id}`,Math.trunc(this.trueStockValue(i)*.5),'salvage','Challenge remaining stock',i.id);this.state.stock=this.state.stock.filter(x=>x.id!==i.id);}c.cashScore=this.state.cash;c.score=challengeScore(c);c.scored=true;this.finish();}
 flowerProducts(){return FLOWERS.map(p=>({...p,available:(this.world.flower.display.includes(p.type)||p.type===6&&this.getContext('Flower.hari.available')===true)&&!(this.world.flower.life>0&&this.world.flower.type===p.type)&&this.state.cash>=p.price}));}
 auctionQuote(id:string){const i=this.state.stock.find(i=>i.id===id);if(!i)return null;const week=Math.floor((this.state.day-1)/5)+1,fee=week<5?300:450,max=this.state.campaign==='challenge'?1:Number(this.getContext('Auction.maxPerWeek')??2);return {eligible:this.isAvailable(i)&&auctionEligibility(this.nativeIds(i.cards))&&this.world.auctionCount<max,fee,readyDay:this.state.day+2,remaining:Math.max(0,max-this.world.auctionCount),trueQualification:auctionEligibility(i.nativeItem?.cardIds??getItemFacts(i.definitionId??i.id)?.nativeCards?.map(c=>nativeCardById[c.id]?.nativeId??c.id)??[])};}
 submitAuction(id:string){if(this.state.campaign!=='challenge'&&this.state.day<18)return false;const i=this.state.stock.find(i=>i.id===id),q=this.auctionQuote(id);if(!i||!q?.eligible||this.state.cash<q.fee)return false;const result=auctionResult(this.trueStockValue(i),i.nativeItem?.cardIds??this.nativeIds(getItemFacts(i.definitionId??i.id)?.nativeCards??i.cards),Math.floor((this.state.day-1)/5)+1,this.world),auctionId=`auction:${id}:${++this.state.sequence}`;if(!this.cashEvent(auctionId,-q.fee,'fee','Auction entry',id))return false;i.auctioned=true;i.listing=null;i.slot=null;this.world.auctionCount++;this.world.auctions.push({id:auctionId,itemId:id,enteredDay:this.state.day,readyDay:q.readyDay,hammer:result.hammer,commission:result.commission,proceeds:result.proceeds,collected:false});this.touch();return true;}
 collectAuction(id:string){const r=this.world.auctions.find(r=>r.id===id||r.itemId===id);if(!r||r.collected||r.readyDay>this.state.day)return false;if(!this.cashEvent(`collect:${r.id}`,r.proceeds,'sale','Auction proceeds',r.itemId))return false;r.collected=true;this.state.stock=this.state.stock.filter(i=>i.id!==r.itemId);this.touch();return true;}
 get rentalRequestView(){const r=this.world.rentalRequest;return r?{id:r.id,itemId:r.itemId,title:r.title,days:r.days,stage:r.stage,counter:r.counter,tryPurchaseFirst:r.tryPurchaseFirst}:null;}
 private rentableStock(){const t=tiers(this.state.reputationState),p=rentalParameters(this.state.day,this.world.rentalFirstDay,this.world.rentalRequests,this.world.rentalAccepted);if(t.expertness+t.attractiveness<8||p.deactivated)return [];return this.state.stock.filter(i=>this.isAvailable(i)&&i.listing!==null&&i.listing>=p.minPrice&&this.nativeIds(i.cards).some(id=>['blue_perfect','blue_slightdmg','blue_fairlydmg'].includes(id)));}
 rentalOffers(){const r=this.world.rentalRequest;return r&&['offer','counter'].includes(r.stage)?[{itemId:r.itemId,title:r.title,days:r.days,fair:r.fair,min:r.min,max:r.max}]:[];}
 considerRentalRequest(){const w=this.world;if(w.rentalRequest||this.state.campaign==='challenge')return false;const t=tiers(this.state.reputationState);if(t.expertness+t.attractiveness<8)return false;const history=w.rentalDecisions??=[],recent=history.filter(x=>x.day>=this.state.day-4),p=rentalParameters(this.state.day,w.rentalFirstDay,recent.length,recent.filter(x=>x.accepted).length),overall=rentalParameters(this.state.day,w.rentalFirstDay,w.rentalRequests,w.rentalAccepted);if(overall.deactivated){w.contexts['Rental.deactivated']=true;return false;}if(overall.inactive)w.contexts['Rental.inactive']=true;if(Number(w.contexts['Level.rentalStartCustomers']??0)>=p.maximum)return false;const stock=this.rentableStock();if(!stock.length||randomUnit(w)>=p.probability)return false;const item=stock[Math.floor(randomUnit(w)*stock.length)],maxDays=this.state.day>=39?2:this.state.day>=38?3:4,days=2+Math.floor(randomUnit(w)*(maxDays-1));const q=rentalQuote(this.state.day,item.value,item.listing!,days)!;const tryPurchaseFirst=randomUnit(w)<.2||w.rentalRequests<3;w.rentalRequest={id:`rental-request-${++this.state.sequence}`,itemId:item.id,title:item.title,startDay:this.state.day,...q,realPrice:item.value,hope:rentalHopePrice(q.min,q.max,w),tryPurchaseFirst,stage:'offer',counter:null,offered:null,reportIsFair:false};w.contexts['Rental.opened']=true;w.contexts['Level.rentalStartCustomers']=Number(w.contexts['Level.rentalStartCustomers']??0)+1;w.rentalFirstDay??=this.state.day;w.activeSourceEvent=null;w.activeItemDefinition=item.definitionId??null;
  const line=tryPurchaseFirst?`How much is ${item.title}? ${item.listing}U? That's too expensive. Could I rent it for ${days} days instead?`:`Could I rent ${item.title} for ${days} days?`;this.appendNativeVisit({id:w.rentalRequest.id,generated:true,sourceCharacterId:this.randomCustomerId(),definitionId:item.definitionId,day:this.state.day,start:0,end:0,side:'story',title:item.title,base:0,initial:clone(item.cards),final:[],attractiveness:this.state.profile.attractiveness,price:null,estimate:null,dialogues:[{text:line}]});this.state.phase='appraise';this.state.mode='shop';this.state.dialogue=line;this.state.activeNativeItem=item.nativeItem;this.touch();return true;
 }
 offerRentalPrice(amount:number){const r=this.world.rentalRequest;if(!r)return false;const outcome=offerRental(r,amount,this.world);if(outcome.outcome==='invalid')return false;if(outcome.outcome==='accepted')return this.completeRental(amount);if(outcome.outcome==='counter'){this.state.counter=r.counter;this.state.dialogue=`Could we agree on ${r.counter}U for ${r.days} days?`;this.state.phase='offer';this.touch();return false;}this.declineRental();return false;}
 acceptRentalCounter(){const r=this.world.rentalRequest;return !!r&&r.stage==='counter'&&r.counter!==null&&this.completeRental(r.counter);}
 acceptRental(id:string,days:number,amount?:number){const r=this.world.rentalRequest;if(!r||r.itemId!==id||r.days!==days)return false;return r.stage==='counter'?this.acceptRentalCounter():this.offerRentalPrice(amount??r.fair);}
 private completeRental(price:number){const r=this.world.rentalRequest,i=r&&this.state.stock.find(i=>i.id===r.itemId);if(!r||!i||!this.isAvailable(i)||!Number.isSafeInteger(price)||price<0||r.stage==='declined')return false;if(!this.cashEvent(r.id,price,'fee','Rental income',i.id))return false;i.rented=true;i.rentedCount=(i.rentedCount??0)+1;r.stage='accepted';this.world.rentalRequests++;this.world.rentalAccepted++;this.world.rentalDecisions??=[];this.world.rentalDecisions.push({day:this.state.day,accepted:true});this.world.rentals.push({id:r.id,itemId:i.id,startDay:this.state.day,days:r.days,price,dueDay:this.state.day+r.days,status:'active',damage:0,compensation:0});Object.assign(this.state,{phase:'settled',counter:null,dialogue:`Thank you. I'll return it in ${r.days} days.`,cashDelta:price});this.touch();return true;}
 declineRental(){const r=this.world.rentalRequest;if(!r||r.stage==='accepted'||this.state.phase==='settled')return;r.stage='declined';this.world.rentalRequests++;this.world.rentalDecisions??=[];this.world.rentalDecisions.push({day:this.state.day,accepted:false});Object.assign(this.state,{phase:'settled',counter:null,result:'declined',dialogue:'Then I will look elsewhere.'});this.touch();}
 resolveRentals(force=false){for(const r of this.world.rentals.filter(r=>['active','delayed'].includes(r.status)&&r.dueDay<=this.state.day)){if(!force&&randomUnit(this.world)>=.5)continue;const i=this.state.stock.find(i=>i.id===r.itemId);if(!i)continue;if(r.status==='delayed'){r.status='lost';this.state.stock=this.state.stock.filter(s=>s.id!==i.id);continue;}Object.assign(r,rentalReturn(r,this.trueStockValue(i),this.nativeIds(i.cards).find(id=>getNativeCard(id)?.category==='condition')??'',this.world));if(r.status==='returned'){i.rented=false;const conditions=['blue_perfect','blue_slightdmg','blue_fairlydmg','blue_novalue'];if(i.nativeItem){const current=i.nativeItem.cardIds.find(id=>conditions.includes(id));if(current){const damage=(i.rentedCount??0)>=3||this.nativeIds(i.cards).includes('blue_junkpotential')?'blue_totallyWrecked':conditions[Math.min(3,conditions.indexOf(current)+r.damage)];i.nativeItem.cardIds=i.nativeItem.cardIds.map(id=>id===current?damage:id);i.cards=this.cardsFromNative(i.nativeItem.cardIds);i.value=this.value(i.cards,this.state.profile.expertness);}}}else if(r.status==='lost'){if(r.compensation)this.cashEvent(`loss:${r.id}`,r.compensation,'fee','Lost rental compensation',i.id);this.state.stock=this.state.stock.filter(s=>s.id!==i.id);}}this.touch();}
 isStreetStoreOpen(storeId:string){return streetStoreOpen(storeId,this.state.day,!!this.getContext('morning'),this.state.campaign==='challenge');}
 selectStreetRepairItems(ids:string[]){if(ids.length>2||ids.some(id=>!this.state.stock.some(i=>i.id===id)))return false;this.world.streetRepairIds=[...ids];const quotes=ids.map(id=>this.repairInfo(this.state.stock.find(i=>i.id===id)!));this.setContext('Repair.fixPrice',quotes.reduce((sum,q)=>sum+q.cost,0));for(let n=0;n<2;n++){const mode=quotes[n]?.mode;this.setContext(`Repair.item${n+1}.canRepairItem`,mode==='immediate');this.setContext(`Repair.item${n+1}.canFixCard`,mode==='card');this.setContext(`Repair.item${n+1}.canRepairOvernight`,mode==='overnight');}this.setContext('Repair.haveDone',quotes.some(q=>q.mode!=='overnight')||this.state.campaign==='challenge');this.setContext('Repair.havePickup',quotes.some(q=>q.mode==='overnight')&&this.state.campaign!=='challenge');return true;}
 selectStreetAuctionItem(id:string){if(!this.state.stock.some(i=>i.id===id))return false;this.world.streetAuctionId=id;return true;}
 getStreetPurchases(storeId?:string){return NATIVE_STREET_PURCHASES.filter(p=>!storeId||p.storeId===storeId).map(p=>{const n=streetProductNumber(p),ctx=this.getContexts(),domain=p.browse?.domain;let owned=domain?(n===0||testCondition(`${domain}.${n}.bought`,ctx)):p.storeId==='CityChat'?testCondition(`CityChat.${n}.bought`,ctx):p.storeId==='BestRoof'?Number(ctx['Home.type']??0)>=n:false,available=this.isStreetStoreOpen(p.storeId);if(domain&&n>=2)available&&=testCondition(`${domain}.${n}.available`,ctx);if(p.storeId==='BestRoof')available&&=!owned;if(p.storeId==='Scented')available&&=this.world.flower.display.includes(n)&&this.world.flower.type!==n;if(p.storeId==='RepairShop')available&&=!!this.world.streetRepairIds?.length&&this.world.streetRepairIds.every(id=>{const i=this.state.stock.find(i=>i.id===id);return !!i&&this.repairInfo(i).eligible;})&&(!this.world.repair.used||this.world.repair.usedDay!==this.state.day);if(p.storeId==='HiddenV')available&&=p.basePrice===(Math.floor((this.state.day-1)/5)+1<5?300:450)&&!!this.world.streetAuctionId&&!!this.auctionQuote(this.world.streetAuctionId)?.eligible;const price=owned?0:Math.trunc(p.priceContext?Number(ctx[p.priceContext]??0):p.basePrice);return {id:p.id,storeId:p.storeId,name:p.browse?.name??(p.storeId==='Scented'?FLOWERS[n-1]?.name:p.storeId==='BestRoof'?`Home ${n}`:p.storeId==='CityChat'?`Weekly information ${n}`:p.name),productNumber:n,price,priceContext:p.priceContext,owned,available,affordable:price<=this.state.cash,sourcePath:p.path};});}
 purchaseStreetProduct(id:string){const offer=this.getStreetPurchases().find(p=>p.id===id),product=NATIVE_STREET_PURCHASES.find(p=>p.id===id);if(!offer?.available||!offer.affordable||!product)return false;const key=`street-purchase:${id}:${++this.state.sequence}`,lines:string[]=[];let serial=0;this.setContext('browsingItem',offer.productNumber);const already=offer.owned;if(product.storeId==='RepairShop'){if(!this.repairMany(this.world.streetRepairIds??[]))return false;}else if(product.storeId==='HiddenV'){if(!this.world.streetAuctionId||!this.submitAuction(this.world.streetAuctionId))return false;}else if(!this.cashEvent(key,-offer.price,product.storeId==='Scented'?'flower':'fee',offer.name??id))return false;
  const callback=(method:string,num:number,_str:string)=>{if(method==='BuyFlower'){this.world.flower={...this.world.flower,type:num,life:3};this.state.plantDays=3;}else if(method==='MakeAuctionImmediate'){const record=this.world.auctions.at(-1);if(record)record.readyDay=this.state.day;}else if(method==='MakeNextSyncedAvailable'){const domain=product.browse?.domain;if(domain){const other=styleBoughtIndex(this.getContexts(),domain==='Hair'?'Clothes':'Hair'),same=testCondition(`${domain}.${other}.bought`,this.getContexts());this.setContext(`${domain}.${other+(same?1:0)}.available`,true);}}};
  executeStreetCallbacks(product.callbacks[already?'onAlreadyPurchased':'onPurchaseSuccess'],{contexts:()=>this.getContexts(),set:(k,v)=>this.setContext(k,v),cash:(amount,label)=>this.cashEvent(`${key}:effect:${serial++}`,amount,'fee',label),callback,line:t=>lines.push(t.replace(/-d[\d.]+-/g,'')),journal:(entry,text)=>this.world.journal.push({id:entry,text,day:this.state.day})});
  if(product.storeId==='HiddenV')this.world.contexts['Auction.numOpenings']=Math.max(0,(this.state.campaign==='challenge'?1:2)-this.world.auctionCount);this.world.streetPurchases??=[];if(!already)this.world.streetPurchases.push({id,storeId:product.storeId,day:this.state.day,price:offer.price,productNumber:offer.productNumber,alreadyOwned:already});this.world.lastStreetPurchase={id,lines};this.touch();return true;
 }
 streetServices(){return {flowers:this.flowerProducts(),repairAvailable:!this.world.repair.used||this.world.repair.usedDay!==this.state.day,repairMaximum:2,auctions:clone(this.world.auctions),rentals:clone(this.world.rentals),rentalOffers:this.rentalOffers(),journal:clone(this.world.journal),calendar:clone(this.world.calendar),limitations:[...new Set(this.world.limitations)]};}
 snapshot():State{return JSON.parse(JSON.stringify(this.state));}
 restore(input:unknown):{ok:true}|{ok:false;reason:string}{
  const previousVisits=this.visits;try{
   const s=input as State;if(s?.generatedVisits)this.visits=[...this.originalVisits,...clone(s.generatedVisits)];if(!s||s.campaign!=='story'&&s.campaign!=='challenge'&&s.campaign!=='demo'||!Array.isArray(s.order)||s.order.length<1||s.order.length>500||s.order.some(i=>!Number.isInteger(i)||!this.visits[i])||!Number.isInteger(s.visit)||!s.order[s.visit]&&s.order[s.visit]!==0)throw Error('Unknown scenario or visit.');
   if(!Array.isArray(s.cashbook)||!validateCashbook(s.openingCash,s.cash,s.cashbook))throw Error('Cash ledger does not balance.');
   if(!Array.isArray(s.stock)||new Set(s.stock.map(i=>i.id)).size!==s.stock.length)throw Error('Duplicate inventory instances.');
   const slots=s.stock.filter(i=>i.listing!==null&&i.slot!==null&&i.slot!==undefined).map(i=>i.slot);if(new Set(slots).size!==slots.length)throw Error('Duplicate display positions.');
   for(const i of s.stock)if(!Number.isSafeInteger(i.paid)||i.paid<0||!Number.isSafeInteger(i.value)||i.value<0||i.listing!==null&&(!Number.isSafeInteger(i.listing)||i.listing<0)||!Array.isArray(i.cards))throw Error('Invalid inventory.');
   for(const k of ['trades','summaries','closedDays','loans','tags','hidden','inspected','reportedVisitors','performedEvents','appraisalReviews'] as const)if(!Array.isArray(s[k]))throw Error(`Missing ${k}.`);
   const profile=rates(s.reputationState);if(!s.profile||Object.values(s.profile).some(v=>!Number.isFinite(v))||Object.keys(profile).some(k=>profile[k as keyof typeof profile]!==s.profile[k as keyof typeof profile]))throw Error('Invalid reputation.');
   if(s.negotiation){const n=s.negotiation;if(!['open','countered','accepted','left'].includes(n.status)||!['buy','sell'].includes(n.side)||!Array.isArray(n.history)||!Number.isFinite(n.elapsedSeconds)||n.elapsedSeconds<0||!Number.isSafeInteger(n.offers)||n.offers<0)throw Error('Invalid negotiation.');for(const k of ['publicValue','fairValue','initialPublicValue'] as const)if(!Number.isFinite(n[k])||n[k]<0)throw Error('Invalid negotiation value.');for(const k of ['counter','acceptedAmount'] as const)if(n[k]!==null&&(!Number.isSafeInteger(n[k])||n[k]!<0))throw Error('Invalid negotiation price.');}
   if(!Number.isSafeInteger(s.sequence)||s.sequence<0||!Number.isFinite(s.day)||!s.profile)throw Error('Invalid session fields.');
   const restored=clone(s);restored.saleTargetId??=this.visits[s.order[s.visit]].side==='sell'?s.selectedStock:null;restored.world??=createWorld(s.seed,s.day);restored.customerCards??=clone(s.tags);restored.storyContext??=null;restored.contextOffers??={player:s.offers,customer:s.negotiation?.history.filter(h=>h.counter!==null).length??0};
   this.state=restored;this.touch();return {ok:true};
  }catch(error){this.visits=previousVisits;return {ok:false,reason:error instanceof Error?error.message:'Invalid session.'};}
 }
 reset(){this.start();}
}
