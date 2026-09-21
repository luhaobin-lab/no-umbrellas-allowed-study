#!/usr/bin/env python3
import pathlib,json
R=pathlib.Path(__file__).resolve().parents[2]
ns={'__file__':str(R/'scripts/research/build_runtime_campaign.py')};exec((R/'scripts/research/build_runtime_campaign.py').read_text().split('events={}')[0],ns)
idx,B,ptr,convert,walk=map(ns.get,['idx','B','ptr','convert','walk'])
def raw(ident):
 x=idx[ident];return json.loads((B/x['json']).read_text())['data']
def go(ident):
 x=idx[ident];return ptr(raw(ident)['m_GameObject'],x['asset'])['ref']
def decoded(ident):
 x=idx[ident];d=json.loads((R/'reference/original-study/progression/decoded/windows-1.0.5-demo'/x['class']/(ident.replace(':','--')+'.json')).read_text());refs={n['$id']:n for n in walk(d['odin']) if '$id'in n};return convert(d['odin'],x['asset'],refs)
names={raw(go(x['id']))['m_Name']:x['id'] for x in idx.values() if x['asset']=='level58' and x.get('class') in ['StreetEventData','SimpleStreetEventData']}
purchases=json.loads((R/'reference/original-study/npc/street-purchases-level58.json').read_text())
if isinstance(purchases,dict):purchases=purchases.get('purchases',list(purchases.values()))
result=[]
for x in purchases:
 d=x['data'];r={k:x[k] for k in ['id','gameObject','path','storeId']};r['name']=r['path'].split('/')[-1];r.update(basePrice=d['basePrice'],priceContext=d['PriceContextName'] if d['UseBasePriceFromContext'] else None,callbacks={},browse=None)
 for key in ['onPurchaseTry','onPurchaseSuccess','onAlreadyPurchased','onPurchaseFailed']:
  calls=[]
  for c in d[key]['m_PersistentCalls']['m_Calls']:
   target=ptr(c['m_Target'],'level58');arg=c['m_Arguments'];out={'method':c['m_MethodName'],'target':target,'string':arg['m_StringArgument'],'number':arg['m_IntArgument']}
   if target and target['class']=='SetContext':out['context']=raw(target['ref'])
   if out['method']=='Execute':
    ident=names.get(out['string']);out['eventSource']=ident;out['event']=decoded(ident) if ident else None
   calls.append(out)
  r['callbacks'][key]=calls
 for y in idx.values():
  if y['asset']=='level58' and y.get('class')=='StreetStoreBrowse':
   bd=raw(y['id'])
   for i in bd['BrowseItems']:
    ref=ptr(i['Purchase'],'level58')
    if ref and ref['ref']==x['id']:r['browse']={'domain':bd['Domain'],'id':i['ID'],'name':convert(i['Name'],'level58',{})}
 result.append(r)
(R/'src/native-street-purchases-data.ts').write_text('/** Generated source street products and resolved purchase callbacks. */\nimport type {StreetProduct} from "./native-street-purchases";\nexport const NATIVE_STREET_PURCHASES:StreetProduct[]=JSON.parse('+json.dumps(json.dumps(result,ensure_ascii=False,separators=(',',':')),ensure_ascii=False)+');\n')
(R/'reference/original-study/progression/runtime-street-purchases.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('purchases',len(result))
for p in result:
 print(p['id'],p['storeId'],p['gameObject'],p['browse'])
 for c in p['callbacks']['onPurchaseSuccess']:
  if c.get('event'):
   print(c['eventSource'],[(o.get('type'),o.get('Key'),o.get('Value'),o.get('m_MethodName')) for o in walk(c['event']) if o.get('type') in ['SetPersistentContextEventData','UnityEngine.Events.PersistentCall']])
