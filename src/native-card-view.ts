/** Original CardDisplayManager (resources.assets:26132) and its 279×174 prefab.
 * Gameplay truth is deliberately not inferred here: this renders the supplied card ID.
 */
import {NATIVE_CARD_VIEW} from './native-card-data';
import {NATIVE_MANUAL_FONTS} from './native-manual-data';
import {getNativeCard,nativeCardId} from './native-rules';
import {drawNativeText,layoutNativeText,type TextRect} from './native-text';
import type {NativeCard,NativeManualNode,NativeSprite} from './native-types';

export interface NativeCardAppearance {id:string;name:string;info:string;effect:string;tier:number;color:number;category:string;background:NativeSprite}
export interface NativeCardHighlight {recentlyChanged?:boolean;hasEffect?:boolean;effectActive?:boolean;canChange?:boolean;willChange?:boolean;recognized?:boolean}
export interface NativeCardDrawOptions {
 expanded?:boolean;
 /** Source preview interpolation, 0..1; animate for .1 seconds with easeOutQuad. */
 previewProgress?:number;
 image?:(path:string)=>HTMLImageElement;
 onImageLoad?:()=>void;
 highlight?:NativeCardHighlight;
 /** A full card is used while dragging. No folded-slot clipping or preview displacement. */
 full?:boolean;
 /** Original TierText is inactive in this prefab. */
 showTier?:boolean;
 otherCardIds?:readonly string[];
}
export interface NativeCardDrawResult {id:string;hit:TextRect;fullBounds:TextRect;previewOffset:number;ready:boolean;highlightCanClear:boolean;appearance:NativeCardAppearance}
const prefixes=['gry','gr','bl','r','yl','pnk_front'];
const title=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
const pinkRanges:Record<string,[number,number][]>={appraised:[[-5,-1],[0,4],[5,9],[10,14],[15,19]],recommended:[[0,4],[5,9],[10,14],[15,19],[20,24]],trusted:[[15,11],[10,6],[5,-4],[-5,-9],[-10,-14]]};
export function nativePinkDisplayTier(kind:string,percent:number):number{
 return kind==='trusted'?(percent>10?0:percent>5?1:percent>-5?2:percent>-10?3:4):kind==='appraised'?(percent<0?0:percent<5?1:percent<10?2:percent<15?3:4):(percent<5?0:percent<10?1:percent<15?2:percent<20?3:4);
}
/** Unity's visual Card factory intentionally differs from the F# valuation factory. */
export function getNativeCardAppearance(query:string|NativeCard):NativeCardAppearance|undefined{
 const id=nativeCardId(typeof query==='string'?query:query.id),raw=typeof query==='string'?getNativeCard(id.startsWith('green_fakeBrandHalf')?'green_fakeBrandHalf':id):query;
 if(!raw)return undefined;
 let {name,tier,color,category}=raw,info=raw.effectText??'',effect=raw.shortEffect;
 const pink=id.match(/^pink_(appraised|recommended|trusted)(?:_(-?\d+)|([1-5]))$/);
 if(pink){category='pink_'+pink[1];tier=pink[3]?Number(pink[3])-1:nativePinkDisplayTier(pink[1],Number(pink[2]));color=5;
  name=NATIVE_CARD_VIEW.dynamicText[category+'_Name'];info=NATIVE_CARD_VIEW.dynamicText[category+(tier+1)+'_EffectText'];
  effect=pink[3]?pinkRanges[pink[1]][tier].map(v=>v+'%').join('\n~ '):Number(pink[2])+'%';
 }else if(id.startsWith('green_jewel_')){
  const [, ,kind,caratText,cutName]=id.split('_'),carat=Number(caratText)||1,cut=cutName==='none'?'round':cutName;
  name=`${title(kind)}, ${title(cut)} cut, ${carat} ${carat===1?'caret':'carets'}`;info=name;tier=1;effect=`${raw.addend>=0?'+':''}${Math.trunc(raw.addend)}V`;
 }else if(id.startsWith('green_fakeBrandHalf')&&id!=='green_fakeBrandHalf'){const source=getNativeCard('green_fakeBrandHalf')!;name=source.name;info=source.effectText??'';tier=source.tier;color=source.color;category=source.category;effect=source.shortEffect;}
 if(color===3||color===4)effect='';
 let spriteTier=Math.min(tier,2);
 if(color===5&&category.startsWith('pink_'))spriteTier=category==='pink_recommended'?[0,0,1,1,2][tier]:[0,0,0,1,2][tier];
 const background=NATIVE_CARD_VIEW.sprites[`card_${prefixes[color]}_0${spriteTier+1}`];
 return background?{id,name,info,effect,tier,color,category,background}:undefined;
}
export function nativeCardHighlightState(s:NativeCardHighlight={}){
 const active=!!(s.hasEffect&&s.effectActive||s.canChange&&s.willChange);
 return {shown:!!s.recentlyChanged||active,exclamation:!!s.recentlyChanged||active&&!s.recognized,canClear:!active};
}
// Independently exported Card.badFigures (native-card-probe.jsonl, card-sale-constants).
const negativeFigures=new Set(['blue_criminal','blue_businessman','blue_politician','blue_scholar','blue_fakesign']);
/** CardDisplayManager.SetOverriddenEffect stops at the first applicable pink card. */
export function nativeCardOverriddenEffect(card:NativeCardAppearance,otherCards:readonly string[]):{effect:string;changedBy:string}|undefined{
 for(const id of otherCards){if(id===card.id||!id.startsWith('pink_'))continue;const pink=getNativeCardAppearance(id);if(!pink)continue;let effect:string|undefined;
  if(pink.category==='pink_appraised'){
   if(pink.tier===0&&['blue_pop','blue_perfect'].includes(card.id))effect='+0%';
   if(pink.tier>=3&&negativeFigures.has(card.id))effect='-0%';
   if(pink.tier===4&&card.category==='condition'&&(getNativeCard(card.id)?.multiplier??1)<1)effect='-0%';
  }else if(pink.category==='pink_recommended'&&pink.tier>=2&&card.category==='popularity'){
   const raw=getNativeCard(card.id);if(raw&&raw.multiplier<1)effect='-0%';
   else effect=({blue_minor:'+20%',blue_pop:'+40%',blue_pop_all:'+60%',blue_pop_mid:'+30%',blue_pop_senior:'+30%',blue_pop_young:'+20%',blue_unpop_certain:'+30%'} as Record<string,string>)[card.id];
  }
  if(effect!==undefined)return {effect,changedBy:pink.name};
 }
 return undefined;
}
function rect(node:NativeManualNode,parent:[number,number]=[279,174]):TextRect{
 const r=node.rect,w=parent[0]*(r.anchorMax[0]-r.anchorMin[0])+r.sizeDelta[0],h=parent[1]*(r.anchorMax[1]-r.anchorMin[1])+r.sizeDelta[1];
 return [parent[0]*(r.anchorMin[0]+(r.anchorMax[0]-r.anchorMin[0])*r.pivot[0])+r.anchoredPosition[0]-w*r.pivot[0],parent[1]*(1-r.anchorMin[1]-(r.anchorMax[1]-r.anchorMin[1])*r.pivot[1])-r.anchoredPosition[1]-h*(1-r.pivot[1]),w,h];
}
export function nativeCardPreviewOffset(card:NativeCardAppearance):number{
 const n=NATIVE_CARD_VIEW.parts.InfoText,r=rect(n),spec=n.text!,m=spec.margins;
 return NATIVE_CARD_VIEW.preview.baseOffset+layoutNativeText(spec,r[2]-m[0]-m[2],{},card.info,undefined,r[3]-m[1]-m[3]).height;
}
const imageCache=new Map<string,HTMLImageElement>();
function defaultImage(path:string,onLoad?:()=>void){let im=imageCache.get(path);if(!im){im=new Image();if(onLoad)im.addEventListener('load',onLoad,{once:true});im.src=path;imageCache.set(path,im);}return im;}
export function getNativeCardRequiredImages():string[]{
 const images=new Set(Object.values(NATIVE_CARD_VIEW.sprites).map(s=>s.asset));
 for(const part of Object.values(NATIVE_CARD_VIEW.parts)){if(part.image?.sprite)images.add(part.image.sprite.asset);if(part.text){const f=NATIVE_MANUAL_FONTS[part.text.font];for(const asset of f?.alphaAtlasAssets??[])images.add(asset);}}
 return [...images];
}
/** x/y is the top-left of the folded slot. Width fixes source scale; height clips its
 * lower part, so it must not be used to squash a 279×174 card into a short strip.
 * Expanded cards should be drawn after neighbours and hit-tested via the returned hit.
 */
