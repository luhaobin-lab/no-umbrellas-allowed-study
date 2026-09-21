"""Generate compact Windows 1.0.5 runtime facts and Unity manual layout contracts.
Requires the independently validated original-study extraction. Sprite pixel export is separate.
"""
import collections, functools, hashlib, json, re, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'reference/original-study/windows-1.0.5-demo'
OUT=ROOT/'src'
def read(path):return json.loads(path.read_text())
study=read(ROOT/'docs/original-study/item-tool-catalog.json')['versions']['windows-1.0.5-demo']
old=read(ROOT/'docs/research/official-item-catalog.json')
index={x['id']:x for x in read(BASE/'final-index.json')}
files=read(BASE/'serialized-files.json')
requested={}
export_path=ROOT/'artifacts/native-data/exported-assets.json'
exported=read(export_path) if export_path.exists() else {'assets':{},'materials':{},'fontMaterials':{}}
def rid(asset,ptr):
 if not ptr or not ptr.get('m_PathID'):return None
 f=ptr.get('m_FileID',0)
 if f:asset=files[asset]['externals'][f-1].split('/')[-1]
 return f'{asset}:{ptr["m_PathID"]}'
@functools.lru_cache(maxsize=None)
def obj(oid):
 d=index.get(oid,{})
 return read(BASE/d['json']) if d.get('json') else {'_source':d,'data':exported['components'][oid]} if oid in exported.get('components',{}) else None
def sprite(oid,folder):
 if not oid:return None
 source=index.get(oid)
 if not source:return None
 typ=source['type']
 if typ not in ['Sprite','Texture2D']:return None
 name=source.get('name','');key=hashlib.sha256(oid.encode()).hexdigest()[:12]
 request=requested.setdefault(oid,{'sourceId':oid,'asset':f'/assets/{folder}/{key}.png','name':name,'type':typ})
 size=source.get('rect',{});width=size.get('width',source.get('width',0));height=size.get('height',source.get('height',0))
 result={'sourceId':oid,'asset':request['asset'],'name':name,'width':width,'height':height}
 for key in ['width','height','border','pivot','pixelsPerUnit']:
  if key in exported['assets'].get(oid,{}):result[key]=exported['assets'][oid][key]
 return result
sprites_by_name=collections.defaultdict(list)
for i in index.values():
 if i['type']=='Sprite':sprites_by_name[i.get('name','')].append(i)
resource_map={path.lower():rid('globalgamemanagers',ptr) for path,ptr in read(BASE/'objects/ResourceManager/globalgamemanagers--13.json')['data']['m_Container']}
def item_sprite(name):
 return sprite(resource_map.get('sprites/item/'+name.lower()),'native-items')
cards={};aliases={}
for c in study['cards']:
 raw=c['raw'];effect=c['serializedEffectAffine'];probe=c['serializedCardEffect'];id=c['id']
 cards[id]={'id':id,'name':c['name'].get('en-US',id),'category':raw['Category'],'tier':raw['Tier'],'color':{'Gray':0,'Green':1,'Blue':2,'Red':3,'Yellow':4,'Pink':5}[probe['color']],'multiplier':effect['multiplier'],'addend':effect['addend'],'shortEffect':raw['ShortEffectText'],'effectText':c['effectText'].get('en-US',''),'collectible':bool(raw['IsCollectible']),'sourceId':c['source']['id']}
 if id in old['cards']:
  alias=old['cards'][id]['id'];previous=aliases.get(alias)
  if previous is None or cards[id]['tier']<cards[previous]['tier']:aliases[alias]=id
