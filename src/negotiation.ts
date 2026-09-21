import { initializeNativeNagging,advanceNativeTicks } from './native-tick';
import { ensureNativeState } from './native-migration';
import { runNativeSale } from './native-sale';
import { acceptNative, counterNative, leaveNative, pushNative } from './native-response';
import type { NativeNegotiationInput, NativeNegotiationState, NativeSaleInput, NativeSalePlan, NativeCardAction } from './native-negotiation-types';
import { createNativeContext } from './native-pipelines';
import { runNativePricePipeline } from './native-price-pipeline';
import { initializeNativeScript } from './native-script-hooks';
export { drainNativeScriptEffects,declineNativeDeal,NATIVE_SCRIPT_REGISTRY } from './native-script-hooks';
export type { NativeNegotiationInput, NativeNegotiationState, NativeSaleInput, NativeSalePlan, NativeCardAction } from './native-negotiation-types';
/**
 * Independent implementation of selected rules statically verified in the
 * official 1.0.5 Demo. Exact branch coverage and full-game parity are not claimed.
 * Runtime transitions use native action histories and ordered pipes. Missing
 * caller facts stay explicit; recorded outcomes are never runtime inputs.
 */
export const MODEL_PARAMETERS = {
  version: 'native-pipeline-negotiation-3',
  status: 'partially-demo-derived',
  evidence: 'docs/research/NEGOTIATION_DEMO_FACTS.md',
  source: {
    archiveSha256: '026da208cdf7fdec6e09491f1262d271af3dd67a571ce8bf583f73435f9fb602',
    applicationVersion: '1.0.5 Demo',
    behavior: 'Independent implementation of inspected numerical rules; full pipeline and full-game parity are not claimed.',
    randomGenerator: 'Local seeded PRNG, not the original process-wide System.Random stream.',
  },
  demo: {
    activeFirstAccept: 0.7, wishyFirstAccept: 0.8, fixieAccept: 0.8,
    fearlessAccept: 0.2, scaredCounter: 0.6, trivialValueUpper: 4,
    insultRatio: 0.3, halfValue: 0.5,
    horongLow: 0.65, horongHigh: 0.7,
    compromiseJoke: 0.1, compromiseLow: 0.35, compromiseHigh: 0.5,
    wishyCompromiseInsist: 0.2, wishyCompromiseAccept: 0.48,
    insistLow: 0.55, insistHigh: 0.67,
    repeatedActivePlayerOffers: 3, repeatedTotalOffers: 4,
    repeatedLow: 0.6, repeatedHigh: 0.7, wishyRepeatedAccept: 0.65,
    wishyResuggestAccept: 0.64, wishyResuggestLow: 0.55,
    wishyResuggestImmediateChance: 0.4, wishyResuggestCounterChance: 0.7, wishyResuggestIncrease: 0.05,
    busyOpeningRandomDivisor: 3, busyLowImpact: 0.2, busyLeavingNegativeImpact: -0.4,
    saleAcceptanceOffset: 0.3, saleTierBonus: 0.1, saleTierBonusFrom: 2,
    saleNearListingRatio: 1.1, saleNearDiscount: 0.01, saleNearRandomWidth: 0.1,
    saleExpensiveFrom: 1000, saleNormalWidth: 0.4, saleExpensiveWidth: 0.2,
    tickSeconds: 0.2, busyTickRange: [40, 60], idleTickRange: [450, 600],
    doraIdleTickRange: [600, 800], idleLeavingProfileProbability: 0.25,
  },
  provisional: {
    // These aggregate inputs cannot identify every actual card-specific branch.
    severeIncorrectCardCount: 2,
    repeatedInvalidLimit: 3,
    defaultAppraisedTier: 1,
    personalityAlias: { patient: 'active', hurried: 'active-with-busy-modifier', scared: 'active-with-frightened-reported-modifier' },
  },
} as const;

