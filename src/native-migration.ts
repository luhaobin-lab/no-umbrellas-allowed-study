import type { NegotiationState } from './negotiation';
import { createNativeContext } from './native-pipelines';
/** Upgrade old local saves without touching cash/inventory or pretending omitted facts are known. */
export function ensureNativeState(previous:NegotiationState):NegotiationState {
 if(previous.native){
  const n=previous.native;
  if(n.itemCondition!==undefined&&n.shopBalance!==undefined&&n.sameTypeStockValues!==undefined&&n.redCardRolls!==undefined&&(!n.pending||n.pending.contextLength!==undefined))return previous;
  const updated=structuredClone(previous),native=updated.native;
  native.itemCondition??=null;native.shopBalance??=null;native.sameTypeStockValues??=null;native.redCardRolls??=null;
  if(native.pending&&native.pending.contextLength===undefined){native.pending=null;native.delayedActions=[];native.unknownFacts.push('legacy-delayed-context-migration');}
  return updated;
 }
 const s=structuredClone(previous),creation=createNativeContext({feelSorry:false},s.personality,s.publicValue,s.fairValue,s.rngState??s.seed,s.flower==='horong'?1:s.flower==='dora'?3:0);
 s.native=creation.native;s.native.unknownFacts.push('legacy-context-migration');s.sale={};s.salePlan=null;s.flowerType=s.flower==='horong'?1:s.flower==='dora'?3:0;
 for(const row of s.history??[]){s.native.context.unshift({type:'PlayerSuggestPrice',amount:row.amount,tick:0});if(row.counter!==null)s.native.context.unshift({type:'CustomerSuggestPrice',amount:row.counter,tick:0});}
 return s;
}
