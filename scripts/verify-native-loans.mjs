import {browserExecutable} from './browser-executable.mjs';
/** Isolated browser render fixtures for the dynamic loan component.
 * This does not inject or replace any live game state. */
import { build } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const output = path.resolve('artifacts/qa/native-loans');
await fs.mkdir(output, { recursive: true });
const compiled = await build({ entryPoints: ['src/native-loan-panel.ts'], bundle: true, write: false, format: 'iife', globalName: 'NativeLoan' });
const browser = await chromium.launch({ headless: true, executablePath: browserExecutable });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const html = `<!doctype html><html><head><style>@font-face{font-family:OrangeKid;src:url('/assets/fonts/orange-kid.ttf')}html,body{margin:0;background:#28262b}canvas{display:block}</style></head><body><canvas id="preview" width="1920" height="1080"></canvas></body></html>`;
await page.route('http://native-loan.test/**', async route => {
  const url = new URL(route.request().url());
  if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
  if (url.pathname === '/qa/backdrop.png') return route.fulfill({ contentType: 'image/png', body: await fs.readFile('artifacts/qa/free-play/visual-current-loans.png') });
  const location = path.resolve('public', '.' + url.pathname);
  if (!location.startsWith(path.resolve('public') + path.sep)) return route.abort();
  try { await route.fulfill({ contentType: location.endsWith('.ttf') ? 'font/ttf' : 'image/png', body: await fs.readFile(location) }); }
  catch { errors.push('Missing asset: ' + url.pathname); await route.abort(); }
});

try {
  await page.goto('http://native-loan.test/');
  await page.addScriptTag({ content: compiled.outputFiles[0].text });
  await page.evaluate(async () => {
    await document.fonts.load('30px OrangeKid');
    const assets = [...new Set(Object.values(NativeLoan.NATIVE_LOAN_ASSETS)), '/qa/backdrop.png'];
    window.loanImages = new Map(await Promise.all(assets.map(asset => new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve([asset, image]); image.onerror = () => reject(new Error('Image: ' + asset)); image.src = asset;
    }))));
  });
  const active = (id, payoff, interest, cycle = 1) => ({ id, name: id, principal: payoff, payoff, interest, cycle, overdue: 0, active: true });
  const offer = (id, principal, interest, cycle = 1) => ({ id, name: id, principal, payoff: principal, interest, cycle, overdue: 0, active: false });
  const cases = [
    { name: 'active-debts', cash: 2500, entries: [active('darcy', 500, 25), active('executor', 1950, 450, 3)] },
    { name: 'available-three-lenders', cash: 4000, entries: [offer('avac', 5000, 500, 2), offer('darcy', 4000, 200), active('executor', 1500, 450, 3)] },
    { name: 'paid-record-and-new-offer', cash: 4500, entries: [offer('avac', 5000, 500, 2), offer('darcy', 4000, 200), { ...active('executor', 1500, 450, 3), active: false, status: 'repaid', key: 'executor-paid-1' }] },
    { name: 'overdue-insufficient-cash', cash: 15, entries: [{ ...active('darcy', 575, 25), overdue: 3 }, active('executor', 2400, 450, 3)] },
    { name: 'empty-ledger', cash: 100, entries: [] },
    { name: 'six-cards-large-amounts', cash: 999999999, entries: [offer('avac', 23000000, 2300000, 2), active('darcy', 99000000, 4950000), active('executor', 90000000, 27000000, 3), { ...active('darcy', 500, 25), key: 'darcy-paid-1', status: 'repaid' }, { ...active('executor', 1500, 450, 3), key: 'executor-stopped-1', status: 'aborted' }, { ...offer('darcy', 500, 25), key: 'darcy-offer-2' }] },
  ];
  const report = { kind: 'isolated-component-browser-fixtures', source: 'src/native-loan-panel.ts', screenshots: [], errors };
  for (const fixture of cases) {
    const result = await page.evaluate(fixture => {
      const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.drawImage(window.loanImages.get('/qa/backdrop.png'), 0, 0);
      const hits = [], actions = [];
      NativeLoan.renderLoanPanel(ctx, {
        ...fixture,
        draw: (asset, x, y, width, height) => ctx.drawImage(window.loanImages.get(asset), x, y, width, height),
        text: (s, x, y, size, color, align) => { ctx.font = `${size}px OrangeKid`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); },
        hit: (id, label, rect, action, extras) => hits.push({ id, label, rect, action, disabled: !!extras?.disabled }),
        onClose: () => actions.push('close'),
        onAction: (id, action) => actions.push(`${action}:${id}`),
      });
      window.loanHits = hits;
      for (const hit of hits) if (hit.id.startsWith('loan-pay-') || hit.id.startsWith('loan-get-')) hit.action();
      return { name: fixture.name, hits: hits.map(({ action, ...rest }) => rest), actions };
    }, fixture);
    await page.screenshot({ path: path.join(output, fixture.name + '.png') });
    const actions = result.hits.filter(hit => hit.id.startsWith('loan-pay-') || hit.id.startsWith('loan-get-'));
    assert.equal(actions.length, fixture.entries.length);
    assert.equal(result.actions.length, actions.filter(hit => !hit.disabled).length);
    for (const action of actions) assert.ok(action.rect[1] + action.rect[3] <= 510);
    report.screenshots.push(result);
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ fixtures: cases.length, output, errors }, null, 2));
} finally { await browser.close(); }
