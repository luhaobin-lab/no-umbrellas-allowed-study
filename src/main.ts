import {NativeStreetView} from './native-street-view';
import {nativeGemDialogue} from './native-street-data';
import {drawNativeDamage,drawNativeGem,nativeDamageIdleAngle,nativeDamageSettledAngle} from './native-tool-view';
import {drawNativeCard,getNativeCardRequiredImages} from './native-card-view';
import {applyNativeCharacterHsl} from './native-character-color';
import {NATIVE_FLOWER_SPRITES} from './native-flower-data';
import {createNativeCharacterAppearance,getNativeCharacterLayers,type NativeCharacterAppearance} from './native-characters';
import {testCondition} from './native-scheduler';
import {NativeManualView,nativePage,adjacentManualPage} from './native-manual-view';
import {NATIVE_MANUAL_PAGES} from './native-manual-data';
import {getNativeItem,getNativeCard} from './native-rules';
import {inspectNativeItem,NATIVE_TOOL_UNLOCKS,type NativeTool,type NativeToolReading} from './native-tools';
import {renderLoanPanel,type LoanPanelEntry} from './native-loan-panel';
import {DEMO_TOOL_FRAMES} from './demo-tool-assets';
import {SaveRepository} from './session-store';
import {inspectItem,getItemFacts} from './item-facts';
import {cycleInterest} from './economy';
import {STREET_PROTEST_DIALOGUES,STREET_AMBIENT_DIALOGUES} from './reference-street-dialogues';
import {REFERENCE_INVENTORY_BY_TITLE,REFERENCE_SHELF_BY_TITLE,REFERENCE_INVENTORY_GRID} from './reference-inventory';
import {StreetWorld} from './street';
import {REPORTING_BY_ID,REPORTING_DEVICE} from './reference-reporting';
import './style.css';
import {BROADCAST_BY_ID,MORNING_SEQUENCE,NIGHT_SEQUENCE,STORY_SEQUENCE,HORONG_COUNTER_PATCH} from './reference-broadcasts';
import {RECORDED_EVENTS} from './reference-events';
import {REFERENCE_FONT} from './reference-font';
import {REFERENCE_ANIMATIONS} from './reference-animations';
import {REF_INSPECTION_BY_TRANSACTION} from './reference-inspections';
import {Game,type Card,type Patch} from './engine';
import {auxiliaryScreen,AUXILIARY_MECHANICS} from './auxiliary';
import {visits,cards,cardById,bookCards,initialStock,recordedById} from './data';
import {REF_BOOK_PAGES,REF_BOOK_PAGE_BY_ID,REF_BOOK_CROP,type ReferenceBookHotspot} from './reference-book-data';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML='<main id="stage"><canvas id="game" width="1920" height="1080" aria-label="No Umbrellas Allowed shop"></canvas><div id="controls"></div><span id="loading">Loading...</span></main>';
const stage=document.querySelector<HTMLDivElement>('#stage')!,canvas=document.querySelector<HTMLCanvasElement>('#game')!,ctx=canvas.getContext('2d')!,controls=document.querySelector<HTMLDivElement>('#controls')!;
ctx.imageSmoothingEnabled=false;
const followRecording=false;
const game=new Game(visits);
const streetWorld=new StreetWorld(),streetKeys=new Set<string>();streetWorld.ready.then(()=>{dirty=true;});
const images=new Map<string,HTMLImageElement>();let dirty=true,elapsed=0,lastVisitId='';
function img(path:string){let im=images.get(path);if(!im){im=new Image();im.src=path;im.onload=()=>{dirty=true;};im.onerror=()=>console.warn('Asset could not load',path);images.set(path,im);}return im;}
function draw(path:string,x:number,y:number,w?:number,h?:number){const im=img(path);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,w??im.naturalWidth,h??im.naturalHeight);}
function patch(p?:Patch){if(p)draw(p.asset,...p.rect);}
function surface(id:string,x=0,y=0,w?:number,h?:number){draw(`/assets/surfaces/${id}.png`,x,y,w,h);}
function rect(x:number,y:number,w:number,h:number,color:string){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function text(s:string,x:number,y:number,size=23,color='#443e31',align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`${Math.round(size*1.5)}px OrangeKid`;ctx.textAlign=align;ctx.fillText(s,x,y);}
const tint=document.createElement('canvas'),tctx=tint.getContext('2d')!;
function digits(value:string|number,right:number,top:number,height=46,color='#fff'){
 const chars=String(value).split(''),gap=Math.max(2,Math.round(height*.09));let widths=chars.map(c=>{const m=img(`/assets/ui/digit-${c}.png`);return m.naturalHeight?Math.round(m.naturalWidth*height/m.naturalHeight):Math.round(height*.6);});let x=right-widths.reduce((a,b)=>a+b,0)-gap*(chars.length-1);
 chars.forEach((c,i)=>{const im=img(`/assets/ui/digit-${c}.png`);if(im.complete&&im.naturalWidth){tint.width=im.width;tint.height=im.height;tctx.clearRect(0,0,im.width,im.height);tctx.drawImage(im,0,0);tctx.globalCompositeOperation='source-in';tctx.fillStyle=color;tctx.fillRect(0,0,im.width,im.height);tctx.globalCompositeOperation='source-over';ctx.drawImage(tint,x,top,widths[i],height);}x+=widths[i]+gap;});
}
interface Hit {id:string;label:string;rect:[number,number,number,number];action:()=>void;card?:Card;tool?:string;stock?:string;disabled?:boolean}
const nativeManual=new NativeManualView(img);
let nativeStreet:NativeStreetView|null=null,gemDialogue:string[]=[],gemLine=0;
function streetView(){if(!nativeStreet){nativeStreet=new NativeStreetView();nativeStreet.ready.then(()=>{dirty=true;});}return nativeStreet;}
const nativeAppearances=new Map<string,NativeCharacterAppearance>();
let inspectionAge=0,needleFrom=52.7;
let nativeReading:NativeToolReading|null=null,openedItem=false,toolHover=false,shiftHeld=false,gemPending:{remaining:number;cardId:string}|null=null;
let stockDetail:string|null=null,detailOffset=0,itemZoom=false,showWanted=false,executorBorrowed=false,financialScreen:string|null=null,morningPending=false,finalStreet=false;const performedEvents={has:(id:string)=>game.state.performedEvents.includes(id),add:(id:string)=>{if(!game.state.performedEvents.includes(id))game.state.performedEvents.push(id);},clear:()=>{game.state.performedEvents=[];},[Symbol.iterator]:()=>game.state.performedEvents[Symbol.iterator]()};let broadcastKind:'morning'|'night'|'story'|null=null,broadcastIndex=0,lastNightDay=0;
let streetScreen='street',auxPanel:string|null=null,returnMode:Game['state']['mode']='shop',darcyDebt=500,executorDebt=0,avacDebt=0,plantDays=0,reportCount=0,reportToday=0,reportCollapsed=false,showCityProgress=false;const reportedVisitors={has:(id:string)=>game.state.reportedVisitors.includes(id),clear:()=>{game.state.reportedVisitors=[];},[Symbol.iterator]:()=>game.state.reportedVisitors[Symbol.iterator]()};
let hits:Hit[]=[],toolBar=false,calculator=false,listingEdit=false,privateOpen=false,inventoryOpen=false,inventoryPage=0,tagOffset=0,hoverTag:string|null=null,dialogueVisible=false,tutorial:string|null=null,aux:string|null=null,streetX=0,showLoans=false;
const characterTints=new Map<string,HTMLCanvasElement>();
let pointer={x:960,y:540},down:{x:number;y:number;hit?:Hit}|null=null,drag:{card?:Card;tool?:string;stock?:string;source?:string;x:number;y:number}|null=null,lastKey='';
function hit(id:string,label:string,r:Hit['rect'],action:()=>void,extras:Partial<Hit>={}){hits.push({id,label,rect:r,action,...extras});}
function inside(p:{x:number;y:number},r:Hit['rect']){return p.x>=r[0]&&p.y>=r[1]&&p.x<r[0]+r[2]&&p.y<r[1]+r[3];}
function enterStreet(screen='street'){game.setContext('morning',game.state.phase!=='between');game.setContext('evening',game.state.phase==='between');if(finalStreet&&screen==='public-square')screen='public-square-later';streetScreen=screen;streetWorld.enter(screen);streetWorld.setShopsOpen(game.state.phase!=='between');game.state.mode='street';dirty=true;}
function moveMode(mode:Game['state']['mode']){if(mode==='street')enterStreet();else game.state.mode=mode==='shop'&&game.state.phase==='between'?'summary':mode;game.state.book=null;calculator=false;listingEdit=false;inventoryOpen=false;dirty=true;}
const ambience=new Audio('/assets/shop-ambience.mp3');ambience.loop=true;ambience.volume=.25;
function start(campaign:'story'|'challenge'|'demo'='demo'){void ambience.play().catch(()=>{});game.start(campaign==='story'?initialStock():[],campaign,Date.now()>>>0);nativeAppearances.clear();nativeReading=null;openedItem=false;gemPending=null;toolHover=false;calculator=false;toolBar=false;tutorial=null;aux=null;financialScreen=null;showLoans=false;stockDetail=null;showWanted=false;darcyDebt=500;executorDebt=0;avacDebt=0;executorBorrowed=false;performedEvents.clear();morningPending=false;broadcastKind=null;broadcastIndex=0;lastNightDay=0;finalStreet=false;streetWorld.setLateScene(false);reportCount=0;reportToday=0;reportCollapsed=false;reportedVisitors.clear();showCityProgress=false;plantDays=0;modal=null;saveMessage='';summaryPage=0;summaryDetail=null;listingEdit=false;privateOpen=false;inventoryOpen=false;inventoryPage=0;tagOffset=0;hoverTag=null;dialogueVisible=false;itemZoom=false;lastVisitId='';streetWorld.restore({floor:'b1',later:false,x:2269,direction:'right',searchedBins:[],shopsOpen:true});dirty=true;saveDay();}
let modal:'settings'|'profile'|'endings'|'saves'|null=null,saveMessage='',summaryPage=0,summaryDetail:'best'|'worst'|null=null,saveListPage=0;
const saves=new SaveRepository<any>(localStorage);
let lastSaved='',saveClock=0;
function showMessage(message:string){saveMessage=message;dirty=true;}
function syncBusinessUI(){darcyDebt=game.repayment('darcy')??0;executorDebt=game.repayment('executor')??0;avacDebt=game.repayment('avac')??0;executorBorrowed=!!game.getLoan('executor');plantDays=game.state.plantDays;reportCount=game.state.reportedVisitors.length;reportToday=game.state.reportToday;}
function uiSnapshot(){return {inspectionAge,needleFrom,nativeAppearances:[...nativeAppearances],nativeReading,openedItem,gemPending,stockDetail,detailOffset,itemZoom,showWanted,financialScreen,morningPending,finalStreet,broadcastKind,broadcastIndex,lastNightDay,streetScreen,auxPanel,returnMode,reportCollapsed,showCityProgress,toolBar,calculator,listingEdit,privateOpen,inventoryOpen,inventoryPage,tagOffset,hoverTag,dialogueVisible,tutorial,showLoans,summaryPage,summaryDetail};}
function sessionSnapshot(){return JSON.parse(JSON.stringify({state:game.snapshot(),ui:uiSnapshot(),street:streetWorld.snapshot()}));}
function saveNow(){if(game.state.mode==='menu')return false;const snapshot=sessionSnapshot(),result=saves.save(snapshot);if(!result.ok){showMessage(`Save failed: ${result.error.message}`);return false;}lastSaved=JSON.stringify(snapshot);return true;}
function saveDay(){const result=saves.saveDay(game.state.day,sessionSnapshot());if(!result.ok)showMessage(`Save failed: ${result.error.message}`);else lastSaved=JSON.stringify(sessionSnapshot());}
function loadSave(day?:number,branchId?:string){
 const result=day===undefined?saves.loadLatest():saves.loadDay(day,branchId);
 if(!result.ok){showMessage(`Cannot load: ${result.error.message}`);return false;}if(!result.value){showMessage('No saved game yet.');return false;}
 const snapshot=result.value.snapshot,validation=game.restore(snapshot?.state);
 if(!validation.ok){showMessage(`Cannot load: ${validation.reason}`);return false;}
 const u=snapshot.ui??{};inspectionAge=u.inspectionAge??0;needleFrom=u.needleFrom??52.7;nativeAppearances.clear();for(const [k,a] of u.nativeAppearances??[])nativeAppearances.set(k,a);nativeReading=u.nativeReading??null;openedItem=!!u.openedItem;gemPending=u.gemPending??null;toolHover=false;
 stockDetail=u.stockDetail??null;detailOffset=u.detailOffset??0;itemZoom=!!u.itemZoom;showWanted=!!u.showWanted;financialScreen=u.financialScreen??null;morningPending=!!u.morningPending;finalStreet=!!u.finalStreet;
 broadcastKind=u.broadcastKind??null;broadcastIndex=u.broadcastIndex??0;lastNightDay=u.lastNightDay??0;streetScreen=u.streetScreen??'street';auxPanel=u.auxPanel??null;returnMode=u.returnMode??'shop';reportCollapsed=!!u.reportCollapsed;showCityProgress=!!u.showCityProgress;
 toolBar=!!u.toolBar;calculator=!!u.calculator;listingEdit=!!u.listingEdit;privateOpen=!!u.privateOpen;inventoryOpen=!!u.inventoryOpen;inventoryPage=u.inventoryPage??0;tagOffset=u.tagOffset??0;hoverTag=u.hoverTag??null;dialogueVisible=!!u.dialogueVisible;tutorial=u.tutorial??null;showLoans=!!u.showLoans;summaryPage=u.summaryPage??0;summaryDetail=u.summaryDetail??null;
 if(snapshot.street)streetWorld.restore(snapshot.street);lastVisitId=game.visit?.id??'';modal=null;saveMessage='';syncBusinessUI();dirty=true;void ambience.play().catch(()=>{});lastSaved=JSON.stringify(sessionSnapshot());return true;
}
function renderReadout(tool:string,x:number,y:number){if(nativeItem()&&tool==='damage'){drawNativeDamage(ctx,img,x,y,nativeReading?.tool==='damage'?nativeDamageSettledAngle(needleFrom,nativeReading.needleAngle??0,inspectionAge):nativeDamageIdleAngle(elapsed/1000));return;}if(nativeItem()&&tool==='gem'){drawNativeGem(ctx,img,x,y,gemPending?1-gemPending.remaining:null);return;}
 const nr=nativeItem()&&nativeReading?.tool===tool?nativeReading:null;const result=nr?{status:nr.status,readout:{...nr,signatureSprite:tool==='signature'?nr.sprite?.asset:undefined,materialSprite:tool==='material'?nr.sprite?.asset:undefined}}:inspectItem(game.visit.id,tool),r=result.readout;
 if(r&&'asset' in r&&r.asset&&'rect' in r&&r.rect){draw(r.asset,Math.round(x-r.rect[2]/2),Math.round(y-r.rect[3]/2),r.rect[2],r.rect[3]);return;}
 const scale=nativeItem()?3:3.2;function component(name:string,cx=x,cy=y){const f=DEMO_TOOL_FRAMES[name];if(f)draw(f.asset,Math.round(cx-f.size[0]*scale/2),Math.round(cy-f.size[1]*scale/2),f.size[0]*scale,f.size[1]*scale);}
 if(result.status!=='available'||!r){component(tool==='gem'?'item_jewel_main':tool==='screwdriver'?'item_watch':'item_date_main');return;}
 if(tool==='damage'&&r.needleAngle!==undefined){
  component('item_condi_main');component('item_condi_back',x,y+23);
  ctx.save();ctx.translate(x,y+9);ctx.rotate(-r.needleAngle*Math.PI/180);const f=DEMO_TOOL_FRAMES.item_condi_pointer;draw(f.asset,-f.size[0]*scale/2,-f.size[1]*scale+10,f.size[0]*scale,f.size[1]*scale);ctx.restore();component('item_condi_reflect',x,y-7);
 }else if(tool==='year'&&r.year!==undefined){component('item_date_main');digits(r.year,x+52,y-26,31,'#d4e2a7');}
 else if(tool==='signature'){component('item_sign_main');if(r.signatureSprite){const im=img(r.signatureSprite);if(im.complete&&im.naturalWidth)draw(r.signatureSprite,x-im.naturalWidth*scale/2+8,y-im.naturalHeight*scale/2,im.naturalWidth*scale,im.naturalHeight*scale);}else{ text('No Signature',x+9,y-4,14,'#bbeafa','center');text('Found',x+9,y+17,14,'#bbeafa','center');}}
 else if(tool==='material'){
  component('item_material');if(r.materialSprite){ctx.save();ctx.beginPath();ctx.rect(x-37,y-66,72,105);ctx.clip();const im=img(r.materialSprite);if(im.complete&&im.naturalWidth){const off=document.createElement('canvas');off.width=im.width;off.height=im.height;const c=off.getContext('2d')!;c.drawImage(im,0,0);if(r.materialTint){c.globalCompositeOperation='multiply';c.fillStyle=`rgb(${r.materialTint.r*255},${r.materialTint.g*255},${r.materialTint.b*255})`;c.fillRect(0,0,im.width,im.height);}ctx.drawImage(off,x-75,y-77,150,111);}ctx.restore();}
 }else component(tool==='gem'?'item_jewel_main':'item_watch');
}
function renderSummary(){
 inventoryOpen=false;stockDetail=null;calculator=false;listingEdit=false;const s=game.state,summary=game.daySummary;draw('/assets/demo-panels/result_main.png',0,0,1920,1080);for(let row=0;row<3;row++)draw('/assets/demo-panels/result_slot.png',510,213+row*210,939,207);draw('/assets/demo-panels/result_card_image.png',172,329,288,186);draw('/assets/demo-panels/result_card_image.png',172,578,288,186);text('Best deal of the day',314,305,24,'#e1d49a','center');text('Worst deal of the day',314,555,24,'#e1d49a','center');
 const records=summary.trades,totalPages=Math.max(1,Math.ceil(records.length/9));summaryPage=Math.min(totalPages-1,summaryPage);
 function cell(trade:typeof records[number]|null,x:number,y:number,w:number,h:number){
  draw('/assets/demo-panels/result_card_image.png',x-4,y-7,w+8,h+14);if(!trade){text('-',x+w/2,y+h/2,30,'#887460','center');return;}
  const native=REFERENCE_INVENTORY_BY_TITLE[trade.title];if(native)draw(native.asset,x+w/2-66,y+6,132,121);
  else text(trade.title.slice(0,20),x+w/2,y+48,18,'#473f37','center');
  text(trade.side==='sell'?'SOLD':'BOUGHT',x+w/2,y+h-42,23,trade.side==='sell'?'#d1ffff':'#dfdab2','center');
  text(`${trade.price}U${trade.profit!==null?'  ('+(trade.profit>=0?'+':'')+trade.profit+'U)':''}`,x+w/2,y+h-14,21,'#453d37','center');
 }
 for(let i=0;i<9;i++)cell(records[summaryPage*9+i]??null,528+i%3*312,234+Math.floor(i/3)*210,268,163);
 cell(summary.best,183,341,264,155);cell(summary.worst,183,590,264,155);
 hit('summary-best','Best deal of the day',[164,329,302,181],()=>{summaryDetail=summaryDetail==='best'?null:'best';dirty=true;});
 hit('summary-worst','Worst deal of the day',[164,576,302,192],()=>{summaryDetail=summaryDetail==='worst'?null:'worst';dirty=true;});
 bitmapText(`DAY ${s.day}`,1520,309,310);
 const lines=[`${summary.purchases} bought / ${summary.sales} sold`,`Opening cash: ${summary.openingCash}U`,`Sales: +${summary.saleRevenue}U`,`Purchases: -${summary.purchaseCost}U`,`Borrowed: +${summary.borrowing}U`,`Repaid: -${summary.repayments}U`,`Interest paid: -${summary.interest}U`,`Closing cash: ${summary.closingCash}U`,`Known profit: ${summary.knownProfit}U`,...(s.failure?['Loan default',s.failure]:s.completed?['Session complete.','Sleep to return to menu.']:['Sleep to start tomorrow.'])];
 lines.forEach((line,i)=>text(line.slice(0,29),1520,370+i*34,20,'#674e40'));
 draw('/assets/demo-panels/result_pageNum.png',890,856,171,78);text(`${summaryPage+1}/${totalPages}`,970,915,37,'#94cecb','center');
 hit('summary-next','Next page',[1071,856,157,80],()=>{summaryPage=Math.min(totalPages-1,summaryPage+1);dirty=true;});hit('summary-previous','Previous page',[1233,856,157,80],()=>{summaryPage=Math.max(0,summaryPage-1);dirty=true;});
 draw('/assets/demo-panels/result_nextButton.png',1753,853,99,123);draw('/assets/demo-panels/result_pageDown_default.png',1071,856,156,78);draw('/assets/demo-panels/result_pageUp_default.png',1233,856,156,78);hit('aux-sleep',s.completed||s.failure?'Finish session':'Sleep',[1753,853,103,120],()=>runAux('day:sleep'));
 rect(0,0,1920,90,'#090908');rect(0,1000,1920,80,'#090908');
 if(summaryDetail){const trade=summary[summaryDetail];rect(152,190,730,135,'#d8c6a9');text(trade?.title??'No completed sale with known cost.',177,234,23,'#594735');if(trade)text(`Bought ${trade.costBasis}U / Sold ${trade.price}U / Profit ${trade.profit}U`,177,281,22,'#594735');}
}
function renderCalendar(){
 renderAuxiliary(game.state.day>=9?'calendar-later':'calendar');
 rect(399,375,1111,370,'#d9cbb0');bitmapText('Saved days',444,390,500);
 const result=saves.listDays();const branches=result.ok?result.value:[];
 if(!branches.length)text('No daily saves yet.',450,479,23,'#624d3d');
 branches.slice(saveListPage*8,saveListPage*8+8).forEach((b,i)=>{const x=433+(i%4)*260,y=452+Math.floor(i/4)*120;rect(x,y,239,96,'#bca88c');text(`DAY ${b.day}`,x+120,y+36,27,'#4d4338','center');text(b.branchId.slice(-12),x+120,y+68,16,'#68594a','center');hit(`load-day-${b.branchId}`,`Load day ${b.day}, branch ${b.branchId}`,[x,y,239,96],()=>loadSave(b.day,b.branchId));});
 hit('saved-days-next','More saves',[1093,288,86,63],()=>{saveListPage=Math.min(Math.max(0,Math.ceil(branches.length/8)-1),saveListPage+1);dirty=true;});
 hit('saved-days-previous','Previous saves',[748,288,86,63],()=>{saveListPage=Math.max(0,saveListPage-1);dirty=true;});
}
function renderModal(){
 // Clear underlying hit regions while a modal is open: a click cannot buy through it.
 hits=[];rect(505,245,910,590,'#4a4037');rect(515,255,890,570,'#cab99b');
 const title=modal==='settings'?'Settings':modal==='profile'?'Reputation':modal==='endings'?'Completed sessions':'Saved games';bitmapText(title,556,283,720);
 hit('modal-close','Close',[1314,271,60,60],()=>{modal=null;dirty=true;});text('X',1344,310,32,'#66503c','center');
 function button(id:string,label:string,y:number,action:()=>void){rect(560,y,800,63,'#ab9679');bitmapText(label,584,y+15,745);hit(id,label,[560,y,800,63],action);}
 if(modal==='settings'){
  button('settings-sound',`Sound: ${ambience.muted?'Off':'On'}`,363,()=>{ambience.muted=!ambience.muted;dirty=true;});
  button('settings-volume',`Volume: ${Math.round(ambience.volume*100)}%`,440,()=>{ambience.volume=(Math.round(ambience.volume*100)+25)%125/100;dirty=true;});
  button('settings-fullscreen','Fullscreen',517,()=>{if(document.fullscreenElement)void document.exitFullscreen();else void stage.requestFullscreen();});
  button('settings-save','Save game',594,()=>{if(saveNow())showMessage('Game saved.');});
  button('settings-menu','Save and return to main menu',671,()=>{if(game.state.mode==='menu'||saveNow()){game.state.mode='menu';modal=null;}dirty=true;});
 }else if(modal==='profile'){
  const p=game.state.profile;[[`Expertness: ${p.expertness}%`,382],[`Attractiveness: ${p.attractiveness}%`,453],[`Wittiness: ${p.wittiness}%`,524]].forEach(([line,y])=>bitmapText(String(line),585,Number(y),700));
  text(`Appraisals reviewed: ${game.state.appraisalReviews.length}`,587,635,25,'#685441');
 }else if(modal==='endings'){
  const result=saves.loadLatest();const saved=result.ok?result.value?.snapshot.state:null;
  if(saved?.completed){bitmapText(`${saved.campaign==='challenge'?'Challenge':'Story slice'} completed`,582,394,742);bitmapText(`${saved.trades.length} trades. Cash: ${saved.cash}U`,582,455,742);}
  else bitmapText('No completed session yet.',582,394,742);
 }else renderCalendar();
}
window.addEventListener('pagehide',()=>saveNow());
setInterval(()=>{if(game.state.mode==='menu'||modal||++saveClock%2)return;const now=JSON.stringify(sessionSnapshot());if(now!==lastSaved)saveNow();},1000);

function tagValue(c:Card){if(c.value===null||c.operator==='none')return '';return c.operator==='percent'?`${c.value>=0?'+':''}${c.value}%`:c.operator==='multiply'?`×${c.value}`:`${c.operator==='add'&&c.value>=0?'+':''}${c.value}U`;}
function bitmapText(value:string,x:number,y:number,maxWidth:number){
 const gap=1;const parts=Array.from(value,c=>c===' '?{c,w:7,g:null}:{c,w:(REFERENCE_FONT[c]||REFERENCE_FONT[c.toLowerCase()])?.width||10,g:REFERENCE_FONT[c]||REFERENCE_FONT[c.toLowerCase()]});const width=parts.reduce((v,p)=>v+p.w+gap,0);const scale=Math.min(1,maxWidth/width);ctx.save();ctx.beginPath();ctx.rect(x,y,maxWidth,32);ctx.clip();let dx=x;for(const p of parts){if(p.g)draw(p.g.asset,dx,y,p.w*scale,31);else if(p.c!==' '){text(p.c,dx,y+23,21,'#514332');}dx+=(p.w+gap)*scale;}ctx.restore();}
function cardDraw(c:Card,x:number,y:number,w=276,h=44,full=false){const id=c.id==='current-attraction'?`pink_trusted_${game.state.profile.attractiveness}`:game.nativeIds([c])[0];if(drawNativeCard(ctx,id,x,y,w,h,{image:img,full,otherCardIds:game.nativeIds(game.state.tags)}))return;if(c.asset)draw(c.asset,x,y,w,h);else{draw('/assets/ui/tag-base.png',x,y,w,h);bitmapText(c.label,x+38,y+5,165);text(tagValue(c),x+w-7,y+29,19,'#904e32','right');}}
function add(c:Card,hidden=false){game.add(c,hidden);if(game.state.dialogue)dialogueVisible=true;dirty=true;}
function renderLedger(){
 const s=game.state,v=game.visit;if(!v||!game.active)return;
 const recorded=recordedById[v.id];const exact=recorded?.states.find(p=>p.tags.join('|')===s.tags.map(t=>t.id).join('|')&&p.appraisedValue===game.estimate&&v.attractiveness===s.profile.attractiveness);
 if(exact?.ledgerAsset&&tagOffset===0)draw(exact.ledgerAsset,60,348,345,505);else{
 draw('/assets/ui/ledger-empty.png',60,346,345,510);patch(v.titlePatch);if(!v.titlePatch)bitmapText(v.title,91,366,285);
 s.tags.slice(tagOffset,tagOffset+6).forEach((c,i)=>cardDraw(c,103,411+i*48));
 const a=cards.filter(c=>c.group==='shop'&&c.value===s.profile.attractiveness)[0];if(a)cardDraw(a,103,714,276,48);else cardDraw({id:'current-attraction',label:'Attractiveness',group:'shop',operator:'percent',value:s.profile.attractiveness},103,714,276,48);
 rect(177,790,203,41,'#585858');digits(game.estimate,379,797,30,'#d4ff00');}
 s.tags.slice(tagOffset,tagOffset+6).forEach((c,i)=>{hit(`tag-${c.id}`,c.label,[103,411+i*48,276,44],()=>{hoverTag=hoverTag===c.id?null:c.id;dirty=true;},{card:c});hit(`private-${c.id}`,`Move ${c.label} to private slot`,[60,411+i*48,38,42],()=>{if(s.privateUnlocked){game.add(c,true);privateOpen=true;}dirty=true;});});
 hit('tags-up','Scroll tags up',[81,777,72,34],()=>{tagOffset=Math.max(0,tagOffset-1);dirty=true;});hit('tags-down','Scroll tags down',[81,814,72,34],()=>{tagOffset=Math.min(Math.max(0,s.tags.length-6),tagOffset+1);dirty=true;});
 if(hoverTag){const c=s.tags.find(t=>t.id===hoverTag);if(c){const index=s.tags.indexOf(c)-tagOffset;if(index>=0&&index<6){const r=drawNativeCard(ctx,game.nativeIds([c])[0],103,411+index*48,276,44,{image:img,expanded:true,otherCardIds:game.nativeIds(s.tags)});if(r)hit(`preview-${c.id}`,c.label,r.hit,()=>{}, {card:c});}}}
 if(s.privateUnlocked){hit('private-open','Open private slots',[110,855,80,35],()=>{privateOpen=!privateOpen;dirty=true;});if(privateOpen){draw('/assets/ui/private-panel.png',113,804,554,196);rect(257,815,278,34,'#655738');digits(game.value([...s.tags,...s.hidden]),530,818,29,'#ffdc77');s.hidden.forEach((c,i)=>{cardDraw(c,140+i*270,920,250,44);hit(`hidden-${c.id}`,c.label,[140+i*270,920,250,44],()=>{}, {card:c});});}}
}
function manualContexts(){const c=game.getContexts();if(game.state.campaign!=='demo')for(const p of NATIVE_MANUAL_PAGES)for(const key of p.unlockCondition.split('&&'))if(key!=='true')c[key]=true;return c;}
function renderBook(){const s=game.state;if(!s.book)return;
 if(s.campaign==='story'&&REF_BOOK_PAGE_BY_ID[s.book]){const p=REF_BOOK_PAGE_BY_ID[s.book];draw(p.assetURL,1350,155,570,800);for(const h of p.hotspots){const c=h.tagId?bookCards[h.tagId]:undefined;hit(`book-${h.id}`,h.label,[1350+h.rect[0],155+h.rect[1],h.rect[2],h.rect[3]],()=>{if(h.kind==='close')s.book=null;else if(h.target)s.book=h.target;dirty=true;},{card:c,disabled:h.kind==='locked'});}return;}
 const contexts=manualContexts();nativeManual.setPointer(pointer.x,pointer.y);for(const h of nativeManual.render(ctx,s.book,contexts)){const card=h.cardId?game.cardsFromNative([h.cardId])[0]:undefined;hit(h.id,h.label,h.rect,()=>{if(h.action==='close')s.book=null;else if(h.action==='home')s.book='Home';else if(h.action==='previous'||h.action==='next')s.book=adjacentManualPage(s.book??'Home',h.action==='previous'?-1:1,contexts);else if(h.pageId)s.book=h.pageId;dirty=true;},{card,disabled:h.disabled});}
}
const toolNames=['screwdriver','damage','gem','material','year','signature'];
function toolEnabled(name:string){if(gemPending)return false;if(game.state.campaign==='demo'){const key:Record<string,string>={damage:'integrity',material:'material',signature:'signature',year:'year',gem:'jewel',screwdriver:'screw'};return game.getContext(NATIVE_TOOL_UNLOCKS[name as NativeTool])===true;}return name!=='gem'||game.state.gemUnlocked;}
function nativeItem(){return game.visit?.side==='sell'?game.saleItem?.nativeItem:game.state.activeNativeItem;}
function inspect(tool:string){if(!toolEnabled(tool)||!game.active)return;const item=nativeItem();if(item){
 const result=inspectNativeItem(item,tool as NativeTool,{currentBookPage:game.state.book?nativePage(game.state.book).id:undefined,shift:shiftHeld,manualEnabled:game.getContext('Mechanic.manual')===true,privateCardIds:game.nativeIds(game.state.hidden),customerCardIds:game.nativeIds(game.state.customerCards),open:openedItem});
 needleFrom=nativeDamageIdleAngle(elapsed/1000);inspectionAge=0;nativeReading=result;game.inspect(tool,{bookPage:result.bookPage??game.state.book,toolUseHook:result.toolUseHook,usedEvent:result.usedEvent,deselect:result.deselect});
 if(result.open!==undefined)openedItem=result.open;
 if(result.assumedCard&&result.status==='available'){gemPending={remaining:(result.printSeconds??.75)+(result.fadeSeconds??.25),cardId:result.assumedCard.id};privateOpen=true;}
 if(result.status==='failed'||result.status==='source-error')showMessage(result.reason);
 }else{game.inspect(tool);const reading=inspectItem(game.visit.id,tool);if(reading.readout?.bookPage&&!shiftHeld)game.state.book=reading.readout.bookPage;}
 toolBar=false;calculator=false;dirty=true;
}
function updateInspection(dt:number){inspectionAge+=dt;if(!gemPending)return;gemPending.remaining-=dt;dirty=true;if(gemPending.remaining<=0){const c=game.cardsFromNative([gemPending.cardId])[0];if(c)game.add(c,true);gemPending=null;game.state.tool=null;}}
function renderTools(){const s=game.state;if(!game.active)return;surface('tools-trigger',912,953,92,38);hit('tools-trigger','Open appraisal tools',[894,940,130,60],()=>{toolBar=true;dirty=true;});hit('item','Inspect or rotate item',[785,690,345,270],()=>{if(s.tool)inspect(s.tool);else {const d=nativeItem(),def=d&&getNativeItem(d.definitionId);if(def?.zoomSprite||/Bookmark|Stamp|Postage|Tiny/i.test(game.visit?.title||''))itemZoom=!itemZoom;else toolBar=!toolBar;dirty=true;}});
 if(toolBar){toolNames.forEach((t,i)=>{surface('tool-slot-empty',708+i*83,898,83,98);if(toolEnabled(t))surface(`tool-${t}`,716+i*83,911,67,68);hit(`tool-${t}`,t,[708+i*83,898,83,98],()=>{if(toolEnabled(t)){s.tool=t;toolBar=false;nativeReading=null;toolHover=false;}dirty=true;},{tool:t,disabled:!toolEnabled(t)});});}
 if(s.tool&&s.inspected.includes(s.tool)&&inside(pointer,[785,684,345,278]))renderReadout(s.tool,pointer.x,pointer.y);
 if(gemPending&&!inside(pointer,[785,684,345,278]))drawNativeGem(ctx,img,pointer.x,pointer.y,1-gemPending.remaining);
}
function enterDigit(d:string){if(!listingEdit){game.enterDigit(d);return;}const s=game.state;if(d==='C')s.quote='';else if(d==='E')s.quote=s.quote.slice(0,-1);else if(/^\d$/.test(d)&&s.quote.length<7)s.quote=(s.quote==='0'?'':s.quote)+d;}
function submitOffer(){
 if(listingEdit&&game.state.mode==='sales'&&game.state.selectedStock){const p=Number(game.state.quote);game.listStock(game.state.selectedStock,p);calculator=false;listingEdit=false;inventoryOpen=true;}
 else{game.offer();calculator=false;dialogueVisible=true;}
 dirty=true;
}
function renderCalculator(){if(!calculator||(!game.active&&!listingEdit))return;surface(game.state.mode==='shop'?'calculator-shop':'calculator',1486,526,333,game.state.mode==='shop'?474:462);rect(1578,569,198,50,'#686a66');digits(game.state.quote||'0',1770,577,34,'#d8df83');
 ['1','2','3','4','5','6','7','8','9'].forEach((d,i)=>hit(`key-${d}`,`Key ${d}`,[1525+i%3*56,681+Math.floor(i/3)*51,50,46],()=>{enterDigit(d);dirty=true;}));
 hit('key-0','Key 0',[1583,832,50,45],()=>{enterDigit('0');dirty=true;});hit('key-clear','Clear',[1693,681,55,43],()=>{enterDigit('C');dirty=true;});hit('key-erase','Erase',[1693,728,55,43],()=>{enterDigit('E');dirty=true;});
 hit('offer','Offer',[1638,832,109,45],()=>{submitOffer();});hit('decline','Decline',[1516,911,117,50],()=>{if(!listingEdit)game.requestDecline();calculator=false;listingEdit=false;dirty=true;});hit('accept','Accept',[1669,911,122,50],()=>{if(listingEdit)submitOffer();else game.accept();calculator=false;dialogueVisible=true;dirty=true;});
}
function guestBalloon(x:number,y:number,w:number,h:number){
 const im=img('/assets/demo-panels/balloon_guest_01.png');if(!im.complete||!im.naturalWidth)return;
 const sx=[0,11,126,137],sy=[0,10,40,59],dx=[x,x+33,x+w-33,x+w],dy=[y,y+30,y+h-57,y+h];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(im,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],Math.round(dx[col]),Math.round(dy[row]),Math.round(dx[col+1]-dx[col]),Math.round(dy[row+1]-dy[row]));
}
function renderDialogue(){
 if((!dialogueVisible&&!game.world.story&&!game.curationView?.waiting)||!game.visit)return;const s=game.state;if(game.world.story||game.curationView?.waiting){renderNativeDialogue();return;}const dialogue=game.visit.dialogues[Math.min(s.dialogueIndex,game.visit.dialogues.length-1)];let area:Hit['rect']=dialogue?.rect??[640,235,640,120];
 if(!s.dialogue&&dialogue?.asset&&dialogue.rect)draw(dialogue.asset,...dialogue.rect);
 else if(s.dialogue||dialogue?.text){
  const line=s.dialogue||dialogue.text,words=line.split(/\s+/),lines:string[]=[];let current='';
  for(const word of words){if((ctx.font='30px OrangeKid',ctx.measureText((current+' '+word).trim()).width)>610){lines.push(current);current=word;}else current=(current+' '+word).trim();}if(current)lines.push(current);
  const width=Math.min(670,Math.max(250,Math.max(...lines.map(l=>ctx.measureText(l).width))+54)),height=82+lines.length*28;area=[961-width/2,308-height,width,height];guestBalloon(...area);lines.forEach((l,i)=>text(l,961,area[1]+54+i*28,20,'#493b3e','center'));
 }
 hit('dialogue-next','Continue dialogue',area,()=>{if(s.dialogue){s.dialogue='';dialogueVisible=false;}else{s.dialogueIndex++;if(s.dialogueIndex>=game.visit.dialogues.length){dialogueVisible=false;if(s.phase==='narrative')game.completeNarrative();}}dirty=true;});
}
function renderNativeDialogue(){const story=game.storyView;const line=story.line;if(!line&&!story.choices.length)return;ctx.font='30px OrangeKid';const words=line.split(/\s+/),lines:string[]=[];let current='';for(const word of words){if(ctx.measureText((current+' '+word).trim()).width>620&&current){lines.push(current);current=word;}else current=(current+' '+word).trim();}if(current)lines.push(current);const height=Math.max(110,64+lines.length*29),area:Hit['rect']=[616,Math.max(106,312-height),690,height];guestBalloon(...area);lines.forEach((l,i)=>text(l,961,area[1]+43+i*29,20,'#493b3e','center'));
 if(story.choices.length)story.choices.forEach((choice,i)=>{const r:Hit['rect']=[690,320+i*63,570,58];rect(...r,'#ddd1b6');text(choice.label,975,r[1]+38,21,'#4b3d35','center');hit(`story-choice-${choice.id}`,choice.label,r,()=>{game.chooseStory(choice.id);dirty=true;});});else hit('dialogue-next','Continue dialogue',area,()=>{game.continueStory();dialogueVisible=true;dirty=true;});}
