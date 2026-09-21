import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveRepository, DEFAULT_SAVE_KEY, type SaveResult, type StorageLike } from './session-store';

class MemoryStorage implements StorageLike {
  items = new Map<string, string>();
  failRead = false;
  failWrite = false;
  failRemove = false;
  getItem(key: string) { if (this.failRead) throw new Error('Storage unavailable'); return this.items.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrite) throw new Error('Quota exceeded'); this.items.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw new Error('Storage unavailable'); this.items.delete(key); }
}

const now = () => new Date('2026-09-21T03:04:05.000Z');
function value<T>(result: SaveResult<T>): T { if (!result.ok) assert.fail(JSON.stringify(result)); return result.value; }
function error<T>(result: SaveResult<T>, code: string) { assert.equal(result.ok, false); if (result.ok) assert.fail('Expected failure'); assert.equal(result.error.code, code); }
const fixture = () => ({ day: 6, cash: 208, stock: [{ id: 'bag-instance-1', cards: ['canvas'], listing: null }], debt: { principal: 500, dueDay: 7 }, ui: { book: 'condition', quote: '50' }, flags: ['拒绝虚构检查点'], rng: 17 });

test('Session roundtrip is complete, independent, and readable by a fresh repository', () => {
  const storage = new MemoryStorage();
  const repo = new SaveRepository<ReturnType<typeof fixture>>(storage, { now });
  assert.equal(value(repo.loadLatest()), null);
  const input = fixture();
  const written = value(repo.save(input));
  assert.equal(written.savedAt, now().toISOString());
  assert.match(written.checksum, /^fnv1a32:[0-9a-f]{8}$/);
  input.cash = 9999;
  written.snapshot.stock.length = 0;
  const loaded = value(new SaveRepository<ReturnType<typeof fixture>>(storage).loadLatest());
  assert.deepEqual(loaded?.snapshot, fixture());
  loaded!.snapshot.debt.principal = 0;
  assert.equal(value(repo.loadLatest())!.snapshot.debt.principal, 500);
});

test('Cash tampering, malformed JSON, and changed metadata are diagnosed without overwriting', () => {
  for (const mutate of [
    (raw: string) => { const data = JSON.parse(raw); data.payload.latest.snapshot.cash = 100000; return JSON.stringify(data); },
    (raw: string) => { const data = JSON.parse(raw); data.savedAt = '2026-09-22T03:04:05.000Z'; return JSON.stringify(data); },
  ]) {
    const storage = new MemoryStorage(); const repo = new SaveRepository(storage, { now });
    value(repo.save(fixture()));
    const damaged = mutate(storage.getItem(DEFAULT_SAVE_KEY)!); storage.setItem(DEFAULT_SAVE_KEY, damaged);
    error(repo.loadLatest(), 'checksum-mismatch'); error(repo.save({ cash: 1 }), 'checksum-mismatch');
    assert.equal(storage.getItem(DEFAULT_SAVE_KEY), damaged);
  }
  const storage = new MemoryStorage(); const repo = new SaveRepository(storage);
  storage.setItem(DEFAULT_SAVE_KEY, '{truncated');
  error(repo.loadLatest(), 'corrupt-json'); error(repo.save({}), 'corrupt-json');
  assert.equal(storage.getItem(DEFAULT_SAVE_KEY), '{truncated');
});

test('Old and future schemas are preserved instead of silently converted or discarded', () => {
  for (const schemaVersion of [1, 3, undefined]) {
    const storage = new MemoryStorage(); const repo = new SaveRepository(storage);
    const old = JSON.stringify({ schemaVersion, cash: 123 }); storage.setItem(DEFAULT_SAVE_KEY, old);
    error(repo.loadLatest(), 'unsupported-version'); error(repo.save({ cash: 0 }), 'unsupported-version');
    assert.equal(storage.getItem(DEFAULT_SAVE_KEY), old);
  }
});

test('Failed autosave or day-branch write leaves the previous complete session and history unchanged', () => {
  const storage = new MemoryStorage(); const repo = new SaveRepository(storage, { now });
  const first = value(repo.saveDay(6, fixture()));
  const bytes = storage.getItem(DEFAULT_SAVE_KEY);
  storage.failWrite = true;
  error(repo.save({ cash: 999 }), 'write-failed');
  error(repo.saveDay(7, { cash: 999 }), 'write-failed');
  assert.equal(storage.getItem(DEFAULT_SAVE_KEY), bytes);
  assert.deepEqual(value(repo.loadLatest()), first);
  assert.equal(value(repo.listDays()).length, 1);
  storage.failWrite = false;
  const second = value(repo.saveDay(7, { cash: 300 }));
  assert.equal(second.id, 'save-2');
  assert.equal(second.parentBranchId, first.branchId);
});

