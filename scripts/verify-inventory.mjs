import {browserExecutable} from './browser-executable.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:browserExecutable}),p=await b.newPage({viewport:{width:1920,height:1080}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
const click=async id=>{await p.locator('#'+id).click({timeout:3500});await p.waitForTimeout(120)};
async function drag(id,x,y){const r=await p.locator('#'+id).boundingBox();assert.ok(r,id);await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(x,y,{steps:15});await p.mouse.up();await p.waitForTimeout(150)}
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:5174');await click('new-game');let initial=await state();const offered=Math.ceil(initial.estimate*.9);await click('calculator-toggle');await p.locator('#quote-input').fill(String(offered));await click('offer');for(let attempts=0;attempts<6&&(await state()).phase!=='settled';attempts++){if(!(await state()).calculatorOpen)await click('calculator-toggle');await p.locator('#quote-input').fill(String(offered));await click('offer');}let purchased=(await state()).stock.find(i=>i.definitionId==='day6-backpack-soldier');assert.ok(purchased);const itemId=purchased.id;
 await click('sales-left');await click('inventory-toggle');await drag('inventory-'+itemId,225,399);let s=await state();assert.equal(s.stock.find(v=>v.id===itemId).listing,0);assert.equal(s.calculatorOpen,true);assert.equal(s.listingEdit,true);checks.push('Fresh inventory drag opens native calculator with 0 listing');
 await click('key-clear');await click('key-1');await click('key-1');await click('key-5');await click('offer');s=await state();assert.equal(s.stock.find(v=>v.id===itemId).listing,115);assert.equal(s.cash,258-offered);assert.equal(s.stock.length,7);checks.push('Price editing after settlement changes listing only');
 await drag('sale-slot-0',455,815);s=await state();assert.equal(s.stock.find(v=>v.id===itemId).listing,115);checks.push('Shelf drag preserves existing price');
 await p.screenshot({path:'artifacts/qa/inventory-priced.png'});await click('remove-sale-hit-'+itemId);s=await state();assert.equal(s.stock.find(v=>v.id===itemId).listing,null);assert.equal(s.stock.length,7);checks.push('Taking down a display retains ownership');
 await click('shop-return');await click('calendar-open');assert.equal((await state()).mode,'calendar');await p.screenshot({path:'artifacts/qa/calendar-native.png'});await click('aux-close');assert.equal((await state()).mode,'shop');checks.push('Physical day plaque opens calendar and closes back to counter');
 assert.deepEqual(errors,[]);await fs.writeFile('artifacts/qa/inventory-report.json',JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS',checks);
}catch(e){await p.screenshot({path:'artifacts/qa/inventory-failed.png'});await fs.writeFile('artifacts/qa/inventory-report.json',JSON.stringify({passed:false,error:String(e),checks,errors,state:await state()},null,2));throw e}finally{await b.close()}
