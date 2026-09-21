import {browserExecutable} from './browser-executable.mjs';
import {chromium} from 'playwright';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:browserExecutable,headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const out='artifacts/native-update';await page.goto('http://127.0.0.1:5177');await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');await page.click('#new-game');await page.waitForTimeout(100);
const trace=[];
for(let i=0;i<60;i++) {const s=JSON.parse(await page.evaluate(()=>window.render_game_to_text()));trace.push({i,visit:s.visit,phase:s.phase,story:s.storyView,tags:s.tags});if(s.storyView.waiting||s.phase!=='narrative')break;const next=page.locator('#dialogue-next');if(!await next.count())break;await next.click();await page.waitForTimeout(35);}
await page.screenshot({path:`${out}/tutorial-wait.png`});await fs.writeFile(`${out}/tutorial-trace.json`,JSON.stringify({trace,errors},null,2));console.log(JSON.stringify(trace.at(-1)));await browser.close();
