import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {RECORDED_TRANSACTIONS} from '../src/reference-transactions.ts';
const run=promisify(execFile),out={};await fs.mkdir('public/assets/animation',{recursive:true});
for(const t of RECORDED_TRANSACTIONS){if(!t.npc.asset||!t.npc.bbox)continue;let time=Number(t.npc.asset.match(/visitor-(\d+)/)?.[1]);if(!time)continue;let {x,y,width,height}=t.npc.bbox;height=Math.min(height,684-y);if(height<30)continue;const folder=`public/assets/animation/${t.id}`;await fs.mkdir(folder,{recursive:true});await run('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(time),'-i','参考视频.mp4','-t','1.5','-vf',`crop=${width}:${height}:${x}:${y},fps=8`,'-frames:v','12',`${folder}/%02d.png`]);out[t.id]={time,rect:[x,y,width,height],fps:8,frames:Array.from({length:12},(_,i)=>`/assets/animation/${t.id}/${String(i+1).padStart(2,'0')}.png`)};}
await fs.writeFile('src/reference-animations.ts',`export const REFERENCE_ANIMATIONS:Record<string,{time:number;rect:[number,number,number,number];fps:number;frames:string[]}> = ${JSON.stringify(out,null,2)};\n`);console.log('Extracted',Object.keys(out).length,'NPC idle loops');
