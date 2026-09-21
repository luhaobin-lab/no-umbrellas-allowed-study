"""Export precisely referenced source sprites and TMP atlas pixels; never modify game files."""
import hashlib,json
from pathlib import Path
import UnityPy
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data'
request=json.loads((ROOT/'artifacts/native-data/asset-requests.json').read_text())
paths=[SOURCE/n for n in ['resources.assets','sharedassets0.assets','sharedassets9.assets']]+list(SOURCE.rglob('*.bundle'))+list(SOURCE.glob('*.resS'))
env=UnityPy.load(*map(str,paths))
objects={f'{Path(o.assets_file.name).name}:{o.path_id}':o for o in env.objects}
exports={};errors=[]
for r in request['sprites']:
 try:
  o=objects[r['sourceId']];d=o.read();im=d.image.convert('RGBA')
  if o.type.name=='Sprite':
   crop=im;im=Image.new('RGBA',(round(d.m_Rect.width),round(d.m_Rect.height)));offset=d.m_RD.textureRectOffset;im.paste(crop,(round(offset.x),im.height-round(offset.y)-crop.height))
  out=ROOT/'public'/r['asset'].lstrip('/');out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
  m={**r,'width':im.width,'height':im.height,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
  if o.type.name=='Sprite':m.update(border=[d.m_Border.x,d.m_Border.y,d.m_Border.z,d.m_Border.w],pivot=[d.m_Pivot.x,d.m_Pivot.y],pixelsPerUnit=d.m_PixelsToUnits)
  else:
   m['textureFormat']=int(d.m_TextureFormat)
   # Unity's TMP distance texture stores signed coverage in alpha; preserve raw plus a binary contour image.
   alpha=im.getchannel('A');alpha=alpha.point(lambda v:255 if v>=128 else 0)
   contour=Image.new('RGBA',im.size,(255,255,255,0));contour.putalpha(alpha)
   target=out.with_name(out.stem+'-alpha.png');contour.save(target);m['alphaAsset']=r['asset'].replace('.png','-alpha.png');m['alphaConversion']={'channel':'A','threshold':128,'method':'hard contour; runtime SDF shader should use raw atlas for smoothing'}
  exports[r['sourceId']]=m
 except Exception as e:errors.append({'sourceId':r['sourceId'],'error':str(e)})
materials={}
for oid in request['fontMaterialIds']:
 try:
  materials[oid]=objects[oid].read_typetree()
 except Exception as e:errors.append({'sourceId':oid,'error':str(e)})
# Font assets carry their own material, so include those as well as per-text material overrides.
idx={i['id']:i for i in json.loads((ROOT/'reference/original-study/windows-1.0.5-demo/final-index.json').read_text())}
files=json.loads((ROOT/'reference/original-study/windows-1.0.5-demo/serialized-files.json').read_text())
fontMaterials={}
for fid in request['fontIds']:
 d=json.loads((ROOT/'reference/original-study/windows-1.0.5-demo'/idx[fid]['json']).read_text())['data'];p=d.get('material',d.get('m_Material'))
 if not p or not p['m_PathID']:continue
 asset=fid.split(':')[0];asset=files[asset]['externals'][p['m_FileID']-1].split('/')[-1] if p['m_FileID'] else asset
 oid=f'{asset}:{p["m_PathID"]}';fontMaterials[fid]=oid
 if oid not in materials:
  try:materials[oid]=objects[oid].read_typetree()
  except Exception as e:errors.append({'sourceId':oid,'error':str(e)})
(ROOT/'artifacts/native-data/exported-assets.json').write_text(json.dumps({'assets':exports,'materials':materials,'fontMaterials':fontMaterials,'components':{oid:o.read_typetree() for oid,o in objects.items() if o.type.name in ['Canvas','CanvasGroup']},'errors':errors},ensure_ascii=False,indent=2))
print(json.dumps({'exported':len(exports),'materials':len(materials),'errors':errors},ensure_ascii=False))
