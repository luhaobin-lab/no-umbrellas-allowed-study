import UnityPy,json
from pathlib import Path
E=UnityPy.load('/tmp/nua-unity-assets');catalog=json.load(open('docs/research/official-item-catalog.json'));items=catalog['items'];cards=catalog['cards'];ids=set(catalog['explicitVisitMap'].values());p=Path('public/assets/demo-tools');p.mkdir(parents=True,exist_ok=True)
sigs={items[i]['signaturePathId'] for i in ids if items[i]['signaturePathId']};opens={items[i]['openSpritePathId'] for i in ids if items[i]['openSpritePathId']}
materials={c for i in ids for c in items[i]['cardIds'] if cards[c]['category']=='material'}
materials.update(['green_canvas','green_paper'])
toolnames={'item_date_main','item_material','item_material_small','item_sign_main','item_condi_back','item_sign_small','item_watch_small','item_watch','item_condi_reflect','item_condi_main','item_condi_small','item_jewel_main','item_jewel_card','item_condi_pointer','item_date_small','item_jewel_small'}
found={'materials':{},'signatures':{},'movements':{},'frames':{}};errors=[]
for o in E.objects:
 if o.type.name!='Sprite':continue
 try:
  d=o.read();name=d.m_Name
  kind='frames' if name in toolnames else 'materials' if name in materials else 'signatures' if o.path_id in sigs else 'movements' if o.path_id in opens else None
  if not kind:continue
  filename=(name if kind in ['materials','frames'] else str(o.path_id))+'.png';d.image.save(p/filename);found[kind][name if kind in ['materials','frames'] else str(o.path_id)]={'asset':'/assets/demo-tools/'+filename,'name':name,'size':d.image.size}
 except Exception as e:errors.append(str(e)[:120])
Path('docs/research/official-tool-assets.json').write_text(json.dumps({'found':found,'errors':errors,'expected':{'materials':list(materials),'signatures':list(sigs),'movements':list(opens)}},indent=2));print({k:len(v) for k,v in found.items()},'errors',len(errors),errors[:2])
