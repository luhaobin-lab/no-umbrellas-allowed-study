import { getDemoCustomer, type DemoScriptHook } from './demo-customer-data';
import { DEMO_CARDS, DEMO_ITEMS } from './demo-item-data';

/** Serializable, independent implementation of the inspected 1.0.5 Demo hooks. */
export interface StoryContext {
  version: 1;
  visitId: string;
  hook: DemoScriptHook | null;
  left: boolean;
  cardHookActive: boolean;
  priceHookActive: boolean;
  hideHookActive: boolean;
  brandPriceMode: 'initial' | 'why' | 'why2' | 'none';
  brandInitialOffers: number;
  brandFakeDiscussed: boolean;
  brandWrongReason: boolean;
  brandMaterialEstablished: boolean;
  artLowCount: number;
  artArtistCount: number;
  artBestCount: number;
  privateNationalCount: number;
  privatePopularityCount: number;
  privateInitialOffers: number;
  /** Player suggestions since the last context clear; latest is last. */
  suggestedCardIds: string[];
}
export interface StoryCardInput {
  nativeCardId: string;
  hidden: boolean;
  /** Actual source-card correctness; null means unknown, not false. */
  correctCard: boolean | null;
  customerCardIds: readonly string[];
  /** Private cards BEFORE this operation. Rejected public cards are not here. */
  playerCardIds: readonly string[];
  /** Optional authoritative earlier suggestion in this native category, if supplied by a full context engine. */
  discussedCardId?: string | null;
}
export interface StoryOfferInput {
  amount: number;
  customerValue: number;
  customerCardIds: readonly string[];
  playerCardIds: readonly string[];
  /** Counts BEFORE the current offer, within the current source context. */
  playerOffers: number;
  customerOffers: number;
  /** Source EvaluateInfo.numMissingCard, not the number of unknown audit facts. */
  missingCount: number | null;
}
interface StoryResultBase {
  context: StoryContext;
  handled: boolean;
  message: string;
  branch: string | null;
  clearContext: boolean;
  /** A source dependency was unavailable; a fallback is not an exact source result. */
  partial: boolean;
}
export interface StoryCardResult extends StoryResultBase {
  acceptBelief: boolean | null;
  leave: boolean;
  /** Hidden hooks run before insertion. A handled hide does not insert the card. */
  allowHidden: boolean | null;
}
export interface StoryOfferResult extends StoryResultBase {
  outcome: 'refuse' | 'leave' | null;
}

export function createStoryContext(visitId: string): StoryContext {
  const hook = getDemoCustomer(visitId).scriptHookId;
  return {
    version: 1, visitId, hook, left: false,
    cardHookActive: hook !== null, priceHookActive: hook !== null,
    hideHookActive: hook === 'D11PrivateAfter', brandPriceMode: 'initial',
    brandInitialOffers: 0, brandFakeDiscussed: false, brandWrongReason: false,
    brandMaterialEstablished: false, artLowCount: 0, artArtistCount: 0, artBestCount: 0,
    privateNationalCount: 0, privatePopularityCount: 0, privateInitialOffers: 0,
    suggestedCardIds: [],
  };
}

const has = (ids: readonly string[], id: string) => ids.includes(id);
const known = (input: Pick<StoryOfferInput, 'customerCardIds' | 'playerCardIds'>, id: string) =>
  has(input.customerCardIds, id) || has(input.playerCardIds, id);
