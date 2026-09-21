import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {NATIVE_CHARACTER_DATA} from './native-character-data';
import {NATIVE_CHARACTERS,createNativeCharacterAppearance,getNativeCharacterLayers} from './native-characters';
const originalDir=new URL('../reference/original-study/windows-1.0.5-demo/objects/Character/',import.meta.url);
test('all 54 character definitions preserve independent source Appearance tables',()=>{
 assert.equal(Object.keys(NATIVE_CHARACTERS).length,54);
 for(const name of readdirSync(originalDir)){const envelope=JSON.parse(readFileSync(new URL(name,originalDir),'utf8')),source=envelope.data,actual=NATIVE_CHARACTERS[source.ID];assert.ok(actual);assert.deepEqual(actual.appearances,source.Appearance);assert.equal(actual.sex,source.Sex);assert.equal(actual.age,source.Age);}
});
test('every source sprite frame is exported; source null animation frames stay null',()=>{
 assert.equal(Object.keys(NATIVE_CHARACTER_DATA.parts).length,772);assert.equal(Object.keys(NATIVE_CHARACTER_DATA.sprites).length,16331);
 let clips=0,nullFrames=0;
 for(const part of Object.values(NATIVE_CHARACTER_DATA.parts)){if(part.sprite)assert.ok(NATIVE_CHARACTER_DATA.sprites[part.sprite]);for(const clip of Object.values(part.clips)){clips++;assert.ok(clip.keys.length);for(const [time,sprite] of clip.keys){assert.ok(Number.isFinite(time));if(sprite===null){nullFrames++;continue;}assert.ok(NATIVE_CHARACTER_DATA.sprites[sprite]);}}}
 assert.equal(clips,4468);assert.ok(nullFrames>0);
 for(const sprite of Object.values(NATIVE_CHARACTER_DATA.sprites))assert.ok(existsSync(new URL('../public'+sprite.asset,import.meta.url)),sprite.asset);
});
test('Darcy uses source 203 parts and source trim-aware canvases',()=>{
 const appearance=createNativeCharacterAppearance('darcy')!,layers=getNativeCharacterLayers(appearance),byRole=Object.fromEntries(layers.map(l=>[l.role,l]));
 assert.equal(appearance.partIds.body,'203');assert.equal(appearance.partIds.head,'203');assert.equal(appearance.partIds.hair,'203');
 assert.equal(byRole.body.sprite.width,104);assert.equal(byRole.body.sprite.height,109);assert.equal(byRole.hair.sprite.height,182);assert.equal(byRole.nose.sprite.width,48);assert.equal(byRole.eyeL.scaleX,-1);assert.equal(byRole.eyeR.scaleX,1);
 assert.notDeepEqual(getNativeCharacterLayers(createNativeCharacterAppearance('bokho')!).map(l=>l.sprite.sourceId),layers.map(l=>l.sprite.sourceId));
});
test('six demographic random generators preserve saved seeds and matching part eligibility',()=>{
 for(const id of Object.keys(NATIVE_CHARACTERS).filter(id=>/^random_(male|female)_/.test(id))){const a=createNativeCharacterAppearance(id,{seed:123})!,b=createNativeCharacterAppearance(id,{seed:123})!;assert.deepEqual(a,b);const layers=getNativeCharacterLayers(a);for(const role of ['body','cloth','head','eyeL','nose'])assert.ok(layers.some(l=>l.role===role),`${id}/${role}`);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);}
});
