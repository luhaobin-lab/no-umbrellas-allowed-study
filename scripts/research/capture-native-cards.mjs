import {browserExecutable} from '../browser-executable.mjs';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='artifacts/native-card-qa',browser=await chromium.launch({headless:true,executablePath:browserExecutable}),page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:5180/'+dir+'/index.html');await page.waitForSelector('body[data-scene-ready="true"]');const ids=await page.evaluate(()=>window.cards),states=[];
for(let i=0;i<ids.length;i+=30){states.push(...await page.evaluate(ids=>window.showCards(ids),ids.slice(i,i+30)));await page.screenshot({path:`${dir}/cards-${String(i/30).padStart(2,'0')}.png`});}
const special=['green_jewel_ruby_2_pear','green_fakeBrandHalfasync',...['appraised','recommended','trusted'].flatMap(p=>Array.from({length:5},(_,i)=>`pink_${p}${i+1}`))];states.push(...await page.evaluate(ids=>window.showCards(ids),special));await page.screenshot({path:dir+'/dynamic.png'});
const overrides=['blue_pop','blue_fairlydmg','blue_politician','blue_businessman','blue_fakesign','blue_unpop_certain'];await page.evaluate(ids=>window.showCards(ids,{otherCardIds:['pink_appraised_15','pink_recommended_10'],highlight:{hasEffect:true,effectActive:true}}),overrides);await page.screenshot({path:dir+'/overridden.png'});
await page.evaluate(()=>window.drawFolded());await page.screenshot({path:dir+'/folded.png'});await fs.writeFile(dir+'/report.json',JSON.stringify({cards:ids.length,dynamic:special.length,errors,states},null,2));await browser.close();console.log(JSON.stringify({cards:ids.length,dynamic:special.length,errors}));
