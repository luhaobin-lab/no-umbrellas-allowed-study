import {browserExecutable} from './browser-executable.mjs';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5174';
const output = new URL('../artifacts/qa/free-play/', import.meta.url);
await mkdir(output, { recursive: true });
const report = {
  url, startedAt: new Date().toISOString(), passed: false,
  policy: 'Fresh browser contexts; real UI input only. Game text and localStorage are read-only. No source transaction prices imported.',
  scenarios: [], browserErrors: [], blocked: [],
};
const browser = await chromium.launch({
  headless: true,
  executablePath: browserExecutable,
});
let current;
async function setup(name, campaign = 'story') {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const record = { name, passed: false, checks: [], screenshots: [], errors: [] };
  report.scenarios.push(record);
  page.on('pageerror', e => { record.errors.push(String(e)); report.browserErrors.push({ name, error: String(e) }); });
  page.on('console', message => { if (message.type() === 'error') { const error = message.text(); record.errors.push(error); report.browserErrors.push({ name, error }); } });
  page.on('requestfailed', request => report.browserErrors.push({ name, error: `${request.url()}: ${request.failure()?.errorText}` }));
  current = { name, page, context, record };
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  record.buildScript = await page.locator('script[type="module"][src]').first().getAttribute('src');
  if (process.env.EXPECTED_BUILD) assert.ok(record.buildScript?.endsWith(process.env.EXPECTED_BUILD), `Unexpected browser build: ${record.buildScript}`);
  await page.locator(campaign === 'challenge' ? '#challenge' : '#new-game').click();
  await page.waitForTimeout(180);
  return current;
}
const ownership = stock => stock.map(item => ({ id: item.id, title: item.title, paid: item.paid, listing: item.listing }));
const state = () => current.page.evaluate(() => JSON.parse(window.render_game_to_text()));
const exists = async id => (await current.page.locator(`#${id}`).count()) > 0;
async function click(id) { await current.page.locator(`#${id}`).click({ timeout: 3500 }); await current.page.waitForTimeout(90); }
async function screenshot(name) {
  const target = fileURLToPath(new URL(`${current.name}-${name}.png`, output));
  await current.page.screenshot({ path: target });
  current.record.screenshots.push(target);
}
function check(name, details = {}) { current.record.checks.push({ name, ...details }); }
async function openCalculator() {
  if ((await state()).calculatorOpen) return;
  if (await exists('calculator-toggle')) await click('calculator-toggle');
  else if (await exists('sales-customer')) await click('sales-customer');
  else throw new Error('No accessible calculator for this customer.');
}
async function inputOffer(amount) {
  await openCalculator();
  await click('key-clear');
  for (const digit of String(amount)) await click(`key-${digit}`);
  assert.equal(Number((await state()).quote), amount, 'Calculator changed the entered offer.');
  assert.equal(Number(await current.page.locator('#quote-input').inputValue()), amount, 'Keyboard input and canvas quote diverged.');
  if (!current.record.enteredOfferScreenshot) {
    await screenshot('entered-offer');
    current.record.enteredOfferScreenshot = true;
  }
  await click('offer');
}
async function offerUntilResponse(amount) {
  // Some native customer scripts reject a proposal without entering generic
  // bargaining. Respond to that actual UI feedback; never assume a fixed
  // number of refusals or import a recorded deal price.
  const attempts = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    await inputOffer(amount);
    const response = await state();
    attempts.push({ offered: amount, phase: response.phase, counter: response.counter, result: response.result, dialogue: response.dialogue });
    if (attempt === 0) await screenshot('first-price-response');
    if (response.phase === 'settled' || Number.isFinite(response.counter) && response.counter > 0) {
      check('Quoted through real customer feedback within six UI attempts', { attempts });
      return response;
    }
    assert.ok(['appraise', 'offer'].includes(response.phase), `Unexpected state after a price refusal: ${response.phase}`);
  }
  check('Six live UI proposals produced no counter or settlement', { attempts });
  throw new Error('Customer feedback produced neither a counter nor settlement within six UI proposals.');
}
async function acceptCurrentCounter(response) {
  assert.ok(Number.isFinite(response.counter) && response.counter > 0, 'No current counter exists to accept.');
  assert.ok(response.counter <= response.cash, 'The current counter cannot be afforded in this scenario.');
  await openCalculator();
  const acceptId = await exists('accept') ? 'accept' : await exists('accept-offer') ? 'accept-offer' : null;
  assert.ok(acceptId, 'No accept-counter control is available.');
  await click(acceptId);
  return state();
}
async function dragCard(id, target = { x: 220, y: 568 }) {
  const box = await current.page.locator(`#${id}`).boundingBox();
  assert.ok(box, `The visible book card ${id} has no drag target.`);
  await current.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await current.page.mouse.down();
  await current.page.mouse.move(target.x, target.y, { steps: 10 });
  await current.page.mouse.up();
  await current.page.waitForTimeout(150);
}
async function establishBackpackMaterial() {
  const before = await state();
  await current.page.mouse.move(955, 974);
  await current.page.waitForTimeout(100);
  await click('tool-material');
  await current.page.mouse.move(950, 830);
  await current.page.waitForTimeout(150);
  assert.equal((await state()).book, 'material', 'Material inspection did not open its book page.');
  await dragCard('book-canvas');
  assert.ok((await state()).tags.some(tag => tag.id === 'canvas'), 'The inspected material could not be entered on the ledger.');
  await click('book-brands');
  await click('book-next');
  await dragCard('book-wrong-material', { x: 220, y: 483 });
  const after = await state();
  assert.ok(after.tags.some(tag => tag.id === 'wrong-material'), 'Material evidence did not reach the public ledger.');
  assert.ok(after.estimate < before.estimate, 'Correctly challenging the claimed brand did not change the public appraisal.');
  assert.equal(after.cash, before.cash, 'Appraisal transferred cash before agreement.');
  assert.deepEqual(ownership(after.stock), ownership(before.stock));
  check('Visible tool inspection and book-card drag establish material before saving a live counter', { before: before.estimate, after: after.estimate, tags: after.tags });
  await screenshot('material-established');
  await click('book-close');
}
async function decline() { await openCalculator(); await click('decline'); }
async function nextCustomer() {
  const before = (await state()).visit;
  await click('next-visitor');
  const after = await state();
  assert.notEqual(after.visit, before, 'Next visitor did not advance.');
  return after;
}
async function run(name, fn, campaign = 'story') {
  try {
    console.log('START', name);
    await setup(name, campaign);
    await fn();
    current.record.passed = current.record.errors.length === 0;
    console.log('DONE', name, current.record.passed);
  } catch (error) {
    const failure = { scenario: name, message: String(error) };
    try { failure.state = await state(); await screenshot('blocked'); } catch { /* Preserve initial error. */ }
    report.blocked.push(failure);
    if (current?.record) current.record.errors.push(String(error));
    console.log('BLOCKED', name, String(error));
  } finally { if (current?.context) await current.context.close(); }
}
async function drainAnnouncements() {
  for (let i = 0; i < 30; i++) {
    if (await exists('broadcast-next')) await click('broadcast-next');
    else if (await exists('aux-okay')) await click('aux-okay');
    else if (await exists('message-dismiss')) await click('message-dismiss');
    else return;
  }
  throw new Error('Announcement or tutorial failed to finish after 30 clicks.');
}
async function enterFromStreet() {
  if ((await state()).mode === 'street') {
    await current.page.keyboard.press('e');
    await current.page.waitForTimeout(130);
  }
  await drainAnnouncements();
}
async function fundRequiredFine() {
  let s = await state();
  if (s.cash >= 250) return;
  await click('financial-return');
  await click('loans');
  const lender = await exists('loan-get-executor') ? 'loan-get-executor' : await exists('loan-get-darcy') ? 'loan-get-darcy' : null;
  assert.ok(lender, 'Required fine is unaffordable and no visible loan is available.');
  const before = s.cash;
  await click(lender);
  s = await state();
  assert.ok(s.cash > before, 'Visible loan did not provide funds for the required story fine.');
  check('Required story fee funded through a real loan button, not a state injection', { lender, before, after: s.cash });
  await click('loan-close');
  await click('npc-dialogue');
}
async function advanceAllDeclines({ stopAtDay, maxActions = 850 } = {}) {
  const days = new Set(), visits = new Set();
  let completedEncounters = 0, lastSignature = '', stuck = 0;
  for (let action = 0; action < maxActions; action++) {
    await drainAnnouncements();
    const s = await state();
    days.add(s.day); visits.add(s.visit);
    if (stopAtDay !== undefined && s.day >= stopAtDay) return { days: [...days], visits: [...visits], completedEncounters, final: s };
    if (s.completed) return { days: [...days], visits: [...visits], completedEncounters, final: s };
    if (s.failure) throw new Error(`Session failed before the requested endpoint: ${s.failure}`);
    const signature = JSON.stringify([s.visit, s.day, s.mode, s.phase, s.cash, s.broadcastKind, s.broadcastIndex, s.performedEvents?.length]);
    stuck = signature === lastSignature ? stuck + 1 : 0; lastSignature = signature;
    if (stuck > 45) throw new Error(`Repeated UI actions cannot leave ${s.visit} (${s.mode}/${s.phase}).`);
    if (await exists('event-day10-fine-250')) {
      await fundRequiredFine();
      const before = await state();
      await click('event-day10-fine-250');
      assert.equal((await state()).cash, before.cash - 250);
      continue;
    }
    if (await exists('financial-complete')) { await click('financial-complete'); continue; }
    if (await exists('financial-return')) { await click('financial-return'); continue; }
    if (s.mode === 'summary') { await screenshot(`day-${s.day}-summary`); await click('aux-sleep'); continue; }
    if (s.mode === 'street') { await enterFromStreet(); continue; }
    if (s.phase === 'between') {
      assert.ok(await exists('night-leave'), 'Night has no route out of the shop.');
      await click('night-leave'); continue;
    }
    if (s.phase === 'narrative') {
      if (await exists('dialogue-next')) await click('dialogue-next');
      else if (await exists('npc-dialogue')) await click('npc-dialogue');
      else throw new Error(`Narrative has no continuation: ${s.visit}`);
      continue;
    }
    if (['appraise', 'offer'].includes(s.phase)) {
      const cash = s.cash;
      await decline();
      assert.equal((await state()).cash, cash, 'Declining a trade transferred cash.');
      continue;
    }
    if (s.phase === 'settled') {
      completedEncounters++;
      await click('next-visitor'); continue;
    }
    throw new Error(`Unhandled reachable state ${s.mode}/${s.phase}.`);
  }
  throw new Error('Full free-play route exceeded the bounded UI action budget.');
}
async function calendarSaves() {
  await enterFromStreet();
  await click('calendar-open');
  return current.page.locator('[id^="load-day-"]').evaluateAll(nodes => nodes.map(node => ({ id: node.id, label: node.getAttribute('aria-label') })));
}

