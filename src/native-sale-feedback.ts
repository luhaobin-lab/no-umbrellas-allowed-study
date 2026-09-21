import {sortNativeCards,isTrueCard,resolveNativeItem,getNativeCard,refineNativeCards,combineNativeCards} from './native-rules';
import type {NativeItemQuery} from './native-types';
import {SALE_FEEDBACK_RULES} from './native-sale-feedback-rules';
export interface NativeAppraisalIssue {kind:'missing'|'wrong-card'|'wrong-category';category:string;expected?:string;actual?:string}
export interface NativeSaleFeedbackInput {item:NativeItemQuery;appraisalCardIds:readonly string[];evaluated:boolean;buyingPrice:number;listingPrice:number}
const recycle=new Set(['green_paper1','green_glass1','green_aluminum1','green_basemetal1','green_surgical1','green_stainlesssteel1','green_silver1','green_plastic1']);
/** Original evaluation compares each category's highest true tier with the first sorted appraisal. */
export function nativeAppraisalIssues(query:NativeItemQuery,appraisal:readonly string[]):NativeAppraisalIssue[]{
 const item=resolveNativeItem(query),truth=sortNativeCards(item.cardIds),proposed=sortNativeCards(appraisal),categories=[...new Set([...truth,...proposed].map(c=>c.category))],issues:NativeAppraisalIssue[]=[];
 for(const category of categories){if(['trusted','appraised','recommended','repair'].includes(category))continue;const real=truth.filter(c=>c.category===category),card=proposed.find(c=>c.category===category),highest=real.reduce<typeof real[number]|undefined>((a,c)=>!a||c.tier>a.tier?c:a,undefined);
  if(!highest){if(card)issues.push({kind:'wrong-category',category,actual:card.id});continue;}
  if(!card){issues.push({kind:'missing',category,expected:highest.id});continue;}
  if(!isTrueCard(item,card))issues.push({kind:'wrong-card',category,expected:highest.id,actual:card.id});
 }return issues;
}
export function evaluateNativeSaleFeedback(input:NativeSaleFeedbackInput){
 const item=resolveNativeItem(input.item),issues=nativeAppraisalIssues(item,input.appraisalCardIds);
 let mandatoryFeedback:{accept:boolean;branch:string}|null=null;
 if(!input.evaluated)for(const rule of SALE_FEEDBACK_RULES){const [category,id]=rule.args as readonly string[];
  const match=(kind:NativeAppraisalIssue['kind'],field?:'actual'|'expected')=>issues.some(i=>i.kind===kind&&i.category===category&&(!field||i[field]===id));
  const matched=rule.predicate==='hasFakeHalfWrongAppraisal'?issues.some(i=>i.kind==='wrong-card'&&i.category==='brand'&&i.expected==='green_fakeBrand'):
   rule.predicate==='hasFakeWrongAppraisal'?issues.some(i=>i.kind==='wrong-card'&&i.category==='brand'&&i.expected!=='green_fakeBrand'&&i.expected?.includes('fakeBrand')):
   rule.predicate==='missedRecyclable'?item.cardIds.some(id=>recycle.has(id))&&!input.appraisalCardIds.some(id=>recycle.has(id)):
   rule.predicate==='hasMissingCategory'?match('missing'):
   rule.predicate==='hasMissingCategoryAs'?match('missing','expected'):
   rule.predicate==='hasWrongCategory'?match('wrong-category'):
   rule.predicate==='hasWrongCategoryAs'?match('wrong-category','actual'):
   rule.predicate==='hasWrongCard'?match('wrong-card'):
   rule.predicate==='hasWrongCardShould'?match('wrong-card','expected'):match('wrong-card','actual');
  if(matched){let branch:string=rule.branch;if(rule.predicate==='missedRecyclable'){const material=item.cardIds.find(id=>getNativeCard(id)?.category==='material');if(material)branch+='#Card.'+material+'.name';}mandatoryFeedback={accept:false,branch};break;}
 }
 const actual=sortNativeCards(item.cardIds).find(c=>c.category==='condition')?.id,stated=sortNativeCards(input.appraisalCardIds).find(c=>c.category==='condition')?.id;
 // The original misspells blue_fairydmg in this branch; preserving it is deliberate.
 const suspicious=actual==='blue_slightdmg'&&stated==='blue_perfect'||actual==='blue_fairlydmg'&&stated==='blue_slightdmg'||actual==='blue_novalue'&&stated==='blue_fairydmg';
 const conditionFeedback=suspicious&&(input.listingPrice-input.buyingPrice)/input.buyingPrice<=.5?{accept:true,branch:stated==='blue_perfect'?'SuspiciousPerfect':stated==='blue_slightdmg'?'SuspiciousSlightDmg':'SuspiciousFairlyDmg'}:null;
 return {mandatoryFeedback,conditionFeedback,issues,totallyWrecked:item.cardIds.includes('blue_totallyWrecked')};
}

/** Haggle correctness includes the source's deliberate reference/certificate exceptions. */
export function isNativeHaggleCardTrue(query:NativeItemQuery,cardId:string,customerCardIds:readonly string[]){
 const item=resolveNativeItem(query),id=cardId.replace(/^(green_(?:cubic|amethyst|garnet|topaz|pearl|quartz))_cert$/,'$1');
 return item.referenceCardIds.includes(id)&&!customerCardIds.some(id=>id.includes('fakeBrand'))||isTrueCard(item,cardId)||id.includes('green_jewel_');
}
export function nativeNegotiationFacts(query:NativeItemQuery,customerCardIds:readonly string[],playerCardIds:readonly string[]=[]){
 const item=resolveNativeItem(query),combined=combineNativeCards(customerCardIds,playerCardIds).map(c=>c.id),issues=nativeAppraisalIssues(item,combined),count=refineNativeCards(item.cardIds).length;
 if(count===0)throw new RangeError('Original negotiation cannot create an item with zero true cards.');
 return {actualFake:item.cardIds.some(id=>id.includes('fakeBrand')),appraiseProportion:customerCardIds.filter(id=>item.cardIds.includes(id)).length/count,missingCategories:issues.filter(i=>i.kind==='missing').length,nonCorrectCategories:issues.length,hasUnappraisedPositiveCard:issues.some(i=>{const c=i.expected?getNativeCard(i.expected):undefined;return c&&c.color!==5&&100*c.multiplier+c.addend>100;})};
}
