import {browserExecutable} from '../browser-executable.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const out=process.argv[2]??'artifacts/native-manual-qa/baseline';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:browserExecutable});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:5180/artifacts/native-manual-qa/index.html');await page.waitForFunction(()=>typeof window.showNativePage==='function');
const ids=await page.evaluate(()=>window.nativePageIds),results=[];
for(const id of ids){const state=await page.evaluate(id=>window.showNativePage(id),id);await page.screenshot({path:`${out}/${id}.png`,clip:{x:1350,y:154,width:570,height:801}});results.push(state)}
await fs.writeFile(`${out}/states.json`,JSON.stringify(results));await fs.writeFile(`${out}/errors.json`,JSON.stringify(errors));console.log(JSON.stringify({pages:results.length,errors}));await browser.close();
