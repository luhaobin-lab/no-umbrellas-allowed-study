from PIL import Image
from pathlib import Path
import json
out=Path('public/assets/font');out.mkdir(exist_ok=True)
candidates={}
for t in json.load(open('reference/tag-font-input.json')):
 if not t['asset'] or t['group']=='shop':continue
 im=Image.open('public'+t['asset']).convert('RGB').crop((36,6,205,37));m=im.convert('L').point(lambda x:255 if x<125 else 0)
 seg=[];st=None
 for x in range(m.width+1):
  on=x<m.width and any(m.getpixel((x,y)) for y in range(m.height))
  if on and st is None:st=x
  if not on and st is not None:seg.append((st,x));st=None
 word=''.join(t['text'].split())
 if len(seg)!=len(word):continue
 for i,(c,(a,b)) in enumerate(zip(word,seg)):
  if c in candidates and i==0:continue
  g=m.crop((a,0,b,31))
  if i==0:
   for y in range(3):
    for x in range(min(4,g.width)):g.putpixel((x,y),0)
  rgba=Image.new('RGBA',g.size,(80,66,48,255));rgba.putalpha(g)
  candidate={'width':g.width,'height':31,'source':t['id'],'position':i,'image':rgba}
  if c not in candidates or (candidates[c]['position']==0 and i>0):candidates[c]=candidate
meta={}
for c,d in candidates.items():
 name=f'{ord(c)}.png';d['image'].save(out/name);meta[c]={'asset':'/assets/font/'+name,'width':d['width'],'height':d['height'],'source':d['source']}
Path('src/reference-font.ts').write_text('export const REFERENCE_FONT:Record<string,{asset:string;width:number;height:number;source:string}> = '+json.dumps(meta)+';\n')
print('glyphs',''.join(sorted(meta)))
