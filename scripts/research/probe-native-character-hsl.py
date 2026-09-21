"""Evaluate the extracted Windows DXBC arithmetic, independent of the TS HSL formula.
This bounded interpreter stops at the color transform, before outline/URP lights.
"""
import json,re,math,itertools
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];SHADERS=ROOT/'reference/original-study/items/shaders'
variants=['win-1338-31.dxbc.txt','win-1340-4.dxbc.txt','win-1344-4.dxbc.txt']
EPSILON=1e-10

def run(filename,rgba,adjust):
 regs={'v[1]':adjust[:],'r[0]':rgba[:]}
 def read(s):
  neg=s.startswith('-');s=s[1:] if neg else s;absolute=s.startswith('abs(');s=s[4:-1] if absolute else s
  if s.startswith('('):
   v=[float(x) for x in s[1:-1].split(',')];v=v*4 if len(v)==1 else v
  else:
   name,_,sw=s.partition('.');base=[EPSILON]*4 if name.startswith('cb') else regs.get(name,[0]*4);sw=sw or 'xyzw';sw=sw*4 if len(sw)==1 else sw;v=[base['xyzw'.index(c)] for c in sw]
  return [(-1 if neg else 1)*(abs(x) if absolute else x) for x in v]
 def write(s,v):
  name,_,mask=s.partition('.');regs.setdefault(name,[0]*4)
  for char in mask or 'xyzw':i='xyzw'.index(char);regs[name][i]=v[i]
 for line in (SHADERS/filename).read_text().splitlines():
  op,_,tail=line.partition(' ')
  if op.startswith('DCL') or op=='DISCARD':continue
  args=re.split(r', (?=(?:[^()]*\([^()]*\))*[^()]*$)',tail)
  if op=='SAMPLE':write(args[0],rgba);continue
  src=[read(s) for s in args[1:]];base=op.replace('_sat','')
  if base=='MOV':v=src[0]
  elif base=='MOVC':v=[b if a else c for a,b,c in zip(*src)]
  elif base=='ADD':v=[a+b for a,b in zip(*src)]
  elif base=='MUL':v=[a*b for a,b in zip(*src)]
  elif base=='MAD':v=[a*b+c for a,b,c in zip(*src)]
  elif base=='DIV':v=[a/b for a,b in zip(*src)]
  elif base=='MIN':v=[min(a,b) for a,b in zip(*src)]
  elif base=='LT':v=[int(a<b) for a,b in zip(*src)]
  elif base=='EQ':v=[int(a==b) for a,b in zip(*src)]
  elif base=='GE':v=[int(a>=b) for a,b in zip(*src)]
  elif base=='FRC':v=[a-math.floor(a) for a in src[0]]
  else:raise ValueError(op)
  if op.endswith('_sat'):v=[max(0,min(1,a)) for a in v]
  write(args[0],v)
  if line.startswith('MAD r[0].xyz,'):return regs['r[0]']
 raise ValueError('No color output')
colors=[[0,0,0,1],[1,1,1,1],[.5,.5,.5,1],[1,0,0,1],[0,1,0,1],[0,0,1,1],[.72,.44,.22,.7],[.1,.2,.3,.2],[.91,.77,.53,1],[.12,.88,.32,1],[.33,.18,.84,1],[.43,.65,.74,1]]
adjustments=[[0,.5,.5,1],[.04,.52,.49,1],[.93,.33,.54,1],[.5,0,.2,1],[.8,.7,.7,1],[-.4,1,.9,.2],[1.2,.3,.12,1],[0,.5,.85,1]]
rows=[]
for filename,rgba,adjust in itertools.product(variants,colors,adjustments):rows.append({'source':filename,'rgba':rgba,'adjust':adjust,'epsilon':EPSILON,'expected':run(filename,rgba,adjust)})
result={'kind':'native-windows-dxbc-color-oracle','phase':'HSL before lights/outlines','epsilonStatus':'Explicit probe uniform; source runtime initialization is not established','variants':variants,'cases':rows}
(ROOT/'src/fixtures/native-character-hsl-original.json').write_text(json.dumps(result,separators=(',',':')))
print(json.dumps({'cases':len(rows),'variants':variants}))
