"""Export the six supplied flower scene props without editing source files."""
from pathlib import Path
import json,hashlib
from PIL import Image
import UnityPy
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'reference/original-study/windows-1.0.5-demo';SOURCE=ROOT/'原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data'
idx={i['id']:i for i in json.loads((BASE/'final-index.json').read_text())};files=json.loads((BASE/'serialized-files.json').read_text())
def data(i):return json.loads((BASE/idx[i]['json']).read_text())['data']
def rid(a,p):return None if not p or not p['m_PathID'] else f"{files[a]['externals'][p['m_FileID']-1].split('/')[-1] if p['m_FileID'] else a}:{p['m_PathID']}"
env=UnityPy.load(*map(str,[SOURCE/'level58',SOURCE/'sharedassets58.assets',SOURCE/'sharedassets0.assets',SOURCE/'resources.assets']+list(SOURCE.glob('*.resS'))));objs={f'{Path(o.assets_file.name).name}:{o.path_id}':o for o in env.objects}
out=ROOT/'public/assets/native-flowers';out.mkdir(parents=True,exist_ok=True);catalog={};setflowers=data('level58:2271')
for i,goref in enumerate(setflowers['Flowers']):
 layers=[]
 def walk(goid,x=0,y=0,sx=1,sy=1,root=False):
  go=data(goid);a=goid.split(':')[0]
  if not root and not go['m_IsActive']:return
  comp=[rid(a,c['component']) for c in go['m_Component']];tid=next((c for c in comp if idx[c]['type'] in ['Transform','RectTransform']),None)
  if not tid:return
  t=data(tid)
  if not root:x+=t['m_LocalPosition']['x']*sx;y+=t['m_LocalPosition']['y']*sy
  sx*=t['m_LocalScale']['x'];sy*=t['m_LocalScale']['y']
  for c in comp:
   if idx[c]['type']!='SpriteRenderer':continue
   d=objs[c].read_typetree();oid=rid(a,d['m_Sprite'])
   if not oid or not d['m_Enabled']:continue
   sprite=objs[oid].read();crop=sprite.image.convert('RGBA');im=Image.new('RGBA',(round(sprite.m_Rect.width),round(sprite.m_Rect.height)));off=sprite.m_RD.textureRectOffset;im.paste(crop,(round(off.x),im.height-round(off.y)-crop.height));px=sprite.m_Pivot.x;py=sprite.m_Pivot.y;w=im.width/sprite.m_PixelsToUnits*abs(sx);h=im.height/sprite.m_PixelsToUnits*abs(sy)
   layers.append((d['m_SortingOrder'],im,x-w*px,y+h*(1-py),w,h,oid))
  for child in t['m_Children']:
   ct=rid(a,child);walk(rid(a,data(ct)['m_GameObject']),x,y,sx,sy)
 walk(rid('level58',goref),root=True)
 if not layers:continue
 left=min(l[2] for l in layers);right=max(l[2]+l[4] for l in layers);top=max(l[3] for l in layers);bottom=min(l[3]-l[5] for l in layers);scale=100
 im=Image.new('RGBA',(max(1,round((right-left)*scale)),max(1,round((top-bottom)*scale))))
 for _,sprite,x,y,w,h,oid in sorted(layers,key=lambda l:l[0]):
  resized=sprite.resize((max(1,round(w*scale)),max(1,round(h*scale))),Image.Resampling.NEAREST);im.alpha_composite(resized,(round((x-left)*scale),round((top-y)*scale)))
 filename=f'{i+1}.png';im.save(out/filename);catalog[i+1]={'asset':'/assets/native-flowers/'+filename,'size':list(im.size),'sources':[l[-1] for l in layers]}
(ROOT/'src/native-flower-data.ts').write_text('/** Six original flower props, composed from level58 SpriteRenderers. */\nexport const NATIVE_FLOWER_SPRITES:Record<number,{asset:string;size:number[];sources:string[]}>= '+json.dumps(catalog,separators=(',',':'))+';\n')
print(json.dumps({k:{'size':v['size'],'sprites':len(v['sources'])} for k,v in catalog.items()}))
