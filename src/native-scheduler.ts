/** Serializable original-Level scheduling and a deliberately non-JavaScript expression evaluator. */
export type ContextValue=string|number|boolean;
export type Contexts=Record<string,ContextValue>;
export type StoryOp={type:string;[key:string]:any};
export interface SourceRef {ref:string;name:string;class:string}
export interface SourceEvent {id:string;sourceId:string;eventType:number;condition:string;triggerCondition:string;repeatable:boolean;triggerCountdown:number;triggerCancel:boolean;startingContexts:{Key:string;Value:string}[];doHaggle:boolean;playerCanDecline:boolean;item:SourceRef|null;itemFromContext:string|null;customer:SourceRef|null;personality:number;defaultCards:string[];intro:StoryOp[];outro:StoryOp[];chunks:Record<string,StoryOp[]>;acceptableItems:string[];requiredCards:string[];cardMode:string;skipCurationHaggle?:boolean;skippedCurationNoBuy?:boolean}
export interface SourceLevel {id:string;before:string[];schedule:string[];after:string[];startingContexts:{Key:string;Value:string}[];itemDifficulty:{x:number;y:number};customerDifficulty:{x:number;y:number}}
export interface CampaignCatalog {version:string;levels:Record<string,SourceLevel>;events:Record<string,SourceEvent>;items:{id:string;random:boolean;randomItemLine:number;line:string;source:string}[];limitations:string[]}
export interface SchedulerState {day:number;queue:string[];cursor:number;played:string[];countdowns:Record<string,number>;rng:number;serial:number;ended:boolean}
export const nextRandom=(seed:number)=>(Math.imul(seed,1664525)+1013904223)>>>0;
export function randomUnit(state:{rng:number}){state.rng=nextRandom(state.rng);return state.rng/4294967296;}
export function evaluateExpression(source:string|number|boolean|null|undefined,contexts:Contexts,unknown?:string[]):ContextValue {
 if(typeof source==='number'||typeof source==='boolean')return source;
 if(!source?.trim())return false;
 const tokens:string[]=[]; const re=/\s*(?:((?:\d+\.?\d*|\.\d+))|((?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))|([A-Za-z_$][\w.$]*)|(==|!=|<>|>=|<=|&&|\|\||[()!+*/%<>=?:,\-]))/gy;let pos=0;
 while(pos<source.length){re.lastIndex=pos;const m=re.exec(source);if(!m){if(source.slice(pos).trim()){unknown?.push(source);return false;}break;}tokens.push(m[1]??m[2]??m[3]??m[4]);pos=re.lastIndex;}
 let at=0;const truth=(v:ContextValue)=>v!==false&&v!==0&&v!==''&&v!=='false';
 const precedence:Record<string,number>={'or':1,'||':1,'and':2,'&&':2,'==':3,'=':3,'!=':3,'<>':3,'>':4,'<':4,'>=':4,'<=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
 function atom():ContextValue {const t=tokens[at++];if(t===undefined)throw Error('operand');if(t==='!'||t==='not')return !truth(atom());if(t==='-')return -Number(atom());if(t==='+')return Number(atom());if(t==='('){const v=expr(0);if(tokens[at++]!==')')throw Error('parenthesis');return v;}if(t[0]==='"'||t[0]==="'")return t.slice(1,-1).replace(/\\(['"\\])/g,'$1');if(/^\d|^\./.test(t))return Number(t);if(t==='true')return true;if(t==='false'||t==='null')return false;if(t.startsWith('IsDefined.'))return contexts[t.slice(10)]!==undefined;const v=contexts[t];return v===undefined?false:v;}
 function expr(min:number):ContextValue {let a=atom();while(at<tokens.length){const op=tokens[at],p=precedence[op];if(p===undefined||p<min)break;at++;const b=expr(p+1);switch(op){case'&&':case'and':a=truth(a)&&truth(b);break;case'||':case'or':a=truth(a)||truth(b);break;case'=':case'==':a=a==b;break;case'!=':case'<>':a=a!=b;break;case'>':a=Number(a)>Number(b);break;case'<':a=Number(a)<Number(b);break;case'>=':a=Number(a)>=Number(b);break;case'<=':a=Number(a)<=Number(b);break;case'+':a=typeof a==='string'||typeof b==='string'?String(a)+String(b):Number(a)+Number(b);break;case'-':a=Number(a)-Number(b);break;case'*':a=Number(a)*Number(b);break;case'/':a=Number(b)?Number(a)/Number(b):0;break;case'%':a=Number(b)?Number(a)%Number(b):0;}}
 return a;}
 try{const v=expr(0);if(at!==tokens.length)throw Error('unsupported');return v;}catch{unknown?.push(source);return false;}
}
export function testCondition(expr:string,contexts:Contexts,unknown?:string[]){const v=evaluateExpression(expr,contexts,unknown);return v!==false&&v!==0&&v!==''&&v!=='false';}
export function createScheduler(seed=105):SchedulerState{return {day:1,queue:[],cursor:0,played:[],countdowns:{},rng:seed>>>0,serial:0,ended:false};}
export function scheduleDay(s:SchedulerState,c:CampaignCatalog,day:number,brokenLevel=0){
 const level=c.levels[`day${String(day).padStart(2,'0')}`];if(!level){s.ended=true;s.queue=[];s.cursor=0;return false;}
 s.day=day;s.cursor=0;const slots=level.schedule.filter(x=>x==='@purchase').length;const counts=Array(slots).fill(0);let remaining=brokenLevel>=3?2:4;
 while(remaining&&slots){const cycle=Array.from({length:slots},(_,i)=>i);for(let i=cycle.length-1;i>0;i--){const j=Math.floor(randomUnit(s)*(i+1));[cycle[i],cycle[j]]=[cycle[j],cycle[i]];}for(const i of cycle){counts[i]++;if(--remaining===0)break;}}
 let slot=0;const main=level.schedule.flatMap(x=>x==='@purchase'?Array(counts[slot++]).fill('@purchase'):[x]);
 const interleaved=main.flatMap((x,i)=>i<main.length-1?[x,'@sale','@rental']:[x]);
 s.queue=[...level.before,...interleaved.flatMap((x,i)=>i<interleaved.length-1?[x,'@trigger']:[x]),'@trigger-last','@rental-returns','@report-end',...level.after,'@day-end'];return true;
}
/** All candidates advance their counters before priority selects the first eligible event. */
export function triggeredEvent(s:SchedulerState,c:CampaignCatalog,contexts:Contexts):SourceEvent|null{
 const eligible:SourceEvent[]=[];
 for(const id of c.levels.triggeredEvents.schedule){const e=c.events[id];if(!e||(!e.repeatable&&s.played.includes(id)))continue;const condition=testCondition(e.triggerCondition,contexts);const count=s.countdowns[id]??0;
  if(e.triggerCountdown===0){if(condition)eligible.push(e);continue;}
  if(condition){if(count>=e.triggerCountdown)eligible.push(e);else s.countdowns[id]=count+1;}
  else if(e.triggerCancel)s.countdowns[id]=0;else if(count>0){if(count>=e.triggerCountdown)eligible.push(e);else s.countdowns[id]=count+1;}
 }
 return eligible[0]??null;
}