const messages: Record<string, string> = {
  // Brief independent English paraphrases, not claimed as the original localized lines.
  price: 'Take another look at the bag first.', price2: 'Have you checked the brand?',
  why: 'What makes you think it is fake?', why2: 'That does not explain it.',
  reason: 'Can you give me a reason?', confuse: 'There is nothing wrong with the slogan.',
  material: 'So the material is wrong.', materialFirst: 'The material does prove it.',
  materialAfter: 'We already established the material problem.', bag: 'Are we talking about this bag?',
  green_canvas1: 'Yes, it is canvas.', green_canvas2: 'Canvas, yes. What does that prove?',
  green_canvas3: 'That does not fit what you just told me.',
  ToSuggestedWrongFakeGreedy: 'Now you are changing your story.',
  hueStop: 'Finish the appraisal before discussing a price.', success: 'That is the right assessment.',
  high: 'That assessment is too generous.', low: 'I cannot accept that assessment.', twice: 'You have already said that.',
  mad: 'Enough. I am not selling it.', art: 'What about its artistic value?',
  hue: 'That is not the right assessment of this artwork.', artist: 'That alone does not justify your assessment.',
  best: 'You really think it is a masterpiece?', best2: 'All right, I accept that assessment.', deceased: 'Yes, the artist has passed away.',
  more: 'There is more to this paper. Look again.', happy: 'Yes, that adds value.',
  onHide: 'You have discovered both kinds of value.', hueStopP: 'Do not hide that popularity tag yet.',
  hueStopNH: 'Do not hide that historical value yet.',
  QuestionProfessionalism: 'That appraisal is wrong. I am not selling.',
  ItemNotAppreciated: 'You do not appreciate this item. I am leaving.',
  AppraisalNeeded: 'The appraisal is incomplete. I am leaving.', c: 'Yes, the signature is fake.',
};

function cardBase(source: StoryContext): StoryCardResult {
  return { context: structuredClone(source), handled: false, acceptBelief: null, leave: false,
    allowHidden: null, message: '', branch: null, clearContext: false, partial: false };
}
function cardDecision(r: StoryCardResult, branch: string, accepted: boolean | null, leave = false): StoryCardResult {
  r.handled = true; r.branch = branch; r.message = messages[branch] ?? branch;
  r.acceptBelief = accepted; r.leave = leave; r.context.left = leave;
  return r;
}
function clear(r: StoryResultBase) {
  r.clearContext = true;
  r.context.suggestedCardIds = [];
}

