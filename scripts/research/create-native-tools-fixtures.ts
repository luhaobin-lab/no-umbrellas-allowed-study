/** Explicit saved UI fixtures, not claimed to be campaign-generated encounters. */
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';import {createHash} from 'node:crypto';
import {Game,type Visit} from '../../src/engine';import {visits} from '../../src/data';import {getNativeItem,getNativeCard,createNativeItem,estimateNativeCards} from '../../src/native-rules';import {SaveRepository,DEFAULT_SAVE_KEY} from '../../src/session-store';
const out='artifacts/native-tools-browser';mkdirSync(out,{recursive:true});const fixtures=[];
for(const [name,id,seed,npc] of [['watch','BSC_OZ_01',105,'darcy'],['dynamic-gem','No_03_01',24680,'random_female_3040'],['no-gem','BSC_01_02',13579,'random_male_5060']] as const){
 const g=new Game(visits);g.start([],'challenge',seed);const def=getNativeItem(id)!,item=createNativeItem(id,{seed,instanceId:`qa-native-tools-${name}`});
 const initialIds=item.cardIds.filter(id=>{const c=getNativeCard(id)!;return c.color===0||c.category==='material'||c.category==='condition'});
 const v:Visit={id:`qa-fixture-${name}`,day:g.state.day,start:0,end:0,side:'buy',title:def.name,base:0,initial:g.cardsFromNative(initialIds),final:[],attractiveness:g.state.profile.attractiveness,price:null,estimate:null,definitionId:id,sourceCharacterId:npc,personality:'cautious',dialogues:[{text:'Explicit source-item UI test fixture, not a campaign encounter.'}]};
 // Append via the engine encounter loader, which creates the real haggle and UI state.
 g.state.activeNativeItem=item;(g as any).appendNativeVisit(v);
 const storage=new Map<string,string>(),repo=new SaveRepository<any>({getItem:k=>storage.get(k)??null,setItem:(k,v)=>{storage.set(k,v)},removeItem:k=>{storage.delete(k)}});
 const snapshot={state:g.snapshot(),ui:{dialogueVisible:false}};const result=repo.save(snapshot);if(!result.ok)throw Error(result.error.message);
 const verifier=new Game(visits);const restored=verifier.restore(snapshot.state);if(!restored.ok)throw Error(restored.reason);
 const entry={name,itemId:id,sourceId:def.sourceId,seed,npc,nativeItem:item,trueValue:estimateNativeCards(item.cardIds),expected:{integrity:def.integrity,year:def.year,signatureSourceId:def.signature?.sourceId??null,openSpriteSourceId:def.openSprite?.sourceId??null,materialId:initialIds.find(id=>getNativeCard(id)?.category==='material'),jewelId:item.jewel?.cardId??item.cardIds.find(id=>getNativeCard(id)?.category==='jewel')??null},saveKey:DEFAULT_SAVE_KEY,save:storage.get(DEFAULT_SAVE_KEY)!};fixtures.push(entry);writeFileSync(`${out}/fixture-${name}.json`,JSON.stringify(entry,null,2));
}
const sourceFiles=['src/main.ts','src/engine.ts','src/native-tools.ts','src/native-rules.ts','src/native-character-color.ts','src/native-card-view.ts'],sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
writeFileSync(`${out}/fixture-manifest.json`,JSON.stringify({scope:'Explicit source-item saved fixtures. No tool result, card award or tool animation is injected. Browser tests must use Load Game and controls.',fixtures:fixtures.map(({save,...rest})=>rest),sourceHashes:Object.fromEntries(sourceFiles.map(p=>[p,sha(p)])),buildFiles:Object.fromEntries(readdirSync('/tmp/nua-tools-ui-dist/assets').filter(x=>x.endsWith('.js')||x.endsWith('.css')).map(n=>[n,sha('/tmp/nua-tools-ui-dist/assets/'+n)]))},null,2));
console.log(JSON.stringify(fixtures.map(f=>({name:f.name,id:f.itemId,native:f.nativeItem,expected:f.expected,value:f.trueValue}))));
