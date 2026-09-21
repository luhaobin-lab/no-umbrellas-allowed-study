/** Independently implemented rules verified against the official 1.0.5 demo.
 * Evidence and deliberate fixes: docs/research/DEMO_ECONOMY_FACTS.md.
 */
export interface LoanAccount {
  id: string;
  principal: number;
  /** Fraction charged each cycle, e.g. 0.05 means 5%. */
  rate: number;
  cycleDays: number;
  startedDay: number;
  status: 'active' | 'offered' | 'repaid' | 'aborted';
  overdue: number;
  /** Prevents a repeated end-of-day action from charging the same cycle twice. */
  lastInterestDay?: number;
}

export interface InterestCharge {
  loanId: string;
  due: number;
  paid: number;
  unpaid: number;
  overdue: number;
}

export interface InterestResult {
  loans: LoanAccount[];
  cash: number;
  paidTotal: number;
  unpaidTotal: number;
  charges: InterestCharge[];
  failure: boolean;
}

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

function integer(value: number, label: string, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(`${label} must be a safe integer >= ${minimum}.`);
}

function validateLoan(loan: LoanAccount) {
  if (!loan.id || !['active', 'offered', 'repaid', 'aborted'].includes(loan.status)) throw new RangeError('Loan identity or status is invalid.');
  integer(loan.principal, 'principal');
  finite(loan.rate, 'rate');
  if (loan.rate < 0) throw new RangeError('rate must be nonnegative.');
  integer(loan.cycleDays, 'cycleDays', 1);
  integer(loan.startedDay, 'startedDay', 1);
  integer(loan.overdue, 'overdue');
  if (loan.lastInterestDay !== undefined) integer(loan.lastInterestDay, 'lastInterestDay', 1);
  if (!Number.isSafeInteger(Math.trunc(loan.principal * loan.rate))) throw new RangeError('Interest exceeds the supported money range.');
}

export function cycleInterest(loan: LoanAccount): number {
  validateLoan(loan);
  return Math.trunc(loan.principal * loan.rate);
}

/** Uses inventory's true card value, not the player's asking prices or costs. */
export function loanLimit(cash: number, inventoryTrueTotal: number, loans: readonly LoanAccount[]): number {
  finite(cash, 'cash');
  finite(inventoryTrueTotal, 'inventoryTrueTotal');
  if (inventoryTrueTotal < 0) throw new RangeError('inventoryTrueTotal must be nonnegative.');
  loans.forEach(validateLoan);
  const netEstate = Math.trunc(cash + inventoryTrueTotal) - loans.filter(loan => loan.status === 'active').reduce((sum, loan) => sum + loan.principal, 0);
  if (!Number.isSafeInteger(netEstate)) throw new RangeError('Estate exceeds the supported money range.');
  return Math.max(500, Math.trunc(netEstate / 200) * 100);
}

export function isInterestDay(loan: LoanAccount, today: number): boolean {
  validateLoan(loan);
  integer(today, 'today', 1);
  return loan.status === 'active' && today >= loan.startedDay && (today - loan.startedDay + 1) % loan.cycleDays === 0;
}

/** A first-cycle early repayment still costs one full period of interest. */
export function quoteRepayment(loan: LoanAccount, today: number): number | null {
  validateLoan(loan);
  integer(today, 'today', 1);
  if (loan.status !== 'active' || today < loan.startedDay) return null;
  const periodsElapsed = Math.trunc((today - loan.startedDay) / loan.cycleDays);
  const amount = loan.principal + cycleInterest(loan) * (periodsElapsed === 0 ? 1 : loan.overdue);
  if (!Number.isSafeInteger(amount)) throw new RangeError('Repayment exceeds the supported money range.');
  return amount;
}

/**
 * One actual day's settlement. Do not use this to skip unprocessed days.
 * Intentional repair of a demo bug: each loan checks remaining cash, whereas
 * the demo checks every loan against the same initial cash and can go negative.
 * No partial interest payment. A successful cycle clears overdue, as in demo.
 */