function renderCurrentCharacter(){const v=game.visit;if(!v)return;const id=v.sourceCharacterId;if(!id){patch(v.npc);return;}let appearance=nativeAppearances.get(v.id);if(!appearance){appearance=createNativeCharacterAppearance(id,{seed:game.state.seed,evaluateContext:p=>testCondition(p,game.getContexts())});if(appearance)nativeAppearances.set(v.id,appearance);}if(!appearance)return;const layers=getNativeCharacterLayers(appearance,{time:elapsed/1000,speaking:dialogueVisible||!!game.world.story});ctx.save();ctx.beginPath();ctx.rect(600,90,710,654);ctx.clip();for(const l of layers){const im=img(l.sprite.asset);if(!im.complete||!im.naturalWidth)continue;const tintKey=l.sprite.asset+'|'+l.hsv.join(',');let colored=characterTints.get(tintKey);if(!colored){colored=document.createElement('canvas');colored.width=im.naturalWidth;colored.height=im.naturalHeight;const c=colored.getContext('2d')!;c.drawImage(im,0,0);const pixels=c.getImageData(0,0,colored.width,colored.height);applyNativeCharacterHsl(pixels.data,l.hsv);c.putImageData(pixels,0,0);characterTints.set(tintKey,colored);}ctx.save();ctx.translate(960+l.x*3,765-l.y*3);ctx.scale(l.scaleX,l.scaleY);ctx.drawImage(colored,-l.sprite.pivot[0]*l.sprite.width*3,-(1-l.sprite.pivot[1])*l.sprite.height*3,l.sprite.width*3,l.sprite.height*3);ctx.restore();}ctx.restore();}
function stockSprite(item:Game['state']['stock'][number],x:number,y:number,w:number,h:number){const sprite=getNativeItem(item.nativeItem?.definitionId??item.definitionId??'')?.sprite;if(!sprite)return false;const scale=Math.min(w/sprite.width,h/sprite.height);draw(sprite.asset,x+(w-sprite.width*scale)/2,y+(h-sprite.height*scale)/2,sprite.width*scale,sprite.height*scale);return true;}
function renderCurrentItem(){const instance=nativeItem(),def=instance&&getNativeItem(instance.definitionId),sprite=def&&(itemZoom&&def.zoomSprite?def.zoomSprite:openedItem&&def.openSprite?def.openSprite:def.sprite);if(sprite){const scale=Math.min(345/sprite.width,278/sprite.height,3);draw(sprite.asset,957.5-sprite.width*scale/2,823-sprite.height*scale/2,sprite.width*scale,sprite.height*scale);}else if(def){text(def.name,958,812,22,'#c9c1a4','center');}else patch(game.visit?.item);}
function renderDate(){if(game.state.day>=6&&game.state.day<=11)draw(`/assets/ui/day-${game.state.day}.png`,696,420,84,68);else{rect(696,420,84,68,'#c7cbbd');text(String(game.state.day),738,470,30,'#524d41','center');}}
function renderShop(){const s=game.state;draw('/assets/ui/shop-empty-clean.png',0,0,1920,1080);const wi=String(Math.floor(elapsed/125)%96+1).padStart(3,'0');draw(`/assets/window-left/${wi}.png`,110,392,560,248);draw(`/assets/window-right/${wi}.png`,1196,392,560,248);renderDate();if(s.phase!=='between'&&broadcastKind!=='morning'){renderCurrentCharacter();const animation=REFERENCE_ANIMATIONS[game.visit.id];if(animation){const frame=Math.floor(elapsed/125)%animation.frames.length;draw(animation.frames[frame],...animation.rect);}if(s.phase!=='settled'){if(itemZoom&&/Bookmark/.test(game.visit?.title||''))surface('bookmark-magnified',785,684,345,278);else renderCurrentItem();}}
 if(s.campaign==='story'&&s.phase==='between'&&!finalStreet&&lastNightDay!==s.day){lastNightDay=s.day;broadcastKind='night';broadcastIndex=0;}if(s.phase==='between'){hit('night-leave','Leave shop',[838,339,252,400],()=>{enterStreet();broadcastKind=null;dirty=true;});}if(game.visit?.id==='day11-private-slot-tutorial'){draw('/assets/ui/training-hoverboard.png',785,684,345,278);draw('/assets/ui/training-ledger.png',60,348,345,505);draw('/assets/ui/private-panel.png',113,804,554,196);}if(plantDays>0)draw(HORONG_COUNTER_PATCH.asset,...HORONG_COUNTER_PATCH.rect);if(broadcastKind!=='morning'){renderLedger();renderTools();}hit('calendar-open','Open calendar',[696,424,87,64],()=>{returnMode=s.mode;s.mode='calendar';dirty=true;});hit('wanted-board','Missing and Wanted',[1650,392,95,94],()=>{showWanted=!showWanted;dirty=true;});hit('book-open','Open book',[1882,456,38,149],()=>{s.book=s.book?null:(s.campaign==='story'?'index':'Home');calculator=false;dirty=true;});hit('calculator-toggle','Open offer calculator',[1486,943,333,60],()=>{calculator=!calculator;s.book=null;dirty=true;});
 hit('sales-left','Show sale shelves',[0,456,45,155],()=>moveMode('sales'));if(s.phase!=='between'&&broadcastKind!=='morning')hit('npc-dialogue','Speak to visitor',[845,328,240,390],()=>{if(s.phase==='settled'){game.next();dialogueVisible=false;}else if(game.visit.id==='day10-fine-visit'&&!performedEvents.has('day10-fine-250')){financialScreen='fine';}else if(game.world.story){game.continueStory();dialogueVisible=true;}else if(s.phase==='narrative'&&!game.visit.dialogues.length){game.completeNarrative();}else{dialogueVisible=true;s.dialogueIndex=0;}dirty=true;});
 if(s.phase==='settled'){hit('next-visitor','Next visitor',[845,328,240,390],()=>{game.next();dialogueVisible=false;dirty=true;});}
 renderReporting();renderBook();renderCalculator();renderDialogue();renderCuration();
}
function submitReport(){game.report();syncBusinessUI();dirty=true;}
function renderReporting(){if(game.state.day<11)return;const offset=reportCollapsed?100:0;const asset=REPORTING_BY_ID[`device-${String(Math.min(2,reportCount)).padStart(2,'0')}`];ctx.save();ctx.beginPath();ctx.rect(0,0,1920,1000);ctx.clip();draw(asset.asset,1259,811+offset,180,189);if(reportToday!==reportCount||reportCount>2){rect(1280,845+offset,146,52,'#262529');digits(String(reportToday).padStart(2,'0'),1335,849+offset,40,'#dbc86d');digits(String(reportCount).padStart(2,'0'),1417,849+offset,40,'#b66c62');}const hover:Hit['rect']=[1267,841+offset,166,58];if(inside(pointer,hover))draw(REPORTING_BY_ID['counter-labels'].asset,...hover);if(!reportCollapsed&&inside(pointer,REPORTING_DEVICE.reportButtonRect))patch(REPORTING_BY_ID['button-hover']);ctx.restore();hit('report-toggle',reportCollapsed?'Expand report device':'Collapse report device',reportCollapsed?REPORTING_DEVICE.collapsedTopToggleRect:REPORTING_DEVICE.topToggleRect,()=>{reportCollapsed=!reportCollapsed;dirty=true;});if(!reportCollapsed)hit('report-submit','Report current customer',REPORTING_DEVICE.reportButtonRect,submitReport);}
function renderInventory(){game.signalStory('StockOpened');const drawerOffset=stockDetail?-260:0;surface('sales-inventory',1596+drawerOffset,194,324,698);const stock=game.state.stock.slice(inventoryPage*10,inventoryPage*10+10);for(let i=0;i<10;i++){let x=REFERENCE_INVENTORY_GRID.x+drawerOffset+i%2*REFERENCE_INVENTORY_GRID.columnStep,y=REFERENCE_INVENTORY_GRID.y+Math.floor(i/2)*REFERENCE_INVENTORY_GRID.rowStep;surface('inventory-slot-empty',x,y,132,121);const item=stock[i];if(item){const native=REFERENCE_INVENTORY_BY_TITLE[item.title];if(native)draw(native.asset,x,y,132,121);else if(!stockSprite(item,x+9,y+10,110,99)&&item.patch)draw(item.patch.asset,x+9,y+10,110,99);}if(item)hit(`inventory-${item.id}`,item.title,[x,y,132,121],()=>{game.state.selectedStock=item.id;stockDetail=item.id;dirty=true;},{stock:item.id});}
 for(let i=0;i<3;i++)hit(`inventory-page-${i}`,`Inventory page ${i+1}`,[1668+drawerOffset+i*56,842,45,42],()=>{inventoryPage=i;dirty=true;});}
