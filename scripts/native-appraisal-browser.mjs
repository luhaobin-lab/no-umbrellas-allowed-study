import {browserExecutable} from './browser-executable.mjs';
import {chromium} from 'playwright';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:browserExecutable,headless:true}),page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:5177');await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');await page.click('#challenge');
const state=async()=>JSON.parse(await page.evaluate(()=>window.render_game_to_text()));
for(let i=0;i<60;i++){const s=await state();if(s.phase!=='narrative')break;await page.click('#dialogue-next');await page.waitForTimeout(35);}
await page.click('#book-open');await page.waitForTimeout(350);await page.getByRole('button',{name:'Materials',exact:true}).click();await page.waitForTimeout(600);await page.screenshot({path:'artifacts/native-update/materials-native.png'});
await page.keyboard.press('Escape');await page.click('#tools-trigger');const tools=await page.locator('button[id^="tool-"]').evaluateAll(es=>es.map(e=>({id:e.id,disabled:e.disabled})));
await page.click('#tool-damage');await page.mouse.move(971,825);await page.waitForTimeout(800);await page.screenshot({path:'artifacts/native-update/damage-native.png'});const observed=await state();
const targets=await page.locator('button[id^="native-book"],button[id^="native-link"]').evaluateAll(es=>es.map(e=>({id:e.id,label:e.getAttribute('aria-label'),rect:[e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight]})));
await fs.writeFile('artifacts/native-update/appraisal-browser.json',JSON.stringify({tools,observed,targets,errors},null,2));console.log(JSON.stringify({tools,book:observed.book,reading:observed.nativeReading,targets:targets.length,errors}));await browser.close();
