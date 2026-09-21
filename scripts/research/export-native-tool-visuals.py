"""Exact selected tool render hierarchy and animation constants from supplied 1.0.5."""
import json,math,hashlib
from pathlib import Path
import UnityPy
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'reference/original-study/windows-1.0.5-demo';SOURCE=ROOT/'原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data'
idx={r['id']:r for r in json.loads((BASE/'final-index.json').read_text())};files=json.loads((BASE/'serialized-files.json').read_text());env=UnityPy.load(*map(str,[SOURCE/'level9',SOURCE/'resources.assets',SOURCE/'sharedassets0.assets',SOURCE/'sharedassets9.assets']+list(SOURCE.glob('*.resS'))));objs={f'{Path(o.assets_file.name).name}:{o.path_id}':o for o in env.objects};exported=json.loads((ROOT/'artifacts/native-data/exported-assets.json').read_text())['assets'];new_exports={}
def ref(a,p):return f"{files[a]['externals'][p['m_FileID']-1].split('/')[-1] if p['m_FileID'] else a}:{p['m_PathID']}" if p and p.get('m_PathID') else None
def data(id):
 r=idx[id];return json.loads((BASE/r['json']).read_text())['data'] if r.get('json') else objs[id].read_typetree()
def trans(go):return next(ref(go.split(':')[0],c['component']) for c in data(go)['m_Component'] if idx[ref(go.split(':')[0],c['component'])]['type'] in ['Transform','RectTransform'])
def sprite(id):
 if not id:return None
 if id in exported:e=exported[id];return {k:e[k] for k in ['sourceId','asset','name','width','height','pivot','pixelsPerUnit']}
 if id in new_exports:return new_exports[id]
 d=objs[id].read();crop=d.image.convert('RGBA');im=Image.new('RGBA',(round(d.m_Rect.width),round(d.m_Rect.height)));off=d.m_RD.textureRectOffset;im.paste(crop,(round(off.x),im.height-round(off.y)-crop.height));name=hashlib.sha256(id.encode()).hexdigest()[:12];asset=f'/assets/native-tools/{name}.png';im.save(ROOT/'public'/asset.lstrip('/'));v={'sourceId':id,'asset':asset,'name':d.m_Name,'width':im.width,'height':im.height,'pivot':[d.m_Pivot.x,d.m_Pivot.y],'pixelsPerUnit':d.m_PixelsToUnits};new_exports[id]=v;return v

def hierarchy(goid):
 nodes=[]
 def walk(go,parent=None,position=(0,0),scale=(1,1)):
  a=go.split(':')[0];g=data(go);tid=trans(go);t=data(tid);lp=[t['m_LocalPosition'][k] for k in ['x','y']];ls=[t['m_LocalScale'][k] for k in ['x','y']];rot=math.degrees(2*math.atan2(t['m_LocalRotation']['z'],t['m_LocalRotation']['w']))
  # Tool root follows mouse in world space; strip only its stored shelf location.
  wp=[0,0] if parent is None else [position[n]+lp[n]*scale[n] for n in range(2)];ws=[scale[n]*ls[n] for n in range(2)]
  n={'id':go,'transformId':tid,'name':g['m_Name'],'parentId':parent,'active':bool(g['m_IsActive']),'localPosition':lp,'localScale':ls,'localRotation':rot,'position':wp,'scale':ws}
  for c in g['m_Component']:
   cid=ref(a,c['component']);typ=idx[cid]['type']
   if typ in ['SpriteRenderer','SpriteMask']:
    d=data(cid)
    if typ=='SpriteRenderer':n['renderer']={'sourceId':cid,'enabled':bool(d['m_Enabled']),'sprite':sprite(ref(a,d['m_Sprite'])),'sortingOrder':d['m_SortingOrder'],'maskInteraction':d['m_MaskInteraction'],'color':d['m_Color'],'flipX':bool(d['m_FlipX']),'flipY':bool(d['m_FlipY'])}
    else:n['mask']={'sourceId':cid,'sprite':sprite(ref(a,d['m_Sprite'])),'alphaCutoff':d.get('m_AlphaCutoff',.5),'frontSortingOrder':d.get('m_FrontSortingOrder'),'backSortingOrder':d.get('m_BackSortingOrder'),'isCustomRangeActive':d.get('m_IsCustomRangeActive')}
  nodes.append(n)
  for p in t['m_Children']:
   tr=ref(a,p);walk(ref(tr.split(':')[0],data(tr)['m_GameObject']),go,wp,ws)
 walk(goid);return nodes
