import type {NativeStreetView} from './native-street-view';
import {NATIVE_STREET_DOORS,NATIVE_STREET_STORE_LABELS,nativeStreetStoreOpen,sourceWorldToStreetX} from './native-street-data';
import type {Contexts} from './native-scheduler';
/**
 * Continuous walking controller with original source scene layers and door positions.
 * Video strips remain the loading fallback and the unported public-square scene.
 */
export type StreetFloor = 'b1' | 'b2' | 'b3' | 'public';
export type StreetKeys = ReadonlySet<string> | Readonly<Record<string, boolean>>;
export type StreetPrompt = 'lower' | 'upper' | 'notice' | 'scavenge' | 'participate' | 'talk';
interface StreetTarget { id: string; label: string; x: number; y: number; radius: number; prompt: StreetPrompt; action: string }
interface FloorDefinition { width: number; minX: number; maxX: number; targets: StreetTarget[] }
const target = (id: string, label: string, x: number, prompt: StreetPrompt, action: string, radius = 105, y = 460): StreetTarget => ({ id, label, x, y, radius, prompt, action });
const storeX=(storeId:string)=>sourceWorldToStreetX(NATIVE_STREET_DOORS.find(d=>d.destinationPath.startsWith(`Stores/${storeId}/`))!.worldPosition.x);
const FLOORS: Record<StreetFloor, FloorDefinition> = {
  b1: { width: 4506, minX: 810, maxX: 3710, targets: [
    target('b1-bin-left', 'Scavenge', 812, 'scavenge', 'street:scavenge:unobserved', 100, 654),
    target('b1-down', 'Move to lower floor', 1134, 'lower', 'nav:street-b2'),
    target('scented', 'SCENTED', storeX('Scented'), 'notice', 'nav:store:Scented'),
    target('darcy', "DARCY’S", 2269, 'notice', 'nav:shop'),
    target('gem', 'GEM', storeX('GemByJ'), 'notice', 'nav:store:GemByJ'),
    target('b1-up', 'Move to upper floor', 3390, 'upper', 'nav:public-square'),
    target('b1-bin-right', 'Scavenge', 3710, 'scavenge', 'street:scavenge:unobserved', 95, 654),
  ] },
  b2: { width: 4506, minX: 810, maxX: 3710, targets: [
    target('b2-bin-left', 'Scavenge', 812, 'scavenge', 'cash:13', 100, 654),
    target('b2-down', 'Move to lower floor', 1134, 'lower', 'nav:street-b3'),
    target('jnkjnk', 'JNKJNK', storeX('JunkJunk'), 'notice', 'nav:store:JunkJunk'),
    target('hiddenv','HIDDEN V',storeX('HiddenV'),'notice','nav:store:HiddenV'),
    target('repair','REPAIR',storeX('RepairShop'),'notice','nav:store:RepairShop'),
    target('b2-up','Move to upper floor',3390,'upper','nav:street-east'),
    target('b2-bin-right','Scavenge',3710,'scavenge','street:scavenge:unobserved',95,654),
  ] },
  b3: {width:4506,minX:810,maxX:3710,targets:[
    target('b3-down','Move to lower floor',1134,'lower','street:unobserved:lower-floor'),
    target('nicet','NICE T',storeX('NiceT'),'notice','nav:store:NiceT'),
    target('ajikhair','AJIK HAIR',storeX('AjikHair'),'notice','nav:store:AjikHair'),
    target('bestroof','NEW ROOF',storeX('BestRoof'),'notice','nav:store:BestRoof'),
    target('b3-up','Move to upper floor',3390,'upper','nav:street-b2-east'),
  ]},
  public: { width: 3888, minX: 826, maxX: 3490, targets: [
    target('public-office', 'Talk', 1094, 'talk', 'nav:office', 110),
    target('public-protest', 'Participate', 1950, 'participate', 'street:participate', 160),
    target('public-down-left', 'Move to lower floor', 826, 'lower', 'nav:street-west'),
    target('public-down-right', 'Move to lower floor', 3084, 'lower', 'nav:street-east'),
  ] },
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const pressed = (keys: StreetKeys, ...names: string[]) => names.some(name => 'has' in keys && typeof keys.has === 'function' ? keys.has(name) : Boolean((keys as Readonly<Record<string, boolean>>)[name]));

export interface StreetWorldState {
  floor: StreetFloor; later: boolean; x: number; cameraX: number; cameraY: number; direction: 'left' | 'right'; moving: boolean;
  walkingTarget: number | null; nearby: { id: string; label: string; action: string; screenX: number } | null;
  scavenging: boolean; searchedBins: string[]; pendingAction: string | null; shopsOpen: boolean; ready: boolean;
}

export class StreetWorld {
  readonly speed = 480;
  readonly ready: Promise<void>;
  private floor: StreetFloor = 'b1';
  private later = false;
  private x = 2269;
  private cameraX = 1309;
  private direction: 'left' | 'right' = 'right';
  private moving = false;
  private animation = 0;
  private walkingTarget: number | null = null;
  private actionAtDestination: StreetTarget | null = null;
  private images = new Map<string, HTMLImageElement>();
  private assetsReady = false;
  private searchedBins = new Set<string>();
  private searchRemaining = 0;
  private bubbleRemaining = 0;
  private activeBin: string | null = null;
  private pendingAction: string | null = null;
  private fade = 0;
  private shopsOpen = true;
  private contexts:Contexts={day:1,morning:true,evening:false};

  constructor() {
    const assets = ['b1-panorama', 'b1-foreground', 'b2-panorama', 'b2-foreground', 'public-panorama', 'public-foreground', 'public-late-panorama', 'public-late-foreground',
      'prompt-lower', 'prompt-upper', 'prompt-notice', 'prompt-scavenge', 'prompt-scented', 'prompt-darcy', 'prompt-gem', 'prompt-participate', 'door-open-lamp', 'door-open-sign', 'prompt-talk', 'bubble-searching', 'bubble-cash13',
      ...(['left', 'right'] as const).flatMap(direction => [...Array.from({ length: 6 }, (_, n) => `bob-${direction}-${n}`), `bob-${direction}-idle`, ...Array.from({ length: 6 }, (_, n) => `public-bob-${direction}-${n}`), `public-bob-${direction}-idle`])];
    this.ready = Promise.all(assets.map(name => new Promise<void>(resolve => {
      const image = new Image(); this.images.set(name, image); image.onload = () => resolve(); image.onerror = () => resolve(); image.src = `/assets/street/${name}.png`;
    }))).then(() => { this.assetsReady = true; });
  }

  snapshot() { return {floor:this.floor,later:this.later,x:this.x,direction:this.direction,searchedBins:[...this.searchedBins],shopsOpen:this.shopsOpen}; }
  restore(s:ReturnType<StreetWorld['snapshot']>) {
    if(!s||!FLOORS[s.floor]||!Number.isFinite(s.x)||!Array.isArray(s.searchedBins))return false;
    this.floor=s.floor;this.later=!!s.later;this.x=clamp(s.x,FLOORS[s.floor].minX,FLOORS[s.floor].maxX);
    this.direction=s.direction==='left'?'left':'right';this.searchedBins=new Set(s.searchedBins);this.shopsOpen=!!s.shopsOpen;
    this.cameraX=clamp(this.x-960,0,FLOORS[this.floor].width-1920);this.walkingTarget=null;this.actionAtDestination=null;this.moving=false;
    this.pendingAction=null;this.searchRemaining=0;this.bubbleRemaining=0;this.activeBin=null;return true;
  }

  /** Calling code can match closed-shop red lights observed at the end of day 6. */
  setShopsOpen(open: boolean) { this.shopsOpen = open;this.contexts.morning=open;this.contexts.evening=!open; }
  setContexts(contexts:Contexts){this.contexts={...contexts};}
  setLateScene(later: boolean) { this.later = later; }

  enter(screen: string) {
    const previousFloor = this.floor;
    if (screen.startsWith('street-b2')) { this.floor = 'b2'; this.x = screen.endsWith('-east')?3390:1134; }
    else if(screen.startsWith('street-b3')) {this.floor='b3';this.x=screen.endsWith('-east')?3390:1134;}
    else if (screen.startsWith('public-square')) { this.floor = 'public'; this.later = this.later || screen.includes('later'); this.x = this.later ? 1894 : previousFloor === 'b1' ? 3084 : 1950; }
    else {
      this.floor = 'b1';
      this.x = screen === 'street-west' ? 1134 : screen === 'street-east' ? 3390 : 2269;
    }
    this.cameraX = clamp(this.x - 960, 0, FLOORS[this.floor].width - 1920);
    this.walkingTarget = null; this.actionAtDestination = null; this.moving = false; this.pendingAction = null;
    this.searchRemaining = 0; this.bubbleRemaining = 0; this.activeBin = null;
    this.fade = previousFloor === this.floor ? 0 : 0.25;
  }

  /** dt is seconds; keyboard input has priority over a click-to-walk destination. */
  update(dt: number, keys: StreetKeys = new Set()) {
    const seconds = clamp(dt, 0, 0.1); this.fade = Math.max(0, this.fade - seconds);
    if (this.bubbleRemaining > 0) this.bubbleRemaining = Math.max(0, this.bubbleRemaining - seconds);
    if (this.searchRemaining > 0) {
      this.searchRemaining = Math.max(0, this.searchRemaining - seconds); this.moving = false;
      if (this.searchRemaining === 0 && this.activeBin) { this.searchedBins.add(this.activeBin); this.pendingAction = 'cash:13'; this.bubbleRemaining = 1.5; }
      return;
    }
    const left = pressed(keys, 'ArrowLeft', 'a', 'A', 'KeyA');
    const right = pressed(keys, 'ArrowRight', 'd', 'D', 'KeyD');
    let axis = Number(right) - Number(left);
    if (left || right) { this.walkingTarget = null; this.actionAtDestination = null; }
    else if (this.walkingTarget !== null) {
      const distance = this.walkingTarget - this.x;
      if (Math.abs(distance) <= this.speed * seconds) {
        this.x = this.walkingTarget; this.walkingTarget = null;
        if (this.actionAtDestination) { this.activate(this.actionAtDestination); this.actionAtDestination = null; }
      } else axis = Math.sign(distance);
    }
    const before = this.x;
    this.x = clamp(this.x + axis * this.speed * seconds, FLOORS[this.floor].minX, FLOORS[this.floor].maxX);
    this.moving = before !== this.x;
    if (this.moving) { this.direction = axis < 0 ? 'left' : 'right'; this.animation += seconds; }
    else this.animation = 0;
    this.cameraX = clamp(this.x - 960, 0, FLOORS[this.floor].width - 1920);
  }

  private nearby(): StreetTarget | undefined {
    return FLOORS[this.floor].targets.filter(t => !(this.later && t.id === 'public-protest')).filter(t => Math.abs(t.x - this.x) <= t.radius && !this.searchedBins.has(t.id)).sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0];
  }
  private actionFor(t: StreetTarget) {
    const action=t.id==='gem'&&Number(this.contexts.day??1)>=21?'nav:store:CityChat':t.action;
    if(action.startsWith('nav:store:')){const storeId=action.slice('nav:store:'.length);return nativeStreetStoreOpen(storeId,this.contexts)?action:`street:notice:${storeId}`;}
    return action;
  }
  private activate(t: StreetTarget) {
    if (this.searchRemaining > 0 || this.searchedBins.has(t.id)) return;
    if (t.id === 'b2-bin-left') { this.activeBin = t.id; this.searchRemaining = 3.1; this.walkingTarget = null; return; }
    this.pendingAction = this.actionFor(t);
  }
  /** E key. If a timed search/click has completed, its queued action is returned first. */
  interact(): string | null {
    if (this.pendingAction) return this.takeAction();
    const current = this.nearby(); if (current) this.activate(current);
    return this.takeAction();
  }
  /** Call once each update to dispatch click-walk arrival and timed cash events. */
  takeAction(): string | null { const action = this.pendingAction; this.pendingAction = null; return action; }

  click(x: number, y: number): string | null {
    if (y < 90 || y > 990 || this.searchRemaining > 0) return null;
    if (x >= 1881 && y >= 455 && y <= 605) return 'inventory:toggle';
    const worldX = x + this.cameraX;
    const hit = FLOORS[this.floor].targets.filter(t => !(this.later && t.id === 'public-protest')).find(t => Math.abs(worldX - t.x) < 90 && (t.prompt === 'scavenge' ? y > 600 && y < 718 : y > 320 && y < 590));
    if (hit && Math.abs(this.x - hit.x) <= hit.radius) { this.activate(hit); return this.takeAction(); }
    this.walkingTarget = clamp(hit?.x ?? worldX, FLOORS[this.floor].minX, FLOORS[this.floor].maxX);
    this.actionAtDestination = hit ?? null;
    return null;
  }

  render(ctx: CanvasRenderingContext2D,options:{nativeView?:NativeStreetView;contexts?:Contexts;drawPrompt?:(text:string,x:number,y:number)=>void}={}) {
    if(options.contexts)this.setContexts(options.contexts);
    const native=options.nativeView?.isReady&&this.floor!=='public'?options.nativeView:null;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 90, 1920, 900); ctx.clip(); ctx.imageSmoothingEnabled = false;
    const camera = Math.round(this.cameraX);
    const cameraY = this.floor === 'public' ? Math.round(28 * clamp((Math.abs(this.x - 1950) - 230) / 600, 0, 1)) : 0;
    const sceneY = this.floor === 'public' ? 82 - cameraY : 90;
    const draw = (name: string, x: number, y: number) => { const image = this.images.get(name); if (image?.complete && image.naturalWidth > 0) ctx.drawImage(image, Math.round(x), Math.round(y)); };
    const backdrop = this.floor === 'public' && this.later ? 'public-late' : this.floor;
    if(native&&this.floor!=='public')native.renderStreet(ctx,{floor:this.floor,cameraX:camera,contexts:this.contexts,pass:'background'});else draw(`${backdrop}-panorama`, -camera, sceneY);
    if (!native&&this.floor === 'b1' && this.shopsOpen) for (const x of [1584, 2269, 2949]) { draw('door-open-lamp', x - camera - 35, 313); draw('door-open-sign', x - camera - 24, 449); }
    const publicFrames = this.direction === 'right' ? [1, 2, 5] : [3, 4, 5];
    let sprite = `${this.floor === 'public' ? 'public-' : ''}bob-${this.direction}-${this.moving ? this.floor === 'public' ? publicFrames[Math.floor(this.animation * 10) % 3] : Math.floor(this.animation * 10) % 6 : 'idle'}`;
    if (!this.images.get(sprite)?.naturalWidth) sprite = `bob-${this.direction}-2`;
    draw(sprite, this.x - camera - 130, 400);
    if(native&&this.floor!=='public')native.renderStreet(ctx,{floor:this.floor,cameraX:camera,contexts:this.contexts,pass:'foreground'});else draw(`${backdrop}-foreground`, -camera, sceneY);
    if (this.searchRemaining > 0) draw('bubble-searching', this.x - camera - 42, 291);
    else if (this.bubbleRemaining > 0) draw('bubble-cash13', this.x - camera - 57, 291);
    else {
      const current = this.nearby();
      if (current) {
        const action=this.actionFor(current),isStore=current.action.startsWith('nav:store:'),closed=action.startsWith('street:notice:');
        const changedStore=current.id==='gem'&&action.endsWith(':CityChat');
        const dynamic=native&&isStore&&(!['scented','gem'].includes(current.id)||changedStore);
        const prompt=current.id==='darcy'?'darcy':isStore&&!closed&&!changedStore&&['scented','gem'].includes(current.id)?current.id:current.prompt;
        if(dynamic){const storeId=action.split(':').at(-1)!;const label=closed?'E  Read notice':`E  Move to ${NATIVE_STREET_STORE_LABELS[storeId]??storeId}`;if(options.drawPrompt)options.drawPrompt(label,this.x-camera,360);else {ctx.fillStyle='#ddd5a4';ctx.font='24px monospace';ctx.textAlign='center';ctx.fillText(label,this.x-camera,385);ctx.textAlign='left';}}
        else {const name=`prompt-${prompt}`,image=this.images.get(name);if(image)draw(name,clamp(this.x-camera-70,10,1910-image.naturalWidth),360);}
      }
    }
    if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade / .25})`; ctx.fillRect(0, 90, 1920, 900); }
    ctx.restore();
  }

  state(): StreetWorldState {
    const current = this.nearby();
    return { floor: this.floor, later: this.later, x: Math.round(this.x), cameraX: Math.round(this.cameraX), cameraY: this.floor === 'public' ? Math.round(28 * clamp((Math.abs(this.x - 1950) - 230) / 600, 0, 1)) : 0, direction: this.direction, moving: this.moving,
      walkingTarget: this.walkingTarget, nearby: current ? { id: current.id, label: current.id==='gem'&&Number(this.contexts.day??1)>=21?'CITY CHAT':current.label, action: this.actionFor(current), screenX: Math.round(current.x - this.cameraX) } : null,
      scavenging: this.searchRemaining > 0, searchedBins: [...this.searchedBins], pendingAction: this.pendingAction, shopsOpen: this.shopsOpen, ready: this.assetsReady };
  }
}
