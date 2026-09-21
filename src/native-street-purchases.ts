import {evaluateExpression,testCondition,type Contexts,type StoryOp} from './native-scheduler';
export interface StreetCallback {method:string;string:string;number:number;target:{ref:string;name:string;class:string}|null;context?:{key:string;value:string};event?:Record<string,StoryOp[]>|null;eventSource?:string|null;}
export interface StreetProduct {id:string;gameObject:number;name:string;path:string;storeId:string;basePrice:number;priceContext:string|null;browse:{domain:string;id:string;name:string}|null;callbacks:Record<string,StreetCallback[]>;}
export interface StreetPurchaseHost {contexts():Contexts;set(key:string,value:string|number|boolean):void;cash(amount:number,label:string):boolean;callback(method:string,number:number,string:string):void;line(text:string):void;journal(id:string,text:string):void;}
/** Executable purchase callbacks. Cosmetic animation/audio callbacks have no economic effects. */
export function executeStreetCallbacks(calls:StreetCallback[],host:StreetPurchaseHost){
 function ops(items:StoryOp[]){for(const o of items){switch(o.type){
  case'Say':host.line(o.LocalizedLine??'');break;
  case'SetPersistentContextEventData':host.set(o.Key,evaluateExpression(o.Value,host.contexts()));break;
  case'BranchingEventData':ops((testCondition(o.predicate,host.contexts())?o.IfTrueEvents:o.ElseEvents)??[]);break;
  case'SwitchEventData':ops(o.SwitchCases.find((c:StoryOp)=>testCondition(c.casePredicate,host.contexts()))?.content??o.Default??[]);break;
  case'AdjustBalanceEventData':host.cash(o.adjustMode===1?Math.trunc(Math.fround(Number(host.contexts().balance)*Math.fround(o.percentage/100))):Math.trunc(o.amount),'Street shop adjustment');break;
  case'JournalEntryEventData':host.journal(o.ID,o.LocalizedJournalEntry);break;
  case'UnityEventData':for(const c of o.EventToPlay?.m_PersistentCalls?.m_Calls??[])host.callback(c.m_MethodName,c.m_Arguments?.m_IntArgument??0,c.m_Arguments?.m_StringArgument??'');break;
 }} }
 for(const call of calls){if(call.method==='Execute'&&call.event)ops([...call.event.onTriggerEnter??[],...call.event.onInteraction??[],...call.event.afterUnfreeze??[]]);else if(call.method==='RunSetContext'&&call.context)host.set(call.context.key,call.context.value==='true'?true:call.context.value==='false'?false:call.context.value);else host.callback(call.method,call.number,call.string);}
}
export function streetProductNumber(p:StreetProduct){return Number(p.browse?.id??p.name.match(/(\d+)$/)?.[1]??0);}
export function styleBoughtIndex(contexts:Contexts,domain:string){let n=0;while(n<6&&testCondition(`${domain}.${n+1}.bought`,contexts))n++;return n;}
export function streetStoreOpen(store:string,day:number,morning:boolean,challenge=false){if(challenge&&['Scented','RepairShop','HiddenV'].includes(store))return true;if(store==='GemByJ')return morning&&(day<=5||day>=10&&day<=15);if(store==='RepairShop')return morning&&day>=9;if(store==='HiddenV')return morning&&day>=18;if(store==='BestRoof')return morning&&day>=12;if(store==='CityChat')return morning&&day>=21;return morning;}
