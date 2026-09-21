import UnityPy,json
from pathlib import Path
p=Path('public/assets/demo-panels');p.mkdir(parents=True,exist_ok=True)
selected={'result_main','result_slot','result_card_info','result_card_image','result_card_Shadow','result_lightOverlay','result_sold','result_disposed','result_nextButton','loan_main','loan_slot','loan_status','loan_button','loan_Darcy','loan_executor'}
e=UnityPy.load('/tmp/nua-tool-ui-assets');found=[]
for o in e.objects:
 if o.type.name!='Sprite':continue
 d=o.read()
 if d.m_Name not in selected:continue
 im=d.image;im.save(p/(d.m_Name+'.png'));found.append({'name':d.m_Name,'asset':'/assets/demo-panels/'+d.m_Name+'.png','size':im.size,'sourceAsset':o.assets_file.name,'sourcePathId':o.path_id})
Path('docs/research/demo-panels.json').write_text(json.dumps(found,indent=2));print(found)