export function onStoryCard(source: StoryContext, input: StoryCardInput): StoryCardResult {
  const r = cardBase(source), s = r.context, id = input.nativeCardId;
  if (s.left) return cardDecision(r, 'ItemNotAppreciated', null, true);
  if (input.hidden) {
    if (s.hook === 'D11PrivateAfter' && s.hideHookActive
        && has(input.playerCardIds, 'blue_nationalhis') && has(input.playerCardIds, 'blue_pop')) {
      // IO.onPlayerAssumeCard invokes the hook before writing the new hidden card.
      s.hideHookActive = false; r.allowHidden = false;
      return cardDecision(r, 'onHide', null);
    }
    r.allowHidden = true;
    return r;
  }
  const meta = DEMO_CARDS[id];
  const earlier = input.discussedCardId !== undefined ? input.discussedCardId
    : meta ? [...s.suggestedCardIds].reverse().find(old => DEMO_CARDS[old]?.category === meta.category) ?? null : null;
  s.suggestedCardIds.push(id);

  if (s.hook === 'D06BrandAfter') {
    if (s.brandMaterialEstablished) {
      // These two source pipes remain after the event removes its initial hooks.
      if (id === 'green_fakeBrand') return cardDecision(r, 'materialAfter', false);
      if (earlier) {
        const definition = getDemoCustomer(s.visitId).itemDefinitionId;
        const references = definition ? DEMO_ITEMS[definition]?.referenceCardIds ?? [] : [];
        if (!has(input.customerCardIds, earlier) || !references.includes(earlier) || input.correctCard === false)
          return cardDecision(r, 'ToSuggestedWrongFakeGreedy', false);
        if (input.correctCard === null) r.partial = true;
      }
      return r;
    }
    if (!s.cardHookActive) return r;
    if (id === 'green_canvas') {
      if (!s.brandFakeDiscussed) return cardDecision(r, 'green_canvas1', true);
      return cardDecision(r, s.brandWrongReason ? 'green_canvas3' : 'green_canvas2', !s.brandWrongReason);
    }
    if (id === 'green_fakeBrand') {
      s.brandFakeDiscussed = true; s.brandPriceMode = 'why'; s.priceHookActive = true;
      return cardDecision(r, 'reason', false);
    }
    if (id === 'green_fakeBrandText') {
      s.brandWrongReason = true; s.brandPriceMode = 'why2'; s.priceHookActive = true;
      return cardDecision(r, 'confuse', false);
    }
    if (id === 'green_fakeBrandMaterial') {
      s.brandMaterialEstablished = true; s.cardHookActive = false; s.priceHookActive = false;
      s.brandPriceMode = 'none'; clear(r);
      return cardDecision(r, s.brandFakeDiscussed ? 'materialFirst' : 'material', true);
    }
    if (meta?.category === 'brand' && meta.tier >= 3) {
      s.brandWrongReason = true; s.brandPriceMode = 'why2'; s.priceHookActive = true;
      return cardDecision(r, 'bag', false);
    }
    if (!meta) { r.partial = true; return r; }
    if (s.brandWrongReason) return cardDecision(r, 'why2', false);
    if (s.brandFakeDiscussed) {
      // The source rebinds (f,f2) to (old f2,true), not (true,true).
      s.brandFakeDiscussed = s.brandWrongReason;
      s.brandWrongReason = true; s.brandPriceMode = 'why2'; s.priceHookActive = true;
      return cardDecision(r, 'why', false);
    }
    return r;
  }

  if (s.hook === 'D08ArtHue' && s.cardHookActive) {
    if (id === 'green_art_good') {
      s.priceHookActive = false; clear(r);
      return cardDecision(r, 'success', true);
    }
    if (id === 'green_art_worst' || id === 'green_art_bad') {
      const n = s.artLowCount++;
      return cardDecision(r, n === 0 ? 'low' : n === 1 ? 'twice' : 'mad', n >= 2 ? null : false, n >= 2);
    }
    if (['green_art_artist', 'green_art_best', 'green_art_deceased'].includes(id))
      return cardDecision(r, 'high', false);
    return r;
  }

  if (s.hook === 'D08ArtAfter' && s.cardHookActive) {
    if (['green_art_worst', 'green_art_bad', 'green_art_good'].includes(id)) {
      const n = s.artLowCount++;
      return cardDecision(r, n >= 2 ? 'mad' : 'hue', false, n >= 2);
    }
    if (id === 'green_art_artist') {
      const n = s.artArtistCount++;
      return cardDecision(r, n >= 2 ? 'mad' : 'artist', false, n >= 2);
    }
    if (id === 'green_art_deceased') return cardDecision(r, 'deceased', true);
    if (id === 'green_art_best') {
      const n = s.artBestCount++;
      if (n >= 2) s.cardHookActive = false;
      return cardDecision(r, n >= 2 ? 'best2' : 'best', n >= 2);
    }
    return r;
  }

  if (s.hook === 'D11PrivateAfter' && s.cardHookActive) {
    if (id === 'blue_nationalhis') {
      if (s.privateNationalCount >= 2) return r;
      const n = s.privateNationalCount++;
      s.priceHookActive = false;
      return cardDecision(r, n === 0 ? 'hueStop' : 'happy', n > 0);
    }
    if (id === 'blue_pop') {
      // Original ch tests x (national counter), not y, even for popularity.
      if (s.privateNationalCount >= 2) return r;
      s.privatePopularityCount = s.privateNationalCount === 0 ? 1 : 2;
      s.priceHookActive = false;
      return cardDecision(r, s.privateNationalCount === 0 ? 'hueStop' : 'happy', s.privateNationalCount > 0);
    }
    return r;
  }
  if (s.hook === 'UnWilling') {
    if (input.correctCard === false) return cardDecision(r, 'QuestionProfessionalism', false, true);
    if (input.correctCard === null) r.partial = true;
    return r;
  }
  if (s.hook === 'D07Choi' && id === 'blue_fakesign') return cardDecision(r, 'c', true);
  return r;
}

export interface StoryDeclineResult extends StoryResultBase {
  /** Source failHaggle marks failure immediately; a chunk-only branch awaits its event script. */
  failImmediately: boolean;
}

