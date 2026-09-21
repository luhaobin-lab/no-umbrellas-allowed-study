import {DEMO_CARDS,type DemoCard} from './demo-item-data';
import {recommendationScore,RECOMMENDED_BRAND_TIERS,type RecommendationFacts} from './reputation';

export interface DemoRecommendationOptions {
  /** Original item instance/definition ID, required unless pickedUp is explicit. */
  itemId?: string;
  pickedUp?: boolean;
  repaired?: boolean;
  /** Unrounded true value, only when independently computed from true cards. */
  trueValue?: number;
}

export interface DemoRecommendationAnalysis {
  score: number | null;
  facts: RecommendationFacts | null;
  reason: 'known' | 'unknown-card' | 'unknown-value' | 'missing-item-origin';
  unknownIds: string[];
}

function apply(card: DemoCard, amount: number): number | null {
  if(card.value===null||!Number.isFinite(card.value))return null;
  switch(card.operator){
    case 'base': return card.value;
    case 'add': return amount+card.value;
    case 'percent': return amount*(1+card.value/100);
    case 'multiply': return amount*card.value;
    case 'none': return amount;
  }
}

function colorOrder(card: DemoCard): number {
  const prefix=card.nativeId.split('_')[0];
  return ({gray:0,green:1,blue:2,red:3,yellow:4,pink:5} as Record<string,number>)[prefix]??6;
}

/** Highest tier per original category; last card wins an equal-tier collision. */
function refine(cards: readonly DemoCard[]): DemoCard[] {
  const category=new Map<string,DemoCard>();
  for(const card of cards){const previous=category.get(card.category);if(!previous||card.tier>=previous.tier)category.set(card.category,card);}
  return [...category.values()].sort((a,b)=>colorOrder(a)-colorOrder(b)||(a.category<b.category?-1:a.category>b.category?1:0));
}

export function analyzeDemoRecommendation(input: readonly (DemoCard|string)[], options: DemoRecommendationOptions={}): DemoRecommendationAnalysis {
  const unknownIds:string[]=[];
  let cards:DemoCard[]=[];
  for(const entry of input){
    if(typeof entry==='string'){
      const card=DEMO_CARDS[entry];
      if(card)cards.push(card);else unknownIds.push(entry);
    }else if(entry&&typeof entry.nativeId==='string'&&typeof entry.category==='string'&&Number.isInteger(entry.tier)) cards.push(entry);
    else unknownIds.push(String((entry as {id?:string})?.id??'invalid card'));
  }
  if(unknownIds.length)return {score:null,facts:null,reason:'unknown-card',unknownIds};
  if(options.pickedUp===undefined&&options.itemId===undefined)return {score:null,facts:null,reason:'missing-item-origin',unknownIds:[]};
  if(options.repaired){
    const condition=DEMO_CARDS.blue_slightdmg;
    const marker=DEMO_CARDS.blue_repaired;
    if(!condition||!marker)return {score:null,facts:null,reason:'unknown-card',unknownIds:['blue_slightdmg','blue_repaired'].filter(id=>!DEMO_CARDS[id])};
    cards=[...cards.filter(card=>card.category!=='condition'&&card.nativeId!=='blue_repaired'),condition,marker];
  }
  const refined=refine(cards);
  let trueValue=options.trueValue??0;
  if(options.trueValue===undefined){
    for(const card of refined){const result=apply(card,trueValue);if(result===null)return {score:null,facts:null,reason:'unknown-value',unknownIds:[card.nativeId]};trueValue=result;}
    trueValue=cards.length?Math.max(1,trueValue):0;
  }
  if(!Number.isFinite(trueValue)||trueValue<0)return {score:null,facts:null,reason:'unknown-value',unknownIds:[]};
  const popularity=refined.find(card=>card.category==='popularity');
  const figure=refined.find(card=>card.category==='figure');
  const popEffect=popularity?apply(popularity,100):100;
  const figureEffect=figure?apply(figure,100):100;
  if(popEffect===null||figureEffect===null)return {score:null,facts:null,reason:'unknown-value',unknownIds:[...(popEffect===null?[popularity!.nativeId]:[]),...(figureEffect===null?[figure!.nativeId]:[])]};
  const ids=cards.map(card=>card.nativeId);
  const brands=cards.filter(card=>card.category==='brand').map(card=>card.nativeId);
  const hasBrand=(tier:'AA'|'A')=>brands.some(id=>RECOMMENDED_BRAND_TIERS[tier].some(brand=>id.includes(brand)));
  const facts:RecommendationFacts={
    trueValue,
    popularity:popularity?.nativeId==='blue_pop_all'?'all':popEffect>100?'positive':popEffect<100?'negative':'neutral',
    figure:figure?.nativeId==='blue_greatgreat'?'world-historic':figureEffect>100?'positive':'other',
    brandTier:hasBrand('AA')?'AA':hasBrand('A')?'A':'other',
    limited:ids.includes('blue_limited'),
    historical:ids.includes('blue_archae')||ids.includes('blue_nationalhis'),
    fake:ids.some(id=>id.includes('fakeBrand')),
    repaired:options.repaired===true||ids.includes('blue_repaired'),
    pickedUp:options.pickedUp??options.itemId!.endsWith('_t'),
  };
  return {score:recommendationScore(facts),facts,reason:'known',unknownIds:[]};
}

/** Native IDs are exact keys; translated labels and fuzzy names are never parsed. */
export function scoreFromDemoCards(input: readonly (DemoCard|string)[], options: DemoRecommendationOptions={}): number | null {
  return analyzeDemoRecommendation(input,options).score;
}
