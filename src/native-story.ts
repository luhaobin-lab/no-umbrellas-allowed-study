import {evaluateExpression,testCondition,randomUnit,type Contexts,type StoryOp,type SourceEvent} from './native-scheduler';
export interface StoryState {eventId:string;stage:'intro'|'outro'|'chunk';queue:StoryOp[];line:string;choices:{id:string;label:string;ops:StoryOp[]}[];waiting:StoryOp|null;done:boolean;serial:number;unsupported:string[];rng:number;returnPhase?:string;instance?:number;prepared?:boolean;constructionCash?:number;}
export interface StoryHost {contexts:()=>Contexts;set:(key:string,value:string|number|boolean)=>void;effect:(op:StoryOp,key:string)=>void;signal?:(name:string,op:StoryOp)=>boolean;}
export function createStory(e:SourceEvent,stage:StoryState['stage'],seed:number,chunk?:string):StoryState{return {eventId:e.id,stage,queue:structuredClone(stage==='intro'?e.intro:stage==='outro'?e.outro:e.chunks[chunk??'']??[]),line:'',choices:[],waiting:null,done:false,serial:0,unsupported:[],rng:seed};}
function text(t:string){return (t??'').replace(/-d[\d.]+-/g,'').replace(/<[^>]+>/g,'');}
const presentation=new Set(['DelayEventData','CustomerExpressionEventData','CharacterAnimation','CharacterEnterEventData','CharacterLeaveEventData','MoveCharacter','HideCharacter','SetFacing','SetWalkAnimation','SetCharacterAppearance','StartFadeoutEventData','EndFadeoutEventData']);
function prepareOperations(ops:StoryOp[],s:StoryState,cash:number):StoryOp[]{return ops.flatMap(op=>{
 if(op.type==='AdjustBalanceEventData'&&op.adjustMode===1)return [{...op,sourceAmount:Math.trunc(Math.fround(Math.fround(cash)*Math.fround(op.percentage/100)))}];
 if(op.type==='BranchingEventData')return [{...op,IfTrueEvents:prepareOperations(op.IfTrueEvents??[],s,cash),ElseEvents:prepareOperations(op.ElseEvents??[],s,cash)}];
 if(op.type==='RandomEventData')return op.pool?.length?prepareOperations([op.pool[Math.floor(randomUnit(s)*op.pool.length)]],s,cash):[];
 if(op.type==='ConcurrentEvents')return [{...op,events:(op.events??[]).map((events:StoryOp[])=>prepareOperations(events,s,cash))}];
 return [op];
});}
/** A suspended line/choice/wait survives serialization. No flattened branch is executed early. */
export function advanceStory(s:StoryState,host:StoryHost,choice?:string){
 if(s.done)return;if(!s.prepared){s.queue=prepareOperations(s.queue,s,s.constructionCash??Number(host.contexts().balance??0));s.prepared=true;}
 if(s.choices.length){const c=s.choices.find(x=>x.id===choice);if(!c)return;s.queue.unshift(...prepareOperations(c.ops,s,Number(host.contexts().balance??0)));s.choices=[];}
 if(s.waiting){const w=s.waiting,pass=(w.hasEscapeCondition&&testCondition(w.escapeCondition,host.contexts()))||(w.isContextRequirement&&testCondition(w.requirement,host.contexts()))||host.signal?.(w.GameplayEventToWait?.name??'',w);if(!pass)return;s.waiting=null;}
 s.line='';let budget=1000;
 while(s.queue.length&&budget--){const op=s.queue.shift()!;const key=`story:${s.eventId}:${s.stage}:${s.serial++}`;
  if(presentation.has(op.type))continue;
  switch(op.type){
   case'LineEventData':case'Say':s.line=text(op.content??op.line??op.text);if(s.line)return;break;
   case'BranchingEventData':s.queue.unshift(...(testCondition(op.predicate,host.contexts(),s.unsupported)?op.IfTrueEvents:op.ElseEvents)??[]);break;
   case'SwitchEventData':{const cases:StoryOp[]=op.SwitchCases??op.cases??op.Cases??[];const found=cases.find(c=>testCondition(c.casePredicate??c.predicate??c.condition,host.contexts(),s.unsupported));s.queue.unshift(...prepareOperations(found?.content??op.Default??[],s,Number(host.contexts().balance??0)));break;}
   case'RandomEventData':if(op.pool?.length)s.queue.unshift(op.pool[Math.floor(randomUnit(s)*op.pool.length)]);break;
   case'EventGroupData':s.queue.unshift(...(op.events??op.Events??op.eventData??[]));break;
   case'ConcurrentEvents':s.queue.unshift(...(op.events??op.Events??[]).flat());break;
   case'TextChoiceEventData':s.choices=(op.choices??[]).map((c:any)=>({id:c.id,label:text(c.LocalizedLabel??c.label??c.id),ops:c.onSelect??[]}));if(s.choices.length)return;break;
   case'SetPersistentContextEventData':host.set(op.Key,evaluateExpression(op.Value,host.contexts(),s.unsupported));break;
   case'WaitGameplayEventData':s.waiting=op;if(op.isContextRequirement&&testCondition(op.requirement,host.contexts())||host.signal?.(op.GameplayEventToWait?.name??'',op)){s.waiting=null;break;}s.line='Complete the indicated shop interaction to continue.';return;
   case'TutorialEventData':host.effect(op,key);break;
   default:host.effect(op,key);
  }
 }
 if(!budget){s.unsupported.push('execution-budget');s.line='This event requires an unimplemented continuation.';return;}s.done=s.queue.length===0;
}