items={}
for i in study['items']:
 r=i['raw'];id=i['id'];s=i['source'];asset=s['asset']
 items[id]={'id':id,'name':i['name'].get('en-US',id),'content':i['content'].get('en-US',''),'year':r['YearMade'],'integrity':r['integrity'],'cardIds':i['cardIds'],'referenceCardIds':i['referenceCardIds'],'materialTint':r['materialTintColor'],'hasSignature':bool(r['HasSignature']),'deprecated':bool(r['Deprecated']),'randomEligible':i['canAppearAsRandomItem'],'randomLine':i['generatedEventItemLine'].get('en-US',''),'companionComment':i['companionComment'].get('en-US',''),'hasTier2JewelryInfo':bool(r['hasTier2JewelryInfo']),'generateRandomTier2JewelryInfo':bool(r['generateRandomTier2JewelryInfo']),'jewelryCarat':r['JewelryCaret'],'jewelryCut':r['JewelryCut'],'difficulty':i['dllObservation']['difficulty'],'sourceId':s['id']}
 for key,source in [('sprite',item_sprite(id)),('zoomSprite',item_sprite(id+'_zoom')),('hoverSprite',item_sprite(id+'_hover')),('signature',sprite(rid(asset,r['signSprite']),'native-tools')),('openSprite',sprite(rid(asset,r['OpenSprite']),'native-items'))]:
  if source:items[id][key]=source
materials={c['id']:sprite(next((x['id'] for x in sprites_by_name.get(c['id'],[]) if x['asset']=='resources.assets'),None),'native-tools') for c in study['cards'] if c['raw']['Category']=='material'}
materials={k:v for k,v in materials.items() if v}
frames={}
for name in ['item_date_main','item_material','item_material_small','item_sign_main','item_condi_back','item_sign_small','item_watch_small','item_watch','item_condi_reflect','item_condi_main','item_condi_small','item_jewel_main','item_jewel_card','item_condi_pointer','item_date_small','item_jewel_small']:
 frames[name]=sprite(next((x['id'] for x in sprites_by_name.get(name,[]) if x['asset']=='resources.assets'),None),'native-tools')
def write_ts(name,imports,values):
 text='/** Generated from the supplied Windows 1.0.5 Demo. Run scripts/generate-native-data.py. */\n'+imports+'\n'
 for var,(typ,value) in values.items():text+=f'export const {var}:{typ} = '+json.dumps(value,ensure_ascii=False,separators=(',',':'))+';\n'
 (OUT/name).write_text(text)
write_ts('native-item-data.ts',"import type {NativeCard,NativeItemDefinition,NativeSprite} from './native-types';",{'NATIVE_CARD_DATA':('Record<string,NativeCard>',cards),'NATIVE_ITEM_DATA':('Record<string,NativeItemDefinition>',items),'NATIVE_CARD_ALIASES':('Record<string,string>',aliases),'NATIVE_MATERIAL_SPRITES':('Record<string,NativeSprite>',materials),'NATIVE_TOOL_SPRITES':('Record<string,NativeSprite>',frames)})

# Typed gameplay-compatible legacy schema; source arithmetic replaces printed text inference.
legacy_cards={}
for c in study['cards']:
 raw=cards[c['id']];prev=old['cards'].get(c['id'],{});factory=c['factoryCardEffect'] or {}
 add=factory.get('at0',raw['addend']);mult=(factory.get('at100',100*raw['multiplier']+raw['addend'])-add)/100
 op='base' if raw['color']==0 and mult==1 else 'add' if mult==1 and add!=0 else 'percent' if add==0 and mult!=1 else 'none'
 value=add if op in ['base','add'] else round((mult-1)*100,10) if op=='percent' else 0
 if prev.get('operator')=='multiply' and add==0:op='multiply';value=mult
 group=prev.get('group',{'product':'type','figure':'signature','art':'artwork'}.get(raw['category'],raw['category']))
 legacy_cards[c['id']]={'nativeId':c['id'],'id':prev.get('id',c['id']),'label':raw['name'],'group':group,'category':raw['category'],'tier':raw['tier'],'operator':op,'value':value,'shortEffect':raw['shortEffect']}
legacy_items={}
for i in study['items']:
 r=i['raw'];d=items[i['id']]
 legacy_items[i['id']]={'id':i['id'],'name':d['name'],'content':d['content'],'year':d['year'],'integrity':d['integrity'],'cardIds':d['cardIds'],'referenceCardIds':d['referenceCardIds'],'hasSignature':d['hasSignature'],'signaturePathId':r['signSprite']['m_PathID'],'openSpritePathId':r['OpenSprite']['m_PathID'],'materialTint':d['materialTint'],'hasTier2JewelryInfo':d['hasTier2JewelryInfo'],'generateRandomTier2JewelryInfo':d['generateRandomTier2JewelryInfo'],'jewelryCaret':d['jewelryCarat'],'jewelryCut':d['jewelryCut']}
