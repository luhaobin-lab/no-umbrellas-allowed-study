import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getDemoCustomer, DEMO_CUSTOMER_FACTS } from './demo-customer-data';
import { storyPriceResponse } from './story-negotiation';

test('source binds all visits without giving unknown customers a made-up personality', () => {
  const facts = Object.values(DEMO_CUSTOMER_FACTS);
  assert.equal(facts.length, 53);
  assert.equal(facts.filter(f => f.status === 'matched-script').length, 10);
  assert.equal(facts.filter(f => f.personality === 'active').length, 6);
  assert.equal(facts.filter(f => f.personality === 'wishy-washy').length, 4);
  assert.equal(getDemoCustomer('day7-fixie-bag').personality, null); // Demo pointer not established; video evidence is separate.
  assert.equal(getDemoCustomer('day7-backpack-resale').personality, null); // Same item is not the same NPC.
  assert.equal(getDemoCustomer('day9-black-umbrella-sale').eventId, null); // Purchase event cannot prove this buyer.
  assert.equal(getDemoCustomer('unknown').personality, null);
});

test('default NPC assumptions remain separate from true properties and opening offers', () => {
  const f = getDemoCustomer('day9-time-device');
  assert.deepEqual(f.defaultAssumptionIds, ['gray_machine', 'blue_fairlydmg', 'green_plastic']);
  assert.equal(f.initialAskingPrice, null);
  assert.equal(f.characterId, 'random_female_3040');
  f.defaultAssumptionIds.length = 0;
  assert.equal(getDemoCustomer('day9-time-device').defaultAssumptionIds.length, 3);
});

test('Choi exact boundaries and third over-high departure', () => {
  const price = (offer: number, priorOffers = 0, customerValue = 50) => storyPriceResponse('day7-crabgrass', { offer, priorOffers, customerValue });
  assert.equal(price(29).outcome, 'decline-deal');
  assert.equal(price(30).branch, 'p30');
  assert.equal(price(44).branch, 'p30');
  assert.equal(price(45).branch, 'p45');
  assert.equal(price(99).outcome, 'accept');
  assert.equal(price(100).outcome, 'decline-offer');
  assert.equal(price(100, 1).branch, 'p100_2');
  assert.equal(price(100, 2).outcome, 'decline-deal');
  assert.equal(price(45, 0, 20).outcome, 'decline-offer'); // High check precedes fixed floor.
});

test('Yeongi uses current customer estimate with 65%, 90% and 200% boundaries', () => {
  const price = (offer: number, customerValue = 200) => storyPriceResponse('day8-doll', { offer, customerValue, priorOffers: 0 });
  assert.equal(price(129).outcome, 'decline-deal');
  assert.equal(price(130).branch, 'b');
  assert.equal(price(180).branch, 'a');
  assert.equal(price(399).outcome, 'accept');
  assert.equal(price(400).outcome, 'decline-offer');
  assert.equal(price(400).clearContext, true);
  assert.equal(price(129).clearContext, false);
  assert.equal(price(130, 300).outcome, 'decline-deal');
});

test('unimplemented source hooks and unrelated customers cannot silently claim exact handling', () => {
  const input = { offer: 100, customerValue: 100, priorOffers: 0 };
  assert.equal(storyPriceResponse('day8-rabbit', input).implementation, 'unimplemented-script-hook');
  assert.equal(storyPriceResponse('day8-rabbit', input).handled, false);
  assert.equal(storyPriceResponse('day7-backpack-resale', input).implementation, 'no-script-hook');
});