export type NegotiationPersonality = 'patient' | 'hurried' | 'scared' | 'fixie' | 'active' | 'wishy-washy' | 'fearless' | 'cautious' | 'emotional';
export type NegotiationOutcome = 'accepted' | 'counter' | 'rejected' | 'left';
export type NegotiationStatus = 'open' | 'countered' | 'accepted' | 'left';
export interface NegotiationInput {
  side: 'buy' | 'sell';
  fairValue: number;
  publicValue: number;
  initialPublicValue: number;
  listingPrice?: number;
  personality: NegotiationPersonality;
  seed: number;
  reputation: number;
  flower?: boolean | 'horong' | 'dora' | number;
  native?: NativeNegotiationInput;
  sale?: NativeSaleInput;
  appraisedTier?: number;
  /** Explicit validation supplied by the appraisal engine, not a value gap. */
  incorrectPublicCards?: number;
  subjectivePublicCards?: number;
}
export interface NegotiationState {
  modelVersion: typeof MODEL_PARAMETERS.version;
  native: NativeNegotiationState;
  sale: NativeSaleInput;
  salePlan: NativeSalePlan | null;
  side: 'buy' | 'sell';
  fairValue: number;
  publicValue: number;
  initialPublicValue: number;
  listingPrice: number | null;
  personality: NegotiationPersonality;
  seed: number;
  reputation: number;
  incorrectPublicCards: number;
  subjectivePublicCards: number;
  status: NegotiationStatus;
  offers: number;
  irritation: number;
  elapsedSeconds: number;
  positiveAppraisals: number;
  counter: number | null;
  acceptedAmount: number | null;
  lastOffer: number | null;
  lastMessage: string;
  departureReason: 'time' | 'offers' | 'irritation' | 'appraisal' | null;
  appraisalReaction: 'none' | 'accepted' | 'incorrect' | 'rejected-negative' | 'rejected-subjective' | 'left';
  /** Seeded temperament is sampled once and survives serialization. */
  reservationRatio: number;
  initialCounterRatio: number;
  buyerPremiumRatio: number;
  flower: 'none' | 'horong' | 'dora';
  flowerType: number;
  appraisedTier: number;
  rngState: number;
  customerOffers: number;
  idleSeconds: number;
  timeLimitSeconds: number | null;
  nagIntervals: number[];
  nagStage: number;
  appraisalEvents: number;
  history: { amount: number; outcome: NegotiationOutcome; counter: number | null }[];
}
export interface NegotiationResponse {
  state: NegotiationState;
  outcome: NegotiationOutcome;
  counter: number | null;
  message: string;
}
export interface AppraisalUpdate {
  fairValue: number;
  publicValue: number;
  incorrectPublicCards?: number;
  subjectivePublicCards?: number;
}