test('Day rewinds preserve old branches and autosaves resume the selected branch', () => {
  const storage = new MemoryStorage(); const repo = new SaveRepository<{ cash: number }>(storage, { now });
  const day6 = value(repo.saveDay(6, { cash: 258 }));
  const old7 = value(repo.saveDay(7, { cash: 213 }));
  assert.equal(value(repo.loadDay(6))?.branchId, day6.branchId);
  value(repo.save({ cash: 208 }));
  const fresh = new SaveRepository<{ cash: number }>(storage, { now });
  const new7 = value(fresh.saveDay(7, { cash: 208 }));
  assert.equal(new7.parentBranchId, day6.branchId);
  assert.equal(value(fresh.loadDay(7))?.snapshot.cash, 208);
  assert.equal(value(fresh.loadDay(7, old7.branchId))?.snapshot.cash, 213);
  assert.equal(value(fresh.loadLatest())?.snapshot.cash, 208);
  assert.equal(value(fresh.listDays()).length, 3);
  assert.equal(value(fresh.loadDay(8)), null);
  assert.equal(value(fresh.loadDay(7, 'missing')), null);
});

test('Day retention is bounded and keeps an earlier day when the player branches from it', () => {
  const storage = new MemoryStorage(); const repo = new SaveRepository(storage, { now, maxDays: 2, maxBranchesPerDay: 2 });
  value(repo.saveDay(6, { cash: 1 })); value(repo.saveDay(7, { cash: 2 })); value(repo.saveDay(8, { cash: 3 }));
  assert.equal(value(repo.loadDay(6)), null);
  assert.deepEqual(value(repo.listDays()).map(entry => entry.day), [8, 7]);
  value(repo.saveDay(2, { cash: 4 }));
  assert.deepEqual(value(repo.listDays()).map(entry => entry.day), [2, 8]);
  value(repo.saveDay(2, { cash: 5 })); value(repo.saveDay(2, { cash: 6 }));
  assert.deepEqual(value(repo.listDays()).map(entry => entry.day), [2, 2, 8]);
  assert.equal(value(repo.loadLatest())?.snapshot && (value(repo.loadLatest())!.snapshot as { cash: number }).cash, 6);
});

test('Non-JSON snapshots cannot silently lose values and never erase a valid save', () => {
  const storage = new MemoryStorage(); const repo = new SaveRepository(storage, { now });
  value(repo.save(fixture())); const bytes = storage.getItem(DEFAULT_SAVE_KEY);
  const circular: Record<string, unknown> = {}; circular.self = circular;
  for (const invalid of [{ lost: undefined }, [undefined], [NaN], [Infinity], { n: 1n }, { fn() {} }, circular, new Date(), Array(2), { [Symbol('lost')]: 1 }]) {
    error(repo.save(invalid), 'invalid-snapshot'); assert.equal(storage.getItem(DEFAULT_SAVE_KEY), bytes);
  }
});

test('Read/remove failures are diagnostic, clear removes only the owned key, and days are validated', () => {
  const storage = new MemoryStorage(); const repo = new SaveRepository(storage, { now });
  value(repo.saveDay(6, fixture())); storage.setItem('other-game', 'keep');
  storage.failRead = true; error(repo.loadLatest(), 'read-failed'); error(repo.save({}), 'read-failed');
  storage.failRead = false; storage.failRemove = true; error(repo.clear(), 'clear-failed');
  assert.notEqual(value(repo.loadLatest()), null);
  storage.failRemove = false; value(repo.clear());
  assert.equal(value(repo.loadLatest()), null); assert.deepEqual(value(repo.listDays()), []); assert.equal(storage.getItem('other-game'), 'keep');
  for (const day of [0, -1, 1.5, NaN, Infinity]) { error(repo.saveDay(day, {}), 'invalid-day'); error(repo.loadDay(day), 'invalid-day'); }
  error(new SaveRepository(storage, { maxDays: 0 }).save({}), 'invalid-options');
});