export function drawNativeCard(ctx:CanvasRenderingContext2D,query:string|NativeCard,x:number,y:number,width:number,height:number,options:NativeCardDrawOptions={}):NativeCardDrawResult|undefined{
 const card=getNativeCardAppearance(query);if(!card)return undefined;
 const image=options.image??((p:string)=>defaultImage(p,options.onImageLoad)),scale=width/279,progress=options.previewProgress??(options.expanded?1:0),preview=options.full?0:nativeCardPreviewOffset(card)*scale*Math.max(0,Math.min(1,progress));
 const fullBounds:TextRect=[x,y-preview,width,174*scale],visibleHeight=options.full?174*scale:Math.min(174*scale,height+preview),hit:TextRect=[x,y-preview,width,visibleHeight];let ready=true;
 ctx.save();ctx.beginPath();ctx.rect(...hit);ctx.clip();ctx.translate(x,y-preview);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 function sprite(s:NativeSprite,r:TextRect){const im=image(s.asset);if(im.complete&&im.naturalWidth)ctx.drawImage(im,...r);else ready=false;}
 function text(field:string,value:string){const n=NATIVE_CARD_VIEW.parts[field];if(n.text)drawNativeText(ctx,n.text,rect(n),image,{},value);}
 sprite(card.background,[0,0,279,174]);text('NameText',card.name);text('EffectText',card.effect);
 if(options.showTier&&card.tier<3)text('TierText','Tier '+(card.tier+1));
 const override=options.otherCardIds?nativeCardOverriddenEffect(card,options.otherCardIds):undefined;
 if(override){sprite(card.background,rect(NATIVE_CARD_VIEW.parts.OverriddenOverlay));text('AlternateNameText',card.name);text('PreviousEffectText',card.effect);text('AlternateEffect',override.effect);text('ChangedByText',NATIVE_CARD_VIEW.changedByFormat.replace(/\{CardID\}/g,override.changedBy));}
 // Description is a later sibling than OverriddenOverlay in the source hierarchy.
 text('InfoText',card.info);
 const highlight=nativeCardHighlightState(options.highlight);
 if(highlight.shown){const n=NATIVE_CARD_VIEW.parts[`Tier${card.tier===0?1:2}Highlight${highlight.exclamation?'':'_noEx'}`];if(n.image?.sprite)sprite(n.image.sprite,rect(n));}
 ctx.restore();return {id:card.id,hit,fullBounds,previewOffset:preview,ready,highlightCanClear:highlight.canClear,appearance:card};
}