const isMoney = (n: number) => Number.isSafeInteger(n) && n >= 0;
const finite = (n: number) => Number.isFinite(n);
function requireMoney(n: number, name: string) {
  if (!isMoney(n)) throw new RangeError(`${name} must be a nonnegative safe integer.`);
}
function requireCount(n: number, name: string) { requireMoney(n, name); }
function requireValue(n: number, name: string) { if (!Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) throw new RangeError(`${name} must be a finite nonnegative valuation.`); }
function nextRandom(seed: number): [number, number] {
  const state = (seed + 0x6d2b79f5) >>> 0;
  let value = Math.imul(state ^ (state >>> 15), state | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [state, ((value ^ (value >>> 14)) >>> 0) / 0x100000000];
}
function randomSequence(seed: number) {
  let state = seed >>> 0;
  return { next() { const next = nextRandom(state); state = next[0]; return next[1]; }, get state() { return state; } };
}
export function createNegotiation(input: NegotiationInput): NegotiationState {
  for (const key of ['fairValue', 'publicValue', 'initialPublicValue'] as const) requireValue(input[key], key);
  if (input.listingPrice !== undefined) requireMoney(input.listingPrice, 'listingPrice');
  if (!finite(input.seed) || !finite(input.reputation)) throw new RangeError('Seed and reputation must be finite.');
  if (input.side !== 'buy' && input.side !== 'sell') throw new RangeError('Unsupported trade side.');
  if (!['patient', 'hurried', 'scared', 'fixie', 'active', 'wishy-washy', 'fearless', 'cautious', 'emotional'].includes(input.personality)) throw new RangeError('Unsupported personality.');
  const incorrectPublicCards = input.incorrectPublicCards ?? 0;
  const subjectivePublicCards = input.subjectivePublicCards ?? 0;
  requireCount(incorrectPublicCards, 'incorrectPublicCards');
  requireCount(subjectivePublicCards, 'subjectivePublicCards');
  const appraisedTier = input.appraisedTier ?? MODEL_PARAMETERS.provisional.defaultAppraisedTier;
  requireCount(appraisedTier, 'appraisedTier');
  const random = randomSequence(input.seed);
  const flowerType=typeof input.flower==='number'?input.flower:input.flower==='dora'?3:input.flower===true||input.flower==='horong'?1:0;
  const flower = flowerType===1?'horong':flowerType===3||flowerType===6?'dora':'none';
  const d = MODEL_PARAMETERS.demo;
  const range = flower === 'dora' ? d.doraIdleTickRange : d.idleTickRange;
  const nagIntervals = Array.from({ length: 3 }, () => (d.busyTickRange[0] + Math.floor(random.next() * (d.busyTickRange[1] - d.busyTickRange[0]))) * d.tickSeconds);
  const nativeCreation=createNativeContext(input.native??{},input.personality,input.publicValue,input.fairValue,random.state,flowerType);
  const openingCounter=input.side==='buy'?nativeCreation.counter:null;
  const timeLimitSeconds=nativeCreation.native.normalIdle && nativeCreation.native.nagMode==='by-time' ? (range[0]+Math.floor(random.next()*(range[1]-range[0])))*d.tickSeconds : null;
  const created:NegotiationState = {
    modelVersion: MODEL_PARAMETERS.version,
    native:nativeCreation.native,sale:structuredClone(input.sale??{}),salePlan:null,flowerType,
    side: input.side, fairValue: input.fairValue, publicValue: input.publicValue,
    initialPublicValue: input.initialPublicValue,
    listingPrice: input.side === 'sell' ? input.listingPrice ?? input.publicValue : null,
    personality: input.personality, seed: input.seed >>> 0, reputation: input.reputation,
    incorrectPublicCards, subjectivePublicCards, flower, appraisedTier,
    status: openingCounter === null ? 'open' : 'countered', offers: 0, irritation: 0,
    elapsedSeconds: 0, idleSeconds: 0, positiveAppraisals: 0,
    counter: openingCounter, acceptedAmount: null, lastOffer: null, lastMessage: '', departureReason: null,
    appraisalReaction: 'none', history: [], rngState: nativeCreation.rngState,
    customerOffers: openingCounter === null ? 0 : 1,
    timeLimitSeconds, nagIntervals, nagStage: 0, appraisalEvents: 0,
    // Compatibility fields are now fixed, observed rules rather than guessed ranges.
    reservationRatio: input.personality === 'fixie' ? d.fixieAccept : input.personality === 'fearless' ? d.fearlessAccept : input.personality === 'wishy-washy' ? d.wishyFirstAccept : d.activeFirstAccept,
    initialCounterRatio: d.activeFirstAccept, buyerPremiumRatio: 1,
  };
  initializeNativeNagging(created);
  initializeNativeScript(created,input.native?.scriptId);
  return created;
}

function leave(state: NegotiationState, reason: NegotiationState['departureReason'], message:string):NegotiationState { const next=structuredClone(state);leaveNative(next,next.lastOffer??0,'AppraisalDeparture',reason);next.lastMessage=message;return next; }
export function tick(state: NegotiationState, seconds: number): NegotiationState {
  state=ensureNativeState(state);
  if (!finite(seconds) || seconds < 0) throw new RangeError('Elapsed seconds must be finite and nonnegative.');
  if (state.status === 'accepted' || state.status === 'left' || seconds === 0) return state;
  const next=structuredClone(state),n=next.native;
  next.elapsedSeconds=Math.min(Number.MAX_SAFE_INTEGER,next.elapsedSeconds+seconds);next.idleSeconds+=seconds;
  const elapsed=n.tickRemainder+seconds, ticks=Math.floor((elapsed+1e-9)/MODEL_PARAMETERS.demo.tickSeconds);
  n.tickRemainder=Math.max(0,elapsed-ticks*MODEL_PARAMETERS.demo.tickSeconds);
  advanceNativeTicks(next,ticks);
  return next;
}

/**
 * Feed this only after an intentional appraisal change, not on every draw.
 * The returned publicValue may stay unchanged when a customer refuses evidence.
 * A gap between fair and public value alone is NOT an appraisal error: private
 * cards legitimately create that gap.
 */
export function updateAppraisal(state: NegotiationState, update: AppraisalUpdate): NegotiationState {
  state=ensureNativeState(state);
  requireValue(update.fairValue, 'fairValue');
  requireValue(update.publicValue, 'publicValue');
  const incorrectPublicCards = update.incorrectPublicCards ?? state.incorrectPublicCards;
  const subjectivePublicCards = update.subjectivePublicCards ?? state.subjectivePublicCards;
  requireCount(incorrectPublicCards, 'incorrectPublicCards');
  requireCount(subjectivePublicCards, 'subjectivePublicCards');
  if (state.status === 'accepted' || state.status === 'left' || state.side === 'sell') return state;
  if (update.publicValue === state.publicValue && incorrectPublicCards === state.incorrectPublicCards && subjectivePublicCards === state.subjectivePublicCards) return update.fairValue === state.fairValue ? state : { ...state, fairValue: update.fairValue };
  if (update.fairValue === state.fairValue && update.publicValue === state.publicValue && incorrectPublicCards === state.incorrectPublicCards && subjectivePublicCards === state.subjectivePublicCards) return state;
  let next: NegotiationState = { ...structuredClone(state), fairValue: update.fairValue, incorrectPublicCards, subjectivePublicCards, appraisalReaction: 'accepted', idleSeconds: 0, appraisalEvents: state.appraisalEvents + 1 };
  next.native.pending=null;
  const lower = update.publicValue < state.publicValue;
  const higher = update.publicValue > state.publicValue;
  const relativeChange = state.publicValue === 0 ? 0 : (update.publicValue - state.publicValue) / state.publicValue;
  if (state.personality === 'hurried' && lower && relativeChange <= MODEL_PARAMETERS.demo.busyLeavingNegativeImpact && incorrectPublicCards === 0) {
    next.publicValue = update.publicValue;
    next = leave(next, 'appraisal', 'I have no time to think about that. I am taking it back.');
    next.appraisalReaction = 'left';
    return next;
  } else if (state.personality === 'hurried' && Math.abs(relativeChange) <= MODEL_PARAMETERS.demo.busyLowImpact && incorrectPublicCards === 0) {
    next.publicValue = update.publicValue;
    next.lastMessage = 'All right, but please hurry.';
  } else if (state.personality === 'fixie' && subjectivePublicCards > state.subjectivePublicCards) {
    next.appraisalReaction = 'rejected-subjective';
    next.lastMessage = 'That is a matter of opinion.';
  } else {
    next.publicValue = update.publicValue;
    // A counter belongs to the previously discussed appraisal and must be renewed.
    next.counter = null;
    next.status = 'open';
    if (higher) next.positiveAppraisals++;
    if (state.personality === 'scared') {
      next.counter = lower ? Math.floor(next.publicValue * MODEL_PARAMETERS.demo.scaredCounter) : state.counter;
      next.status = next.counter === null ? 'open' : 'countered';
    }
  }
  if (incorrectPublicCards > state.incorrectPublicCards) {
    next.irritation += 1;
    next.appraisalReaction = 'incorrect';
    next.lastMessage = 'Those details do not match my item.';
  }
  // Only explicit native card history may trigger the original repeated-false-card rule.
  return next;
}

function response(state: NegotiationState, outcome: NegotiationOutcome, message: string, amount?: number): NegotiationResponse {
  const next = { ...state, lastMessage: message };
  if (amount !== undefined) next.history = [...state.history, { amount, outcome, counter: state.counter }];
  return { state: next, outcome, counter: next.counter, message };
}
/** Pure transition. Only engine settlement may move cash or ownership. */
export function offer(state: NegotiationState, amount: number): NegotiationResponse {
  state=ensureNativeState(state);
  if (state.status === 'accepted') return response(state, 'rejected', 'This deal is already closed.');
  if (state.status === 'left') return response(state, 'left', state.lastMessage);
  if (!isMoney(amount)) return response(state, 'rejected', 'Enter a nonnegative whole price.');
  const ready = state;
  if (ready.status === 'left') return response(ready, 'left', ready.lastMessage);
  return ready.side === 'buy' ? runNativePricePipeline(ready, amount) : runNativeSale(ready, amount);
}

export { assertNativeCard,hideNativeCard,useNativeTool,clearNegotiationContext } from './native-card-pipeline';

export { acceptNativeSaleCounter } from './native-sale';
