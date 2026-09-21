from pathlib import Path
from PIL import Image
import json,re,numpy as np
s=Path('src/reference-animations.ts').read_text();data=json.loads(s[s.index('= ')+2:].strip().rstrip(';'))
for key,a in data.items():
 basefile=Path(f'public/assets/reference-visitors/visitor-{a["time"]}.png')
 if not basefile.exists():continue
 base=np.asarray(Image.open(basefile).convert('RGB'))[:a['rect'][3],:a['rect'][2]].astype(np.int16)
 h,w=base.shape[:2]
 border=np.zeros((h,w),bool);border[:8]=True;border[:,:8]=True;border[:,-8:]=True
 for f in a['frames']:
  path=Path('public'+f);raw=np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
  shift=np.median((base-raw)[border],axis=0)
  norm=np.clip(raw+shift,0,255).astype(np.uint8)
  diff=np.max(abs(norm.astype(np.int16)-base),axis=2)
  alpha=np.where(diff>12,255,0).astype(np.uint8)
  alpha[:5]=0;alpha[:,:5]=0;alpha[:,-5:]=0
  for y in range(h-12,h):alpha[y]=(alpha[y].astype(float)*(h-1-y)/12).astype(np.uint8)
  out=Image.fromarray(np.dstack([norm,alpha]));out.save(path)
print('Kept only changed animation pixels; border lighting aligned to original idle patch.')
