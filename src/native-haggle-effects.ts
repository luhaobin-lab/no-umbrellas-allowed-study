import type { NegotiationState } from './negotiation';
import type { NativeHaggleAction } from './native-negotiation-types';
import { getNativeCard } from './native-rules';
import { nativeModifierOutcome } from './native-outcome';
export interface NativeHaggleEffects { contexts:Record<string,string|number|boolean>; visitorsDelta:number; evidence:string[] }
const prices=(history:NativeHaggleAction[])=>history.filter(a=>a.type==='PlayerSuggestPrice').map(a=>a.amount!);
const recent=(history:NativeHaggleAction[])=>{const cut=history.findIndex(a=>a.type==='PlayerSuggestCard'||a.type==='CustomerDeclareCard');return cut<0?history:history.slice(0,cut);};
const insisted=(history:NativeHaggleAction[])=>{const values=prices(history);return values.some((v,i)=>i>0&&v===values[i-1]);};
const curtailed=(history:NativeHaggleAction[])=>{const values=prices(recent(history));return values.some((v,i)=>values.slice(i+1).some(old=>old>v));};
function shook(history:NativeHaggleAction[]):boolean{const i=history.findIndex(a=>a.type==='PlayerSuggestPrice');if(i<0)return false;const tail=history.slice(i+1),j=tail.findIndex(a=>a.type==='PlayerSuggestPrice'||a.type==='CustomerDeclinePrice');return j>=0&&(tail[j].type==='PlayerSuggestPrice'||shook(tail.slice(j+1)));}
/** Preserves the original g/f scan: prices newer than the first PriceStamp are skipped. */
function under30(history:NativeHaggleAction[]):boolean{const first=history.findIndex(a=>a.type==='PriceStamp');if(first<0)return false;let value=history[first].amount!;for(const a of history.slice(first+1)){if(a.type==='PriceStamp')value=a.amount!;else if(a.type==='PlayerSuggestPrice'&&a.amount!/value<=.3)return true;}return false;}
/** Original IO settlement context effects only. Cash, stock, Appraised and Trusted remain controller-owned.
 * Call once at committed settlement, and use live globals rather than a stale negotiation snapshot. */
export function nativeHaggleOutcomeEffects(state:NegotiationState,success:boolean,globals=state.native.globals):NativeHaggleEffects{
 const n=state.native,g={...globals},contexts:NativeHaggleEffects['contexts']={},evidence:string[]=[];let visitorsDelta=0;
 const set=(key:string,value:string|number|boolean)=>{g[key]=value;contexts[key]=value;};
 const num=(key:string)=>Number(String(g[key]??0).replaceAll('_',''));
 const inc=(key:string)=>set(key,String(num(key)+1));
 // contextMinusMinus preserves a negative input, and writes 0 when absent.
 const dec=(key:string)=>set(key,String(g[key]===undefined||String(g[key])==='0'?0:num(key)-1));
 const flag=(key:string)=>g[key]==='true'||g[key]==='True'||g[key]===true;
 const has=(id:string)=>n.customerCardIds.includes(id),fixie=n.personality==='Fixie';
 if(success){
  if(has('yellow_buyback'))inc('buyBackPromise');
  const failedBasic=n.customerCardIds.some(id=>!n.trueCardIds.includes(id)&&['jewel','brand','material'].includes(getNativeCard(id)?.category??''));
  if(g.openYellowCard!==undefined&&((n.trueCardIds.some(id=>id.includes('fakeBrand'))&&!n.customerCardIds.some(id=>id.includes('fakeBrand')))||failedBasic))inc('precise');
  if(has('yellow_precise'))dec('precise');
  if(g.visitorsToAdd!==undefined&&String(g.visitorsToAdd)!=='0'){visitorsDelta=num('visitorsToAdd');set('visitorsToAdd','0');}
  if(n.playerCardIds.length)inc(fixie?'fixieFraud':'fraud');
  if(fixie){inc('dealWithFixieSuccess');inc('dealWithFixieCount');}
  if(n.customerCardIds.some(id=>getNativeCard(id)?.color===3))inc('redUsed');
  // The leading space in this source key is intentional.
  if(flag(' charCbokhoAsk')&&state.publicValue*.75>(state.acceptedAmount??state.lastOffer??0))inc('under75');
 }else if(fixie){inc('dealWithFixieFail');inc('dealWithFixieCount');}
 if(insisted(n.context)){const gen=num('Gen_Haggle'),prior=g.lastInsisted;inc('playerInsists');if(prior!==undefined&&gen-Number(prior)===1)inc('InsistStack');else set('InsistStack','1');set('lastInsisted',String(gen));}
 else{dec('playerInsists');set('InsistStack','0');}
 if(success){if(shook(n.context))inc('playerShakes');else dec('playerShakes');}
 Object.entries(nativeModifierOutcome(state,success,g)).forEach(([k,v])=>set(k,v));
 // Report.reportPlayer compares NextDouble() <= 72.5 (always true), not <= .725.
 if((n.day??0)>=11&&((insisted(n.context)&&num('playerInsists')>=3)||under30(n.context)||curtailed(n.context))){set('report','true');if(flag('haveBadge'))set('meReportedSettled','true');}
 if(n.trueCardIds.filter(id=>id.includes('fakeBrand')).length===1)set('firstFake','true');
 if(success&&n.script?.kind==='PreAvarice3'&&n.playerCardIds.length)set('PreAvarice3Hide','true');
 evidence.push('Windows 1.0.5: IO.haggleSuccess/haggleFail/haggleEnd; GlobalVars.EvaluateHaggle/EvaluateHaggleContext; Report.reportPlayer; Pawnshop.checkAddedVisitor; PreAvarice3.onSuccess');
 return{contexts,visitorsDelta,evidence};
}
