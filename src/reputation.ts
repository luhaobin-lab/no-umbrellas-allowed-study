/** Official 1.0.5 demo behavior, independently implemented from verified facts.
 * Raw points and displayed percentages are different values.
 * See docs/research/DEMO_REPUTATION_FACTS.md for source methods and uncertainty.
 */
export interface ReputationState {
  expertnessRaw: number;
  attractivenessRaw: number;
  wittinessRaw: number;
}

export interface ReputationRates { expertness: number; attractiveness: number; wittiness: number }
export type ReputationTier = 1 | 2 | 3 | 4 | 5;
type Segment = readonly [number, number, number, number];
const EXPERTNESS: readonly Segment[] = [[-15,0,-5,0],[0,45,0,5],[45,135,5,10],[135,255,10,15],[255,375,15,20]];
const ATTRACTIVENESS: readonly Segment[] = [[100,40,15,10],[40,10,10,5],[10,-10,5,-5],[-10,-40,-5,-10],[-40,-100,-10,-15]];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
function integer(value: number, label: string, min: number, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
}
function validate(state: ReputationState) {
  integer(state.expertnessRaw, 'expertnessRaw', -15, 375);
  integer(state.attractivenessRaw, 'attractivenessRaw', -100, 100);
  integer(state.wittinessRaw, 'wittinessRaw', 0, 25);
}
function convert(raw: number, segments: readonly Segment[]): number {
  const segment = segments.find(([a,b]) => raw >= Math.min(a,b) && raw <= Math.max(a,b));
  if (!segment) throw new RangeError('Reputation raw value is outside its defined range.');
  const [a,b,x,y] = segment;
  return Math.trunc(x + (raw-a)/(b-a)*(y-x)) || 0;
}

export function rates(state: ReputationState): ReputationRates {
  validate(state);
  return { expertness: convert(state.expertnessRaw,EXPERTNESS), attractiveness: convert(state.attractivenessRaw,ATTRACTIVENESS), wittiness: state.wittinessRaw };
}

export function tiers(state: ReputationState): { expertness: ReputationTier; attractiveness: ReputationTier; wittiness: ReputationTier } {
  const rate = rates(state);
  return {
    expertness: rate.expertness < 0 ? 1 : rate.expertness < 5 ? 2 : rate.expertness < 10 ? 3 : rate.expertness < 15 ? 4 : 5,
    attractiveness: rate.attractiveness > 10 ? 1 : rate.attractiveness > 5 ? 2 : rate.attractiveness > -5 ? 3 : rate.attractiveness > -10 ? 4 : 5,
    wittiness: rate.wittiness < 5 ? 1 : rate.wittiness < 10 ? 2 : rate.wittiness < 15 ? 3 : rate.wittiness < 20 ? 4 : 5,
  };
}

export interface ReputationSeed {
  state: ReputationState;
  intervals: { expertnessRaw: [number,number]; attractivenessRaw: [number,number]; wittinessRaw: [number,number] };
  /** True means the screenshot's percentage cannot uniquely reveal hidden points. */
  inferred: boolean;
  policy: 'lowest-raw-in-matching-interval';
}

export function initialFromRates(expertness: number, attractiveness: number, wittiness: number): ReputationSeed {
  integer(expertness,'expertness',-5,20); integer(attractiveness,'attractiveness',-15,15); integer(wittiness,'wittiness',0,25);
  const interval = (target: number, min: number, max: number, segments: readonly Segment[]): [number,number] => {
    const matches: number[] = [];
    for(let raw=min;raw<=max;raw++) if(convert(raw,segments)===target) matches.push(raw);
    if (!matches.length) throw new RangeError(`No raw points produce ${target}%.`);
    return [matches[0],matches[matches.length-1]];
  };
  const expertnessRaw = interval(expertness,-15,375,EXPERTNESS);
  const attractivenessRaw = interval(attractiveness,-100,100,ATTRACTIVENESS);
  const wittinessRaw: [number,number] = [wittiness,wittiness];
  return {
    state: { expertnessRaw: expertnessRaw[0], attractivenessRaw: attractivenessRaw[0], wittinessRaw: wittiness },
    intervals: { expertnessRaw,attractivenessRaw,wittinessRaw },
    inferred: expertnessRaw[0] !== expertnessRaw[1] || attractivenessRaw[0] !== attractivenessRaw[1],
    policy: 'lowest-raw-in-matching-interval',
  };
}

export interface ReputationUpdate {
  state: ReputationState;
  /** Change after clamping to the legal range. */
  rawDelta: number;
  /** Scoring rule's change before clamping. */
  pointDelta: number;
  applied: boolean;
  reason: 'applied' | 'already-evaluated' | 'disabled' | 'unknown-appraisal' | 'neutral' | 'not-recommended' | 'unknown-score';
}
function update(state: ReputationState, field: keyof ReputationState, points: number, min: number, max: number): ReputationUpdate {
  const next = clamp(state[field]+points,min,max);
  return { state: {...state,[field]:next},rawDelta:next-state[field],pointDelta:points,applied:true,reason:'applied' };
}
function skip(state: ReputationState, reason: ReputationUpdate['reason']): ReputationUpdate {
  return { state:{...state},rawDelta:0,pointDelta:0,applied:false,reason };
}