old_ts=(OUT/'demo-item-data.ts').read_text();header=old_ts[:old_ts.index('export const DEMO_CARDS')]
(OUT/'demo-item-data.ts').write_text(header+'export const DEMO_CARDS:Record<string,DemoCard> = '+json.dumps(legacy_cards,ensure_ascii=False,separators=(',',':'))+';\nexport const DEMO_ITEMS:Record<string,DemoItem> = '+json.dumps(legacy_items,ensure_ascii=False,separators=(',',':'))+';\nexport const DEMO_VISIT_ITEM_IDS:Record<string,string> = '+json.dumps(old['explicitVisitMap'],ensure_ascii=False,separators=(',',':'))+';\n')

# Localization is resolved once into compact English text. No dialogue tables are bundled.
tables={}
for t in read(BASE/'localization-tables.json'):
 if t['locale']!='en-US':continue
 entries={str(e['id']):e['text'] for e in t['entries']};entries.update({e['key']:e['text'] for e in t['entries'] if e['key']})
 for key in [t.get('collection'),'GUID:'+t['guid'] if t.get('guid') else None]:
  if key:tables[key]=entries
def localized(ref):
 table=ref.get('m_TableReference',{}).get('m_TableCollectionName','');key=ref.get('m_TableEntryReference',{});key=key.get('m_Key') or str(key.get('m_KeyId',''))
 return tables.get(table,{}).get(key)
def pair(v):return [v.get('x',0),v.get('y',0)]
def color(v):return '#'+''.join(f'{round(max(0,min(1,v.get(c,1)))*255):02x}' for c in ['r','g','b','a'])
def font(oid):
 d=obj(oid)
 if not d:return {'id':oid or '', 'name':index.get(oid,{}).get('name',''), 'face':{}}
 return {'id':oid,'name':d['data'].get('m_Name',''),'face':d['data'].get('m_FaceInfo',{})}
english_font='CAB-a3d758e01d010e15f1fbbe03fbb5493b:-5948796154329735216'
font_ids=set([english_font]);font_material_ids=set()
def actions(cd,asset):
 found=[]
 def walk(value,event,event_type=None):
  if isinstance(value,dict):
   event_type=value.get('eventID',event_type)
   if 'm_MethodName' in value:
    args=value.get('m_Arguments',{});found.append({'event':event,'target':rid(asset,value.get('m_Target')) or '', 'targetName':index.get(rid(asset,value.get('m_Target')),{}).get('name',''),'targetClass':index.get(rid(asset,value.get('m_Target')),{}).get('class',index.get(rid(asset,value.get('m_Target')),{}).get('type','')),'targetNodeId':rid(asset,obj(rid(asset,value.get('m_Target')))['data'].get('m_GameObject')) if obj(rid(asset,value.get('m_Target'))) else None,'eventType':event_type,'method':value['m_MethodName'],'stringValue':args.get('m_StringArgument',''),'intValue':args.get('m_IntArgument',0),'boolValue':bool(args.get('m_BoolArgument',False))})
   else:
    for k,v in value.items():walk(v,event+'.'+k,event_type)
  elif isinstance(value,list):
   for n,v in enumerate(value):walk(v,event+f'[{n}]',event_type)
 for key,value in cd.items():
  if isinstance(value,(dict,list)):walk(value,key)
 return found