/** Explicit give-up hooks; chunk-only branches must not be mistaken for immediate source failure. */
export function onStoryDecline(source: StoryContext, input: Pick<StoryOfferInput, 'customerCardIds' | 'playerCardIds'>): StoryDeclineResult {
  const r: StoryDeclineResult = { context: structuredClone(source), handled: false,
    failImmediately: false, message: '', branch: null, clearContext: false, partial: false };
  const finish = (branch: string | null, fail: boolean) => {
    r.handled = true; r.failImmediately = fail; r.branch = branch;
    r.message = branch === null ? '' : messages[branch] ?? 'Check the important details first.';
    r.context.left = fail;
    return r;
  };
  if (source.hook === 'D06BrandAfter') return has(input.customerCardIds, 'green_fakeBrandMaterial')
    ? finish(null, true) : finish('playerGiveUpWithoutFakeMaterial', false);
  if (source.hook === 'D08ArtHue') return has(input.customerCardIds, 'green_art_artist')
    ? finish('playerGiveUpWithArtist', false) : finish(null, true);
  if (source.hook === 'D08ArtAfter') return input.customerCardIds.some(id => DEMO_CARDS[id]?.category === 'art')
    ? finish(null, true) : finish('playerGiveUpWithoutArt', false);
  if (source.hook === 'D11PrivateAfter') return known(input, 'blue_pop') && known(input, 'blue_nationalhis')
    ? finish(null, true) : finish('playerGiveUpWithoutPopHist', false);
  if (source.hook === 'D07Choi') return finish('low', false);
  return r;
}

function offerDecision(r: StoryOfferResult, branch: string, leave = false): StoryOfferResult {
  r.handled = true; r.branch = branch; r.message = messages[branch] ?? branch;
  r.outcome = leave ? 'leave' : 'refuse'; r.context.left = leave;
  return r;
}

export function onStoryOffer(source: StoryContext, input: StoryOfferInput): StoryOfferResult {
  const r: StoryOfferResult = { context: structuredClone(source), handled: false, outcome: null,
    message: '', branch: null, clearContext: false, partial: false };
  const s = r.context;
  if (s.left) return offerDecision(r, 'ItemNotAppreciated', true);
  if (s.hook === 'D06BrandAfter') {
    if (s.brandPriceMode === 'none') return r;
    if (s.brandPriceMode === 'initial') {
      const n = s.brandInitialOffers++;
      if (n > 0) { s.brandPriceMode = 'none'; s.priceHookActive = false; }
      return offerDecision(r, n === 0 ? 'price' : 'price2');
    }
    if (s.brandPriceMode === 'why') {
      s.brandPriceMode = 'why2'; s.brandFakeDiscussed = true; s.brandWrongReason = true;
      return offerDecision(r, 'why');
    }
    return offerDecision(r, 'why2');
  }
  if (s.hook === 'D08ArtHue' && s.priceHookActive) return offerDecision(r, 'hueStop');
  if (s.hook === 'D08ArtAfter' && !has(input.customerCardIds, 'green_art_best') && !has(input.customerCardIds, 'green_art_deceased')) {
    clear(r); return offerDecision(r, 'art');
  }
  if (s.hook === 'D11PrivateAfter' && s.priceHookActive) {
    if (known(input, 'blue_nationalhis') || known(input, 'blue_pop') || s.privateInitialOffers >= 2) return r;
    s.privateInitialOffers++; clear(r); return offerDecision(r, 'more');
  }
  if (s.hook === 'UnWilling') {
    // IO.onPlayerAssertPrice inserts the current offer before invoking the hook.
    if (input.playerOffers + input.customerOffers + 1 > 1) return offerDecision(r, 'ItemNotAppreciated', true);
    if (input.missingCount === null) { r.partial = true; return r; }
    if (input.missingCount >= 2) return offerDecision(r, 'AppraisalNeeded', true);
    if (input.customerValue <= 0) { r.partial = true; return r; }
    if (input.amount / input.customerValue > 1.5) return offerDecision(r, 'ItemNotAppreciated', true);
  }
  return r;
}
