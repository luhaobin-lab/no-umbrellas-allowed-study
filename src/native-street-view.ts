import {NATIVE_STREET_SCENE,NATIVE_STREET_PROJECTION,nativeSceneVisible,nativeFlowerTranslation,nativeStreetRenderers,streetXToSourceWorld,type NativeSceneRenderer,type NativeSceneSprite} from './native-street-data';
import type {Contexts} from './native-scheduler';
export interface NativeStreetCamera {worldX:number;worldY:number;pixelsPerUnit:number;width:number;height:number;flowerDisplay?:readonly number[]}
export type NativeInterior='gem'|'repair'|'auction'|'flowers'|'Scented'|'RepairShop'|'HiddenV'|'AjikHair'|'NiceT'|'BestRoof'|'CityChat'|'GemByJ'|'JunkJunk';
export class NativeStreetView {
 readonly ready:Promise<void>;readonly errors:string[]=[];private images=new Map<string,HTMLImageElement>();private tinted=new Map<string,HTMLCanvasElement>();private loaded=false;
 constructor(){this.ready=Promise.all(Object.values(NATIVE_STREET_SCENE.sprites).map(sprite=>new Promise<void>(resolve=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>{this.errors.push(sprite.image);resolve();};image.src=sprite.image;this.images.set(sprite.id,image);}))).then(()=>{this.loaded=true;});}
 get isReady(){return this.loaded;}
 private picture(r:NativeSceneRenderer,s:NativeSceneSprite):CanvasImageSource|null{const base=this.images.get(s.id);if(!base?.complete||!base.naturalWidth)return null;const {r:red,g:green,b:blue}=r.color;if(red>=.999&&green>=.999&&blue>=.999)return base;const key=s.id+':'+[red,green,blue].join(',');if(this.tinted.has(key))return this.tinted.get(key)!;const canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d')!;c.drawImage(base,0,0);c.globalCompositeOperation='multiply';c.fillStyle=`rgb(${Math.round(red*255)},${Math.round(green*255)},${Math.round(blue*255)})`;c.fillRect(0,0,s.width,s.height);c.globalCompositeOperation='destination-in';c.drawImage(base,0,0);this.tinted.set(key,canvas);return canvas;}
 private draw(ctx:CanvasRenderingContext2D,r:NativeSceneRenderer,camera:NativeStreetCamera){
  const sprite=NATIVE_STREET_SCENE.sprites[r.sprite],m=r.matrix,p=camera.pixelsPerUnit;const w=sprite.rect.width/sprite.ppu,h=sprite.rect.height/sprite.ppu;
  const centerX=(m[4]-camera.worldX)*p+camera.width/2,centerY=(camera.worldY-m[5])*p+camera.height/2;
  const radius=(Math.abs(m[0])*w+Math.abs(m[2])*h+Math.abs(m[1])*w+Math.abs(m[3])*h)*p;
  if(centerX+radius<0||centerY+radius<0||centerX-radius>camera.width||centerY-radius>camera.height)return;
  const image=this.picture(r,sprite);if(!image)return;const fx=r.flipX?-1:1,fy=r.flipY?-1:1;
  ctx.save();ctx.globalAlpha=r.color.a;ctx.transform(p*m[0]*fx,-p*m[1]*fx,p*m[2]*fy,-p*m[3]*fy,centerX,centerY);
  ctx.scale(1,-1);ctx.drawImage(image,(-sprite.pivot.x*sprite.rect.width+sprite.textureOffset.x)/sprite.ppu,(sprite.pivot.y*sprite.rect.height-sprite.textureOffset.y-sprite.textureSize.y)/sprite.ppu,sprite.textureSize.x/sprite.ppu,sprite.textureSize.y/sprite.ppu);ctx.restore();
 }
 renderWorld(ctx:CanvasRenderingContext2D,camera:NativeStreetCamera,contexts:Contexts,filter:(renderer:NativeSceneRenderer)=>boolean=()=>true,transform:(renderer:NativeSceneRenderer)=>NativeSceneRenderer|null=r=>r){ctx.save();ctx.imageSmoothingEnabled=false;for(const r of nativeStreetRenderers)if(filter(r)&&nativeSceneVisible(r,contexts)){const transformed=transform(r);if(transformed)this.draw(ctx,transformed,camera);}ctx.restore();}
 /** Uses existing video-strip player/camera X units; foreground sortingLayer>=6 is drawn after Bob. */
 renderStreet(ctx:CanvasRenderingContext2D,options:{floor:'b1'|'b2'|'b3';cameraX:number;contexts:Contexts;pass?:'all'|'background'|'foreground'}){
  const {floor,contexts,pass='all'}=options,p=NATIVE_STREET_PROJECTION.pixelsPerUnit;const camera:NativeStreetCamera={worldX:streetXToSourceWorld(options.cameraX+960),worldY:NATIVE_STREET_PROJECTION.floors[floor]+(540-NATIVE_STREET_PROJECTION.doorY)/p,pixelsPerUnit:p,width:1920,height:1080};
  ctx.save();ctx.beginPath();ctx.rect(0,90,1920,900);ctx.clip();this.renderWorld(ctx,camera,contexts,r=>(r.id.startsWith('level57:')||r.id.startsWith('level56:')||r.path.startsWith('StoreEntrances/'))&&(pass==='all'||(r.sortingLayer>=6)===(pass==='foreground')));ctx.restore();return camera;
 }
 /** Source room and actor layers, with the serialized Cinemachine camera. No screenshot UI residue. */
 renderInterior(ctx:CanvasRenderingContext2D,room:NativeInterior,contexts:Contexts,options:{width?:number;height?:number;pixelsPerUnit?:number;flowerDisplay?:readonly number[]}={}){
  const canonical=({gem:'GemByJ',repair:'RepairShop',auction:'HiddenV',flowers:'Scented'} as Record<string,string>)[room]??room;const art=({GemByJ:'Gem',RepairShop:'repair',HiddenV:'hiddenV_reception',Scented:'scented',AjikHair:'ajikHair',NiceT:'niceT',BestRoof:'Roof',CityChat:'chat_darkVersion',JunkJunk:'Junk'} as Record<string,string>)[canonical];const names={art,nav:canonical};const cameraData=NATIVE_STREET_SCENE.scenes.flatMap(s=>s.cameras).find(c=>c.path.startsWith(`Stores/${names.nav}/StoreCameraTrigger/`));
  if(!cameraData)throw new Error('Missing original interior camera '+room);const width=options.width??1920,height=options.height??1080,camera={worldX:cameraData.position.x,worldY:cameraData.position.y,pixelsPerUnit:options.pixelsPerUnit??Math.max(1,Math.round(height/(2*cameraData.lens.OrthographicSize*100)))*100,width,height,flowerDisplay:options.flowerDisplay};
  ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);this.renderWorld(ctx,camera,contexts,r=>r.path===names.art||r.path.startsWith(names.art+'/')||r.path.startsWith(`Stores/${names.nav}/`),r=>{const shift=nativeFlowerTranslation(r.path,options.flowerDisplay);if(!shift)return r;if(!shift.shown)return null;const matrix=[...r.matrix];matrix[4]+=shift.x;matrix[5]+=shift.y;return{...r,matrix};});ctx.restore();return camera;
 }
}
export function projectNativeStreetPoint(camera:NativeStreetCamera,x:number,y:number){return{x:(x-camera.worldX)*camera.pixelsPerUnit+camera.width/2,y:(camera.worldY-y)*camera.pixelsPerUnit+camera.height/2};}
import interactions from './native-street-interactions-data.json';
interface NativeCollider {id:string;path:string;matrix:number[];data:{m_Size?:{x:number;y:number};m_Radius?:number;m_Offset:{x:number;y:number}}}
function projectCollider(c:NativeCollider,camera:NativeStreetCamera,shift:{x:number;y:number}|null):[number,number,number,number]{
 const d=c.data,size=d.m_Size??{x:2*(d.m_Radius??0),y:2*(d.m_Radius??0)},m=[...c.matrix];if(shift){m[4]+=shift.x;m[5]+=shift.y;}
 const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>{const a=x*size.x+d.m_Offset.x,b=y*size.y+d.m_Offset.y;return projectNativeStreetPoint(camera,m[0]*a+m[2]*b+m[4],m[1]*a+m[3]*b+m[5]);});
 const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return[x,y,Math.max(...xs)-x,Math.max(...ys)-y];
}
export function nativeInteriorProductHotspots(storeId:string,camera:NativeStreetCamera,flowerDisplay:readonly number[]|undefined=camera.flowerDisplay){
 return interactions.filter(n=>n.storeId===storeId&&n.kind==='StreetStorePurchase').flatMap(node=>{
  const shift=nativeFlowerTranslation(node.path,flowerDisplay);if(shift&&!shift.shown)return[];
  const c=node.colliders.find(c=>/InteractionBounds/.test(c.path))??node.colliders[0];if(!c)return[];
  return[{id:node.id,storeId,path:node.path,collider:c.id,bounds:projectCollider(c,camera,shift)}];
 });
}
/** Original manual InteractionBounds / StreetInteractible regions. Trigger-only entry volumes are excluded. */
export function nativeInteriorInteractionHotspots(storeId:string,camera:NativeStreetCamera,contexts:Contexts){
 return interactions.filter(n=>n.storeId===storeId).flatMap(node=>{
  const data=node.data as {triggerType?:number;streetInteractionType?:number};
  if(node.kind==='StreetStorePurchase'||node.kind==='StreetTrigger'&&data.triggerType!==1||!nativeSceneVisible(node,contexts))return[];
  const shift=nativeFlowerTranslation(node.path,camera.flowerDisplay);if(shift&&!shift.shown)return[];
  return node.colliders.map(c=>({id:node.id,kind:node.kind,path:node.path,storeId,purchaseId:node.purchaseId,triggerType:data.triggerType,streetInteractionType:data.streetInteractionType,collider:c.id,bounds:projectCollider(c,camera,shift)})).filter(h=>h.bounds[0]+h.bounds[2]>=0&&h.bounds[0]<=camera.width&&h.bounds[1]+h.bounds[3]>=0&&h.bounds[1]<=camera.height);
 });
}
