import {browserExecutable} from './browser-executable.mjs';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const prefix=process.env.AUDIT_PREFIX||'review';
const out=fileURLToPath(new URL('../artifacts/qa/',import.meta.url));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const failedRequests=[];page.on('response',r=>{if(r.status()>=400)failedRequests.push({status:r.status(),url:r.url()});});
const report={failedRequests,url:process.env.TEST_URL||'http://127.0.0.1:5175',errors,states:[],checks:[]};
async function capture(name){await page.waitForTimeout(250);await page.screenshot({path:out+`${prefix}-${name}.png`});report.states.push({name,state:await page.evaluate(()=>window.render_game_to_text?.()),hitboxes:await page.locator('.hit').evaluateAll(es=>es.map(e=>({id:e.id,label:e.getAttribute('aria-label'),rect:[e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight]})))});}
try{
 await page.goto(report.url);await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');await capture('01-menu');
 await page.mouse.click(905,917);await capture('02-visible-load-click');
 await page.goto(report.url);await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');await page.locator('#load-game').click();await page.waitForTimeout(500);await capture('03-shop');
 await page.locator('#book-open').click();await capture('04-book');
 await page.keyboard.press('b');await page.mouse.move(960,976);await capture('05-tools');
 await page.mouse.click(831,949);await page.mouse.click(956,816);await capture('06-damage');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await page.locator('#calculator-toggle').click();await capture('07-calculator');
 await page.locator('#key-4').click();await page.locator('#key-5').click();await capture('08-calculator-45');
 await page.locator('#quote-input').fill('57');await capture('09-input-57');
 report.completed=true;
}catch(e){report.failure=String(e);await page.screenshot({path:out+prefix+'-failure.png'}).catch(()=>{});}
finally{await writeFile(out+prefix+'-initial.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({completed:report.completed,failure:report.failure,errors,states:report.states.map(x=>({name:x.name,state:x.state}))},null,2));}