result={'camera':{'sourceId':'level9:2426','referenceWidth':1920,'referenceHeight':1080,'targetCameraHalfWidth':data('level9:2426')['targetCameraHalfWidth'],'targetCameraHalfHeight':data('level9:2426')['targetCameraHalfHeight'],'pixelsPerWorldUnit':300,'assetsPixelsPerUnit':100,'sourcePixelsToCanvas':3},'damage':{'sourceId':'level9:2966','rootId':'level9:67','bodyId':'level9:680','needleAnchorId':'level9:616','needleId':'level9:445','nodes':hierarchy('level9:67'),'needleRange':[52.70000076293945,-52.70000076293945],'idleSeconds':.7,'idleEase':'linear','idleLoop':'pingPong','settleSeconds':.5,'settleEase':'easeOutBounce'},'gem':{'sourceId':'level9:2452','rootId':'level9:76','bodyId':'level9:82','ticketId':'level9:152','ticketAnchorId':'level9:217','nodes':hierarchy('level9:76'),'ticketStartLocal':[0,0],'ticketEndLocal':[0,-.12],'printSeconds':.75,'fadeSeconds':.25,'printEase':'easeOutExpo','fadeEase':'easeOutExpo'}}
text='/** Generated from Windows 1.0.5 level9 tool hierarchy; coords are Unity y-up world units. */\nimport type {NativeSprite} from "./native-types";\nexport interface NativeToolVisualNode {id:string;transformId:string;name:string;parentId:string|null;active:boolean;localPosition:number[];localScale:number[];localRotation:number;position:number[];scale:number[];renderer?:{sourceId:string;enabled:boolean;sprite:NativeSprite|null;sortingOrder:number;maskInteraction:number;color:Record<string,number>;flipX:boolean;flipY:boolean};mask?:{sourceId:string;sprite:NativeSprite|null;alphaCutoff:number;frontSortingOrder:number|null;backSortingOrder:number|null;isCustomRangeActive:boolean|null}}\n'
text+='export const NATIVE_TOOL_VISUALS: {camera:{sourceId:string;referenceWidth:number;referenceHeight:number;targetCameraHalfWidth:number;targetCameraHalfHeight:number;pixelsPerWorldUnit:number;assetsPixelsPerUnit:number;sourcePixelsToCanvas:number};damage:{sourceId:string;rootId:string;bodyId:string;needleAnchorId:string;needleId:string;nodes:NativeToolVisualNode[];needleRange:number[];idleSeconds:number;idleEase:string;idleLoop:string;settleSeconds:number;settleEase:string};gem:{sourceId:string;rootId:string;bodyId:string;ticketId:string;ticketAnchorId:string;nodes:NativeToolVisualNode[];ticketStartLocal:number[];ticketEndLocal:number[];printSeconds:number;fadeSeconds:number;printEase:string;fadeEase:string}} = '+json.dumps(result,separators=(',',':'))+';\n'
text+='''/** Original iTween firstpass easing, t normalized to [0,1]. */
export function nativeToolOutBounce(t:number):number { t=Math.max(0,Math.min(1,t));if(t<.36363637)return 7.5625*t*t;if(t<.72727275){t-=.54545456;return 7.5625*t*t+.75;}if(t<.9090909090909091){t-=.8181818;return 7.5625*t*t+.9375;}t-=21/22;return 7.5625*t*t+.984375;}
export function nativeToolOutExpo(t:number):number { return 1-Math.pow(2,-10*Math.max(0,Math.min(1,t))); }
'''
(ROOT/'src/native-tool-visual-data.ts').write_text(text);(ROOT/'artifacts/native-tools-browser/source-tool-visuals.json').write_text(json.dumps(result,indent=2));print(json.dumps({'nodes':{k:len(result[k]['nodes']) for k in ['damage','gem']},'newSprites':new_exports},ensure_ascii=False))
