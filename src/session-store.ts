/** Local JSON storage. No game rules, video checkpoints, or browser globals. */
export const SAVE_SCHEMA_VERSION = 2 as const;
export const DEFAULT_SAVE_KEY = 'no-umbrellas.session.v2';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SaveErrorCode =
  | 'read-failed' | 'write-failed' | 'clear-failed' | 'invalid-snapshot'
  | 'invalid-day' | 'invalid-options' | 'corrupt-json' | 'corrupt-save'
  | 'unsupported-version' | 'checksum-mismatch';

export interface SaveError {
  code: SaveErrorCode;
  message: string;
  cause?: string;
}

export type SaveResult<T> = { ok: true; value: T } | { ok: false; error: SaveError };

export interface SaveRecord<T> {
  id: string;
  savedAt: string;
  /** FNV-1a corruption check, not a security/authenticity signature. */
  checksum: string;
  snapshot: T;
}

export interface DaySaveRecord<T> extends SaveRecord<T> {
  day: number;
  branchId: string;
  parentBranchId: string | null;
}

export type DaySaveInfo = Omit<DaySaveRecord<unknown>, 'snapshot'>;

export interface SaveRepositoryOptions {
  key?: string;
  maxDays?: number;
  maxBranchesPerDay?: number;
  now?: () => Date;
}

interface SavePayload<T> {
  nextId: number;
  latest: SaveRecord<T> | DaySaveRecord<T> | null;
  dayBranches: DaySaveRecord<T>[];
  activeBranchId: string | null;
}

interface SaveEnvelope<T> {
  schemaVersion: typeof SAVE_SCHEMA_VERSION;
  savedAt: string;
  checksum: string;
  payload: SavePayload<T>;
}

const fail = <T>(code: SaveErrorCode, message: string, cause?: unknown): SaveResult<T> => ({
  ok: false,
  error: { code, message, ...(cause === undefined ? {} : { cause: cause instanceof Error ? cause.message : String(cause) }) },
});
const success = <T>(value: T): SaveResult<T> => ({ ok: true, value });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