function renderStockDetail(){
 const item=game.state.stock.find(i=>i.id===stockDetail);if(!item)return;
 const v=visits.find(v=>v.id===(item.definitionId??item.id));const exact=/Backpack of Soldier/.test(item.title)&&item.paid===45&&item.value===58?'backpack':/Golden Glasses/.test(item.title)&&item.paid===75&&item.value===137?'golden-glasses':/My Dear Rabbit/.test(item.title)&&item.paid===1789&&item.value===3011?'rabbit':/Seoul/.test(item.title)&&item.paid===60&&item.value===98?'stamp':/Seoul/.test(item.title)&&item.paid===60&&item.value===196?'stamp-repaired':null;
 if(exact)surface(`inventory-detail-${exact}`,1616,149,304,756);
 else{surface('inventory-detail-backpack',1616,149,304,756);rect(1635,158,277,455,'#d3c9aa');if(v?.titlePatch)draw(v.titlePatch.asset,1628,158,285,61);else text(item.title.slice(0,20),1633,190,19);item.cards.slice(detailOffset,detailOffset+5).forEach((c,i)=>cardDraw(c,1629,350+i*46,276,44));rect(1640,801,269,79,'#565657');digits(item.value,1900,806,30,'#d4ed6c');digits(item.paid,1900,851,23,'#cdc7a0');}
 hit('inventory-detail-close','Close item details',[1888,150,31,51],()=>{stockDetail=null;dirty=true;});hit('inventory-detail-down','More attributes',[1870,742,44,48],()=>{detailOffset=Math.min(Math.max(0,item.cards.length-5),detailOffset+1);dirty=true;});
}
const salePositions:[number,number][]=[[112,306],[334,306],[1006,306],[1229,306],[112,514],[334,514],[1006,514],[1229,514],[112,722],[334,722],[558,722],[783,722],[1006,722],[1229,722]];
function renderSales(){
 draw('/assets/ui/shop-empty-clean.png',0,0,1920,1080);surface('sales-wall',0,90,1595,910);
 const listed=game.state.stock.filter(i=>i.listing!==null);
 salePositions.forEach(([x,y],i)=>{surface('sale-slot-empty',x,y,217,202);const item=listed.find(s=>s.slot===i);if(item){
  const native=REFERENCE_SHELF_BY_TITLE[item.title];if(native&&native.price===item.listing)draw(native.asset,x+2,y+1,212,200);else if(item.sourceListing&&item.patch&&item.originalListing===item.listing)draw(item.patch.asset,x+2,y+1,212,200);
  else{if(native){const im=img(native.asset);if(im.complete&&im.naturalWidth)ctx.drawImage(im,0,0,212,124,x+2,y+1,212,124);}else{text(item.title.slice(0,22),x+108,y+39,19,'#dcdb80','center');const cell=REFERENCE_INVENTORY_BY_TITLE[item.title];if(cell)draw(cell.asset,x+50,y+44,118,108);else if(!stockSprite(item,x+40,y+15,140,110)&&item.patch)draw(item.patch.asset,x+63,y+53,88,84);}digits(item.listing||0,x+187,y+147,30,'#e4e1aa');}
 }
 if(item){surface('sale-remove-control',x+185,y+8,23,23);hit(`remove-sale-${item.id}`,`Take down ${item.title}`,[x+180,y,35,36],()=>{item.listing=null;item.slot=null;inventoryOpen=true;dirty=true;});}hit(`sale-slot-${i}`,item?.title||`Sale slot ${i+1}`,[x,y,217,202],()=>{if(item){game.state.selectedStock=item.id;listingEdit=true;calculator=true;game.state.quote=String(item.listing);}dirty=true;},item?{stock:item.id}:{});if(item)hit(`remove-sale-hit-${item.id}`,`Take down ${item.title}`,[x+180,y,35,36],()=>{item.listing=null;item.slot=null;inventoryOpen=true;dirty=true;});
 });
 const recommended=listed.find(i=>i.slot===14);if(recommended){rect(570,320,415,380,'#2e2d31');if(!stockSprite(recommended,648,370,260,240)&&recommended.patch)draw(recommended.patch.asset,648,370,260,240);text(recommended.title.slice(0,28),778,350,20,'#ded68d','center');digits(recommended.listing||0,960,659,32,'#ddd99a');}hit('recommended','Recommended item',[558,306,441,410],()=>{if(recommended){game.state.selectedStock=recommended.id;stockDetail=recommended.id;}dirty=true;},recommended?{stock:recommended.id}:{});
 hit('shop-return','Return to counter',[0,456,48,150],()=>moveMode('shop'));
 hit('inventory-toggle','Open inventory',[1578,455,58,150],()=>{inventoryOpen=!inventoryOpen;dirty=true;});
 hit('calculator-toggle','Offer calculator',[1486,942,333,60],()=>{calculator=!calculator;dirty=true;});if(inventoryOpen&&game.curationView?.stage!=='select')renderInventory();
 if(game.visit?.side==='sell'&&game.active&&!game.curationView)hit('sales-customer','Customer offer',[558,310,439,400],()=>{listingEdit=false;calculator=true;game.beginSale();calculator=game.active;game.state.quote=String(game.state.counter??game.saleItem?.listing??0);dialogueVisible=true;dirty=true;});
 renderCalculator();renderDialogue();renderCuration();if(game.state.phase==='settled')hit('next-visitor','Continue after sale',[600,350,740,560],()=>{game.next();dialogueVisible=false;dirty=true;});
}
function renderCuration(){const c=game.curationView;if(!c||c.waiting||c.stage==='settled')return;if(c.stage==='select'){inventoryOpen=true;renderInventory();const selected=game.getCurationCandidates().find(i=>i.id===game.state.selectedStock);rect(1100,875,380,65,'#c9bca0');text(selected?'Show '+selected.title:'Select an item',1290,917,22,'#4b3f30','center');hit('curation-show','Show selected item',[1100,875,380,65],()=>{if(selected&&game.submitCurationItem(selected.id)){stockDetail=null;inventoryOpen=false;dialogueVisible=true;}dirty=true;},{disabled:!selected});hit('curation-decline','Decline request',[1100,950,250,46],()=>{game.requestDecline();dirty=true;});text('Decline',1225,982,19,'#d5c7a3','center');}else if(c.stage==='price'||c.stage==='counter'){hit('curation-price','Offer a price',[1100,875,380,65],()=>{calculator=true;listingEdit=false;dirty=true;});if(!calculator){rect(1100,875,380,65,'#c9bca0');text(c.counter!==null?`Offer: ${c.counter}V`:'Offer a price',1290,917,22,'#4b3f30','center');}}}
function renderMenu(){surface('main-menu',0,0,1920,1080);hit('new-game','New Game',[500,885,225,58],start);hit('load-game','Load Game',[784,885,251,58],()=>loadSave());hit('settings','Settings',[1094,885,186,58],()=>{modal='settings';dirty=true;});hit('quit','Quit',[1335,885,115,58],()=>{game.state.mode='menu';dirty=true;});hit('challenge','Challenge Mode',[640,969,250,42],()=>start('challenge'));hit('endings','Endings',[1085,969,140,42],()=>{modal='endings';dirty=true;});}
function runAux(action:string){
 const s=game.state;
 if(action.startsWith('nav:')){
  const dest=action.slice(4);auxPanel=null;
  if(dest==='shop'){
   if(s.phase==='between'){s.mode='summary';summaryPage=0;inventoryOpen=false;stockDetail=null;calculator=false;listingEdit=false;}
   else if(morningPending){morningPending=false;broadcastKind=s.campaign==='story'?'morning':null;broadcastIndex=0;moveMode(game.visit.side==='sell'?'sales':'shop');}
   else moveMode('shop');
  }else if(dest==='flower-shop'||dest==='store:Scented'){if(game.isStreetStoreOpen('Scented')){s.mode='flower';auxPanel='flower-shop';}else showMessage('The entrance is closed.');}
  else if(dest==='repair-shop'||dest==='store:RepairShop'){if(game.isStreetStoreOpen('RepairShop')){financialScreen='repair';inventoryOpen=true;}else showMessage('The entrance is closed.');}
  else if(dest==='gem-shop'||dest==='store:GemByJ'){if(game.isStreetStoreOpen('GemByJ')){s.mode='gem-shop';gemDialogue=nativeGemDialogue(s.day,s.seed).map(line=>line.text);gemLine=0;inventoryOpen=false;streetView();}else showMessage('The entrance is closed.');}
  else if(dest==='office')financialScreen='office';
  else enterStreet(dest);
 }else if(action==='aux:close'){auxPanel=null;showLoans=false;if(s.mode==='calendar')s.mode=returnMode;}
 else if(action==='inventory:toggle')inventoryOpen=!inventoryOpen;
 else if(action==='flower:inspect:horong'||action==='flower:talk')auxPanel='flower-buy';
 else if(action==='flower:buy:horong'){if(game.buyFlower())auxPanel='flower-shop';else showMessage(s.plantDays>0?'There is already a flower in the shop.':'Not enough cash.');}
 else if(action.startsWith('loan:pay:')){if(!game.repay(action.slice(9)))showMessage('Not enough cash to pay off this loan.');}
 else if(action.startsWith('loan:get:')){if(!game.borrow(action.slice(9)))showMessage('This loan is not available.');}
 else if(action==='cash:13'){if(!performedEvents.has('street-scavenge-13')&&game.cashEvent('street-scavenge-13',13,'salvage','Found in a discarded bag'))performedEvents.add('street-scavenge-13');}
 else if(action==='street:notice:darcy')runAux('nav:shop');
 else if(action==='day:sleep'){
  if(s.completed||s.failure){saveNow();s.mode='menu';}
  else if(game.nextDay()){reportToday=0;enterStreet();morningPending=true;auxPanel=null;summaryPage=0;saveDay();}
  else if(s.failure){s.mode='summary';}
 }
 else if(action==='summary:best:show')summaryDetail=summaryDetail==='best'?null:'best';
 else if(action==='summary:worst:show')summaryDetail=summaryDetail==='worst'?null:'worst';
 else if(action==='summary:next')summaryPage++;
 else if(action==='summary:previous')summaryPage=Math.max(0,summaryPage-1);
 else if(action==='tutorial:okay'){if(tutorial==='private-tutorial')tutorial='gem-tutorial';else tutorial=null;}
 else if(action==='report:submit')submitReport();
 else if(action==='gem:show-item'){if(s.selectedStock){financialScreen='repair';stockDetail=null;inventoryOpen=false;}else inventoryOpen=true;}
 else if(action==='street:participate'){showMessage('The crowd is protesting the AVAC.');}
 else if(action.startsWith('street:')){showMessage(action.includes('scavenge')?'Nothing else was found here.':'The entrance is closed.');}
 dirty=true;
}
function renderAuxiliary(id:string){const a=auxiliaryScreen(id);if(!a)return;draw(a.asset,...a.rect);a.hotspots.forEach(h=>hit(`aux-${h.id}`,h.label,h.rect,()=>runAux(h.action)));}
function renderAux(){
 const s=game.state;
 if(s.mode==='street'){draw('/assets/surfaces/street-main.png',0,0,1920,1080);streetWorld.render(ctx);const world=streetWorld.state();if(world.floor==='public'){const nearProtest=!world.later&&Math.abs(world.x-1950)<420;const speech=nearProtest?STREET_PROTEST_DIALOGUES[Math.floor(elapsed/5000)%STREET_PROTEST_DIALOGUES.length]:Math.abs(world.x-1094)<180?STREET_AMBIENT_DIALOGUES.find(v=>v.group==='office'):Math.abs(world.x-2524)<180?STREET_AMBIENT_DIALOGUES[Math.floor(elapsed/5000)%2]:undefined;if(speech)draw(speech.asset,speech.rect[0],speech.rect[1],speech.rect[2],speech.rect[3]);}hit('street-ground','Walk or interact',[0,90,1920,900],()=>{const action=streetWorld.click(pointer.x,pointer.y);if(action)runAux(action);dirty=true;});hit('street-inventory','Open inventory',[1881,455,39,150],()=>{inventoryOpen=!inventoryOpen;dirty=true;});}
 else if(s.mode==='flower')renderAuxiliary(auxPanel==='flower-buy'?'flower-buy':'flower-shop');
 else if(s.mode==='gem-shop'){streetView().renderInterior(ctx,'GemByJ',game.getContexts());if(!gemDialogue.length)gemDialogue=nativeGemDialogue(s.day,s.seed).map(line=>line.text);hit('aux-exit-prompt','Move to Street',[827,427,240,65],()=>runAux('nav:street'));const line=gemDialogue[gemLine];if(line){guestBalloon(580,138,760,170);const words=line.split(/\s+/),lines:string[]=[];let current='';for(const word of words){if((current+' '+word).length>58){lines.push(current);current=word;}else current=(current+' '+word).trim();}if(current)lines.push(current);lines.forEach((line,i)=>text(line,960,180+i*30,21,'#493b3e','center'));hit('gem-dialogue-next','Continue dialogue',[580,138,760,170],()=>{gemLine++;dirty=true;});}else hit('gem-shopkeeper','Talk',[1110,420,290,340],()=>{gemLine=0;dirty=true;});}

 else if(s.mode==='summary')renderSummary();
 else if(s.mode==='calendar'){draw('/assets/ui/shop-empty-clean.png',0,0,1920,1080);renderCurrentCharacter();if(game.state.phase!=='settled')patch(game.visit?.item);renderDate();renderCalendar();}
 if(inventoryOpen&&s.mode!=='summary')renderInventory();
}
function topbar(){if(game.state.mode==='menu')return;rect(1560,0,210,89,'#000');digits(`${game.state.cash}U`,1753,31,46);hit('top-exit','Leave shop',[70,23,61,60],()=>moveMode(game.state.mode==='street'?'shop':'street'));hit('top-settings','Settings',[141,22,65,61],()=>{modal='settings';dirty=true;});hit('top-report','City report',[218,22,58,60],()=>{if(game.state.day>=11)showCityProgress=!showCityProgress;dirty=true;});hit('top-help','Profile',[287,22,64,62],()=>{modal='profile';dirty=true;});hit('loans','Loan ledger',[1790,19,68,70],()=>{showLoans=!showLoans;dirty=true;});}
function performEvent(id:string){const e=RECORDED_EVENTS.find(e=>e.id===id);if(!e||e.amount===null||performedEvents.has(id))return false;if(!game.cashEvent(id,e.amount,'fee',e.id))return false;performedEvents.add(id);dirty=true;return true;}
function leaveFinancial(){financialScreen=null;dirty=true;}
function renderFinancial(){
 const id=financialScreen;
 if(id==='repair'){
  draw('/assets/ui/repair-before.png',0,0,1920,1080);const item=game.inventorySelection;
  rect(460,115,900,240,'#d4c8b4');bitmapText(item?.title??'Select an item from your inventory.',490,140,820);
  const quote=item?game.repairInfo(item):null;
  bitmapText(quote?.eligible?`Repair: ${quote.cost}U`:'This item cannot be repaired.',490,200,820);
  if(quote?.eligible){bitmapText(quote.mode==='overnight'?'Come back tomorrow.':'It will be ready today.',490,246,820);hit('repair-confirm','Repair selected item',[460,280,380,70],()=>{if(item&&game.repair(item.id)){financialScreen=null;inventoryOpen=true;}else showMessage('Not enough cash.');dirty=true;});bitmapText('Repair',550,297,200);}
  hit('repair-inventory','Choose another item',[900,280,420,70],()=>{financialScreen=null;inventoryOpen=true;dirty=true;});bitmapText('Choose another item',910,297,400);
 }else{
  const eventId=id==='office'?'day9-registration-fee':'day10-fine-250',e=RECORDED_EVENTS.find(e=>e.id===eventId)!;
  if(performedEvents.has(eventId)&&e.asset)draw(e.asset,0,0,1920,1080);else draw(`/assets/ui/${id==='fine'?'fine-choice':'office-before'}.png`,0,0,1920,1080);
  if(!performedEvents.has(eventId)&&e.hotspot)hit(`event-${eventId}`,e.hotspot.label,e.hotspot.rect,()=>{if(!performEvent(eventId))showMessage('Not enough cash.');dirty=true;});
  if(performedEvents.has(eventId))hit('financial-complete','Continue',[450,100,960,300],leaveFinancial);
 }
 rect(1560,0,210,89,'#000');digits(`${game.state.cash}U`,1753,31,46);hit('financial-return','Return',[1857,452,62,155],leaveFinancial);
}
function renderBroadcast(){
 if(!broadcastKind)return;const ids=broadcastKind==='morning'?MORNING_SEQUENCE:broadcastKind==='night'?NIGHT_SEQUENCE:STORY_SEQUENCE;const entry=BROADCAST_BY_ID[ids[broadcastIndex]];if(!entry){broadcastKind=null;return;}draw(entry.asset,...entry.rect);hit('broadcast-next','Continue announcement',entry.rect,()=>{broadcastIndex++;if(broadcastIndex>=ids.length){broadcastKind=null;broadcastIndex=0;}dirty=true;});}