def node(goid,seen=None):
 seen=set() if seen is None else seen
 if goid in seen:raise ValueError('Transform cycle '+goid)
 seen.add(goid);go=obj(goid);gd=go['data'];asset=go['_source']['asset'];comps=[]
 for ptr in gd.get('m_Component',[]):
  cid=rid(asset,ptr.get('component',ptr));comp=obj(cid)
  if comp:comps.append((index[cid].get('class',index[cid]['type']),cid,comp['data'],comp['_source']['asset']))
 transform=next((x for x in comps if x[0] in ['RectTransform','Transform']),None)
 td=transform[2] if transform else {};children=[]
 for p in td.get('m_Children',[]):
  tr=obj(rid(transform[3],p));children.append(node(rid(tr['_source']['asset'],tr['data']['m_GameObject']),seen))
 out={'id':goid,'name':gd['m_Name'],'active':bool(gd['m_IsActive']),'rect':{'anchorMin':pair(td.get('m_AnchorMin',{})),'anchorMax':pair(td.get('m_AnchorMax',{})),'pivot':pair(td.get('m_Pivot',{'x':.5,'y':.5})),'sizeDelta':pair(td.get('m_SizeDelta',{})),'anchoredPosition':pair(td.get('m_AnchoredPosition',td.get('m_LocalPosition',{}))),'scale':pair(td.get('m_LocalScale',{'x':1,'y':1})),'rotation':math.degrees(2*math.atan2(td.get('m_LocalRotation',{}).get('z',0),td.get('m_LocalRotation',{}).get('w',1)))},'children':children}
 canvas=next((c[2] for c in comps if c[0]=='Canvas'),None)
 if canvas is not None:out['canvas']={'enabled':bool(canvas.get('m_Enabled',True)),'sortingOrder':canvas.get('m_SortingOrder',0)}
 has_local_font=any(c[0]=='LocalizedFontSelector' and c[2].get('m_Enabled') for c in comps)
 ltext=next((localized(c[2]['m_StringReference']) for c in comps if c[0]=='LocalizeStringEvent' and c[2].get('m_Enabled')),None)
 for cls,cid,cd,ca in comps:
  if not cd.get('m_Enabled',True):continue
  if cls in ['Image','RawImage']:
   sp=sprite(rid(ca,cd.get('m_Sprite',cd.get('m_Texture'))),'native-manual')
   out['image']={'color':color(cd.get('m_Color',{})),'type':cd.get('m_Type',0),'preserveAspect':bool(cd.get('m_PreserveAspect')),'fillCenter':bool(cd.get('m_FillCenter',True)),'pixelsPerUnitMultiplier':cd.get('m_PixelsPerUnitMultiplier',1)}
   if sp:out['image']['sprite']=sp
  elif cls in ['TextMeshProUGUI','TextMeshPro']:
   source_font=rid(ca,cd.get('m_fontAsset'));resolved=english_font if has_local_font else source_font;font_ids.add(resolved);fi=font(resolved)
   if cd.get('m_sharedMaterial',{}).get('m_PathID'):font_material_ids.add(rid(ca,cd['m_sharedMaterial']))
   text=ltext if ltext is not None else cd.get('m_text','')
   text=text.replace('\\n','\n').replace('\\r','')
   links=[{'cardId':i,'text':re.sub('<[^>]+>','',label)} for i,label in re.findall(r'<link=["\']c:([^"\'>]+)["\']>(.*?)</link>',text,re.S)]
   out['text']={'text':text,'font':resolved or '', 'sourceFont':source_font or '', 'fontSize':cd.get('m_fontSize',30),'faceScale':fi['face'].get('m_Scale',1),'color':color(cd.get('m_fontColor',{})),'alignment':cd.get('m_textAlignment',0),'horizontalAlignment':cd.get('m_HorizontalAlignment',cd.get('m_horizontalAlignment',1)),'verticalAlignment':cd.get('m_VerticalAlignment',cd.get('m_verticalAlignment',256)),'style':cd.get('m_fontStyle',0),'wordWrap':bool(cd.get('m_enableWordWrapping',True)),'overflow':cd.get('m_overflowMode',0),'lineSpacing':cd.get('m_lineSpacing',0),'characterSpacing':cd.get('m_characterSpacing',0),'wordSpacing':cd.get('m_wordSpacing',0),'margins':[cd.get('m_margin',{}).get(x,0) for x in ['x','y','z','w']],'localizedFont':has_local_font,'links':links}
   if cd.get('m_enableAutoSizing'):out['text']['autoSize']={'min':cd.get('m_fontSizeMin',0),'max':cd.get('m_fontSizeMax',0)}
  elif cls in ['HorizontalLayoutGroup','VerticalLayoutGroup','GridLayoutGroup']:
   padding=cd['m_Padding'];out['layout']={'type':{'HorizontalLayoutGroup':'horizontal','VerticalLayoutGroup':'vertical','GridLayoutGroup':'grid'}[cls],'padding':[padding[k] for k in ['m_Left','m_Top','m_Right','m_Bottom']],'alignment':cd.get('m_ChildAlignment',0),'spacing':pair(cd['m_Spacing']) if isinstance(cd['m_Spacing'],dict) else cd['m_Spacing']}
   for prop,key in [('controlWidth','m_ChildControlWidth'),('controlHeight','m_ChildControlHeight'),('expandWidth','m_ChildForceExpandWidth'),('expandHeight','m_ChildForceExpandHeight'),('scaleWidth','m_ChildScaleWidth'),('scaleHeight','m_ChildScaleHeight'),('reverse','m_ReverseArrangement')]:
    if key in cd:out['layout'][prop]=bool(cd[key])
   if cls=='GridLayoutGroup':out['layout'].update(cellSize=pair(cd['m_CellSize']),constraint=cd['m_Constraint'],constraintCount=cd['m_ConstraintCount'],startCorner=cd['m_StartCorner'],startAxis=cd['m_StartAxis'])
  elif cls=='ContentSizeFitter':out['fitter']={'horizontal':cd['m_HorizontalFit'],'vertical':cd['m_VerticalFit']}
  elif cls=='LayoutElement':out['layoutElement']={key:cd.get(prop,False if key=='ignore' else -1) for key,prop in [('ignore','m_IgnoreLayout'),('minWidth','m_MinWidth'),('minHeight','m_MinHeight'),('preferredWidth','m_PreferredWidth'),('preferredHeight','m_PreferredHeight'),('flexibleWidth','m_FlexibleWidth'),('flexibleHeight','m_FlexibleHeight')]}
  elif cls in ['CardbookEntry','AppraisalBookEntry']:
   ref=rid(ca,cd.get('card'));out['cardId']=index.get(ref,{}).get('name') or cd.get('cardID') or cd.get('CardID')
  elif cls=='TMP_TextSelector_B':
   out['dragTextLinks']=True;colors=obj(rid(ca,cd.get('linkColors')))
   if colors:out['linkColors']=['#'+int(c['rgba']).to_bytes(4,'little').hex() for c in colors['data']['_list']]
  elif cls in ['Mask','RectMask2D']:out['mask']=True
  elif cls=='ScrollRect':
   def target_go(ptr):
    target=obj(rid(ca,ptr));return rid(target['_source']['asset'],target['data'].get('m_GameObject')) if target else ''
   out['scroll']={'horizontal':bool(cd.get('m_Horizontal')),'vertical':bool(cd.get('m_Vertical')),'contentId':target_go(cd.get('m_Content')),'viewportId':target_go(cd.get('m_Viewport')),'horizontalScrollbarId':target_go(cd.get('m_HorizontalScrollbar')),'verticalScrollbarId':target_go(cd.get('m_VerticalScrollbar')),'horizontalVisibility':cd.get('m_HorizontalScrollbarVisibility',0),'verticalVisibility':cd.get('m_VerticalScrollbarVisibility',0),'scrollSensitivity':cd.get('m_ScrollSensitivity',1)}
  elif cls in ['ExistByContext','EnableByContext']:
   out.setdefault('conditions',[]).append({'kind':cls,'predicate':cd.get('predicate',''),'useComplex':bool(cd.get('useComplexPredicate')),'complex':cd.get('complexPredicate',{}),'targets': [{'id':rid(ca,p), 'nodeId':rid(obj(rid(ca,p))['_source']['asset'],obj(rid(ca,p))['data'].get('m_GameObject')) if not key.startswith('gameObjects') else rid(ca,p), 'invert':key.endswith('Disable'),'type':key,'targetClass':index.get(rid(ca,p),{}).get('class',index.get(rid(ca,p),{}).get('type',''))} for key in ['renderersToControl','behavioursToControl','gameObjectsToControl','renderersToDisable','behavioursToDisable','gameObjectsToDisable'] for p in cd.get(key,[]) if rid(ca,p)]})
  elif cls=='SetContext':out.setdefault('context',[]).append({'key':cd['key'],'value':cd['value']})
  if cls in ['Button','EventRichButton','EventTrigger','ClickableUI','InvokeOnStart']:
   ac=actions(cd,ca)
   if ac:out.setdefault('actions',[]).extend(ac)
 return out
