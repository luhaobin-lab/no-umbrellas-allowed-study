/** Windows 1.0.5 GenerativeCustomer / Challenge selector. Candidate prices are C# int valuations.
 * Guid.NewGuid chooses uniformly independently of GeneralUtils.rnd; the caller supplies separate streams. */
import {getNativeCard,estimateNativeCards} from './native-rules';
import type {Contexts} from './native-scheduler';
export interface GenerationCandidate {id:string;cardIds:string[];price:number;trueValue?:number}
export type GenerationBranch='normal'|'umbrella'|'expensive'|'fake'|'challenge';
export interface GenerationSelection {candidate:GenerationCandidate;branch:GenerationBranch;contexts:Contexts;eligibleIds:string[];target:number|null;scores:{id:string;score:number}[]}
export function generationList(value:unknown):string[]{if(typeof value!=='string'||!value)return [];try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed.filter((x):x is string=>typeof x==='string');}catch{/* Legacy browser saves used pipe-separated lists. */}if(value.trim().startsWith('[')){return (value.match(/"(?:[^"\\]|\\.)*"/g)??[]).map(x=>JSON.parse(x));}return value.split('|').filter(Boolean);}
const GOOD_FIGURES=['blue_nationalhero','blue_wellknown','blue_activist','blue_artist','blue_athlete','blue_journalist'];
const BAD_FIGURES=['blue_criminal','blue_politician','blue_businessman','blue_scholar'];
export function isNativeFake(ids:readonly string[]){return ids.some(id=>id.includes('fakeBrand'));}
export function isNativeTrulyValuable(ids:readonly string[]){return ids.some(id=>['blue_archae','blue_nationalhis','blue_greatgreat'].includes(id))||ids.some(id=>getNativeCard(id)?.category==='figure')&&!ids.includes('blue_fakesign')&&!ids.includes('blue_jewelry');}
/** Preserve the source's blue_national spelling and all four unconditional multiplier draws. */
export function nativeHammerValue(value:number,ids:readonly string[],draw:()=>number){if(draw()>=.95)return {value,band:'low' as const};const archaeology=draw(),national=draw(),bad=draw(),good=draw()*.6;let hammer=value;if(ids.includes('blue_archae'))hammer*=2+archaeology;if(ids.includes('blue_national'))hammer*=1.5+national;if(BAD_FIGURES.some(id=>ids.includes(id)))hammer*=.75+bad/2;if(GOOD_FIGURES.some(id=>ids.includes(id)))hammer*=1+good;else if(ids.includes('blue_greatgreat'))hammer*=2+good*2;return draw()<.9?{value:hammer,band:'normal' as const}:{value:hammer*5,band:'high' as const};}
export function generationScore(target:number,candidate:GenerationCandidate,hammer:number){return Math.abs(Math.trunc(target)-(isNativeTrulyValuable(candidate.cardIds)?Math.trunc((Math.trunc(hammer)+candidate.price)/2):candidate.price));}
export function generationTarget(generated:number,challenge=false):number{if(!challenge)return generated<80?generated*generated*7.2:generated*generated*6.2+6400;let total=50;for(let i=1;i<=generated;i++)total+=i<10?(i+1)*50:i<20?1000:2000;return total;}
export function generationDifficulty(day:number,contexts:Contexts,challenge=false,wrongRatio=NaN):[number,number]{const n=Number(contexts.Gen_Haggle??0);const max=challenge?(n>=15?13:n>=14?12:n>=13?11:n>=12?10:n>=10?8:n>=8?7:n>=6?6:n>=5?5:n>=3?4:n>=2?3:2):day>=24&&wrongRatio<=.5?13:day>=22?12:day>=17?(contexts.getScrew!==undefined?11:10):day>=16?8:day>=11?7:day>=8?6:day>=6?5:day>=5?4:day>=4?3:contexts.dayOneItemDiff!==undefined?2:1;return [max===1?1:2,max];}
export function selectNativeGeneration(input:{day:number;contexts:Contexts;challenge?:boolean;candidates:readonly GenerationCandidate[];draw:()=>number;choose:()=>number;hammer?:(candidate:GenerationCandidate)=>number}):GenerationSelection {
 const {contexts,day,draw,choose}=input,challenge=!!input.challenge,n=Number(contexts.Gen_Haggle??0),isUmbrella=(i:GenerationCandidate)=>i.cardIds.includes('gray_umbrella');let pool=input.candidates.slice(),branch:GenerationBranch=challenge?'challenge':'normal',target:number|null=null,scores:{id:string;score:number}[]=[];
 if(challenge&&n%4!==1)pool=pool.filter(i=>!isUmbrella(i));const roll=draw();
 if(!challenge&&n===Number(contexts.shouldUmbrella??0)&&n>12&&pool.some(isUmbrella)){branch='umbrella';pool=pool.filter(isUmbrella);}
 else if(!challenge&&roll<=.2&&n>15){branch='expensive';pool=pool.slice().sort((a,b)=>b.price-a.price).slice(0,30);}
 else if(!challenge&&roll<=.25&&day>=11&&pool.some(i=>isNativeFake(i.cardIds))){branch='fake';pool=pool.filter(i=>isNativeFake(i.cardIds));}
 else {
  target=(generationTarget(n,challenge)-Number(contexts.itemValueStack??0))*(challenge?1:.5+draw());if(!challenge&&n>=100)pool=pool.filter(i=>!isUmbrella(i)||i.price<200);
  const gray=generationList(contexts.grayToday),brand=generationList(contexts.brandToday);pool=pool.filter(i=>!i.cardIds.some(id=>gray.includes(id)));if(!pool.length)throw Error('not enough gray');pool=pool.filter(i=>!i.cardIds.some(id=>brand.includes(id)));if(!pool.length)throw Error('not enough brand');
  const unbranded=pool.filter(i=>i.cardIds.length>=4&&!i.cardIds.some(id=>getNativeCard(id)?.category==='brand'));if(draw()<.1&&unbranded.length)pool=unbranded;
  const hammered=input.hammer??((i:GenerationCandidate)=>nativeHammerValue(i.trueValue??estimateNativeCards(i.cardIds),i.cardIds,draw).value);
  const ranked=pool.map(candidate=>({candidate,score:generationScore(target!,candidate,isNativeTrulyValuable(candidate.cardIds)?hammered(candidate):candidate.price)})).sort((a,b)=>a.score-b.score);scores=ranked.map(x=>({id:x.candidate.id,score:x.score}));pool=ranked.slice(0,challenge?30:20).map(x=>x.candidate);
 }
 if(!pool.length)throw Error('empty generation candidate pool');const candidate=pool[Math.min(pool.length-1,Math.floor(choose()*pool.length))];const patch:Contexts={itemValueStack:Number(contexts.itemValueStack??0)+(isUmbrella(candidate)&&!challenge&&branch!=='expensive'&&branch!=='fake'?Math.min(candidate.price,50):candidate.price)};
 if(branch==='normal'||branch==='challenge'){const gray=candidate.cardIds.find(id=>getNativeCard(id)?.color===0),brand=candidate.cardIds.find(id=>getNativeCard(id)?.category==='brand');if(gray)patch.grayToday='['+[gray,...generationList(contexts.grayToday)].map(x=>JSON.stringify(x)).join('; ')+']';if(brand)patch.brandToday='['+[brand,...generationList(contexts.brandToday)].map(x=>JSON.stringify(x)).join('; ')+']';}
 return {candidate,branch,contexts:patch,eligibleIds:pool.map(i=>i.id),target,scores};
}
/** IO.tomorrow invokes this after incrementing the date. */
export function tomorrowUmbrellaContext(newDay:number,contexts:Contexts,draw:()=>number):Contexts{return newDay%5===0?{shouldUmbrella:Number(contexts.Gen_Haggle??0)+1+Math.floor(draw()*14)}:{};}