function renderLoans(){
 const ids=game.state.day>=11?['avac','darcy','executor']:['darcy',...(game.state.day>=8?['executor']:[])];
 const entries:LoanPanelEntry[]=ids.map(id=>{const l=game.getLoan(id),active=l?.status==='active',prior=game.state.cashbook.filter(e=>e.category==='loan'&&e.label==='avac loan').length;
  const principal=active?l.principal:id==='darcy'?game.darcyLimit():id==='executor'?1500:5000;
  return {id,name:id,principal,payoff:game.repayment(id)??principal,interest:active?cycleInterest(l):Math.trunc(principal*(id==='darcy'?.05:id==='executor'?.3:.1)),cycle:active?l.cycleDays:id==='executor'?3:id==='avac'?2:1,overdue:active?l.overdue:0,active,...(id==='avac'&&l?.status==='repaid'?{status:'repaid' as const}:{})};
 });
 renderLoanPanel(ctx,{entries,draw,text:(s,x,y,size=30,color='#473f2f',align='left')=>text(s,x,y,size/1.5,color,align),hit,cash:game.state.cash,onClose:()=>{showLoans=false;dirty=true;},onAction:(id,action)=>runAux(`loan:${action}:${id}`),pressedId:down?.hit?.id});
}
function overlays(){if(game.state.tool&&nativeItem()&&!inside(pointer,[785,684,345,278])&&!gemPending){if(game.state.tool==='damage')drawNativeDamage(ctx,img,pointer.x,pointer.y,nativeDamageIdleAngle(elapsed/1000));else if(game.state.tool==='gem')drawNativeGem(ctx,img,pointer.x,pointer.y,null);else surface(`tool-${game.state.tool}`,pointer.x-33,pointer.y-34,67,68);}if(showCityProgress){patch(REPORTING_BY_ID['city-progress-90']);hit('city-progress-close','Close city progress',REPORTING_BY_ID['city-progress-90'].rect,()=>{showCityProgress=false;dirty=true;});}if(showWanted){draw('/assets/ui/wanted-board.png',330,26,1258,1008);hit('wanted-close','Close wanted board',[330,26,1258,1008],()=>{showWanted=false;dirty=true;});}if(stockDetail)renderStockDetail();if(showLoans)renderLoans();if(financialScreen)renderFinancial();if(tutorial)renderAuxiliary(tutorial);renderBroadcast();if(aux){aux=null;}if(modal)renderModal();if(saveMessage){rect(445,908,1000,67,'#d4c9ad');text(saveMessage.slice(0,85),945,950,23,'#714c37','center');hit('message-dismiss','Dismiss message',[445,908,1000,67],()=>{saveMessage='';dirty=true;});}}
function render(){syncBusinessUI();if(lastVisitId!==game.visit?.id){openedItem=false;nativeReading=null;toolHover=false;gemPending=null;lastVisitId=game.visit?.id||'';if(lastVisitId==='day11-meaningful-paper'&&!performedEvents.has('private-tutorial')){tutorial='private-tutorial';performedEvents.add('private-tutorial');}dialogueVisible=!!game.state.dialogue||!!game.world.story;listingEdit=false;itemZoom=false;hoverTag=null;tagOffset=0;stockDetail=null;privateOpen=false;toolBar=false;}dirty=false;hits=[];ctx.clearRect(0,0,1920,1080);if(game.state.mode==='menu')renderMenu();else if(game.state.mode==='shop')renderShop();else if(game.state.mode==='sales')renderSales();else renderAux();topbar();overlays();if(drag){if(drag.card)cardDraw(drag.card,drag.x-65,drag.y-21,276,44,true);else if(drag.tool)surface(`tool-${drag.tool}`,drag.x-33,drag.y-34,67,68);if(drag.stock){const item=game.state.stock.find(s=>s.id===drag!.stock);if(item){const cell=REFERENCE_INVENTORY_BY_TITLE[item.title];if(cell)draw(cell.asset,drag.x-66,drag.y-60,132,121);else if(!stockSprite(item,drag.x-54,drag.y-54,108,108)&&item.patch)draw(item.patch.asset,drag.x-54,drag.y-54,108,108);}}ctx.strokeStyle='#dbe89b';ctx.lineWidth=3;if(drag.card)ctx.strokeRect(100,407,284,293);}syncControls();}
let controlsSignature='';
function syncControls(){const signature=hits.map(h=>h.id+':'+h.rect.join(',')+h.disabled).join('|')+game.state.visit+game.state.mode+calculator;if(signature===controlsSignature){const input=document.querySelector<HTMLInputElement>('#quote-input');if(input&&input.value!==game.state.quote)input.value=game.state.quote;return;}controlsSignature=signature;const active=document.activeElement?.id;controls.replaceChildren();for(const h of hits){const b=document.createElement('button');b.id=h.id;b.className='hit';b.setAttribute('aria-label',h.label);b.title=h.label;b.style.cssText=`left:${h.rect[0]}px;top:${h.rect[1]}px;width:${h.rect[2]}px;height:${h.rect[3]}px`;b.disabled=!!h.disabled;b.tabIndex=h.disabled?-1:0;b.addEventListener('click',e=>{if(e.detail===0){h.action();dirty=true;}});controls.append(b);}
 if(calculator&&(game.active||listingEdit)){const input=document.createElement('input');input.id='quote-input';input.setAttribute('aria-label','Offer amount');input.inputMode='numeric';input.value=game.state.quote;input.addEventListener('input',()=>{game.state.quote=input.value;dirty=true;});input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){submitOffer();}});controls.append(input);}
 if(active==='quote-input')document.getElementById(active)?.focus({preventScroll:true});}