manual_config=read(BASE/'objects/ManualConfig/resources.assets--23866.json')['data']
pages=[]
for i,p in enumerate(manual_config['manualPages']):
 oid=rid('resources.assets',p['pagePrefab']);pages.append({'id':manual_config['manualPageIDs'][i],'title':localized(p['localizedTitle']) or p['pageTitle'],'unlockCondition':p['unlockCondition'],'sourceId':oid,'root':node(oid)})
manual=obj('level9:2624');frame_root=node(rid('level9',manual['data']['m_GameObject']))
# Full root frame preserves scene book background/title/container/buttons without guessing offsets.
frame={'sourceId':'level9:2624','root':frame_root,'pageContainerId':rid('level9',manual['data']['ContentPanel']),'titleComponentId':rid('level9',manual['data']['TitleText']),'englishFontId':english_font,'contentSize':[516,672]}
# Original infoscreen card prefab plus source background/highlight images.
card_component=obj('resources.assets:26132')['data']
card_root=node('resources.assets:4704')
card_sprites={}
for prefix in ['gr','bl','r','yl','gry','pnk_front']:
 for tier in range(1,4):
  name=f'card_{prefix}_{tier:02d}';card_sprites[name]=sprite(resource_map.get('sprites/card/'+name),'native-cards')
