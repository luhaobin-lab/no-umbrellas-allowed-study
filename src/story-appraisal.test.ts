import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  createStoryContext, onStoryCard, onStoryOffer, onStoryDecline,
  type StoryContext, type StoryCardInput, type StoryOfferInput,
} from './story-appraisal';

const card = (s: StoryContext, id: string, extra: Partial<StoryCardInput> = {}) => onStoryCard(s, {
  nativeCardId: id, hidden: false, correctCard: true, customerCardIds: [], playerCardIds: [], ...extra,
});
const offer = (s: StoryContext, extra: Partial<StoryOfferInput> = {}) => onStoryOffer(s, {
  amount: 100, customerValue: 100, customerCardIds: [], playerCardIds: [],
  playerOffers: 0, customerOffers: 0, missingCount: 0, ...extra,
});

test('backpack blocks two direct prices, then gives control back to normal pricing', () => {
  const start = createStoryContext('day6-backpack-soldier');
  const first = offer(start), second = offer(first.context), third = offer(second.context);
  assert.equal(first.branch, 'price');
  assert.equal(second.branch, 'price2');
  assert.equal(third.handled, false);
  assert.equal(start.brandInitialOffers, 0); // Pure transition, safe to serialize/replay.
  assert.equal(second.context.brandPriceMode, 'none');
  const fakeAfterUnlock = card(second.context, 'green_fakeBrand');
  assert.equal(offer(fakeAfterUnlock.context).branch, 'why');
});

test('backpack requires the material evidence and retains its post-proof pipes', () => {
  let s = createStoryContext('day6-backpack-soldier');
  const fake = card(s, 'green_fakeBrand'); s = fake.context;
  assert.equal(fake.acceptBelief, false);
  assert.equal(card(s, 'green_canvas').branch, 'green_canvas2');
  const demanded = offer(s); s = demanded.context;
  assert.equal(demanded.branch, 'why');
  assert.equal(card(s, 'green_canvas').acceptBelief, false);
  const proof = card(s, 'green_fakeBrandMaterial'); s = proof.context;
  assert.equal(proof.acceptBelief, true);
  assert.equal(proof.branch, 'materialFirst');
  assert.equal(proof.clearContext, true);
  assert.deepEqual(s.suggestedCardIds, []);
  assert.equal(offer(s).handled, false);
  assert.equal(card(s, 'green_fakeBrand').branch, 'materialAfter');
  const wrongCorrection = card(s, 'green_easyenough', { discussedCardId: 'green_fakeBrandMaterial', customerCardIds: ['green_fakeBrandMaterial'] });
  assert.equal(wrongCorrection.branch, 'ToSuggestedWrongFakeGreedy');
});

test('backpack preserves counterintuitive source flag rebindings rather than normalizing them', () => {
  const init = createStoryContext('day6-backpack-soldier');
  const textFirst = card(init, 'green_fakeBrandText');
  assert.equal(card(textFirst.context, 'green_canvas').branch, 'green_canvas1');
  let s = card(init, 'green_fakeBrand').context;
  const other = card(s, 'green_gold'); // No such native card is evidence unknown.
  assert.equal(other.partial, true);
  const unrelated = card(s, 'green_wood'); s = unrelated.context;
  assert.equal(unrelated.branch, 'why');
  assert.equal(s.brandFakeDiscussed, false);
  assert.equal(card(s, 'green_canvas').branch, 'green_canvas1');
  assert.equal(card(init, 'green_fakeBrandYear').branch, 'bag');
  assert.equal(card(init, 'green_fakeBrandMaterial').branch, 'material');
});

test('backpack context remembers repeated categories after a proof clear', () => {
  let s = card(createStoryContext('day6-backpack-soldier'), 'green_fakeBrandMaterial').context;
  const first = card(s, 'green_canvas'); s = first.context;
  assert.equal(first.handled, false);
  const second = card(s, 'green_canvas', { customerCardIds: ['green_canvas'] });
  assert.equal(second.acceptBelief, false); // Earlier Canvas is not in the native reference-card list.
});

test('Mona Lisa requires Good Art; low grades share a three-attempt counter', () => {
  let s = createStoryContext('day8-gioconda');
  assert.equal(offer(s).branch, 'hueStop');
  const hidden = card(s, 'green_art_good', { hidden: true });
  assert.equal(hidden.handled, false);
  assert.equal(offer(hidden.context).handled, true);
  const high = card(s, 'green_art_best');
  assert.equal(high.acceptBelief, false);
  const good = card(s, 'green_art_good'); s = good.context;
  assert.equal(good.acceptBelief, true);
  assert.equal(good.clearContext, true);
  assert.equal(offer(s).handled, false);
  const one = card(s, 'green_art_worst'), two = card(one.context, 'green_art_bad');
  const three = card(two.context, 'green_art_worst');
  assert.equal(one.branch, 'low');
  assert.equal(two.branch, 'twice');
  assert.equal(three.leave, true);
});

test('rabbit will not price hidden art evidence or an unaccepted assertion', () => {
  const s = createStoryContext('day8-rabbit');
  assert.equal(offer(s, { playerCardIds: ['green_art_deceased'] }).handled, true);
  assert.equal(offer(s).clearContext, true);
  const deceased = card(s, 'green_art_deceased');
  assert.equal(deceased.acceptBelief, true);
  assert.equal(offer(deceased.context).handled, true); // Caller has not committed the belief yet.
  assert.equal(offer(deceased.context, { customerCardIds: ['green_art_deceased'] }).handled, false);
});

