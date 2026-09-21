import type { NativeModifier, NativeNegotiationInput, NativeNegotiationState, NativePersonality } from './native-negotiation-types';
import { nativeRandom } from './native-random';
import { getNativeCard,refineNativeCards,sortNativeCards } from './native-rules';
export const NATIVE_MODIFIER_CANDIDATES: readonly NativeModifier[] = ['AddedCustomerToday','AddedCustomerTomorrow','DeceivingAsBusy','Rain','Busy','Easy','FrightenedReported','ConfusedReported','AngryReported','FrustratedReported','Enthusiast','Junuk','SingSing','DarcyFriend'];
const CHALLENGE: readonly NativeModifier[]=['DeceivingAsBusy','Busy','FrightenedReported','ConfusedReported','Easy','Enthusiast'];
export const nativeFamily=(p:NativePersonality)=>p==='Active'||p==='Emotional'?'Active':p==='Fixie'?'Fixie':'WishyWashy';
export function nativePersonality(alias:string):NativePersonality {return alias==='fixie'?'Fixie':alias==='cautious'?'Cautious':alias==='emotional'?'Emotional':alias==='wishy-washy'?'WishyWashy':'Active';}
/** Candidate eligibility is not the final occurrence probability. Source randomly orders successful candidates. */
export function selectNativeModifier(input:NativeNegotiationInput,personality:NativePersonality,fairValue:number,seed:number){
 const random=nativeRandom(seed),unknown:string[]=[],g=input.globals??{},eligible:NativeModifier[]=[];
 const numeric=(k:string)=>Number(g[k]??0),flag=(k:string)=>String(g[k]??'').toLowerCase()==='true';
 const requires=(name:string,value:unknown)=>{if(value===undefined||value===null){if(!unknown.includes(name))unknown.push(name);return false;}return true;};
 if(personality!=='Fixie')for(const m of input.challenge?CHALLENGE:NATIVE_MODIFIER_CANDIDATES){
  let yes=false;const grade=1+Math.trunc(numeric('AzikScore')/10),reported=(input.day??-1)>=11;
  const reportProb=flag('Report.topReporter')?.97:numeric('Report.week')<=2?.9:.95;
  switch(m){
   case 'AddedCustomerToday':yes=g.addCustomerToday1!==undefined&&numeric('Gen_Haggle')+1===numeric('addCustomerToday1');break;
   case 'AddedCustomerTomorrow':yes=g.addCustomerTomorrow1!==undefined&&numeric('Gen_Haggle')+1===numeric('addCustomerTomorrow1');break;
   case 'DeceivingAsBusy':yes=requires('actualFake',input.actualFake)&&input.actualFake===true&&random.next()>.9;break;
   case 'Rain':break; // The original router marks this candidate unimplemented.
   case 'Busy':yes=nativeFamily(personality)==='Active'&&requires('actualFake',input.actualFake)&&input.actualFake===false&&random.next()>.9;break;
   case 'Easy':yes=requires('appraiseProportion',input.appraiseProportion)&&(input.appraiseProportion??0)>.7&&nativeFamily(personality)==='Active';break;
   case 'FrightenedReported':yes=reported&&requires('actualFake',input.actualFake)&&input.actualFake===false&&random.next()>reportProb;break;
   case 'ConfusedReported':yes=reported&&requires('actualFake',input.actualFake)&&input.actualFake===false&&random.next()>reportProb*.9;break;
   case 'AngryReported':yes=reported&&random.next()>reportProb*.9*.9;break;
   case 'FrustratedReported':yes=reported&&random.next()>reportProb*.9*.9*.9;break;
   case 'Enthusiast':if(requires('nonCorrectCategories',input.nonCorrectCategories)){yes=random.next()>.9&&input.nonCorrectCategories!<=2;if(!yes)yes=random.next()>.6&&input.nonCorrectCategories!<=3;}break;
   case 'Junuk':if(random.next()>.8)yes=grade===1||(grade>=2&&grade<=4&&random.next()>(grade-1)*.25);break;
   case 'SingSing':if(requires('hasUnappraisedPositiveCard',input.hasUnappraisedPositiveCard)&&input.hasUnappraisedPositiveCard&&fairValue>=500&&random.next()>.5)yes=grade===5||(grade>=2&&grade<=4&&random.next()>(5-grade)*.25);break;
   case 'DarcyFriend':yes=reported&&random.next()>.95;break;
  }
  if(yes)eligible.push(m);
 }
 const selected=eligible.map(modifier=>({modifier,key:random.next()})).sort((a,b)=>a.key-b.key)[0]?.modifier??null;
 return{selected,applied:selected==='DarcyFriend'||selected==='Rain'?null:selected,eligible,rngState:random.state,unknownFacts:unknown};
}
export function createNativeContext(input:NativeNegotiationInput,alias:string,publicValue:number,fairValue:number,seed:number,flower:number){
 const personality=input.personality??nativePersonality(alias),family=nativeFamily(personality);let selected:NativeModifier|null=input.modifier!==undefined?input.modifier:(alias==='hurried'?'Busy':alias==='scared'?'FrightenedReported':alias==='fearless'?'FrustratedReported':null),unknown:string[]=[];
 if(input.autoSelectModifier){const selection=selectNativeModifier(input,personality,fairValue,seed);seed=selection.rngState;selected=selection.selected;unknown=selection.unknownFacts;}
 const modifier=selected==='Rain'||selected==='DarcyFriend'?null:selected,random=nativeRandom(seed);
 const feel=family==='Active'&&(input.feelSorry??(random.next()<=.5));
 const pricePipes=family==='Fixie'?['Fixie.RepeatedSuggest','Fixie.Stopper']:family==='Active'?['Minus','Cheap','Active.RepeatedSuggests','Active.OnChangedGuideline','Active.InitialSuggest','PlayerCurtail','Active.PlayerInsists','Active.CompromisedSuggest','CounterSuggest','General.Stopper']:['Minus','Cheap','Wishy.RepeatedSuggests','Wishy.InitialSuggest','Wishy.OnHesitate','PlayerCurtail','Wishy.PlayerInsists','Wishy.CompromisedSuggest','CounterSuggest','Wishy.PlayerResuggest','General.Stopper'];
 if(feel&&modifier!=='Busy'&&modifier!=='DeceivingAsBusy')pricePipes.unshift('Active.FeelSorry');
 if(modifier==='Busy')pricePipes[pricePipes.indexOf('Active.RepeatedSuggests')]='Busy.RepeatedSuggests';
 if(modifier==='FrightenedReported')pricePipes.unshift('Frightened.High','Frightened.Higher','Frightened.Lower');
 if(modifier==='FrustratedReported')pricePipes.unshift('Frustrated.Price');
 if(modifier==='ConfusedReported')pricePipes.unshift('Confused.Price');
 if(modifier==='AngryReported')pricePipes.unshift('Angry.Price');
 if(modifier==='SingSing')pricePipes.unshift('SingSing.Initial');
 let counter=input.initialCounter??null;
 if(counter===null){if(modifier==='Busy')counter=Math.floor(publicValue*(.7+random.next()/3));else if(modifier==='Easy')counter=Math.floor(publicValue*(.7+random.next()/5));else if(modifier==='DeceivingAsBusy'||modifier==='AngryReported')counter=Math.floor(publicValue*.7);else if(modifier==='FrightenedReported')counter=Math.floor(publicValue*.6);}
 const cardPipes=family==='Fixie'?['Fixie.Blue','Fixie.Red','Fixie.Green','Fixie.Stopper']:['RepeatedFalseCards','DiscussedCard','DiscussedCategory','ExactCard',...(input.globals?.openRedCard!==undefined?['Red.Once','Red.AvacTarget','Red.ShopBalance','Red.ShopPlenty','Red.Last','Red.Report']:[]),'Fake','Rare','Popularity','Condition','FigureJewel','Figure','Jewel','General.Stopper'];
 if(['Enthusiast','FrightenedReported','AngryReported','FrustratedReported'].includes(modifier??''))cardPipes.unshift(modifier+'.Card');
 if(modifier==='Busy'||modifier==='DeceivingAsBusy')cardPipes.splice(3,0,...(modifier==='Busy'?['Busy.HighImpact']:[]),'Busy.LowImpact');
 const native:NativeNegotiationState={personality,entryPoint:input.entryPoint??'controller',family,modifier,selectedModifier:selected,context:[{type:'PriceStamp',amount:publicValue,tick:0}],pricePipes,cardPipes,globals:{...input.globals},day:input.day??null,actualFake:input.actualFake??null,itemCondition:input.itemCondition??null,shopBalance:input.shopBalance??null,sameTypeStockValues:input.sameTypeStockValues??null,redCardRolls:input.redCardRolls??null,missingCategories:input.missingCategories??null,nonCorrectCategories:input.nonCorrectCategories??null,customerCardIds:[...input.customerCardIds??[]],playerCardIds:[...input.playerCardIds??[]],trueCardIds:[...input.trueCardIds??[]],referenceCardIds:[...input.referenceCardIds??[]],priceHookActive:input.priceHookActive===true||modifier==='SingSing'||modifier==='Enthusiast',cardHookActive:input.cardHookActive??false,normalIdle:input.normalIdle!==false,pending:null,ticks:0,tickRemainder:0,hideCount:1,warningUsed:false,confusedPrevious:null,sourceBranch:'createHaggle',unknownFacts:unknown,nagMode:(['nagging','et','by-time','up-down'] as const)[Math.floor(random.next()*4)],originalFairValue:fairValue};
 if(counter!==null)native.context.unshift({type:'CustomerSuggestPrice',amount:counter,tick:0});
 // Source CreateHaggle.createCustomerFromIdList sorts then refines initial beliefs.
 // In particular only the final same-tier yellow-category assumption survives.
 if(native.customerCardIds.length&&native.customerCardIds.every(id=>getNativeCard(id)))native.customerCardIds=refineNativeCards(sortNativeCards(native.customerCardIds)).map(c=>c.id);
 return {native,counter,rngState:random.state,flower};
}