card_parts={}
for field in ['NameText','InfoText','EffectText','TierText','Background','Tier1Highlight','Tier1Highlight_noEx','Tier2Highlight','Tier2Highlight_noEx','OverriddenOverlay','ChangedByText','AlternateNameText','PreviousEffectText','AlternateEffect']:
 oid=rid('resources.assets',card_component[field]);ob=obj(oid)
 goid=oid if index[oid]['type']=='GameObject' else rid(ob['_source']['asset'],ob['data']['m_GameObject'])
 n=node(goid)
 if index[oid].get('class')=='Image':
  cd=ob['data'];sp=sprite(rid(ob['_source']['asset'],cd.get('m_Sprite')),'native-cards');n['image']={'sprite':sp,'color':color(cd['m_Color']),'type':cd['m_Type'],'preserveAspect':bool(cd['m_PreserveAspect']),'fillCenter':bool(cd['m_FillCenter'])}
 card_parts[field]=n
card_view={'sourceId':'resources.assets:26132','prefabId':'resources.assets:4704','size':[279,174],'root':card_root,'parts':card_parts,'sprites':card_sprites,'preview':{'baseOffset':32,'duration':.1,'ease':'easeOutQuad'},'changedByFormat':card_parts['ChangedByText'].get('text',{}).get('text',''),'dynamicText':{k:v for k,v in tables['Card'].items() if not k.isdigit() and (k=='green_jewel_t2' or k.startswith('pink_') and (k.endswith('_Name') or k.endswith('_EffectText')))}}
write_ts('native-card-data.ts',"import type {NativeManualNode,NativeSprite} from './native-types';",{'NATIVE_CARD_VIEW':('{sourceId:string;prefabId:string;size:number[];root:NativeManualNode;parts:Record<string,NativeManualNode>;sprites:Record<string,NativeSprite>;preview:{baseOffset:number;duration:number;ease:string};changedByFormat:string;dynamicText:Record<string,string>}',card_view)})
font_defs={}
for fid in sorted(x for x in font_ids if x):
 data=obj(fid)
 if not data:continue
 fd=data['data'];fa=data['_source']['asset'];atlasids=[rid(fa,x) for x in fd.get('m_AtlasTextures',[])];atlasids=[x for x in atlasids if x]
 for at in atlasids:sprite(at,'native-manual')
 glyphs=[{'index':g['m_Index'],'rect':[g['m_GlyphRect'][k] for k in ['m_X','m_Y','m_Width','m_Height']],'metrics':[g['m_Metrics'][k] for k in ['m_Width','m_Height','m_HorizontalBearingX','m_HorizontalBearingY','m_HorizontalAdvance']],'scale':g.get('m_Scale',1),'atlasIndex':g.get('m_AtlasIndex',0)} for g in fd.get('m_GlyphTable',[])]
 font_defs[fid]={'id':fid,'name':fd.get('m_Name',''),'family':fd.get('m_FaceInfo',{}).get('m_FamilyName',''),'atlasSources':atlasids,'atlasAssets':[requested[x]['asset'] for x in atlasids],'alphaAtlasAssets':[exported['assets'].get(x,{}).get('alphaAsset',requested[x]['asset']) for x in atlasids],'materialId':exported.get('fontMaterials',{}).get(fid),'material':exported.get('materials',{}).get(exported.get('fontMaterials',{}).get(fid)),'alphaConversion':{'channel':'A','threshold':128},'normalStyle':fd.get('normalStyle',0),'boldStyle':fd.get('boldStyle',0),'boldSpacing':fd.get('boldSpacing',0),'italicStyle':fd.get('italicStyle',0),'face':fd.get('m_FaceInfo',{}),'glyphs':glyphs,'characters':[{'unicode':c['m_Unicode'],'glyphIndex':c['m_GlyphIndex'],'scale':c.get('m_Scale',1)} for c in fd.get('m_CharacterTable',[])],'kerning':fd.get('m_FontFeatureTable',{}).get('m_GlyphPairAdjustmentRecords',[]),'atlasRenderMode':fd.get('m_AtlasRenderMode'),'atlasPadding':fd.get('m_AtlasPadding'),'atlasWidth':fd.get('m_AtlasWidth'),'atlasHeight':fd.get('m_AtlasHeight')}
