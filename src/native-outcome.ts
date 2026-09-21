import type {NegotiationState} from './negotiation';
/** Apply this patch once during controller settlement, including a player's explicit refusal. */
export function nativeModifierOutcome(state:NegotiationState,success:boolean,globals=state.native.globals):Record<string,string|number|boolean>{
 const n=state.native,m=n.modifier;if(m!=='Junuk'&&m!=='SingSing')return {};
 const key=m+'Failed',patch:Record<string,string|number|boolean>={[key]:success?0:Number(globals[key]??0)+1};
 if(n.day!==null&&n.day>=20){const direction=(m==='SingSing'?1:-1)*(success?1:-1);patch.AzikScore=Math.max(0,Math.min(50,Number(globals.AzikScore??0)+direction));}
 return patch;
}