export interface AppraisalReview {
  /** Counts of independently proved wrong/missing CATEGORIES, not raw card count. */
  wrongCategories: number;
  missingCategories: number;
  complete: boolean;
  alreadyEvaluated?: boolean;
  enabled?: boolean;
}

export function appraisalPoints(wrongCategories: number, missingCategories: number, tier: ReputationTier): number {
  integer(wrongCategories,'wrongCategories',0); integer(missingCategories,'missingCategories',0); integer(tier,'tier',1,5);
  const total = wrongCategories + missingCategories;
  if(total === 0) return 2;
  if(total < 2 && tier < 3) return 0;
  return Math.trunc(-1.5*tier);
}

/** Evaluate the first buyer inspection, which can happen before a sale completes. */
export function reviewAppraisal(state: ReputationState, review: AppraisalReview): ReputationUpdate {
  validate(state);
  integer(review.wrongCategories,'wrongCategories',0); integer(review.missingCategories,'missingCategories',0);
  if(review.alreadyEvaluated) return skip(state,'already-evaluated');
  if(review.enabled===false) return skip(state,'disabled');
  const tier = tiers(state).expertness;
  const points = appraisalPoints(review.wrongCategories,review.missingCategories,tier);
  // Known evidence may prove the penalty even if other categories are unknown.
  if(!review.complete && points >= 0) return skip(state,'unknown-appraisal');
  return update(state,'expertnessRaw',points,-15,375);
}

/** Use the NPC's actual satisfaction result, not simply whether money changed. */
export function reviewSatisfaction(state: ReputationState, outcome: 'satisfied'|'unsatisfied'|'neutral', enabled=true): ReputationUpdate {
  validate(state);
  if(!enabled) return skip(state,'disabled');
  if(outcome==='neutral') return skip(state,'neutral');
  if(outcome!=='satisfied'&&outcome!=='unsatisfied') throw new RangeError('Unknown satisfaction result.');
  const points = (tiers(state).attractiveness===5 ? 2 : 1) * (outcome==='satisfied' ? -1 : 1);
  return update(state,'attractivenessRaw',points,-100,100);
}

export interface RecommendationFacts {
  trueValue: number | null;
  popularity: 'all'|'positive'|'negative'|'neutral'|null;
  figure: 'world-historic'|'positive'|'other'|null;
  brandTier: 'AA'|'A'|'other'|null;
  limited: boolean | null;
  historical: boolean | null;
  fake: boolean | null;
  repaired: boolean | null;
  pickedUp: boolean | null;
}

export const RECOMMENDED_BRAND_TIERS = {
  AA: ['async','oz','realbird','besch'],
  A: ['queen','vertivo','sas','casualcat','ben'],
} as const;

/** Uses independently known true facts; null means the score is not established. */
export function recommendationScore(facts: RecommendationFacts): number | null {
  if(Object.values(facts).some(value=>value===null||value===undefined)) return null;
  if(!Number.isFinite(facts.trueValue)||facts.trueValue!<0) throw new RangeError('trueValue must be finite and nonnegative.');
  const price = facts.trueValue! <= 30 ? -1 : facts.trueValue! >= 2000 ? 2 : facts.trueValue! >= 500 ? 1 : 0;
  return price + (facts.popularity==='all'?2:facts.popularity==='positive'?1:facts.popularity==='negative'?-1:0)
    + (facts.figure==='world-historic'?2:facts.figure==='positive'?1:0)
    + (facts.brandTier==='AA'?2:facts.brandTier==='A'?1:0)
    + (facts.limited?1:0) + (facts.historical?2:0) - (facts.fake?1:0) - (facts.repaired?2:0) - (facts.pickedUp?2:0);
}

export function reviewRecommendation(state: ReputationState, review: {recommended:boolean;score:number|null;enabled?:boolean}): ReputationUpdate {
  validate(state);
  if(review.enabled===false) return skip(state,'disabled');
  if(!review.recommended) return skip(state,'not-recommended');
  if(review.score===null) return skip(state,'unknown-score');
  integer(review.score,'score',-100,100);
  const tier = tiers(state).wittiness;
  const score = review.score;
  const gain = tier>=4 ? 2 : 1;
  const loss = tier===1 ? -Infinity : tier===2 ? -2 : tier===3 ? -1 : 0;
  const points = score>=gain ? 1 : score<=loss ? -1 : 0;
  return update(state,'wittinessRaw',points,0,25);
}