test('rabbit art counters are independent; the third Masterpiece removes its card hook', () => {
  let s = createStoryContext('day8-rabbit');
  s = card(s, 'green_art_artist').context;
  s = card(s, 'green_art_best').context;
  s = card(s, 'green_art_good').context;
  s = card(s, 'green_art_best').context;
  const third = card(s, 'green_art_best');
  assert.equal(third.acceptBelief, true);
  assert.equal(third.branch, 'best2');
  assert.equal(third.context.artArtistCount, 1);
  assert.equal(third.context.artLowCount, 1);
  assert.equal(card(third.context, 'green_art_bad').handled, false);
  s = createStoryContext('day8-rabbit');
  s = card(s, 'green_art_bad').context;
  s = card(s, 'green_art_good').context;
  assert.equal(card(s, 'green_art_worst').leave, true);
  s = createStoryContext('day8-rabbit');
  s = card(s, 'green_art_artist').context;
  s = card(s, 'green_art_artist').context;
  assert.equal(card(s, 'green_art_artist').leave, true);
});

test('meaningful paper knowledge and price-hook removal use separate source state', () => {
  const s = createStoryContext('day11-meaningful-paper');
  const one = offer(s), two = offer(one.context), three = offer(two.context);
  assert.equal(one.branch, 'more'); assert.equal(one.clearContext, true);
  assert.equal(two.branch, 'more'); assert.equal(three.handled, false);
  assert.equal(offer(s, { playerCardIds: ['blue_pop'] }).handled, false);
  assert.equal(offer(s, { customerCardIds: ['blue_nationalhis'] }).handled, false);
  const refused = card(s, 'blue_nationalhis');
  assert.equal(refused.acceptBelief, false);
  assert.equal(offer(refused.context).handled, false); // Even its refused first assertion removes the price hook.
});

test('meaningful paper retains the actual asymmetric popularity counter', () => {
  let s = createStoryContext('day11-meaningful-paper');
  for (let n = 0; n < 3; n++) { const r = card(s, 'blue_pop'); assert.equal(r.acceptBelief, false); s = r.context; }
  s = card(s, 'blue_nationalhis').context;
  const pop = card(s, 'blue_pop');
  assert.equal(pop.acceptBelief, true);
  assert.equal(pop.context.privateNationalCount, 1);
  assert.equal(pop.context.privatePopularityCount, 2);
  const national = card(pop.context, 'blue_nationalhis');
  assert.equal(national.acceptBelief, true);
  assert.equal(card(national.context, 'blue_pop').handled, false);
});

test('meaningful paper hide hook reads the old private slots and suppresses insertion exactly once', () => {
  const s = createStoryContext('day11-meaningful-paper');
  const first = card(s, 'blue_nationalhis', { hidden: true });
  const second = card(first.context, 'blue_pop', { hidden: true, playerCardIds: ['blue_nationalhis'] });
  assert.equal(first.allowHidden, true); assert.equal(second.allowHidden, true);
  const both = ['blue_nationalhis', 'blue_pop'];
  const third = card(second.context, 'green_paper', { hidden: true, playerCardIds: both });
  assert.equal(third.handled, true); assert.equal(third.allowHidden, false);
  assert.equal(third.acceptBelief, null); assert.equal(third.branch, 'onHide');
  assert.equal(card(third.context, 'green_paper', { hidden: true, playerCardIds: both }).allowHidden, true);
});

test('unwilling seller leaves on wrong cards but never converts unknown evidence to guilt', () => {
  const s = createStoryContext('day8-fantastic-hoverboard');
  assert.equal(card(s, 'green_paper', { correctCard: false }).leave, true);
  assert.equal(card(s, 'green_unknown', { correctCard: null }).partial, true);
  assert.equal(card(s, 'green_unknown', { correctCard: null }).leave, false);
  assert.equal(card(s, 'green_paper', { correctCard: false, hidden: true }).leave, false);
});

test('unwilling offer checks include the current offer and preserve strict 1.5 boundary', () => {
  const s = createStoryContext('day8-fantastic-hoverboard');
  assert.equal(offer(s, { amount: 150 }).handled, false);
  assert.equal(offer(s, { amount: 151 }).outcome, 'leave');
  assert.equal(offer(s, { playerOffers: 1 }).outcome, 'leave');
  assert.equal(offer(s, { customerOffers: 1 }).outcome, 'leave');
  assert.equal(offer(s, { missingCount: 2 }).branch, 'AppraisalNeeded');
  assert.equal(offer(s, { missingCount: null }).partial, true);
  assert.equal(offer(s, { missingCount: null }).handled, false);
});

test('give-up hooks distinguish immediate source failure from a pending narrative branch', () => {
  const input = { customerCardIds: [], playerCardIds: [] };
  const bag = createStoryContext('day6-backpack-soldier');
  assert.equal(onStoryDecline(bag, input).failImmediately, false);
  assert.equal(onStoryDecline(bag, { ...input, customerCardIds: ['green_fakeBrandMaterial'] }).failImmediately, true);
  const rabbit = createStoryContext('day8-rabbit');
  assert.equal(onStoryDecline(rabbit, input).branch, 'playerGiveUpWithoutArt');
  assert.equal(onStoryDecline(rabbit, { ...input, customerCardIds: ['green_art_deceased'] }).failImmediately, true);
  const paper = createStoryContext('day11-meaningful-paper');
  assert.equal(onStoryDecline(paper, { customerCardIds: ['blue_pop'], playerCardIds: ['blue_nationalhis'] }).failImmediately, true);
});

test('unknown, ordinary and resale visits do not acquire a story hook through their item identity', () => {
  for (const id of ['unknown', 'day7-backpack-resale', 'day8-avac-card', 'day11-rabbit-sale']) {
    const s = createStoryContext(id);
    assert.equal(card(s, 'green_fakeBrand').handled, false);
    assert.equal(offer(s).handled, false);
  }
});
