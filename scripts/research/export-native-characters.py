"""Source-addressed character parts, animation sprite keys, rig and 54 appearances."""
import collections,hashlib,json,math,re,struct,base64
from PIL import Image
from pathlib import Path
import UnityPy
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'reference/original-study/windows-1.0.5-demo';SOURCE=ROOT/'原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data'
idx={i['id']:i for i in json.loads((BASE/'final-index.json').read_text())};files=json.loads((BASE/'serialized-files.json').read_text())
def data(oid):return json.loads((BASE/idx[oid]['json']).read_text())['data']
def rid(asset,p):
 if not p or not p['m_PathID']:return None
 return f"{files[asset]['externals'][p['m_FileID']-1].split('/')[-1] if p['m_FileID'] else asset}:{p['m_PathID']}"
def first(cls):return next(i for i in idx.values() if i.get('class')==cls)
paths=[next(SOURCE.rglob('characterparts*.bundle')),SOURCE/'level2',SOURCE/'sharedassets2.assets',SOURCE/'sharedassets0.assets',SOURCE/'resources.assets']+list(SOURCE.glob('*.resS'))
env=UnityPy.load(*map(str,paths));objs={f'{Path(o.assets_file.name).name}:{o.path_id}':o for o in env.objects};sprites={};parts={};errors=[];clip_count=0
out=ROOT/'public/assets/native-characters';out.mkdir(parents=True,exist_ok=True)
def sprite(oid):
 if not oid:return None
 if oid in sprites:return oid
 d=objs[oid].read();crop=d.image.convert('RGBA');im=Image.new('RGBA',(round(d.m_Rect.width),round(d.m_Rect.height)));offset=d.m_RD.textureRectOffset;im.paste(crop,(round(offset.x),im.height-round(offset.y)-crop.height));key=hashlib.sha256(oid.encode()).hexdigest()[:12];target=out/(key+'.png');im.save(target)
 tex=d.m_RD.texture.deref_parse_as_object()
 sprites[oid]={'sourceId':oid,'asset':'/assets/native-characters/'+key+'.png','name':d.m_Name,'width':im.width,'height':im.height,'pivot':[d.m_Pivot.x,d.m_Pivot.y],'pixelsPerUnit':d.m_PixelsToUnits,'textureSize':[tex.m_Width,tex.m_Height]}
 return oid
def clip_keys(d,asset):
 maps=[rid(asset,p) for p in d['m_ClipBindingConstant']['pptrCurveMapping']];raw=d['m_MuscleClip']['m_Clip']['data'];keys=[]
 buf=raw['m_StreamedClip']['data'];pos=0
 def f(v):return struct.unpack('<f',struct.pack('<I',v))[0]
 while pos<len(buf):
  time=f(buf[pos]);count=buf[pos+1];pos+=2
  for _ in range(count):
   curve=buf[pos];value=f(buf[pos+4]);pos+=5
   if curve==0 and math.isfinite(time) and math.isfinite(value) and int(value)<len(maps):keys.append([max(0,time),sprite(maps[int(value)])])
 if not keys and maps:keys=[[0,sprite(maps[0])]]
 return keys
# Addressables container gives the authoritative type/id path, no name guessing.
for path,ptr in env.container.items():
 m=re.match(r'Assets/Sprites/StoreCharacter/([^/]+)/([^/]+)/(.+)',path,re.I)
 if not m:continue
 typ,pid,name=m.groups();key=typ.lower()+'/'+pid;part=parts.setdefault(key,{'id':pid,'type':typ.lower(),'clips':{},'sprite':None});o=ptr.deref();oid=f'{Path(o.assets_file.name).name}:{o.path_id}'
 try:
  if o.type.name=='AnimationClip':
   d=o.read_typetree();name=d['m_Name'].upper();part['clips'][name]={'sourceId':oid,'duration':d['m_MuscleClip']['m_StopTime'],'sampleRate':d['m_SampleRate'],'loop':d['m_MuscleClip']['m_LoopTime'],'keys':clip_keys(d,Path(o.assets_file.name).name)};clip_count+=1
  elif o.type.name=='Sprite' and part['sprite'] is None:part['sprite']=sprite(oid)
 except Exception as e:errors.append({'path':path,'error':str(e)})
# Select exact sprite references through the original catalog GUID bucket, not directory order.
catalog=json.loads((SOURCE/'StreamingAssets/aa/catalog.json').read_text());bucket=base64.b64decode(catalog['m_BucketDataString']);keydata=base64.b64decode(catalog['m_KeyDataString']);entry=base64.b64decode(catalog['m_EntryDataString']);u32=lambda d,i:struct.unpack_from('<i',d,i)[0];cursor=4;locations={}
for _ in range(u32(bucket,0)):
 off,count=u32(bucket,cursor),u32(bucket,cursor+4);cursor+=8;entries=[u32(bucket,cursor+j*4) for j in range(count)];cursor+=4*count
 if keydata[off] not in [0,1]:continue
 length=u32(keydata,off+1);key=keydata[off+5:off+5+length].decode('ascii' if keydata[off]==0 else 'utf-16-le');locations[key]=[catalog['m_InternalIds'][u32(entry,4+n*28)] for n in entries]
