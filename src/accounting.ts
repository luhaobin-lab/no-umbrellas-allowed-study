import {compareDailyTrades} from './economy';
/** Cash movements are explicit events. Reference-video balances never enter this ledger. */
export type CashCategory='purchase'|'sale'|'loan'|'repayment'|'interest'|'repair'|'flower'|'fee'|'salvage';
export interface CashEntry {id:string;day:number;amount:number;category:CashCategory;label:string;balance:number;itemId?:string}
export interface TradeEntry {id:string;day:number;itemId:string;title:string;side:'buy'|'sell';price:number;costBasis:number|null;appraisedValue:number;profit:number|null}
export interface DaySummary {day:number;openingCash:number;closingCash:number;income:number;expenses:number;purchases:number;sales:number;purchaseCost:number;saleRevenue:number;knownProfit:number;borrowing:number;repayments:number;interest:number;cashFlow:CashEntry[];trades:TradeEntry[];best:TradeEntry|null;worst:TradeEntry|null}
export interface CashAccount {cash:number;cashbook:CashEntry[]}
export type CashResult={ok:true;entry:CashEntry}|{ok:false;reason:'duplicate'|'invalid-amount'|'insufficient-funds'};
export function postCash(account:CashAccount,event:Omit<CashEntry,'balance'>):CashResult {
 if(account.cashbook.some(e=>e.id===event.id))return {ok:false,reason:'duplicate'};
 if(!event.id||!Number.isSafeInteger(event.amount)||!Number.isSafeInteger(account.cash+event.amount)||event.day<1)return {ok:false,reason:'invalid-amount'};
 if(account.cash+event.amount<0)return {ok:false,reason:'insufficient-funds'};
 const entry={...event,balance:account.cash+event.amount};account.cash=entry.balance;account.cashbook.push(entry);return {ok:true,entry};
}
export function summarizeDay(day:number,openingCash:number,cashbook:CashEntry[],allTrades:TradeEntry[]):DaySummary {
 const cashFlow=cashbook.filter(e=>e.day===day),trades=allTrades.filter(t=>t.day===day),sum=(category:CashCategory)=>cashFlow.filter(e=>e.category===category).reduce((n,e)=>n+e.amount,0);
 const sales=trades.filter(t=>t.side==='sell'),known=sales.filter(t=>t.profit!==null), ranked=known.filter(t=>(t.costBasis??0)>0).sort((a,b)=>compareDailyTrades({paid:a.costBasis!,sold:a.price},{paid:b.costBasis!,sold:b.price}));
 return {day,openingCash,closingCash:openingCash+cashFlow.reduce((n,e)=>n+e.amount,0),income:cashFlow.filter(e=>e.amount>0).reduce((n,e)=>n+e.amount,0),expenses:-cashFlow.filter(e=>e.amount<0).reduce((n,e)=>n+e.amount,0),purchases:trades.filter(t=>t.side==='buy').length,sales:sales.length,purchaseCost:Math.abs(sum('purchase')),saleRevenue:sum('sale'),knownProfit:known.reduce((n,t)=>n+(t.profit??0),0),borrowing:sum('loan'),repayments:Math.abs(sum('repayment')),interest:Math.abs(sum('interest')),cashFlow:structuredClone(cashFlow),trades:structuredClone(trades),best:ranked[0]??null,worst:ranked.at(-1)??null};
}
export function validateCashbook(openingCash:number,cash:number,entries:CashEntry[]):boolean {
 if(!Number.isSafeInteger(openingCash)||openingCash<0||!Number.isSafeInteger(cash)||cash<0)return false;
 let total=openingCash;const seen=new Set<string>();for(const e of entries){if(!e.id||seen.has(e.id)||!Number.isSafeInteger(e.amount))return false;seen.add(e.id);total+=e.amount;if(total<0||total!==e.balance)return false;}return total===cash;
}
