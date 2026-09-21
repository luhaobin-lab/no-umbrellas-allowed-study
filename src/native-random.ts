/** A saved local random stream. Probabilities follow source rules; stream is not System.Random/Guid. */
export function nextNativeRandom(seed: number): [number, number] {
  const state=(seed+0x6d2b79f5)>>>0;
  let value=Math.imul(state^(state>>>15),state|1);
  value^=value+Math.imul(value^(value>>>7),value|61);
  return [state,((value^(value>>>14))>>>0)/0x100000000];
}
export function nativeRandom(seed:number){let state=seed>>>0;return {next(){const r=nextNativeRandom(state);state=r[0];return r[1];},get state(){return state;}};}