/** Reject values JSON would silently drop or coerce (including sparse arrays). */
function canonicalJson(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object') throw new Error('Snapshot must contain only finite numbers, strings, booleans, null, arrays, and plain objects.');
  if (ancestors.has(value)) throw new Error('Snapshot contains a circular reference.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const items: string[] = [];
      for (let i = 0; i < value.length; i++) {
        if (!Object.hasOwn(value, i)) throw new Error('Sparse arrays cannot be saved.');
        items.push(canonicalJson(value[i], ancestors));
      }
      return `[${items.join(',')}]`;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Snapshot objects must be plain JSON objects.');
    if (Object.getOwnPropertySymbols(value).length) throw new Error('Symbol keys cannot be saved.');
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

function checksum(value: unknown): string {
  // Hash UTF-16 code units as two bytes; deterministic in browsers and Node.
  let hash = 0x811c9dc5;
  const json = canonicalJson(value);
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    hash = Math.imul(hash ^ (code & 255), 0x01000193);
    hash = Math.imul(hash ^ (code >>> 8), 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function recordChecksum(record: Record<string, unknown>): string {
  const { checksum: _checksum, ...content } = record;
  return checksum(content);
}

function validRecord(value: unknown, dayRecord = false): boolean {
  if (!object(value) || typeof value.id !== 'string' || !/^save-[1-9]\d*$/.test(value.id) || !date(value.savedAt) || !Object.hasOwn(value, 'snapshot')) return false;
  if (dayRecord && (!Number.isSafeInteger(value.day) || (value.day as number) < 1 || value.branchId !== value.id || !(value.parentBranchId === null || typeof value.parentBranchId === 'string'))) return false;
  return typeof value.checksum === 'string' && value.checksum === recordChecksum(value);
}

/**
 * A single setItem is the commit. localStorage guarantees an unsuccessful
 * setItem leaves its previous value intact. StorageLike implementations must
 * provide the same atomic write/remove contract.
 */
export class SaveRepository<T = unknown> {
  private readonly key: string;
  private readonly maxDays: number;
  private readonly maxBranches: number;
  private readonly now: () => Date;
  private readonly optionsValid: boolean;
  private selectedBranch: string | null | undefined;

  constructor(private readonly storage: StorageLike, options: SaveRepositoryOptions = {}) {
    this.key = options.key ?? DEFAULT_SAVE_KEY;
    this.maxDays = options.maxDays ?? 30;
    this.maxBranches = options.maxBranchesPerDay ?? 8;
    this.now = options.now ?? (() => new Date());
    this.optionsValid = this.key.length > 0 && Number.isSafeInteger(this.maxDays) && this.maxDays >= 1 && this.maxDays <= 30 && Number.isSafeInteger(this.maxBranches) && this.maxBranches >= 1 && this.maxBranches <= 30;
  }

  private read(): SaveResult<SavePayload<T> | null> {
    if (!this.optionsValid) return fail('invalid-options', 'Use a nonempty key and retention limits from 1 to 30.');
    let raw: string | null;
    try { raw = this.storage.getItem(this.key); }
    catch (error) { return fail('read-failed', 'Could not read the saved session.', error); }
    if (raw === null) return success(null);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch (error) { return fail('corrupt-json', 'The saved session is not valid JSON. It has been preserved.', error); }
    if (!object(parsed)) return fail('corrupt-save', 'The saved session has an invalid envelope. It has been preserved.');
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) return fail('unsupported-version', `Unsupported save schema ${String(parsed.schemaVersion)}. Expected ${SAVE_SCHEMA_VERSION}; the original save has been preserved.`);
    try {
      const payload = parsed.payload;
      if (!date(parsed.savedAt) || typeof parsed.checksum !== 'string' || !object(payload)) return fail('corrupt-save', 'The saved session is missing required metadata.');
      if (parsed.checksum !== checksum({ schemaVersion: parsed.schemaVersion, savedAt: parsed.savedAt, payload })) return fail('checksum-mismatch', 'The saved session integrity check failed. It has been preserved.');
      if (!Number.isSafeInteger(payload.nextId) || (payload.nextId as number) < 1 || !(payload.latest === null || validRecord(payload.latest)) || !Array.isArray(payload.dayBranches) || !payload.dayBranches.every(entry => validRecord(entry, true)) || !(payload.activeBranchId === null || typeof payload.activeBranchId === 'string')) return fail('corrupt-save', 'The saved session records are invalid.');
      const ids = payload.dayBranches.map(entry => entry.id);
      if (new Set(ids).size !== ids.length) return fail('corrupt-save', 'The saved session has duplicate branch identifiers.');
      if (payload.activeBranchId !== null && !ids.includes(payload.activeBranchId)) return fail('corrupt-save', 'The active saved branch is missing.');
      return success(payload as unknown as SavePayload<T>);
    } catch (error) {
      return fail('corrupt-save', 'The saved session contains invalid data. It has been preserved.', error);
    }
  }

  private write(snapshot: T, day?: number): SaveResult<SaveRecord<T> | DaySaveRecord<T>> {
    if (day !== undefined && (!Number.isSafeInteger(day) || day < 1)) return fail('invalid-day', 'A saved day must be a positive safe integer.');
    const result = this.read();
    if (!result.ok) return result;
    let cloned: T;
    let savedAt: string;
    try {
      cloned = JSON.parse(canonicalJson(snapshot)) as T;
      savedAt = this.now().toISOString();
    } catch (error) { return fail('invalid-snapshot', 'The session could not be serialized as complete JSON.', error); }
    const payload: SavePayload<T> = result.value ?? { nextId: 1, latest: null, dayBranches: [], activeBranchId: null };
    if (!Number.isSafeInteger(payload.nextId + 1)) return fail('corrupt-save', 'The saved session identifier limit has been reached.');
    const base = { id: `save-${payload.nextId++}`, savedAt, snapshot: cloned };
    const parent = this.selectedBranch === undefined ? payload.activeBranchId : this.selectedBranch;
    const content = day === undefined ? base : { ...base, day, branchId: base.id, parentBranchId: parent };
    const record = { ...content, checksum: checksum(content) } as SaveRecord<T> | DaySaveRecord<T>;
    payload.latest = record;
    if (day !== undefined) {
      payload.dayBranches.push(record as DaySaveRecord<T>);
      const retainedDays = new Set<number>();
      const counts = new Map<number, number>();
      payload.dayBranches = payload.dayBranches.toReversed().filter(entry => {
        if (!retainedDays.has(entry.day) && retainedDays.size >= this.maxDays) return false;
        retainedDays.add(entry.day);
        const count = counts.get(entry.day) ?? 0;
        counts.set(entry.day, count + 1);
        return count < this.maxBranches;
      }).reverse();
      payload.activeBranchId = record.id;
    } else if (parent !== null && payload.dayBranches.some(entry => entry.branchId === parent)) {
      payload.activeBranchId = parent;
    }
    const unsigned = { schemaVersion: SAVE_SCHEMA_VERSION, savedAt, payload };
    const envelope: SaveEnvelope<T> = { ...unsigned, checksum: checksum(unsigned) };
    try { this.storage.setItem(this.key, JSON.stringify(envelope)); }
    catch (error) { return fail('write-failed', 'The session could not be saved. The previous save has been retained.', error); }
    if (day !== undefined) this.selectedBranch = record.id;
    return success(record);
  }

  save(snapshot: T): SaveResult<SaveRecord<T>> { return this.write(snapshot); }

  loadLatest(): SaveResult<SaveRecord<T> | null> {
    const result = this.read();
    if (!result.ok) return result;
    this.selectedBranch = result.value?.activeBranchId ?? null;
    return success(result.value?.latest ?? null);
  }

  /** Each call preserves a new branch. Also updates the resume/autosave slot. */
  saveDay(day: number, snapshot: T): SaveResult<DaySaveRecord<T>> {
    return this.write(snapshot, day) as SaveResult<DaySaveRecord<T>>;
  }

  /** Newest saved branch first; several entries may have the same day. */
  listDays(): SaveResult<DaySaveInfo[]> {
    const result = this.read();
    if (!result.ok) return result;
    return success((result.value?.dayBranches ?? []).toReversed().map(({ snapshot: _snapshot, ...info }) => info));
  }

  /** An omitted branchId selects the most recently saved branch for this day. */
  loadDay(day: number, branchId?: string): SaveResult<DaySaveRecord<T> | null> {
    if (!Number.isSafeInteger(day) || day < 1) return fail('invalid-day', 'A saved day must be a positive safe integer.');
    const result = this.read();
    if (!result.ok) return result;
    const entry = result.value?.dayBranches.findLast(record => record.day === day && (branchId === undefined || record.branchId === branchId)) ?? null;
    if (entry) this.selectedBranch = entry.branchId;
    return success(entry);
  }

  clear(): SaveResult<null> {
    if (!this.optionsValid) return fail('invalid-options', 'Use a nonempty key and retention limits from 1 to 30.');
    try { this.storage.removeItem(this.key); }
    catch (error) { return fail('clear-failed', 'The saved session could not be cleared.', error); }
    this.selectedBranch = undefined;
    return success(null);
  }
}