for i in idx.values():
 if i.get('class')!='CharacterPartAssetsData':continue
 d=data(i['id']);key=d['partName'].lower()+'/'+d['ID'];part=parts.get(key)
 if not part:continue
 part['sourceId']=i['id'];part['sprite']=None
 for ref in d['sprites'][:1]:
  for path in locations.get(ref['m_AssetGUID'],[]):
   if path in env.container:
    o=env.container[path].deref()
    if o.type.name=='Sprite':part['sprite']=sprite(f'{Path(o.assets_file.name).name}:{o.path_id}');break
# Rig uses the original scene object parent/scale/order; no image-space arrangement guesses.
manager=data('resources.assets:25714');rig=[]
for role in ['backhair','body','cloth','head','others','othersTint','eyeL','eyeR','eyeTintL','eyeTintR','nose','noseTint','mouth','mouthTint','eyebrowL','eyebrowR','eyebrowLTint','eyebrowRTint','hair','special']:
 cid=rid('resources.assets',manager[role]);cd=data(cid);goid=rid('resources.assets',cd['m_GameObject']);go=data(goid);comps=[rid('resources.assets',x['component']) for x in go['m_Component']]
 tid=next(x for x in comps if idx[x]['type']=='Transform');td=data(tid);srid=next(x for x in comps if idx[x]['type']=='SpriteRenderer');sr=objs[srid].read_typetree()
 rig.append({'role':role,'type':['backhair','body','cloth','head','others','eye','eyetint','nose','nosetint','mouth','mouthtint','eyebrow','hair','eyebrowtint','special','otherstint'][cd['type']],'transformId':tid,'parentId':rid('resources.assets',td['m_Father']),'position':[td['m_LocalPosition']['x'],td['m_LocalPosition']['y']],'scale':[td['m_LocalScale']['x'],td['m_LocalScale']['y']],'order':sr['m_SortingOrder'],'flipX':bool(sr['m_FlipX']),'flipY':bool(sr['m_FlipY']),'color':sr['m_Color'],'materialIds':[rid('resources.assets',p) for p in sr['m_Materials']]})
anchors={}
for role in ['bodyAnchor','headAnchor']:
 tid=rid('resources.assets',manager[role]);td=data(tid);anchors[role]={'id':tid,'parentId':rid('resources.assets',td['m_Father']),'position':[td['m_LocalPosition']['x'],td['m_LocalPosition']['y']],'scale':[td['m_LocalScale']['x'],td['m_LocalScale']['y']]}
# Include intermediary ancestors so relative offset composition is exact.
transforms={};queue=[r['transformId'] for r in rig]+[v['id'] for v in anchors.values()]
while queue:
 tid=queue.pop()
 if not tid or tid in transforms:continue
 td=data(tid);parent=rid('resources.assets',td['m_Father']);transforms[tid]={'parentId':parent,'position':[td['m_LocalPosition']['x'],td['m_LocalPosition']['y']],'scale':[td['m_LocalScale']['x'],td['m_LocalScale']['y']]}
 if parent:queue.append(parent)
characters={}
for i in idx.values():
 if i.get('class')!='Character':continue
 d=data(i['id']);characters[d['ID']]={'id':d['ID'],'sourceId':i['id'],'sex':d['Sex'],'age':d['Age'],'appearances':d['Appearance']}
offsetdata=data(first('CharacterPartOffsetDataStoratge')['id']);offsets={d['HeadID']:{k:[v['x'],v['y']] for k,v in d.items() if k!='HeadID'} for d in offsetdata['offsetData']}
partdata=data(first('CharacterPartDataStorage')['id'])
result={'characters':characters,'parts':parts,'sprites':sprites,'rig':rig,'anchors':anchors,'transforms':transforms,'offsets':offsets,'partEligibility':partdata['characterPartData'],'longHairIds':partdata['LongHairIDs']}
report={'characters':len(characters),'parts':len(parts),'clips':clip_count,'sprites':len(sprites),'errors':errors}
folder=ROOT/'artifacts/native-characters';folder.mkdir(exist_ok=True,parents=True);(folder/'source-data.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')));(folder/'export-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
(ROOT/'src/native-character-data.ts').write_text('/** Generated from original Windows 1.0.5 characterparts bundle and scene rig. */\nimport type {NativeCharacterData} from "./native-characters";\nexport const NATIVE_CHARACTER_DATA:NativeCharacterData = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