inline_sprites={}
icons=obj('resources.assets:25086')['data']
glyph_index={g['m_Index']:g for g in icons['m_SpriteGlyphTable']}
for i,c in enumerate(icons['m_SpriteCharacterTable']):
 g=glyph_index[c['m_GlyphIndex']];sp=sprite(rid('resources.assets',g['sprite']),'native-manual');inline_sprites[i]={**sp,'glyphMetrics':g['m_Metrics'],'glyphScale':g['m_Scale'],'characterScale':c['m_Scale']}
write_ts('native-manual-data.ts',"import type {NativeManualPage,NativeManualNode,NativeSprite,NativeFontAtlas} from './native-types';",{'NATIVE_MANUAL_INLINE_SPRITES':('Record<number,NativeSprite & {glyphMetrics:Record<string,number>;glyphScale:number;characterScale:number}>',inline_sprites),'NATIVE_MANUAL_PAGES':('NativeManualPage[]',pages),'NATIVE_MANUAL_FRAME':('{sourceId:string;root:NativeManualNode;pageContainerId:string;titleComponentId:string;englishFontId:string;contentSize:number[]}',frame),'NATIVE_MANUAL_FONTS':('Record<string,NativeFontAtlas>',font_defs),'NATIVE_MANUAL_COLLECT_CONTEXTS':('Record<string,string[]>',study['manual']['collectContexts'])})
folder=ROOT/'artifacts/native-data';folder.mkdir(parents=True,exist_ok=True)
(folder/'asset-requests.json').write_text(json.dumps({'sprites':list(requested.values()),'fontIds':list(font_ids),'fontMaterialIds':list(font_material_ids)},ensure_ascii=False,indent=2))
print(json.dumps({'items':len(items),'cards':len(cards),'manualPages':len(pages),'fonts':len(font_defs),'assetRequests':len(requested),'missingItemMainSprite':[i for i,v in items.items() if 'sprite' not in v]},ensure_ascii=False))
