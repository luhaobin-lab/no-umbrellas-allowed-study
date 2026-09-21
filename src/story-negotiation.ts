import { getDemoCustomer } from './demo-customer-data';

export interface StoryPriceInput {
  offer: number;
  /** Current NPC belief value; do not pass the actual item value or recorded sale price. */
  customerValue: number;
  /** Number of previous offers. For Choi, every continuing offer is an over-high rejection. */
  priorOffers: number;
}
export interface StoryPriceResponse {
  handled: boolean;
  outcome: 'accept' | 'decline-offer' | 'decline-deal' | null;
  /** Original branch identifier; the UI chooses its own prose. */
  branch: string | null;
  scriptHookId: string | null;
  implementation: 'verified-price-hook' | 'unimplemented-script-hook' | 'no-script-hook';
  /** Yeongi's first three branches clear the source negotiation context. */
  clearContext: boolean;
}

/** Independently expressed numerical facts from D07Choi.ph and D08Yeongi.ph. */
export function storyPriceResponse(visitId: string, input: StoryPriceInput): StoryPriceResponse {
  const scriptHookId = getDemoCustomer(visitId).scriptHookId;
  const response: StoryPriceResponse = {
    handled: false, outcome: null, branch: null, scriptHookId, clearContext: false,
    implementation: scriptHookId ? 'unimplemented-script-hook' : 'no-script-hook',
  };
  if (scriptHookId !== 'D07Choi' && scriptHookId !== 'D08Yeongi') return response;
  const { offer, customerValue, priorOffers } = input;
  if (!Number.isFinite(offer) || offer < 0 || !Number.isFinite(customerValue) || customerValue < 0
      || !Number.isInteger(priorOffers) || priorOffers < 0) throw new RangeError('Invalid story price input.');
  response.handled = true;
  response.implementation = 'verified-price-hook';
  if (scriptHookId === 'D07Choi') {
    // Order matters: the over-high check runs before the fixed 45/30 checks.
    if (offer >= customerValue * 2) {
      response.outcome = priorOffers >= 2 ? 'decline-deal' : 'decline-offer';
      response.branch = `p100_${Math.min(3, priorOffers + 1)}`;
    } else if (offer >= 45) {
      response.outcome = 'accept'; response.branch = 'p45';
    } else if (offer >= 30) {
      response.outcome = 'accept'; response.branch = 'p30';
    } else {
      response.outcome = 'decline-deal'; response.branch = 'low';
    }
  } else {
    if (offer >= customerValue * 2) {
      response.outcome = 'decline-offer'; response.branch = '300ormore'; response.clearContext = true;
    } else if (offer >= customerValue * 0.9) {
      response.outcome = 'accept'; response.branch = 'a'; response.clearContext = true;
    } else if (offer >= customerValue * 0.65) {
      response.outcome = 'accept'; response.branch = 'b'; response.clearContext = true;
    } else {
      response.outcome = 'decline-deal'; response.branch = 'c';
    }
  }
  return response;
}