function coords(e:PointerEvent){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1920/r.width,y:(e.clientY-r.top)*1080/r.height};}
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer=coords(e);document.body.dataset.keyboard='false';const h=hits.findLast(h=>inside(pointer,h.rect)&&!h.disabled);down={...pointer,hit:h};if(h?.card||h?.tool||h?.stock)e.preventDefault();});
stage.addEventListener('pointermove',e=>{pointer=coords(e);if(!drag){const h=hits.findLast(h=>inside(pointer,h.rect)&&!!h.card&&(h.id.startsWith('tag-')||h.id.startsWith('preview-')));const next=h?.card?.id??null;if(hoverTag!==next){hoverTag=next;dirty=true;}}if(game.state.tool||game.state.book||game.state.day>=11)dirty=true;if(down&&!drag&&Math.hypot(pointer.x-down.x,pointer.y-down.y)>7&&(down.hit?.card||down.hit?.tool||down.hit?.stock))drag={card:down.hit.card,tool:down.hit.tool,stock:down.hit.stock,source:down.hit.id,...pointer};if(drag){Object.assign(drag,pointer);dirty=true;}else if(game.state.mode==='shop'&&game.state.tool&&inside(pointer,[785,684,345,278])){if(!toolHover&&!['gem','screwdriver'].includes(game.state.tool))inspect(game.state.tool);toolHover=true;}else if(!inside(pointer,[785,684,345,278])){toolHover=false;}else if(game.state.mode==='shop'&&!calculator&&!game.state.book){const bar=inside(pointer,[700,930,510,69]);if(bar&&!toolBar){toolBar=true;dirty=true;}}});
stage.addEventListener('pointerup',e=>{pointer=coords(e);if(drag){if(drag.card){if(inside(pointer,[60,348,345,505]))add(drag.card);else if(privateOpen&&inside(pointer,[113,873,554,127]))add(drag.card,true);else if(drag.source?.startsWith('tag-')||drag.source?.startsWith('hidden-')){game.remove(drag.card.id);}}else if(drag.tool&&inside(pointer,[785,684,345,278]))inspect(drag.tool);else if(drag.stock){const recommended=inside(pointer,[558,306,441,410]);const target=recommended?14:salePositions.findIndex(([x,y])=>inside(pointer,[x,y,217,202]));if(target>=0){const st=game.state.stock.find(i=>i.id===drag!.stock);if(st){const fresh=st.listing===null;game.listStock(st.id,st.listing??0,target);if(fresh){game.state.selectedStock=st.id;game.state.quote='0';listingEdit=true;calculator=true;inventoryOpen=false;}}}}drag=null;down=null;dirty=true;return;}
 const h=hits.findLast(h=>inside(pointer,h.rect)&&!h.disabled);if(h&&h.id===down?.hit?.id){if(h.id==='item'&&game.state.tool)inspect(game.state.tool);else if(h.id==='quote-input'){}else h.action();}down=null;dirty=true;});
