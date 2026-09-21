import {browserExecutable} from './browser-executable.mjs';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const url=process.env.TEST_URL||'http://127.0.0.1:5175';
const financeOnly=process.env.TEST_SCENARIO==='day9-finance';
const continueAfterFinance=process.env.TEST_CONTINUE_AFTER_FINANCE==='1';
const artifactPrefix=financeOnly?'day9-finance':'session';
const data=JSON.parse(await readFile(new URL('../reference/transactions/data.json',import.meta.url),'utf8'));
const records=new Map(data.transactions.map(v=>[v.id,v]));
const out=new URL('../artifacts/qa/',import.meta.url);await mkdir(out,{recursive:true});
const report={url,scenario:financeOnly?'day9-finance':'recorded-session',startedAt:new Date().toISOString(),browser:'Google Chrome native installation',inputPolicy:'Pointer/keyboard UI only; render_game_to_text is read-only.',passed:false,visited:[],dayTransitions:[],checks:[],errors:[],blocked:null};
const browser=await chromium.launch({headless:true,executablePath:browserExecutable});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push({message:m.text(),location:m.location()});});page.on('requestfailed',r=>report.errors.push({url:r.url(),failure:r.failure()}));
const state=async()=>JSON.parse(await page.evaluate(()=>window.render_game_to_text()));
const screenshot=async name=>{const path=new URL(`${artifactPrefix}-${name}.png`,out);await page.screenshot({path:fileURLToPath(path)});return fileURLToPath(path);};
async function click(id){await page.locator('#'+id).click({timeout:3000});await page.waitForTimeout(100);}
async function note(check,extra={}){report.checks.push({check,...extra});}
async function block(reason,s,extra={}){report.blocked={reason,state:s,...extra,screenshot:await screenshot('blocked')};console.log('BLOCKED',s.visit,reason);}
const exists=async id=>(await page.locator('#'+id).count())>0;
async function drainOverlays(){
 for(let n=0;n<45;n++){
  if(await exists('broadcast-next')){const s=await state();await click('broadcast-next');await note('Announcement advanced by actual click',{day:s.day,kind:s.broadcastKind,index:s.broadcastIndex});}
  else if(await exists('aux-okay')){const s=await state();await screenshot(`tutorial-${s.day}-${report.checks.length}`);await click('aux-okay');await note('Tutorial Okay reachable',{visit:s.visit});}
  else if(await exists('event-day10-fine-250')){const before=await state();await click('event-day10-fine-250');const after=await state();await note('Recorded fine paid once',{before:before.cash,after:after.cash});if(after.cash!==before.cash-250)throw new Error('Fine cash delta was not -250');}
  else if(await exists('financial-return'))await click('financial-return');
  else return;
 }
 throw new Error('Overlay continuation exceeded 45 actual clicks');
}
async function reportingChecks(){
 const before=await state();if(before.day<11||report.checks.some(c=>c.check==='Reporting UI checked'))return;
 await page.mouse.move(1340,863);await page.waitForTimeout(150);await screenshot('report-counter-labels');
 await click('report-toggle');let s=await state();if(!s.reportCollapsed)throw new Error('Report roof did not collapse');if(await exists('report-submit'))throw new Error('Collapsed report device retains submit hit');await screenshot('report-collapsed');
 await page.mouse.move(1340,963);await page.waitForTimeout(150);await screenshot('report-collapsed-labels');await click('report-toggle');
 await click('report-submit');const once=await state();await click('report-submit');s=await state();
 if(once.cash!==before.cash||s.cash!==before.cash||once.reportCount!==before.reportCount+1||s.reportCount!==once.reportCount)throw new Error('Report submission changes cash or duplicate report count');
 await note('Reporting UI checked',{visit:s.visit,cashUnchanged:s.cash,countBefore:before.reportCount,countAfter:s.reportCount,duplicateIgnored:true,roofCollapsedAndExpanded:true,hoverScreenshots:['session-report-counter-labels.png','session-report-collapsed-labels.png']});
}
async function discoverStampHistory(){
 let s=await state();if(s.tags.some(t=>t.id==='archaeological'))return;
 if(s.calculatorOpen)await click('calculator-toggle');await page.mouse.move(1000,970);await page.waitForTimeout(120);if(!await exists('tool-year'))await click('tools-trigger');
 const tool=await page.locator('#tool-year').boundingBox();if(!tool)throw new Error('Year tool has no visible hit area');await page.mouse.move(tool.x+tool.width/2,tool.y+tool.height/2);await page.mouse.down();await page.mouse.move(950,800,{steps:10});await page.mouse.up();await page.waitForTimeout(150);s=await state();
 if(s.book!=='history'||!s.inspected.includes('year'))throw new Error('Stamp year inspection did not open History automatically');await screenshot('stamp-year-1988');
 const tag=await page.locator('#book-archaeological-value').boundingBox();if(!tag)throw new Error('Archaeological Value has no book hit area');await page.mouse.move(tag.x+tag.width/2,tag.y+tag.height/2);await page.mouse.down();await page.mouse.move(250,620,{steps:10});await page.mouse.up();await page.waitForTimeout(150);s=await state();
 if(!s.tags.some(t=>t.id==='archaeological'))throw new Error('Actual book tag drag did not add Archaeological Value');await note('Stamp dated and book tag dragged before purchase',{estimate:s.estimate,book:s.book,tags:s.tags.map(t=>t.id)});await screenshot('stamp-history-tag');
}
async function walkToStreetAction(action,direction){
 if((await state()).street.nearby?.action===action)return;
 await page.keyboard.down(direction);
 try{for(let n=0;n<160;n++){await page.waitForTimeout(100);const s=await state();if(s.street.nearby?.action===action)return;if(s.mode!=='street')throw new Error('Walking unexpectedly left street mode');}}
 finally{await page.keyboard.up(direction);}
 throw new Error(`Walking did not reach ${action}`);
}
async function payRecordedFee(id,amount){
 const before=await state(),box=await page.locator('#event-'+id).boundingBox();if(!box)throw new Error(`Fee ${id} has no actual button`);await screenshot(id+'-before');await click('event-'+id);const after=await state();await screenshot(id+'-after');await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(100);const twice=await state();
 if(after.cash!==before.cash-amount||twice.cash!==after.cash||!after.performedEvents.includes(id))throw new Error(`${id} did not charge ${amount} exactly once`);await note('Recorded fee paid through actual choice',{id,before:before.cash,after:after.cash,duplicateIgnored:true});
}
async function day9FinanceRoute(){
 await walkToStreetAction('nav:public-square','ArrowRight');await page.keyboard.press('e');await page.waitForTimeout(180);
 await walkToStreetAction('nav:office','ArrowLeft');await page.keyboard.press('e');await page.waitForTimeout(180);let s=await state();
 if(s.cash!==2420)throw new Error('Recorded office entrance did not restore the evidenced 2420 cut');await payRecordedFee('day9-registration-fee',1300);await click('financial-complete');s=await state();
 if(s.mode!=='gem-shop')throw new Error('Office continuation did not reach the recorded repair interior');await screenshot('repair-interior');await click('aux-inventory-tab');
 const stampId='day9-seoul-stamp';if(!await exists('inventory-'+stampId)){for(let n=1;n<3;n++){await click('inventory-page-'+n);if(await exists('inventory-'+stampId))break;}}
 await click('inventory-'+stampId);await screenshot('stamp-before-repair');const beforeStamp=(await state()).stock.find(i=>i.id===stampId);await click('aux-show');await payRecordedFee('day9-stamp-repair',59);await click('financial-complete');
 await click('aux-inventory-tab');await click('inventory-'+stampId);await screenshot('stamp-after-repair');s=await state();const afterStamp=s.stock.find(i=>i.id===stampId);
 if(beforeStamp?.value!==undefined&&(beforeStamp.value!==98||afterStamp?.value!==196))throw new Error('Stamp inventory value did not improve from 98 to 196');
 if(afterStamp?.cards&&!afterStamp.cards.some(c=>c.id==='slightly-damaged'))throw new Error('Repair did not replace the damaged condition');await note('Stamp repaired through selected inventory item and Show',{before:beforeStamp,after:afterStamp,cash:s.cash});
 await click('inventory-detail-close');await click('aux-exit-prompt');s=await state();if(s.mode!=='street'||s.cash!==1061)throw new Error('Repair exit did not return to street with 1061');await screenshot('finance-complete-street');await note('DAY9 registration and repair route complete',{cash:s.cash,street:s.street});
}
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');report.testedBuild=await page.locator('script[type="module"][src]').first().getAttribute('src');await click('load-game');
 let actions=0;let finished=false;
 while(actions++<900){
  await drainOverlays();let s=await state();const rec=records.get(s.visit);
  if(s.finalStreet&&report.visited.at(-1)?.id===data.transactions.at(-1).id&&report.visited.at(-1)?.settled){
   await page.waitForTimeout(400);await screenshot('final-street');await click('street-inventory');await screenshot('final-street-inventory');const opened=s.stock.length?await page.locator('#inventory-'+s.stock[0].id).count():0;
   await note('Final recorded street reached and inventory opened',{cash:s.cash,street:s.street,inventoryHits:opened});if(!opened){await block('Final street inventory did not expose inventory slots',await state());break;}finished=true;break;
  }
  if(s.mode==='street'){
   if(financeOnly&&s.day===9&&s.phase==='between'&&!report.checks.some(c=>c.check==='DAY9 registration and repair route complete')){await day9FinanceRoute();if(!continueAfterFinance){finished=true;break;}continue;}
   const before={day:s.day,phase:s.phase,cash:s.cash,street:s.street};await page.keyboard.press('e');await page.waitForTimeout(150);s=await state();
   await note('Street Darcy entrance used by E',{before,after:{mode:s.mode,phase:s.phase,cash:s.cash}});
   if(s.mode==='street'){await block('E at the default Darcy street entrance did not return to shop or summary',s);break;}continue;
  }
  if(s.mode==='summary'){
   const prev=report.visited.at(-1);await screenshot(`day-${s.day}-summary`);
   if(prev?.id===data.transactions.at(-1).id){finished=true;break;}
   if(!await page.locator('#aux-sleep').count()){await block('Day summary has no actionable Sleep button',s);break;}
   const before={day:s.day,cash:s.cash,visit:s.visit};await click('aux-sleep');s=await state();report.dayTransitions.push({before,after:{day:s.day,cash:s.cash,visit:s.visit}});
   if(s.day<=before.day||s.visit===before.visit){await block('Sleep did not advance the visitor/day',s);break;}
   continue;
  }
  if(s.phase==='between'){
   if(!await exists('night-leave')){await block('Night interlude has no Leave shop doorway',s);break;}
   await click('night-leave');continue;
  }
  if(!rec){await block('Current visit missing in the recorded data',s);break;}
  let entry=report.visited.find(v=>v.id===s.visit);
  if(!entry){entry={id:s.visit,day:s.day,kind:rec.saleType,sourcePrice:rec.finalPrice,before:{cash:s.cash,stockCount:s.stock.length,phase:s.phase,privateUnlocked:s.privateUnlocked},settled:null};report.visited.push(entry);console.log('VISIT',report.visited.length,s.visit,'cash',s.cash,'price',rec.finalPrice);if(report.visited.length%5===1)await screenshot(`visit-${String(report.visited.length).padStart(2,'0')}`);}
  if(s.phase==='narrative'){
   let tries=0;const id=s.visit;
   while((s=await state()).visit===id&&s.phase==='narrative'&&tries++<40){await drainOverlays();s=await state();if(s.visit!==id||s.phase!=='narrative')break;if(await page.locator('#dialogue-next').count())await click('dialogue-next');else if(await page.locator('#npc-dialogue').count())await click('npc-dialogue');else{await block('Narrative has no dialogue continuation',s);break;}}
   if(report.blocked)break;
   if(tries>=40){await block('Narrative dialogue did not finish after 40 actual clicks',s);break;}
   entry.settled={result:'narrative-completed',cash:s.cash,stockCount:s.stock.length};
   if(id==='day11-private-slot-tutorial'){await note('Private slot tutorial visit reachable',{privateUnlockedDuringTutorial:entry.before.privateUnlocked??false,privateUnlockedAfter:s.privateUnlocked});}
   continue;
  }
  if(s.phase==='settled'){
   if(!entry.settled)entry.settled={result:s.result,cash:s.cash,stockCount:s.stock.length};
   if(!await page.locator('#next-visitor').count()){await block('Settled transaction has no Next visitor button',s);break;}
   await click('next-visitor');continue;
  }
  if(!['appraise','offer'].includes(s.phase)){await block('Unexpected non-actionable phase',s);break;}
  if(rec.saleType==='sell'&&s.mode!=='sales'){await block('Sell visitor entered the counter instead of the sales wall',s,{expectedMode:'sales'});break;}
  if(financeOnly&&s.visit==='day9-seoul-stamp'){await discoverStampHistory();s=await state();}
  if(s.visit==='day11-hoverboard-display')await reportingChecks();
  if(rec.saleType==='buy'&&rec.finalPrice!==null&&s.cash<rec.finalPrice){
   if(s.visit==='day8-rabbit'){
    const before=s.cash;await click('loans');if(!await exists('executor-get-loan')){await block('Rabbit purchase needs the recorded loan but Get Loan is unavailable',s);break;}await click('executor-get-loan');s=await state();await note('Executor loan taken through ledger',{before,after:s.cash,debt:s.loanDebt});if(s.cash!==before+1500){await block('Loan did not add exactly 1500',s);break;}await click(await exists('loan-close')?'loan-close':'aux-close');
   }
   if(s.cash<rec.finalPrice){await block('Insufficient cash for the video-recorded price; test will not skip or inject funds',s,{required:rec.finalPrice,shortfall:rec.finalPrice-s.cash});break;}
  }
  const beforeSubmission=await state();entry.submissionCash=beforeSubmission.cash;
  if(!s.calculatorOpen){if(rec.saleType==='sell')await click('sales-customer');else await click('calculator-toggle');}
  if(rec.finalPrice===null){await click('decline');}
  else{
   await click('key-clear');for(const digit of String(rec.finalPrice))await click('key-'+digit);
   const entered=await state();if(Number(entered.quote)!==rec.finalPrice){await block('Calculator did not preserve the exact entered digits',entered);break;}
   await click('offer');
  }
  s=await state();
  if(s.phase!=='settled'){await block('Recorded price/Decline did not settle the visitor',s,{attempted:rec.finalPrice});break;}
  entry.settled={result:s.result,cash:s.cash,stockCount:s.stock.length};
  const expected=entry.submissionCash+(s.result==='bought'?-rec.finalPrice:s.result==='sold'?rec.finalPrice:0);
  if(s.cash!==expected){await block('Cash moved by an unexpected amount for one settlement',s,{expected});break;}
  const once={cash:s.cash,stockCount:s.stock.length,result:s.result};await page.keyboard.press('Enter');await page.mouse.click(1690,855);await page.waitForTimeout(100);s=await state();
  if(s.cash!==once.cash||s.stock.length!==once.stockCount||s.result!==once.result){await block('Repeated settlement input changed money/inventory twice',s,{once});break;}
  await note('Single settlement preserved under repeated native input',{visit:s.visit});
  if(s.visit==='day8-plain-sunglasses-sale'){
   const before=s.cash;await click('loans');await screenshot('darcy-payoff-before');await click('aux-pay-darcy');s=await state();await screenshot('darcy-payoff-after');
   if(s.cash!==before-500||s.loanDebt.darcy!==0){await block('Darcy repayment did not deduct exactly 500 and clear debt',s,{before});break;}await note('Darcy repaid through actual Pay Off button',{before,after:s.cash,debt:s.loanDebt.darcy});await click('aux-close');
  }
  if(s.visit==='day11-rabbit-sale'){
   const before=s.cash;await click('loans');await screenshot('executor-payoff-before');if(!await exists('aux-pay-executor')){await block('Executor Pay Off unavailable after rabbit resale',s);break;}const repaymentButton=await page.locator('#aux-pay-executor').boundingBox();await click('aux-pay-executor');const once=await state();await screenshot('executor-payoff-after');if(repaymentButton)await page.mouse.click(repaymentButton.x+repaymentButton.width/2,repaymentButton.y+repaymentButton.height/2);await page.waitForTimeout(100);s=await state();
   if(once.cash!==before-1500||once.loanDebt.executor!==0||s.cash!==once.cash){await block('Executor repayment did not deduct exactly 1500 once',s,{before,after:once.cash});break;}await note('Executor repaid through actual Pay Off button',{before,after:s.cash,debt:s.loanDebt.executor,duplicateIgnored:true});await click('aux-close');
  }
 }
 report.passed=finished&&!report.blocked&&!report.errors.length;report.finished=finished;report.finalState=await state();report.coverage={visited:report.visited.length,recordedTotal:data.transactions.length,requestedScope:financeOnly?(continueAfterFinance?'All recorded visits plus actual office and repair fees':'Through DAY9 office and repair fees'):'All recorded visits',settlements:report.visited.filter(v=>v.settled&&v.settled.result!=='narrative-completed').length,narratives:report.visited.filter(v=>v.settled?.result==='narrative-completed').length,dayTransitions:report.dayTransitions.length,sourceCheckpointCount:report.finalState.checkpointLog.length,mode:'followRecording source cash snapshots',limitation:'This session checks actual UI progression and single settlement effects; it does not prove a continuous free-play economy or full visual fidelity.'};
}catch(e){report.errors.push(String(e));try{await block('Browser interaction threw',await state(),{error:String(e)});}catch{}}
finally{report.finishedAt=new Date().toISOString();await writeFile(new URL(`${artifactPrefix}-report.json`,out),JSON.stringify(report,null,2));await browser.close();console.log('REPORT',JSON.stringify({passed:report.passed,visited:report.visited.length,blocked:report.blocked?.reason,errors:report.errors.length}));}
