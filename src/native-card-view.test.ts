import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {NATIVE_CARD_DATA} from './native-item-data';
import {NATIVE_CARD_VIEW} from './native-card-data';
import {getNativeCardAppearance,getNativeCardRequiredImages,nativeCardHighlightState,nativeCardOverriddenEffect,nativeCardPreviewOffset} from './native-card-view';

test('all original cards resolve color/tier background and preserve literal localized content',()=>{
 assert.equal(Object.keys(NATIVE_CARD_DATA).length,252);assert.equal(Object.keys(NATIVE_CARD_VIEW.sprites).length,18);
 for(const c of Object.values(NATIVE_CARD_DATA)){const a=getNativeCardAppearance(c)!;assert.ok(a,c.id);assert.equal(a.name,c.name);assert.equal(a.info,c.effectText);assert.equal(a.effect,c.color===3||c.color===4?'':c.shortEffect);assert.ok(nativeCardPreviewOffset(a)>=32);}
 for(const asset of getNativeCardRequiredImages())assert.ok(existsSync(new URL('../public'+asset,import.meta.url)),asset);
});
test('Unity visual factory uses tier 2 jewel presentation independently of valuation tier',()=>{
 const c=getNativeCardAppearance('green_jewel_ruby_2_pear')!;assert.equal(c.name,'Ruby, Pear cut, 2 carets');assert.equal(c.effect,'+1600V');assert.equal(c.tier,1);assert.equal(c.background.name,'card_gr_02');
 const h=getNativeCardAppearance('green_fakeBrandHalfasync')!;assert.equal(h.name,'Not a Knock-Off');assert.equal(h.effect,getNativeCardAppearance('green_fakeBrandHalf')!.effect);
});
test('pink preview and real cards use original 5-tier to 3-sprite mapping',()=>{
 for(const type of ['appraised','trusted','recommended'])for(let tier=1;tier<=5;tier++){
  const c=getNativeCardAppearance(`pink_${type}${tier}`)!;assert.equal(c.tier,tier-1);assert.equal(c.background.name,`card_pnk_front_0${(type==='recommended'?[1,1,2,2,3]:[1,1,1,2,3])[tier-1]}`);
 }
 assert.equal(getNativeCardAppearance('pink_appraised_10')!.background.name,'card_pnk_front_02');
 assert.equal(getNativeCardAppearance('pink_trusted_-10')!.background.name,'card_pnk_front_03');
 assert.equal(getNativeCardAppearance('pink_recommended_10')!.effect,'10%');
});
test('source highlight and overridden effects retain distinction between notice and active effects',()=>{
 assert.deepEqual(nativeCardHighlightState({recentlyChanged:true}),{shown:true,exclamation:true,canClear:true});
 assert.deepEqual(nativeCardHighlightState({hasEffect:true,effectActive:true,recognized:true}),{shown:true,exclamation:false,canClear:false});
 const pop=getNativeCardAppearance('blue_pop')!;
 assert.equal(nativeCardOverriddenEffect(pop,['pink_appraised_-1','pink_recommended_10'])!.effect,'+0%');
 assert.equal(nativeCardOverriddenEffect(pop,['pink_recommended_10','pink_appraised_-1'])!.effect,'+40%');
 const constants=readFileSync(new URL('../reference/original-study/npc/native-card-probe.jsonl',import.meta.url),'utf8').trim().split('\n').map(l=>JSON.parse(l)).find(x=>x.kind==='card-sale-constants');
 for(const id of constants.badFigures)assert.equal(nativeCardOverriddenEffect(getNativeCardAppearance(id)!,['pink_appraised_10'])!.effect,'-0%');
});
