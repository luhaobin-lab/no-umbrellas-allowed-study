/** Original modular character appearances and sprite-animation rig, browser/Node safe. */
import {NATIVE_CHARACTER_DATA} from './native-character-data';
import {nativeRandom} from './native-random';
export interface CharacterSprite {sourceId:string;asset:string;name:string;width:number;height:number;pivot:number[];pixelsPerUnit:number;textureSize:number[]}
interface Clip {sourceId:string;duration:number;sampleRate:number;loop:boolean;keys:[number,string|null][]}
interface Part {sourceId?:string;id:string;type:string;sprite:string|null;clips:Record<string,Clip>}
interface Rig {role:string;type:string;transformId:string;parentId:string|null;position:number[];scale:number[];order:number;flipX:boolean;flipY:boolean;color:{r:number;g:number;b:number;a:number};materialIds:(string|null)[]}
interface Transform {parentId:string|null;position:number[];scale:number[]}
export interface NativeCharacterData {
 characters:Record<string,{id:string;sourceId:string;sex:number;age:number;appearances:Record<string,any>[]}>;
 parts:Record<string,Part>;sprites:Record<string,CharacterSprite>;rig:Rig[];anchors:Record<string,Transform & {id:string}>;transforms:Record<string,Transform>;offsets:Record<string,Record<string,number[]>>;
 partEligibility:{ID:string;Sex:number;Age:number;ForSpecial:number;CachedFoundPartTypes:number}[];longHairIds:string[];
}
export interface NativeCharacterAppearance {characterId:string;sourceId:string;appearanceIndex:number;partIds:Record<string,string>;colors:{skin:number[];hair:number[];eyebrow:number[];cloth:number[];lipstick:number[]};eyebrowsAboveHair:boolean;rngState:number}
export interface NativeCharacterLayer {role:string;sprite:CharacterSprite;x:number;y:number;scaleX:number;scaleY:number;order:number;hsv:number[]}
const baseTypes=['backhair','body','cloth','head','others','eye','eyetint','nose','nosetint','mouth','mouthtint','eyebrow','hair','eyebrowtint','special','otherstint'];
const fallbackOffset:Record<string,number[]>={HEAD_NOSE:[0,25],HEAD_EYE_L:[-10,35],HEAD_EYE_R:[10,35],HEAD_LIPS:[0,15],HEAD_EYEBROW_L:[-10,40],HEAD_EYEBROW_R:[10,40],HEAD_HAIR:[0,2]};
export const NATIVE_CHARACTERS=NATIVE_CHARACTER_DATA.characters;
export function createNativeCharacterAppearance(id:string,options:{seed?:number;appearanceIndex?:number;evaluateContext?:(predicate:string)=>boolean}={}):NativeCharacterAppearance|undefined{
 const character=NATIVE_CHARACTERS[id];if(!character)return undefined;
 let index=options.appearanceIndex??character.appearances.findIndex(a=>options.evaluateContext?options.evaluateContext(a.UseIf):a.UseIf==='true');if(index<0)index=0;
 const definition=character.appearances[index];if(!definition)return undefined;
 const rng=nativeRandom(options.seed??1),partIds:Record<string,string>={};
 for(const type of ['body','cloth','head','eye','eyebrow','nose','mouth','hair','backhair','others']){
  let value=definition[type.toUpperCase()];if(definition['random'+type.toUpperCase()]){
   const candidates=NATIVE_CHARACTER_DATA.partEligibility.filter(p=>p.Age===character.age&&p.Sex===character.sex&&!p.ForSpecial&&(p.CachedFoundPartTypes&(1<<(baseTypes.indexOf(type)+1))));
   value=candidates.length?candidates[Math.floor(rng.next()*candidates.length)].ID:'None';
  }
  if(value&&value!=='None')partIds[type]=value;
 }
 for(const type of ['eye','nose','mouth','eyebrow','others'])if(partIds[type])partIds[type==='others'?'otherstint':type+'tint']=partIds[type];
 if(partIds.head)partIds.special=partIds.head;
 const color=(h:number[][],s:number[][],v:number[][])=>[range(h)/255,range(s)/255,range(v)/255,1];
 function range(ranges:number[][]){const widths=ranges.map(r=>r[1]-r[0]);let n=rng.next()*widths.reduce((a,b)=>a+b,0);for(let i=0;i<ranges.length;i++){if(n<=widths[i])return ranges[i][0]+n;n-=widths[i];}return ranges.at(-1)![1];}
 const neutral=[0,.5,.5,1],colors={skin:[...neutral],hair:[...neutral],eyebrow:[...neutral],cloth:[...neutral],lipstick:[...neutral]};
 if(definition.UseRandomColors){colors.skin=color([[0,11]],[[117,141]],[[117,133]]);colors.hair=color([[0,18],[235,255]],[[66,128]],[[110,137]]);colors.eyebrow=[...colors.hair];colors.cloth=color([[0,255]],[[0,128]],[[119,128]]);}
 if(definition.randomMOUTH&&character.sex===0&&definition.UseRandomColors)colors.lipstick=color([[0,20],[197,255]],[[128,170]],[[106,140]]);
 if(definition.UseCustomHairColor){const c=definition.CustomHairColor;colors.hair=[c.r,c.g,c.b,c.a];colors.eyebrow=[...colors.hair];}
 return {characterId:id,sourceId:character.sourceId,appearanceIndex:index,partIds,colors,eyebrowsAboveHair:NATIVE_CHARACTER_DATA.longHairIds.includes(definition.HAIR),rngState:rng.state};
}
function samplePart(part:Part|undefined,emotion:string,time:number):CharacterSprite|undefined{
 if(!part)return undefined;
 const clip=part.clips[emotion+'_LOOP']??part.clips.NEUTRAL_LOOP;
 if(!clip)return part.sprite?NATIVE_CHARACTER_DATA.sprites[part.sprite]:undefined;
 let t=Math.max(0,time);if(clip.duration>0)t=clip.loop?t%clip.duration:Math.min(t,clip.duration);
 let frame=clip.keys[0]?.[1];for(const [key,sprite] of clip.keys){if(key>t)break;frame=sprite;}
 return frame?NATIVE_CHARACTER_DATA.sprites[frame]:undefined;
}
/** Unity coordinates: y rises upward; x/y are relative to bodyAnchor, before the user's canvas placement. */
export function getNativeCharacterLayers(appearance:NativeCharacterAppearance,options:{emotion?:string;time?:number;speaking?:boolean}={}):NativeCharacterLayer[]{
 const emotion=(options.emotion??'NEUTRAL').toUpperCase(),time=options.time??0,offset=NATIVE_CHARACTER_DATA.offsets[appearance.partIds.head]??fallbackOffset;
 const transforms=structuredClone(NATIVE_CHARACTER_DATA.transforms),images=new Map<string,CharacterSprite>();
 for(const rig of NATIVE_CHARACTER_DATA.rig){
  if(rig.role==='special'&&emotion!=='SPECIAL')continue;
  const type=rig.role.startsWith('eyebrow')&&rig.role.endsWith('Tint')?'eyebrowtint':rig.type;
  const mood=options.speaking&&(type==='mouth'||type==='mouthtint')?'SPEAK':emotion;
  const image=samplePart(NATIVE_CHARACTER_DATA.parts[type+'/'+appearance.partIds[type]],mood,time);if(image)images.set(rig.role,image);
 }
 for(const rig of NATIVE_CHARACTER_DATA.rig){
  const tr=transforms[rig.transformId];if(!tr)continue;
  switch(rig.type){
   case 'body':case 'cloth':case 'eyetint':case 'nosetint':case 'mouthtint':case 'eyebrowtint':case 'special':tr.position=[0,0];break;
   case 'head':tr.position=[0,(images.get('body')?.height??40)-40];break;
   case 'hair':tr.position=[offset.HEAD_HAIR[0],(images.get('head')?.textureSize[1]??0)+offset.HEAD_HAIR[1]];break;
   case 'backhair':tr.position=[0,0];break;
   case 'eye':tr.position=offset[rig.role==='eyeL'?'HEAD_EYE_L':'HEAD_EYE_R'];break;
   case 'eyebrow':tr.position=offset[rig.role==='eyebrowL'?'HEAD_EYEBROW_L':'HEAD_EYEBROW_R'];break;
   case 'nose':tr.position=offset.HEAD_NOSE;break;
   case 'mouth':tr.position=offset.HEAD_LIPS;break;
  }
 }
 const anchor=NATIVE_CHARACTER_DATA.anchors.bodyAnchor.id;
 function world(id:string):{x:number;y:number;sx:number;sy:number}{if(id===anchor||!transforms[id])return {x:0,y:0,sx:1,sy:1};const t=transforms[id],p=t.parentId?world(t.parentId):{x:0,y:0,sx:1,sy:1};return {x:p.x+t.position[0]*p.sx,y:p.y+t.position[1]*p.sy,sx:p.sx*t.scale[0],sy:p.sy*t.scale[1]};}
 const output:NativeCharacterLayer[]=[];
 for(const rig of NATIVE_CHARACTER_DATA.rig){const image=images.get(rig.role);if(!image)continue;const p=world(rig.transformId);let hsv=[rig.color.r,rig.color.g,rig.color.b,rig.color.a];
  // CharacterDisplayManager sets only these renderers; eyes/special retain prefab color.
  if(['body','head','eyeTintL','eyeTintR','nose','noseTint','eyebrowLTint','eyebrowRTint','othersTint','mouth','mouthTint'].includes(rig.role))hsv=appearance.colors.skin;
  if(['hair','backhair','others'].includes(rig.type))hsv=appearance.colors.hair;else if(rig.type==='eyebrow')hsv=appearance.colors.eyebrow;else if(rig.type==='cloth')hsv=appearance.colors.cloth;
  if(rig.role==='mouthTint'&&appearance.colors.lipstick.some((n,i)=>n!==[0,.5,.5,1][i]))hsv=appearance.colors.lipstick;
  const order=rig.role==='mouthTint'?117:rig.type==='eyebrow'?appearance.eyebrowsAboveHair?(NATIVE_CHARACTER_DATA.rig.find(r=>r.role==='hair')!.order+1):121:rig.order;
  output.push({role:rig.role,sprite:image,x:p.x,y:p.y,scaleX:p.sx*(rig.flipX?-1:1),scaleY:p.sy*(rig.flipY?-1:1),order,hsv});
 }
 return output.sort((a,b)=>a.order-b.order);
}
