import {NATIVE_TOOL_VISUALS as V,nativeToolOutBounce,nativeToolOutExpo} from './native-tool-visual-data';
type Node=(typeof V.damage.nodes)[number];
type Picture=(path:string)=>HTMLImageElement;
const p=V.camera.pixelsPerWorldUnit;
function part(ctx:CanvasRenderingContext2D,n:Node,image:Picture,x=0,y=0){const r=n.renderer,s=r?.sprite;if(!s||!r.enabled)return;const im=image(s.asset);if(!im.complete||!im.naturalWidth)return;const w=s.width/(s.pixelsPerUnit??100)*p*n.scale[0],h=s.height/(s.pixelsPerUnit??100)*p*n.scale[1];ctx.save();ctx.globalAlpha*=r.color.a;ctx.drawImage(im,x+n.position[0]*p-w*(s.pivot??[.5,.5])[0],y-n.position[1]*p-h*(1-(s.pivot??[.5,.5])[1]),w,h);ctx.restore();}
export function nativeDamageIdleAngle(seconds:number){const t=(seconds/V.damage.idleSeconds)%2;return V.damage.needleRange[0]+(V.damage.needleRange[1]-V.damage.needleRange[0])*(t<=1?t:2-t);}
export function nativeDamageSettledAngle(from:number,to:number,age:number){return from+(to-from)*nativeToolOutBounce(Math.min(1,Math.max(0,age/V.damage.settleSeconds)));}
export function drawNativeDamage(ctx:CanvasRenderingContext2D,image:Picture,x:number,y:number,angle:number){ctx.save();ctx.translate(x,y);for(const n of [...V.damage.nodes].sort((a,b)=>(a.renderer?.sortingOrder??0)-(b.renderer?.sortingOrder??0))){if(n.id===V.damage.rootId||!n.renderer)continue;if(n.id===V.damage.needleId){const anchor=V.damage.nodes.find(n=>n.id===V.damage.needleAnchorId)!;ctx.save();ctx.translate(anchor.position[0]*p,-anchor.position[1]*p);ctx.rotate(-angle*Math.PI/180);part(ctx,{...n,position:n.localPosition},image);ctx.restore();}else part(ctx,n,image);}ctx.restore();}
let ticketCanvas:HTMLCanvasElement|undefined;
/** The original ticket is visible outside a SpriteMask, then fades with iTween easeOutExpo. */
export function drawNativeGem(ctx:CanvasRenderingContext2D,image:Picture,x:number,y:number,age:number|null){
 ctx.save();ctx.translate(x,y);const nodes=V.gem.nodes;
 for(const n of [...nodes].sort((a,b)=>(a.renderer?.sortingOrder??0)-(b.renderer?.sortingOrder??0))){
  if(n.id===V.gem.rootId||!n.renderer?.enabled)continue;
  if(n.id!==V.gem.ticketId){part(ctx,n as Node,image);continue;}if(age===null)continue;
  const progress=nativeToolOutExpo(Math.min(1,age/V.gem.printSeconds)),fade=age<=V.gem.printSeconds?1:1-nativeToolOutExpo(Math.min(1,(age-V.gem.printSeconds)/V.gem.fadeSeconds));
  const ticket={...n,position:[n.position[0],n.position[1]+V.gem.ticketEndLocal[1]*progress]} as Node;
  ticketCanvas??=document.createElement('canvas');ticketCanvas.width=240;ticketCanvas.height=240;const tc=ticketCanvas.getContext('2d')!;tc.imageSmoothingEnabled=false;tc.translate(120,120);part(tc,ticket,image);
  const mask=nodes.find(n=>n.mask);if(mask?.mask?.sprite){const sprite=mask.mask.sprite,im=image(sprite.asset);if(im.complete&&im.naturalWidth){tc.globalCompositeOperation='destination-out';const w=sprite.width/(sprite.pixelsPerUnit??100)*p*mask.scale[0],h=sprite.height/(sprite.pixelsPerUnit??100)*p*mask.scale[1];tc.drawImage(im,mask.position[0]*p-w*(sprite.pivot??[.5,.5])[0],-mask.position[1]*p-h*(1-(sprite.pivot??[.5,.5])[1]),w,h);}}
  ctx.save();ctx.globalAlpha*=fade;ctx.drawImage(ticketCanvas,-120,-120);ctx.restore();
 }ctx.restore();
}