export function accrueInterest(loans: readonly LoanAccount[], cash: number, today: number): InterestResult {
  integer(cash, 'cash');
  integer(today, 'today', 1);
  loans.forEach(validateLoan);
  if (new Set(loans.map(loan => loan.id)).size !== loans.length) throw new RangeError('Loan IDs must be unique.');
  const updated = loans.map(loan => ({ ...loan }));
  const charges: InterestCharge[] = [];
  let remaining = cash;
  // Sorting copies preserves the caller's display/order while matching priority.
  for (const loan of [...updated].sort((a, b) => cycleInterest(a) - cycleInterest(b))) {
    if (!isInterestDay(loan, today) || (loan.lastInterestDay ?? 0) >= today) continue;
    const due = cycleInterest(loan);
    const paid = remaining >= due ? due : 0;
    const unpaid = remaining >= due ? 0 : due;
    if (remaining >= due) { remaining -= due; loan.overdue = 0; }
    else loan.overdue++;
    loan.lastInterestDay = today;
    charges.push({ loanId: loan.id, due, paid, unpaid, overdue: loan.overdue });
  }
  return {
    loans: updated,
    cash: remaining,
    paidTotal: cash - remaining,
    unpaidTotal: charges.reduce((sum, charge) => sum + charge.unpaid, 0),
    charges,
    failure: updated.some(loan => loan.status === 'active' && loan.overdue >= 3),
  };
}

export type RepairCondition = 'perfect' | 'slightly-damaged' | 'fairly-damaged' | 'valueless' | 'potential-garbage' | 'totally-wrecked';
export interface RepairFacts {
  trueValue: number;
  trueCondition: RepairCondition;
  appraisedCondition: RepairCondition;
  alreadyRepaired?: boolean;
  totallyWrecked?: boolean;
  beingRepaired?: boolean;
  rented?: boolean;
  auctioned?: boolean;
}

export interface RepairQuote {
  eligible: boolean;
  cost: number;
  mode: 'card' | 'immediate' | 'overnight' | 'unavailable';
  reason: 'already-repaired' | 'totally-wrecked' | 'not-damaged' | 'not-available' | null;
  repairedCondition: 'slightly-damaged' | null;
}

/** Eligibility follows the appraisal; the fee and timing follow actual facts. */
export function repairQuote(facts: RepairFacts): RepairQuote {
  finite(facts.trueValue, 'trueValue');
  if (facts.trueValue < 0) throw new RangeError('trueValue must be nonnegative.');
  const conditions: RepairCondition[] = ['perfect', 'slightly-damaged', 'fairly-damaged', 'valueless', 'potential-garbage', 'totally-wrecked'];
  if (!conditions.includes(facts.trueCondition) || !conditions.includes(facts.appraisedCondition)) throw new RangeError('Repair condition is invalid.');
  const unavailable = (reason: RepairQuote['reason']): RepairQuote => ({ eligible: false, cost: 0, mode: 'unavailable', reason, repairedCondition: null });
  if (facts.beingRepaired || facts.rented || facts.auctioned) return unavailable('not-available');
  if (facts.alreadyRepaired) return unavailable('already-repaired');
  if (facts.totallyWrecked || facts.appraisedCondition === 'totally-wrecked') return unavailable('totally-wrecked');
  if (!['fairly-damaged', 'valueless'].includes(facts.appraisedCondition)) return unavailable('not-damaged');
  const mode = facts.trueCondition === 'valueless' ? 'overnight' : facts.trueCondition === 'fairly-damaged' ? 'immediate' : 'card';
  const multiplier = mode === 'overnight' ? 0.2 : mode === 'immediate' ? 0.1 : 0;
  const cost = Math.trunc(50 + facts.trueValue * multiplier);
  if (!Number.isSafeInteger(cost)) throw new RangeError('Repair price exceeds the supported money range.');
  return { eligible: true, cost, mode, reason: null, repairedCondition: 'slightly-damaged' };
}

export interface DailyTrade { paid: number; sold: number }

export function tradeProfit(trade: DailyTrade): number {
  finite(trade.paid, 'paid'); finite(trade.sold, 'sold');
  return Math.trunc(trade.sold) - Math.trunc(trade.paid);
}

/** Zero-cost gifts are excluded from the original profit-margin highlights. */
export function tradeProfitPercent(trade: DailyTrade): number | null {
  finite(trade.paid, 'paid');
  const cost = Math.trunc(trade.paid);
  if (cost <= 0) return null;
  // The original UI computes this with 32-bit float arithmetic then truncates.
  return Math.trunc(Math.fround(Math.fround(Math.fround(tradeProfit(trade)) / Math.fround(cost)) * Math.fround(100)));
}

/** Highest percentage profit first, then highest absolute profit. */
export function compareDailyTrades(a: DailyTrade, b: DailyTrade): number {
  const aPercent = tradeProfitPercent(a);
  const bPercent = tradeProfitPercent(b);
  if (aPercent === null && bPercent === null) return 0;
  if (aPercent === null) return 1;
  if (bPercent === null) return -1;
  return bPercent - aPercent || tradeProfit(b) - tradeProfit(a);
}
