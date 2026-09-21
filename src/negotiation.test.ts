import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNegotiation, offer, tick, updateAppraisal, MODEL_PARAMETERS, type NegotiationInput, type NegotiationState } from './negotiation';

const defaults: NegotiationInput = { side: 'buy', fairValue: 100, publicValue: 100, initialPublicValue: 100, personality: 'patient', seed: 71, reputation: 0 };
const create = (changes: Partial<NegotiationInput> = {}) => createNegotiation({ ...defaults, ...changes });

test('negotiation separates demo-derived facts from provisional behavior and outcome data', () => {
  assert.equal(MODEL_PARAMETERS.status, 'partially-demo-derived');
  assert.ok(MODEL_PARAMETERS.provisional);
  assert.equal(MODEL_PARAMETERS.source.applicationVersion, '1.0.5 Demo');
  const code = readFileSync(new URL('./negotiation.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /from\s+['"].*(?:reference-|data|engine)/);
  assert.doesNotMatch(code, /visitId|finalPrice|quotes\[/);
});
test('same seed and input reproduce decisions through serialization', () => {
  const a = offer(create(), 30);
  const b = offer(create(), 30);
  assert.deepEqual(a, b);
  assert.deepEqual(offer(JSON.parse(JSON.stringify(a.state)), 65), offer(a.state, 65));
});
test('irrelevant injected source prices cannot alter the model', () => {
  const injected = createNegotiation({ ...defaults, finalPrice: 1, visitId: 'anything', sourceCash: 999999 } as NegotiationInput);
  assert.deepEqual(injected, create());
});
test('a different seed can vary temperament without depending on visit order', () => {
  const timers = Array.from({ length: 20 }, (_, seed) => create({ seed, personality: 'hurried' }).nagIntervals.join(','));
  assert.ok(new Set(timers).size > 10);
  assert.deepEqual(create({ seed: 9 }), create({ seed: 9 }));
});
test('independent value scale changes the actual ask, not a recorded target', () => {
  const small = offer(create(), 50);
  const large = offer(create({ fairValue: 1000, publicValue: 1000, initialPublicValue: 1000 }), 500);
  assert.equal(small.outcome, 'counter');
  assert.equal(large.outcome, 'counter');
  assert.ok(large.counter! > small.counter! * 9);
  assert.ok(Math.abs(large.counter! - small.counter! * 10) < 10);
});
test('correct public appraisal can change acceptance while private value stays private', () => {
  const before = create({ fairValue: 50 });
  const after = updateAppraisal(before, { fairValue: 50, publicValue: 50 });
  assert.notEqual(offer(before, 50).outcome, 'accepted');
  assert.equal(offer(after, 50).outcome, 'accepted');
  const privatePositive = create({ fairValue: 1000 });
  assert.equal(offer(privatePositive, 100).outcome, 'accepted');
});
test('lower positive offers cannot immediately buy valuable goods; repeated insults terminate', () => {
  let state = create();
  for (let i = 0; i < 20 && state.status !== 'left'; i++) {
    const result = offer(state, 0);
    assert.notEqual(result.outcome, 'accepted');
    state = result.state;
  }
  assert.equal(state.status, 'left');
  assert.equal(offer(state, 1000).outcome, 'left');
});
test('seller counter is no better for player than the rejected offer', () => {
  for (const seed of [0, 1, 2, 42, 917]) {
    const result = offer(create({ seed }), 50);
    assert.equal(result.outcome, 'counter');
    assert.ok(result.counter! > 50);
    assert.equal(offer(result.state, result.counter!).outcome, 'accepted');
  }
});
test('invalid prices do not consume offers, patience or history', () => {
  const state = create();
  for (const price of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const result = offer(state, price);
    assert.equal(result.outcome, 'rejected');
    assert.equal(result.state.offers, 0);
    assert.equal(result.state.irritation, 0);
    assert.equal(result.state.history.length, 0);
  }
});
test('patient guests are not subject to an invented universal time limit', () => {
  const patient = tick(create(), 10000);
  assert.equal(patient.status, 'open');
  assert.equal(offer(patient, 100).outcome, 'accepted');
});
test('hurried guest can time out and cannot be revived by a late high offer', () => {
  const state = tick(create({ personality: 'hurried' }), 10000);
  assert.equal(state.status, 'left');
  assert.equal(state.departureReason, 'time');
  assert.equal(offer(state, 1000).outcome, 'left');
});
test('timer advances equivalently in chunks and rejects invalid time', () => {
  const state = create({ personality: 'hurried' });
  assert.deepEqual(tick(tick(state, 10), 20), tick(state, 30));
  assert.throws(() => tick(state, -1), RangeError);
  assert.throws(() => tick(state, NaN), RangeError);
});
test('Busy modifier accepts a mild correction but can leave after a severe value loss', () => {
  const mild = updateAppraisal(create({ personality: 'hurried' }), { fairValue: 90, publicValue: 90 });
  assert.equal(mild.publicValue, 90);
  assert.equal(mild.appraisalReaction, 'accepted');
  const severe = updateAppraisal(create({ personality: 'hurried' }), { fairValue: 50, publicValue: 50 });
  assert.equal(severe.publicValue, 50);
  assert.equal(severe.status, 'left');
});
test('frightened Demo modifier keeps its earlier ask after multiple positive cards', () => {
  let state = create({ personality: 'scared' });
  assert.equal(state.counter, 60);
  state = updateAppraisal(state, { fairValue: 120, publicValue: 120 });
  state = updateAppraisal(state, { fairValue: 140, publicValue: 140 });
  assert.notEqual(state.status, 'left');
  assert.equal(state.counter, 60);
  assert.equal(offer(state, 140).outcome, 'left');
});
test('fixie can refuse newly offered subjective information', () => {
  const state = updateAppraisal(create({ personality: 'fixie' }), { fairValue: 120, publicValue: 120, subjectivePublicCards: 1 });
  assert.equal(state.publicValue, 100);
  assert.equal(state.appraisalReaction, 'rejected-subjective');
});
test('aggregate error counts cannot invent a native NPC refusal without card history', () => {
  const initial = create({ incorrectPublicCards: 3 });
  assert.equal(offer(initial, 100).outcome, 'accepted');
  assert.equal(initial.native.context.some(a => a.type === 'PlayerSuggestCard'), false);
});
test('a buyer accepts a cheap actual listing; terminal deal is not accepted twice', () => {
  const result = offer(create({ side: 'sell', listingPrice: 50 }), 50);
  assert.equal(result.outcome, 'accepted');
  assert.equal(result.state.acceptedAmount, 50);
  assert.equal(offer(result.state, 50).outcome, 'rejected');
});
test('buyer counters an excessive listing only once; player cannot haggle repeatedly', () => {
  const result = offer(create({ side: 'sell', listingPrice: 500 }), 500);
  assert.equal(result.outcome, 'counter');
  assert.ok(result.counter! < 500);
  for (const amount of [400, 300, 200, result.counter!]) {
    const retry = offer(result.state, amount);
    assert.equal(retry.outcome, 'rejected');
    assert.equal(retry.counter, result.counter);
    assert.equal(retry.state.offers, 1);
  }
});
test('buyer response uses actual fair value and explicit errors, not inflated tags', () => {
  const honest = offer(create({ side: 'sell', listingPrice: 500 }), 500);
  const wrong = offer(create({ side: 'sell', fairValue: 50, publicValue: 1000, listingPrice: 500, incorrectPublicCards: 3 }), 500);
  assert.equal(wrong.outcome, 'counter');
  assert.ok(wrong.counter! < honest.counter!);
  assert.ok(wrong.state.native.unknownFacts.includes('saleMandatoryFeedback'));
});
test('renaming a listing during the active buyer request is refused', () => {
  const state = create({ side: 'sell', listingPrice: 500 });
  const result = offer(state, 100);
  assert.equal(result.outcome, 'rejected');
  assert.equal(result.state.offers, 0);
});
test('transitions do not mutate input and contain no wallet or stock', () => {
  const state = create();
  const saved = structuredClone(state);
  offer(state, 25); tick(state, 10); updateAppraisal(state, { fairValue: 75, publicValue: 75 });
  assert.deepEqual(state, saved);
  assert.equal('cash' in state, false);
  assert.equal('stock' in state, false);
});
test('unsupported or corrupted domain input fails before creating a negotiation', () => {
  assert.throws(() => create({ fairValue: -1 }), RangeError);
  assert.throws(() => create({ seed: Infinity }), RangeError);
  assert.throws(() => create({ incorrectPublicCards: 0.1 }), RangeError);
  assert.throws(() => create({ personality: 'missing' as NegotiationState['personality'] }), RangeError);
});

// Independently stated numerical fixtures from the inspected Demo branches.
test('Demo Active initial boundary is 70 percent, not a seed-dependent target', () => {
  for (const seed of [0, 1, 71, 700]) {
    assert.equal(offer(create({ personality: 'active', seed }), 70).outcome, 'accepted');
    const below = offer(create({ personality: 'active', seed }), 69);
    assert.equal(below.outcome, 'counter');
    assert.equal(below.counter, 70);
    assert.equal(offer(create({ personality: 'active', seed }), 30).outcome, 'rejected');
  }
});
test('Demo Fixie is 80 percent; the later guide approximation of 70 is not used', () => {
  assert.equal(offer(create({ personality: 'fixie' }), 80).outcome, 'accepted');
  assert.equal(offer(create({ personality: 'fixie' }), 79).counter, 80);
});
test('Demo WishyWashy initial branch differs from Active', () => {
  assert.equal(offer(create({ personality: 'wishy-washy' }), 80).outcome, 'accepted');
  assert.equal(offer(create({ personality: 'wishy-washy' }), 79).outcome, 'rejected');
});
test('Demo frustrated reported profile uses a truncated twenty-percent threshold', () => {
  assert.equal(offer(create({ personality: 'fearless', publicValue: 99, fairValue: 99, initialPublicValue: 99 }), 19).outcome, 'accepted');
  assert.equal(offer(create({ personality: 'fearless', publicValue: 99, fairValue: 99, initialPublicValue: 99 }), 18).counter, 19);
});
test('Demo Active accepts a halfway concession after a sufficiently high preceding offer', () => {
  const first = offer(create({ personality: 'active' }), 60);
  assert.equal(first.counter, 70);
  assert.equal(offer(first.state, 65).outcome, 'accepted');
});
test('Horong modifies the initial response without affecting public valuation', () => {
  const baseline = Array.from({ length: 100 }, (_, seed) => offer(create({ seed }), 67).outcome);
  const flower = Array.from({ length: 100 }, (_, seed) => offer(create({ seed, flower: true }), 67).outcome);
  assert.equal(baseline.filter(x => x === 'accepted').length, 0);
  const accepted = flower.filter(x => x === 'accepted').length;
  assert.ok(accepted > 10 && accepted < 80);
});
test('updating private value does not clear a live public counter or reset patience', () => {
  const first = offer(create(), 60).state;
  const changed = updateAppraisal(first, { fairValue: 500, publicValue: 100 });
  assert.equal(changed.counter, 70);
  assert.equal(changed.customerOffers, first.customerOffers);
  assert.equal(changed.appraisalEvents, first.appraisalEvents);
});
