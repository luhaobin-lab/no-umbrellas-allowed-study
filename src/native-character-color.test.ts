import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyNativeCharacterHsl,nativeCharacterHslPixel,type NativeRgba} from './native-character-color';
import {createNativeCharacterAppearance,getNativeCharacterLayers} from './native-characters';
const oracle=JSON.parse(readFileSync(new URL('./fixtures/native-character-hsl-original.json',import.meta.url),'utf8'));
test('HSL colors match the independent Windows shader instruction interpreter in 288 cases',()=>{
 assert.equal(oracle.cases.length,288);
 for(const row of oracle.cases){const actual=nativeCharacterHslPixel(row.rgba as NativeRgba,row.adjust,row.epsilon);for(let i=0;i<4;i++)assert.ok(Math.abs(actual[i]-row.expected[i])<2e-6,JSON.stringify({row,actual,i}));}
});
test('RGBA buffer preserves alpha and exact neutral colors while applying HSL offsets',()=>{
 const neutral=new Uint8ClampedArray([121,83,42,177,0,0,0,0]),copy=neutral.slice();assert.equal(applyNativeCharacterHsl(neutral,[0,.5,.5,1]),neutral);assert.deepEqual(neutral,copy);
 const changed=applyNativeCharacterHsl(neutral,[.2,.51,.62,1]);assert.equal(changed[3],177);assert.equal(changed[7],0);assert.notDeepEqual(changed.slice(0,3),copy.slice(0,3));
});
test('source eye renderers are not recolored by SetSkinColor and default lipstick retains skin tint',()=>{
 const appearance=createNativeCharacterAppearance('darcy')!;appearance.colors.skin=[.05,.6,.4,1];appearance.colors.lipstick=[0,.5,.5,1];
 const layers=getNativeCharacterLayers(appearance);assert.deepEqual(layers.find(l=>l.role==='head')?.hsv,appearance.colors.skin);
 for(const l of layers.filter(l=>['eyeL','eyeR'].includes(l.role)))assert.notDeepEqual(l.hsv,appearance.colors.skin);
 for(const l of layers.filter(l=>l.role==='mouthTint'))assert.deepEqual(l.hsv,appearance.colors.skin);
});
