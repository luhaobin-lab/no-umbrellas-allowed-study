import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { accrueInterest, compareDailyTrades, cycleInterest, isInterestDay, loanLimit, quoteRepayment, repairQuote, tradeProfitPercent, type LoanAccount } from './economy';

const loan = (overrides: Partial<LoanAccount> = {}): LoanAccount => ({ id: 'executor', principal: 1500, rate: 0.3, cycleDays: 3, startedDay: 8, status: 'active', overdue: 0, ...overrides });

test('Independent original-creditor fixtures keep Ajik investor separate from Bluebird capital products',()=>{
  interface Product {creditor:string;id:string;principal:number;rate:number;cycleDays:number;interest:number;sameDayRepayment:number}
  const evidence=JSON.parse(readFileSync(new URL('../reference/research/demo-creditor-products.json',import.meta.url),'utf8')) as {investor:{product:Product;before:number;afterRepaymentHook:number};capitalLadder:Product[];central:Product};
  assert.equal(evidence.investor.product.creditor,'investor');assert.equal(evidence.investor.product.id,'investorFirst');
  assert.equal(evidence.investor.afterRepaymentHook,evidence.investor.before,'original investor hook does not create another offer');
  assert.ok(evidence.capitalLadder.every(p=>p.creditor==='capital'));
  assert.deepEqual(evidence.capitalLadder.map(p=>p.principal),[5000,8000,12000,17000,23000,23000]);
  for(const product of [evidence.investor.product,...evidence.capitalLadder,evidence.central]){
    const account=loan({...product,startedDay:11});
    assert.equal(cycleInterest(account),product.interest);
    assert.equal(quoteRepayment(account,11),product.sameDayRepayment);
  }
});

test('Executor first-cycle quote and dates agree with direct official DLL calls', () => {
  for (const [day, amount, due] of [[8,1950,false],[9,1950,false],[10,1950,true],[11,1500,false],[12,1500,false],[13,1500,true],[14,1500,false]] as const) {
    assert.equal(quoteRepayment(loan(), day), amount);
    assert.equal(isInterestDay(loan(), day), due);
  }
  assert.equal(cycleInterest(loan()), 450);
  assert.equal(quoteRepayment(loan({ overdue: 2 }), 11), 2400);
  assert.equal(quoteRepayment(loan({ status: 'repaid' }), 11), null);
  assert.equal(quoteRepayment(loan(), 7), null);
});

test('Darcy credit uses current true estate and active principal, at exact 200-unit boundaries', () => {
  const debt = loan({ principal: 200 });
  for (const [cash, result] of [[0,500],[999,500],[1000,500],[1199,500],[1200,500],[8199,3900],[8200,4000]]) assert.equal(loanLimit(cash,0,[debt]),result);
  assert.equal(loanLimit(200,8000,[debt]),4000);
  assert.equal(loanLimit(200,8000,[{...debt,status:'repaid'}]),4100);
  assert.equal(cycleInterest(loan({principal:123,rate:0.05})),6);
});

test('Interest changes continuously across days and a repeated settlement cannot charge twice', () => {
  const initial = [loan()];
  const day8 = accrueInterest(initial, 1000, 8);
  assert.equal(day8.paidTotal,0);
  const day10 = accrueInterest(day8.loans,day8.cash,10);
  assert.equal(day10.cash,550); assert.equal(day10.paidTotal,450);
  const repeated = accrueInterest(day10.loans,day10.cash,10);
  assert.equal(repeated.cash,550); assert.deepEqual(repeated.charges,[]);
  const day13 = accrueInterest(repeated.loans,repeated.cash,13);
  assert.equal(day13.cash,100); assert.equal(day13.paidTotal,450);
  assert.equal(initial[0].lastInterestDay,undefined);
});

test('Three unpaid cycles fail; paying a later cycle clears arrears as in original behavior', () => {
  let loans = [loan({ id:'darcy',principal:500,rate:0.05,cycleDays:1,startedDay:6 })];
  for (let day=6;day<=8;day++) {
    const result=accrueInterest(loans,0,day); loans=result.loans;
    assert.equal(loans[0].overdue,day-5); assert.equal(result.unpaidTotal,25); assert.equal(result.failure,day===8);
  }
  const recovered=accrueInterest(loans,25,9);
  assert.equal(recovered.cash,0); assert.equal(recovered.loans[0].overdue,0); assert.equal(recovered.failure,false);
});

test('Multiple creditors use remaining funds rather than the original negative-cash bug', () => {
  const loans=[loan({id:'expensive',principal:5000,rate:.04,cycleDays:1,startedDay:6}),loan({id:'cheaper',principal:5000,rate:.03,cycleDays:1,startedDay:6})];
  const result=accrueInterest(loans,200,6);
  assert.equal(result.cash,50); assert.equal(result.paidTotal,150); assert.equal(result.unpaidTotal,200);
  assert.deepEqual(result.charges.map(x=>[x.loanId,x.paid,x.overdue]),[['cheaper',150,0],['expensive',0,1]]);
  assert.equal(result.loans[0].id,'expensive');
});

test('Repair combines appraisal eligibility with independent true damage and value', () => {
  assert.deepEqual(repairQuote({trueValue:98,trueCondition:'fairly-damaged',appraisedCondition:'fairly-damaged'}),{eligible:true,cost:59,mode:'immediate',reason:null,repairedCondition:'slightly-damaged'});
  assert.equal(repairQuote({trueValue:98.9,trueCondition:'fairly-damaged',appraisedCondition:'valueless'}).cost,59);
  assert.equal(repairQuote({trueValue:25,trueCondition:'valueless',appraisedCondition:'fairly-damaged'}).cost,55);
  assert.equal(repairQuote({trueValue:25,trueCondition:'valueless',appraisedCondition:'fairly-damaged'}).mode,'overnight');
  const correction=repairQuote({trueValue:100,trueCondition:'slightly-damaged',appraisedCondition:'fairly-damaged'});
  assert.equal(correction.cost,50);assert.equal(correction.mode,'card');
  assert.equal(repairQuote({trueValue:100,trueCondition:'fairly-damaged',appraisedCondition:'slightly-damaged'}).eligible,false);
  for(const flags of [{alreadyRepaired:true},{totallyWrecked:true},{beingRepaired:true},{rented:true},{auctioned:true}]) assert.equal(repairQuote({trueValue:98,trueCondition:'fairly-damaged',appraisedCondition:'fairly-damaged',...flags}).eligible,false);
});

test('Day highlights rank percentage profit before absolute profit and exclude free gifts', () => {
  const trades=[{paid:100,sold:150},{paid:10,sold:20},{paid:20,sold:40},{paid:0,sold:999},{paid:100,sold:90}];
  assert.deepEqual([...trades].sort(compareDailyTrades),[trades[2],trades[1],trades[0],trades[4],trades[3]]);
  assert.equal(tradeProfitPercent(trades[3]),null);
  assert.equal(tradeProfitPercent(trades[4]),-10);
});

test('Invalid money and dates cannot silently contaminate the account model',()=>{
  assert.throws(()=>loanLimit(NaN,0,[]));
  assert.throws(()=>quoteRepayment(loan({cycleDays:0}),8));
  assert.throws(()=>accrueInterest([loan(),loan()],100,8));
  assert.throws(()=>accrueInterest([loan()],-1,8));
  assert.throws(()=>repairQuote({trueValue:Infinity,trueCondition:'perfect',appraisedCondition:'fairly-damaged'}));
});