stage.addEventListener('contextmenu',e=>{e.preventDefault();if(gemPending)return;game.state.tool=null;toolBar=false;hoverTag=null;nativeReading=null;dirty=true;});
stage.addEventListener('dblclick',e=>{const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)*1920/r.width,y:(e.clientY-r.top)*1080/r.height};const h=hits.findLast(h=>inside(p,h.rect)&&!!h.card);if(h?.card&&(h.id.startsWith('book-')||h.id.startsWith('native-book-')||h.id.startsWith('native-link-')))add(h.card);});
stage.addEventListener('wheel',e=>{if(game.state.book&&nativeManual.wheel(e.deltaY,pointer.x,pointer.y)){e.preventDefault();dirty=true;return;}if(inside(pointer,[60,348,345,505])){e.preventDefault();tagOffset=Math.max(0,Math.min(game.state.tags.length-6,tagOffset+Math.sign(e.deltaY)));dirty=true;}},{passive:false});
window.addEventListener('keydown',e=>{shiftHeld=e.shiftKey;lastKey=e.key;streetKeys.add(e.key);if(!modal&&game.state.mode==='street'&&['ArrowLeft','ArrowRight','a','A','d','D','e','E'].includes(e.key)){e.preventDefault();if(e.key.toLowerCase()==='e'&&!e.repeat){const action=streetWorld.interact();if(action)runAux(action);}dirty=true;return;}if(e.key==='Tab')document.body.dataset.keyboard='true';if(e.key==='Escape'){if(modal){modal=null;dirty=true;return;}if(game.state.mode==='street'&&streetWorld.state().floor==='b2'){enterStreet('street-west');}else if(broadcastKind){broadcastKind=null;}else if(financialScreen)financialScreen=null;else if(showWanted)showWanted=false;else if(showCityProgress)showCityProgress=false;else if(stockDetail)stockDetail=null;else if(aux)aux=null;else if(tutorial)tutorial=null;else if(showLoans)showLoans=false;else if(calculator)calculator=false;else if(game.state.tool)game.state.tool=null;else game.state.book=null;dirty=true;return;}if(e.key.toLowerCase()==='f'){if(document.fullscreenElement)document.exitFullscreen();else stage.requestFullscreen();return;}if(e.key.toLowerCase()==='b'&&game.state.mode==='shop'){game.state.book=game.state.book?null:(game.state.campaign==='story'?'index':'Home');calculator=false;dirty=true;}if(calculator&&/^\d$/.test(e.key)){enterDigit(e.key);dirty=true;}else if(calculator&&e.key==='Backspace'){enterDigit('E');dirty=true;}else if(calculator&&e.key==='Enter'){submitOffer();}});
window.addEventListener('keyup',e=>{shiftHeld=e.shiftKey;streetKeys.delete(e.key);});window.addEventListener('blur',()=>streetKeys.clear());
function resize(){const scale=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`scale(${scale})`;stage.style.left=`${(innerWidth-1920*scale)/2}px`;stage.style.top=`${(innerHeight-1080*scale)/2}px`;dirty=true;}
window.addEventListener('resize',resize);resize();
Object.assign(window,{render_game_to_text:()=>JSON.stringify({coordinateSystem:'1920x1080, origin top-left, positive x right and y down',mode:game.state.mode,phase:game.state.phase,day:game.state.day,cash:game.state.cash,visit:game.visit?.id,item:game.visit?.title,tags:game.state.tags.map(t=>({id:t.id,label:t.label,value:t.value})),hidden:game.state.hidden.map(t=>t.id),estimate:game.estimate,book:game.state.book,tool:game.state.tool,inspected:game.state.inspected,inspectionResult:nativeReading??(game.state.tool&&game.state.inspected.includes(game.state.tool)?inspectItem(game.visit.id,game.state.tool):null),quote:game.state.quote,counter:game.state.counter,stock:game.state.stock.map(s=>({id:s.id,title:s.title,paid:s.paid,value:s.value,definitionId:s.definitionId,slot:s.slot,repairReadyDay:s.repairReadyDay,cards:s.cards.map(c=>({id:c.id,label:c.label,value:c.value})),listing:s.listing})),privateUnlocked:game.state.privateUnlocked,gemUnlocked:game.state.gemUnlocked,calculatorOpen:calculator,listingEdit,toolbarOpen:toolBar,result:game.state.result,dialogue:game.state.dialogue,storyContext:game.state.storyContext,sourceTimestamp:game.visit?.start,broadcastKind,broadcastIndex,followRecording,checkpointLog:game.checkpointLog,profile:game.state.profile,negotiation:game.state.negotiation,daySummary:game.daySummary,completed:game.state.completed,failure:game.state.failure,campaign:game.state.campaign,cashbook:game.state.cashbook,saveMessage,modal,performedEvents:[...performedEvents],streetScreen,finalStreet,street:streetWorld.state(),loanDebt:{darcy:darcyDebt,executor:executorDebt,avac:avacDebt},plantDays,reportCount,reportToday,reportCollapsed,reportedVisitors:[...reportedVisitors],recordedVisits:visits.length,recordedBookPages:REF_BOOK_PAGES.length,nativeBookPages:NATIVE_MANUAL_PAGES.length,storyView:game.storyView,rentalRequest:game.rentalRequestView,curation:game.curationView,curationCandidates:game.getCurationCandidates(),nativeReading,gemPending,openedItem,elapsed,lastKey}),advanceTime:(ms:number)=>{elapsed+=ms;updateInspection(ms/1000);if(!modal&&!broadcastKind&&!financialScreen)game.tick(ms/1000);if(game.state.mode==='street'){for(let left=ms;left>0;left-=100){streetWorld.update(Math.min(left,100)/1000,streetKeys);const action=streetWorld.takeAction();if(action)runAux(action);}}dirty=true;render();}});
const preload=[...getNativeCardRequiredImages(),'/assets/surfaces/main-menu.png','/assets/ui/shop-empty-clean.png','/assets/ui/ledger-empty.png',...Array.from('0123456789U',c=>`/assets/ui/digit-${c}.png`)];
await document.fonts.load('30px OrangeKid');
await Promise.all(preload.map(p=>new Promise<void>(resolve=>{const i=img(p);if(i.complete&&i.naturalWidth)resolve();else{i.addEventListener('load',()=>resolve(),{once:true});i.addEventListener('error',()=>resolve(),{once:true});}})));
stage.dataset.ready='true';document.documentElement.dataset.sceneReady='true';let last=performance.now(),lastAnimation=-1;function frame(now:number){const dt=Math.min(.1,(now-last)/1000);elapsed+=now-last;last=now;updateInspection(dt);if(!modal&&!broadcastKind&&!financialScreen&&document.visibilityState==='visible')game.tick(dt);if(game.state.mode==='street'&&!modal&&!broadcastKind&&!financialScreen){streetWorld.update(dt,streetKeys);const action=streetWorld.takeAction();if(action)runAux(action);dirty=true;}const tick=Math.floor(elapsed/125);if(tick!==lastAnimation&&game.state.mode==='shop'){dirty=true;lastAnimation=tick;}if(dirty)render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