try {
  await run('reject-persistence', async () => {
    const before = await state();
    await screenshot('before');
    await decline();
    const declined = await state();
    assert.equal(declined.phase, 'settled');
    assert.equal(declined.result, 'declined');
    assert.equal(declined.cash, before.cash);
    assert.deepEqual(ownership(declined.stock), ownership(before.stock));
    const next = await nextCustomer();
    assert.equal(next.cash, before.cash, 'Changing customer silently reset cash after a refusal.');
    assert.deepEqual(ownership(next.stock), ownership(before.stock), 'Refusing an item changed its ownership.');
    assert.equal(next.followRecording, false, 'Recorded balance restoration is still the default.');
    check('Refusal survives next customer with no cash or ownership transfer', { before: before.cash, after: next.cash });
    await screenshot('after');
  });

  await run('alternate-price-save', async () => {
    const before = await state();
    // Deliberately choose from the displayed estimate, not a replay price table.
    const amount = Math.min(before.cash, Math.max(1, Math.floor(before.estimate * 0.9)));
    let bought = await offerUntilResponse(amount);
    if (bought.phase !== 'settled' && bought.counter !== null) {
      const accepted = bought.counter;
      bought = await acceptCurrentCounter(bought);
      assert.equal(bought.cash, before.cash - accepted);
    } else assert.equal(bought.cash, before.cash - amount);
    assert.equal(bought.result, 'bought');
    assert.equal(bought.stock.length, before.stock.length + 1);
    const acquired = bought.stock.find(item => !before.stock.some(old => old.id === item.id));
    assert.ok(acquired, 'Purchase did not produce an independent stock instance.');
    assert.equal(acquired.paid, before.cash - bought.cash);
    check('An offer derived from current appraisal transfers the actual amount', { attempted: amount, paid: acquired.paid, itemId: acquired.id });
    await screenshot('bought');

    await current.page.keyboard.press('Enter');
    await current.page.mouse.click(1690, 855);
    await current.page.waitForTimeout(100);
    const repeated = await state();
    assert.equal(repeated.cash, bought.cash, 'Repeated settlement input transferred money twice.');
    assert.deepEqual(repeated.stock, bought.stock, 'Repeated settlement input duplicated an item.');
    check('Repeated native input cannot settle the same transaction twice');

    const stored = await current.page.evaluate(() => Object.keys(localStorage).map(key => ({ key, bytes: localStorage.getItem(key)?.length || 0 })));
    assert.ok(stored.some(item => item.bytes > 500), 'No substantial local save exists.');
    await current.page.reload({ waitUntil: 'networkidle' });
    await current.page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    let loaded = await state();
    if (loaded.mode === 'menu') { await click('load-game'); loaded = await state(); }
    assert.equal(loaded.cash, bought.cash, 'Load Game reset cash.');
    assert.equal(loaded.visit, bought.visit, 'Load Game reset the encounter.');
    assert.deepEqual(loaded.stock, bought.stock, 'Load Game lost or recreated inventory.');
    assert.equal(loaded.result, bought.result, 'Load Game forgot the settled transaction.');
    check('Refresh and Load Game retain the exact settled choice', { storage: stored, cash: loaded.cash, visit: loaded.visit });
    const next = await nextCustomer();
    assert.equal(next.cash, bought.cash, 'Saved alternate price was overwritten at next customer.');
    assert.ok(next.stock.some(item => item.id === acquired.id));
    await screenshot('restored-next');
  });

  await run('all-refusals-day', async () => {
    const first = await state();
    const refused = [];
    for (let action = 0; action < 100; action++) {
      const s = await state();
      if (s.day !== first.day || s.mode === 'summary') break;
      if (await exists('broadcast-next')) { await click('broadcast-next'); continue; }
      if (s.phase === 'narrative') {
        if (await exists('dialogue-next')) await click('dialogue-next');
        else if (await exists('npc-dialogue')) await click('npc-dialogue');
        else throw new Error('Narrative blocks an otherwise valid all-refusal day.');
        continue;
      }
      if (['appraise', 'offer'].includes(s.phase)) {
        await decline();
        const after = await state();
        assert.equal(after.cash, s.cash, 'Declining a deal charged money.');
        assert.equal(after.stock.length, s.stock.length, 'Declining a deal transferred stock.');
        refused.push(s.visit);
        continue;
      }
      if (s.phase === 'settled') { await click('next-visitor'); continue; }
      if (s.mode === 'street') {
        await current.page.keyboard.press('e');
        await current.page.waitForTimeout(150);
        continue;
      }
      if (s.phase === 'between' && await exists('night-leave')) { await click('night-leave'); continue; }
      throw new Error(`Unrecognized day transition: ${s.mode}/${s.phase}`);
    }
    const summary = await state();
    assert.ok(refused.length >= 2, 'The scenario did not exercise multiple refusals.');
    assert.equal(summary.mode, 'summary', 'Refusing business prevented reaching a day summary.');
    assert.equal(summary.cash, first.cash, 'Before sleeping, an all-refusal day unexpectedly changed cash.');
    if (summary.daySummary) {
      assert.equal(summary.daySummary.purchases, 0);
      assert.equal(summary.daySummary.sales, 0);
      assert.equal(summary.daySummary.purchaseCost, 0);
      assert.equal(summary.daySummary.saleRevenue, 0);
    }
    check('A day with no accepted transactions remains playable and has no fabricated sales', { refused, cash: summary.cash, summary: summary.daySummary });
    await screenshot('summary');
    assert.ok(await exists('aux-sleep'), 'No Sleep control at the day summary.');
    await click('aux-sleep');
    const morning = await state();
    assert.ok(morning.day > first.day, 'Sleep failed to advance the day.');
    assert.ok(morning.cash <= first.cash, 'Sleeping fabricated revenue after all refusals.');
    const afterSleepCash = morning.cash;
    await current.page.keyboard.press('Enter');
    await current.page.waitForTimeout(80);
    assert.equal((await state()).cash, afterSleepCash, 'Repeated night input charged twice.');
    check('Sleep advances after an unprofitable day and cannot double-charge interest', { before: first.cash, after: morning.cash, day: morning.day });
    await screenshot('morning');
  });
  await run('pending-counter-save', async () => {
    await establishBackpackMaterial();
    const before = await state();
    const amount = Math.max(1, Math.floor(before.estimate / 2));
    const pending = await offerUntilResponse(amount);
    assert.equal(pending.phase, 'offer');
    assert.ok(pending.counter > amount, 'Low opening offer did not produce a live customer counter.');
    assert.equal(pending.cash, before.cash);
    assert.deepEqual(ownership(pending.stock), ownership(before.stock));
    assert.ok(pending.negotiation?.history?.length > 0);
    await screenshot('before-refresh');
    await current.page.reload({ waitUntil: 'networkidle' });
    await current.page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    if ((await state()).mode === 'menu') await click('load-game');
    const restored = await state();
    assert.equal(restored.phase, 'offer');
    assert.equal(restored.counter, pending.counter, 'Loading rerolled or discarded the active counter.');
    assert.equal(restored.negotiation.rngState, pending.negotiation.rngState, 'Loading changed negotiation randomness.');
    assert.deepEqual(restored.negotiation.history, pending.negotiation.history);
    await openCalculator();
    await click('accept');
    const accepted = await state();
    assert.equal(accepted.result, 'bought');
    assert.equal(accepted.cash, before.cash - pending.counter, 'Accept used a price other than the saved live counter.');
    check('Saving a live negotiation retains its counter/history/random state and accepts that exact price', { offered: amount, counter: pending.counter, after: accepted.cash });
    await screenshot('accepted');
  });
  await run('story-slice-all-declines', async () => {
    const route = await advanceAllDeclines();
    assert.deepEqual(route.days, [6, 7, 8, 9, 10, 11]);
    assert.equal(route.final.completed, true);
    assert.equal(route.final.campaign, 'story');
    assert.equal(route.final.daySummary.purchases, 0);
    assert.equal(route.final.daySummary.sales, 0);
    check('All trading choices refused while the complete DAY6 through DAY11 story slice remains traversable', route);
    await screenshot('completed');
    await click('aux-sleep');
    assert.equal((await state()).mode, 'menu');
    check('Completed story slice returns to the main menu');
  });
  await run('challenge-thirty', async () => {
    const route = await advanceAllDeclines();
    assert.equal(route.final.completed, true);
    assert.equal(route.final.campaign, 'challenge');
    assert.equal(route.completedEncounters, 30, 'Challenge did not complete all 30 scheduled encounters.');
    check('All 30 challenge encounters settle or skip unavailable stock without a soft lock', route);
    await screenshot('completed');
    await click('aux-sleep');
    assert.equal((await state()).mode, 'menu');
    check('Completed challenge returns to the main menu');
  }, 'challenge');
  await run('calendar-branch', async () => {
    const originalDay7 = await advanceAllDeclines({ stopAtDay: 7 });
    const originalCash = originalDay7.final.cash;
    const branches = await calendarSaves();
    const day6 = branches.find(b => b.label?.startsWith('Load day 6,'));
    const oldDay7 = branches.find(b => b.label?.startsWith('Load day 7,'));
    assert.ok(day6 && oldDay7, 'Calendar does not expose the saved Day6 and Day7.');
    await click(day6.id);
    const reloadedDay6 = await state();
    assert.equal(reloadedDay6.day, 6);
    const amount = Math.min(reloadedDay6.cash, Math.max(1, Math.floor(reloadedDay6.estimate * 0.9)));
    let bought = await offerUntilResponse(amount);
    if (bought.phase !== 'settled') bought = await acceptCurrentCounter(bought);
    assert.equal(bought.result, 'bought');
    const actualPaid = reloadedDay6.cash - bought.cash;
    assert.ok(actualPaid > 0, 'Alternative calendar branch did not pay for its purchase.');
    const replayDay7 = await advanceAllDeclines({ stopAtDay: 7 });
    assert.equal(replayDay7.final.cash, originalCash - actualPaid);
    const updated = await calendarSaves();
    assert.ok(updated.some(b => b.id === day6.id), 'Replaying removed the old Day6 branch.');
    assert.ok(updated.some(b => b.id === oldDay7.id), 'Replaying overwrote the old Day7 branch.');
    assert.ok(updated.filter(b => b.label?.startsWith('Load day 7,')).length >= 2, 'Replaying did not preserve two Day7 alternatives.');
    await screenshot('two-day7-branches');
    await click(oldDay7.id);
    assert.equal((await state()).cash, originalCash, 'Loading the old Day7 branch returned the new branch instead.');
    check('Calendar reload forks history and preserves old and new cash trajectories', { originalCash, replayCash: replayDay7.final.cash, actualPaid, oldDay7: oldDay7.id, branches: updated });
    await screenshot('old-day7-restored');
  });
  report.passed = report.scenarios.length === 7 && report.scenarios.every(s => s.passed) && report.browserErrors.length === 0;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, scenarios: report.scenarios.map(s => ({ name: s.name, passed: s.passed })), blocked: report.blocked.map(b => b.message), errors: report.browserErrors.length }));
  if (!report.passed) process.exitCode = 1;
}
