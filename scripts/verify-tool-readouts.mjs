import {browserExecutable} from './browser-executable.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='artifacts/qa/system-tools';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:browserExecutable,headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5174');await page.waitForSelector('#new-game');await page.locator('#new-game').click();await page.waitForTimeout(120);
const state=async()=>JSON.parse(await page.evaluate(()=>window.render_game_to_text()));const shots=[];
async function scan(tool){await page.locator('#tools-trigger').click();await page.waitForTimeout(120);await page.locator('#tool-'+tool).click();await page.waitForTimeout(120);await page.mouse.move(945,810);await page.waitForTimeout(120);const s=await state();if(s.tool!==tool||!s.inspected.includes(tool))throw Error('Tool failed '+tool);const path=dir+'/'+s.visit+'-'+tool+'.png';await page.screenshot({path});shots.push({visit:s.visit,tool,book:s.book,reading:s.inspectionResult??null,path});await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.mouse.move(650,800);}
for(const t of ['damage','material','year','signature'])await scan(t);
await page.locator('#calculator-toggle').click();await page.waitForTimeout(120);await page.locator('#decline').click();await page.waitForTimeout(120);await page.locator('#next-visitor').click();await page.waitForTimeout(120);
await page.locator('#sales-customer').click();await page.waitForTimeout(120);await page.waitForTimeout(150);if((await state()).phase!=='settled'){if(!await page.locator('#decline').count())await page.locator('#calculator-toggle').click();await page.waitForTimeout(120);await page.locator('#decline').click();await page.waitForTimeout(120);}
await page.locator('#next-visitor').click();await page.waitForTimeout(120);await page.locator('#shop-return').count()&&await page.locator('#shop-return').click();await page.waitForTimeout(120);
if((await state()).visit!=='day6-combat-boots')throw Error('Did not reach boots');
await scan('signature');await scan('year');
await page.locator('#loans').click();await page.waitForTimeout(120);await page.screenshot({path:dir+'/loans.png'});await page.locator('#loan-close').click();await page.waitForTimeout(120);
await fs.writeFile(dir+'/report.json',JSON.stringify({shots,errors},null,2));await browser.close();if(errors.length)throw Error(errors.join('\n'));
