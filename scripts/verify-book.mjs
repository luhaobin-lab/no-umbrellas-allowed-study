import {browserExecutable} from './browser-executable.mjs';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { tsImport } from 'tsx/esm/api';
const { REF_BOOK_PAGES: pages, REF_BOOK_PAGE_BY_ID: byId } = await tsImport('../src/reference-book-data.ts',import.meta.url);
const { bookCards } = await tsImport('../src/data.ts',import.meta.url);
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'artifacts/qa/book');await fs.mkdir(out,{recursive:true});
const url=process.env.TEST_URL||'http://127.0.0.1:5175';
const report={url,viewport:{width:1920,height:1080,deviceScaleFactor:1},startedAt:new Date().toISOString(),pages:[],navigation:[],tags:[],checks:[],errors:[],failedRequests:[],pixelComparison:[],passed:false};
const browser=await chromium.launch({headless:true,executablePath:browserExecutable});
const p=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.failedRequests.push({status:r.status(),url:r.url()});});
const state=async()=>JSON.parse(await p.evaluate(()=>window.render_game_to_text()));
const click=async id=>{await p.locator('#'+id).click();await p.waitForTimeout(65);};
const check=(name,details={})=>{report.checks.push({name,...details});console.log('PASS',name);};
function edges(id){const page=byId[id];return [...page.hotspots.filter(h=>h.target&&byId[h.target]&&h.kind!=='locked').map(h=>({id:'book-'+h.id,to:h.target})),{id:'book-prev',to:page.previous||'index'},{id:'book-next',to:page.next||'index'}];}
function shortest(from,to){const queue=[{id:from,path:[]}],seen=new Set([from]);while(queue.length){const n=queue.shift();if(n.id===to)return n.path;for(const e of edges(n.id)){if(!seen.has(e.to)){seen.add(e.to);queue.push({id:e.to,path:[...n.path,e]});}}}throw new Error(`No visible navigation path ${from} -> ${to}`);}
async function navigate(to){const from=(await state()).book;assert.ok(from,'book is open');for(const e of shortest(from,to)){const before=(await state()).book;await click(e.id);const after=(await state()).book;report.navigation.push({from:before,hit:e.id,expected:e.to,actual:after});assert.equal(after,e.to,`navigation ${before} / ${e.id}`);}assert.equal((await state()).book,to);}
async function drag(id,destination){const b=await p.locator('#'+id).boundingBox();assert.ok(b,`visible drag source ${id}`);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(destination.x,destination.y,{steps:16});await p.mouse.up();await p.waitForTimeout(65);}
async function fresh(){await p.goto(url);await p.waitForFunction(()=>document.documentElement.dataset.sceneReady==='true');await click('new-game');assert.equal((await state()).mode,'shop');await click('book-open');assert.equal((await state()).book,'index');}
try {
 await fresh();check('visible New Game and book handle open index');
 // A graph of actual visible directory links, signature images and page arrows only.
 for(const page of pages){await navigate(page.id);await p.mouse.move(1230,110);await p.waitForTimeout(220);const screenshot=path.join(out,page.id+'.png');await p.screenshot({path:screenshot,clip:{x:1350,y:155,width:570,height:800}});const record={id:page.id,title:page.title,screenshot,source:path.join(root,'public',page.assetURL),hotspots:[]};
  for(const h of page.hotspots){const l=p.locator('#book-'+h.id);assert.equal(await l.count(),1,`hotspot exists ${page.id}/${h.id}`);record.hotspots.push({id:h.id,kind:h.kind,disabled:await l.isDisabled()});if(h.kind==='locked')assert.equal(await l.isDisabled(),true,`locked ${page.id}/${h.id}`);}
  report.pages.push(record);console.log('PAGE',page.id);
 }
 check('all 21 pages reached through visible navigation',{count:report.pages.length});
 const comparisonScript=`from PIL import Image,ImageChops\nimport json,sys\nrows=json.load(open(sys.argv[1]));out=[]\nfor r in rows:\n a=Image.open(r['source']).convert('RGB');b=Image.open(r['screenshot']).convert('RGB');d=ImageChops.difference(a,b);hist=d.histogram();nonzero=sum(1 for px in d.getdata() if px!=(0,0,0));bbox=d.getbbox();m=max(max(px) for px in d.getdata());out.append({'id':r['id'],'equal':bbox is None,'changedPixels':nonzero,'maxChannelDelta':m,'bbox':bbox});\n if bbox:d.save(r['screenshot'].replace('.png','-diff.png'))\nprint(json.dumps(out))`;
 const input=path.join(out,'comparison-input.json');await fs.writeFile(input,JSON.stringify(report.pages));report.pixelComparison=JSON.parse(execFileSync('python3',['-c',comparisonScript,input],{encoding:'utf8'}));
 if(report.pixelComparison.every(c=>c.equal))check('all 21 book regions pixel-identical to original crops');else console.log('DIFF',JSON.stringify(report.pixelComparison.filter(c=>!c.equal).map(c=>({id:c.id,changedPixels:c.changedPixels,maxChannelDelta:c.maxChannelDelta}))));
 // Actual pointer drags, including an incorrect destination and returning a tag to the book.
 await fresh();await navigate('material');const before=await state();await drag('book-canvas',{x:1150,y:330});assert.deepEqual((await state()).tags,before.tags);assert.equal((await state()).estimate,before.estimate);check('dropping a book card outside the ledger leaves appraisal unchanged');
 await drag('book-canvas',{x:235,y:620});let after=await state();assert.ok(after.tags.some(t=>t.id==='canvas'));const canvasCount=after.tags.filter(t=>t.id==='canvas').length;await drag('book-canvas',{x:235,y:620});after=await state();assert.equal(after.tags.filter(t=>t.id==='canvas').length,canvasCount);check('valid canvas drag and duplicate drag preserve one card');
 await drag('tag-canvas',{x:1650,y:500});assert.equal((await state()).tags.some(t=>t.id==='canvas'),false);check('returning a ledger card removes it');
 await p.screenshot({path:path.join(out,'returned-card.png')});
 // Every distinct tag exposed by a visible book hotspot is physically dragged.
 const unique=new Map();for(const page of pages)for(const h of page.hotspots)if(h.kind==='tag'&&h.tagId&&!unique.has(h.tagId))unique.set(h.tagId,{page:page.id,hotspot:h});
 for(const [tagId,item] of unique){await fresh();await navigate(item.page);const expected=bookCards[tagId];assert.ok(expected,`runtime card ${tagId}`);const before=await state();await drag('book-'+item.hotspot.id,{x:236,y:618});const after=await state();const present=after.tags.find(t=>t.id===expected.id);report.tags.push({tagId,runtimeId:expected.id,page:item.page,expectedValue:expected.value,present:!!present,estimateBefore:before.estimate,estimateAfter:after.estimate,unknownSourceValue:expected.value===null});if(present)assert.equal(present.value,expected.value,`value ${tagId}`);else{assert.ok(after.dialogue,`Rejected card ${tagId} must give visible customer feedback`);assert.deepEqual(after.tags,before.tags,`Rejected card ${tagId} must not silently change the ledger`);}}
 check('every exposed book tag receives an applied or explicitly rejected pointer drag',{count:report.tags.length});
 await navigate('condition');await drag('book-perfect',{x:236,y:618});await drag('book-slightly-damaged',{x:236,y:618});const replaced=await state();assert.ok(replaced.tags.some(t=>t.id==='slightly-damaged'));assert.equal(replaced.tags.some(t=>t.id==='perfect'),false);check('same-category condition replaces the prior card');
 await click('book-close');assert.equal((await state()).book,null);await click('book-open');assert.equal((await state()).book,'index');check('closing and reopening uses the actual book handle');
 await p.screenshot({path:path.join(out,'final-interaction.png')});assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.ok(report.pixelComparison.every(c=>c.equal),'book raster pixel comparison failed; see pixelComparison');report.passed=true;
} catch(e){report.failure=String(e);report.failureState=await state().catch(()=>null);await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error('FAIL',String(e));}
finally{report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(root,'artifacts/qa/book-report.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({passed:report.passed,pages:report.pages.length,tags:report.tags.length,comparisons:report.pixelComparison.length,failure:report.failure,errors:report.errors},null,2));if(!report.passed)process.exitCode=1;}
