import {NATIVE_MANUAL_FONTS,NATIVE_MANUAL_FRAME,NATIVE_MANUAL_INLINE_SPRITES} from './native-manual-data';
import type {NativeManualText} from './native-types';
import {getNativeCard} from './native-rules';
import {testCondition,type Contexts} from './native-scheduler';

type Font=(typeof NATIVE_MANUAL_FONTS)[keyof typeof NATIVE_MANUAL_FONTS];
type Glyph=Font['glyphs'][number];
export type TextRect=[number,number,number,number];
export interface TextLink {id:string;rect:TextRect;label:string}
interface Letter {char:string;color:string;size:number;link?:string;sprite?:number;bold:boolean;italic:boolean}
interface Positioned {letter:Letter;x:number;y:number;advance:number;glyph?:Glyph;scale:number}
export interface NativeTextLayout {width:number;height:number;baseline:number;lines:{width:number;letters:Positioned[];y:number;baseline:number;height:number;advance:number}[];font:Font;size:number;lineHeight:number}
const lookups=new Map<string,Map<number,Glyph>>();
function glyphs(font:Font){let map=lookups.get(font.id);if(!map){const byId=new Map(font.glyphs.map(g=>[g.index,g]));map=new Map(font.characters.map(c=>[c.unicode,byId.get(c.glyphIndex)!]).filter(([,g])=>!!g) as [number,Glyph][]);lookups.set(font.id,map);}return map;}
export function manualText(source:string,contexts:Contexts){
 // Original localized strings use conditional SmartFormat branches.
 let value=source;
 for(let i=0;i<5;i++){const next=value.replace(/\{[^{}]*ctxi\(([^)]+)\):([^{}]*)\}/g,(_,key,branches)=>{const choices=branches.split('|');return choices[testCondition(key,contexts)?0:1]??'';});if(next===value)break;value=next;}
 value=value.replace(/\{[^{}]*ctxc\(([^)]+)\):([^{}]*)\}/g,(_,condition,branches)=>{const choices=branches.split('|'),[key,values]=condition.split('=');const wanted=String(contexts[key]??'');return choices[(values??'').split('|').indexOf(wanted)]??'';});
 return value.replace(/<br\s*\/?\s*>/gi,'\n').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function parse(source:string,size:number,color:string,style=0,linkColors?:string[]):Letter[]{
 const letters:Letter[]=[],colors=[color],sizes=[size],links:string[]=[],bold:boolean[]=[!!(style&1)],italic:boolean[]=[!!(style&2)];
 for(const piece of source.split(/(<[^>]+>)/g)){if(piece[0]==='<'){
  const tag=piece.slice(1,-1);let m:RegExpMatchArray|null;
  if((m=tag.match(/^color=["']?([^"']+)/i)))colors.push(m[1]);else if(tag==='/color')colors.pop();
  else if((m=tag.match(/^size=["']?([\d.]+)(%)?/i)))sizes.push(Number(m[1])*(m[2]?size/100:1));else if(tag==='/size')sizes.pop();
  else if((m=tag.match(/^link=["']?([^"']+)/i)))links.push(m[1]);else if(tag==='/link')links.pop();
  else if(tag==='b')bold.push(true);else if(tag==='/b')bold.pop();else if(tag==='i')italic.push(true);else if(tag==='/i')italic.pop();
  else if((m=tag.match(/^sprite(?:=| index=)["']?(\d+)/i)))letters.push({char:'',color:colors.at(-1)??color,size:sizes.at(-1)??size,link:links.at(-1),sprite:Number(m[1]),bold:false,italic:false});else {for(const char of piece)letters.push({char,color:colors.at(-1)??color,size:sizes.at(-1)??size,link:links.at(-1),bold:bold.at(-1)??false,italic:italic.at(-1)??false});}
  continue;
 }for(const char of piece)letters.push({char,color:colors.at(-1)??color,size:sizes.at(-1)??size,link:links.at(-1),bold:bold.at(-1)??false,italic:italic.at(-1)??false});}
 if(linkColors)for(const l of letters)if(l.link?.startsWith('c:')){const c=getNativeCard(l.link.slice(2));if(c)l.color=c.color===0?'#646464':c.color===1?linkColors[1]:c.color===2?linkColors[2]:c.color===3?linkColors[0]:c.color===4?'#ffff00':'#000000';}return letters;
}
export function layoutNativeText(spec:NativeManualText,width=Infinity,contexts:Contexts={},override?:string,linkColors?:string[],height=Infinity):NativeTextLayout{
 const font=NATIVE_MANUAL_FONTS[spec.font]??NATIVE_MANUAL_FONTS[NATIVE_MANUAL_FRAME.englishFontId],lookup=glyphs(font),face=font.face;
 let size=spec.autoSize?.max??spec.fontSize;
 const build=(fontSize:number):NativeTextLayout=>{
  const letters=parse(manualText(override??spec.text,contexts),fontSize,spec.color,spec.style,linkColors),lines:NativeTextLayout['lines']=[],scale=fontSize/Number(face.m_PointSize)*Number(face.m_Scale),lineHeight=Number(face.m_LineHeight)*scale+spec.lineSpacing*fontSize/100;
  let line:Positioned[]=[],x=0,lastSpace=-1;
  const push=()=>{while(line.length&&line.at(-1)!.letter.char===' ')line.pop();const end=line.at(-1),lineScale=Math.max(0,...line.map(p=>p.letter.size/Number(face.m_PointSize)*Number(face.m_Scale)))||scale,baseline=Number(face.m_AscentLine)*lineScale,height=(Number(face.m_AscentLine)-Number(face.m_DescentLine))*lineScale,previous=lines.at(-1),gap=(Number(face.m_LineHeight)-Number(face.m_AscentLine)+Number(face.m_DescentLine))*scale+spec.lineSpacing*fontSize/100,y=previous?previous.y+previous.height-previous.baseline+baseline+gap:0;
   if(previous)previous.advance=y-previous.y;lines.push({width:end?end.x+end.advance:0,letters:line,y,baseline,height,advance:height+gap});line=[];x=0;lastSpace=-1;};
  for(const letter of letters){if(letter.char==='\n'){push();continue;}const glyph=lookup.get(letter.char.codePointAt(0)??0),s=letter.size/Number(face.m_PointSize)*Number(face.m_Scale);
   const icon=letter.sprite!==undefined?NATIVE_MANUAL_INLINE_SPRITES[letter.sprite]:undefined,iconScale=icon?s*Number(face.m_AscentLine)/icon.glyphMetrics.m_Height*icon.glyphScale*icon.characterScale:s;
   const advance=icon?icon.glyphMetrics.m_HorizontalAdvance*iconScale:(glyph?.metrics[4]??Number(face.m_TabWidth))*s+(letter.bold?(font.boldSpacing??0)*letter.size/100:0)+spec.characterSpacing*letter.size/100+(letter.char===' '?spec.wordSpacing*letter.size/100:0);
   if(spec.wordWrap&&x+advance>width&&line.length){if(lastSpace>=0){const rest=line.splice(lastSpace+1);line.pop();push();for(const p of rest){p.x=x;x+=p.advance;line.push(p);}}else push();}
   if(letter.char===' ')lastSpace=line.length;line.push({letter,x,y:0,advance,glyph,scale:icon?iconScale:s});x+=advance;
  }push();const last=lines.at(-1)!;return {width:Math.max(0,...lines.map(l=>l.width)),height:Math.max(0,last.y+last.height),baseline:lines[0].baseline,lines,font,size:fontSize,lineHeight};
 };
 let result=build(size);if(spec.autoSize&&(result.width>width||result.height>height)){let low=spec.autoSize.min,high=size;result=build(low);for(let i=0;i<16&&high-low>.05;i++){const mid=Math.round((low+high)/2*20)/20,candidate=build(mid);if(candidate.width<=width+.001&&candidate.height<=height+.001){low=mid;result=candidate;}else high=mid;}}
 return result;
}
const tinted=new Map<string,HTMLCanvasElement>();
export function drawNativeText(ctx:CanvasRenderingContext2D,spec:NativeManualText,rect:TextRect,image:(p:string)=>HTMLImageElement,contexts:Contexts={},override?:string,linkColors?:string[]):TextLink[]{
 const [x,y,w,h]=rect,[ml,mt,mr,mb]=spec.margins,layout=layoutNativeText(spec,Math.max(1,w-ml-mr),contexts,override,linkColors,Math.max(1,h-mt-mb)),links:TextLink[]=[];
 const font=layout.font,extra=font as Font&{alphaAtlasAssets?:string[]},atlases=extra.alphaAtlasAssets??font.atlasAssets;
 let top=y+mt;if(spec.verticalAlignment===512)top+=(h-mt-mb-layout.height)/2;else if(spec.verticalAlignment===1024)top+=h-mt-mb-layout.height;
 for(let row=0;row<layout.lines.length;row++){const line=layout.lines[row];let left=x+ml;if(spec.horizontalAlignment===2)left+=(w-ml-mr-line.width)/2;else if(spec.horizontalAlignment===4)left+=w-ml-mr-line.width;
  for(const p of line.letters){const g=p.glyph,l=p.letter,dx=left+p.x,dy=top+line.y;
   if(l.sprite!==undefined){const sprite=NATIVE_MANUAL_INLINE_SPRITES[l.sprite];if(sprite){const im=image(sprite.asset);if(im.complete&&im.naturalWidth)ctx.drawImage(im,dx+sprite.glyphMetrics.m_HorizontalBearingX*p.scale,dy+line.baseline-sprite.glyphMetrics.m_HorizontalBearingY*p.scale,sprite.glyphMetrics.m_Width*p.scale,sprite.glyphMetrics.m_Height*p.scale);}}
   else if(g){const atlasPath=atlases[g.atlasIndex??0],atlas=image(atlasPath);if(atlas.complete&&atlas.naturalWidth){
    const [gx,gy,gw,gh]=g.rect,dw=Math.max(1,Math.round(gw*p.scale)),dh=Math.max(1,Math.round(gh*p.scale)),key=[atlasPath,g.index,l.color,dw,dh,l.bold].join(':');let mask=tinted.get(key);
    if(!mask){mask=document.createElement('canvas');mask.width=dw;mask.height=dh;const mc=mask.getContext('2d')!;mc.imageSmoothingEnabled=false;mc.drawImage(atlas,gx,atlas.naturalHeight-gy-gh,gw,gh,0,0,dw,dh);mc.globalCompositeOperation='source-in';mc.fillStyle=l.color;mc.fillRect(0,0,dw,dh);tinted.set(key,mask);if(tinted.size>2048)tinted.delete(tinted.keys().next().value!);}
    ctx.save();const px=dx+g.metrics[2]*p.scale,py=dy+line.baseline-g.metrics[3]*p.scale;if(l.italic){ctx.translate(px,py+dh);ctx.transform(1,0,-(font.italicStyle??0)/100,1,0,0);ctx.drawImage(mask,0,-dh,dw,dh);}else ctx.drawImage(mask,px,py,dw,dh);ctx.restore();
   }}
   if(spec.style&64){ctx.fillStyle=l.color;const face=font.face,offset=Number(face.m_StrikethroughOffset??0)*p.scale,thickness=Number(face.m_StrikethroughThickness??1)*p.scale;ctx.fillRect(dx,dy+line.baseline-offset-thickness/2,p.advance,thickness);}
   if(l.link){const prev=links.at(-1),r:TextRect=[dx,dy,p.advance,line.advance];if(prev&&prev.id===l.link&&prev.rect[1]===dy&&Math.abs(prev.rect[0]+prev.rect[2]-dx)<1){prev.rect[2]+=p.advance;prev.label+=l.char;}else links.push({id:l.link,rect:r,label:l.char});}
  }
 }return links;
}
