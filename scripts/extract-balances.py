from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,subprocess,io
items=json.loads(Path('reference/balance-input.json').read_text());templates={}
for c in '0123456789U':
 im=Image.open(f'public/assets/ui/digit-{c}.png').getchannel('A');templates[c]=im
result={};tiles=[]
for record in items:
 t=record['time'];raw=subprocess.check_output(['ffmpeg','-loglevel','error','-ss',str(t),'-i','参考视频.mp4','-vf','crop=580:80:1200:10','-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-'])
 im=Image.open(io.BytesIO(raw)).convert('RGB');ar=np.asarray(im);mask=Image.fromarray(np.where(ar.min(axis=2)>210,255,0).astype('uint8'))
 seg=[];start=None
 for x in range(mask.width+1):
  on=x<mask.width and any(mask.getpixel((x,y)) for y in range(mask.height))
  if on and start is None:start=x
  if not on and start is not None:seg.append((start,x));start=None
 word='';dist=[]
 for a,b in seg:
  g=mask.crop((a,0,b,80));bb=g.getbbox()
  if not bb or bb[3]-bb[1]<35 or b-a<8:continue
  g=g.crop(bb);best=None
  for c,tem in templates.items():
   resized=g.resize(tem.size,Image.Resampling.NEAREST);score=np.mean(np.asarray(resized)!=np.asarray(tem))+abs(g.width/g.height-tem.width/tem.height)*.2
   if best is None or score<best[0]:best=(score,c)
  word+=best[1];dist.append(float(best[0]))
 valid=word.endswith('U') and word[:-1].isdigit() and len(word)<8 and max(dist,default=1)<.22
 if valid:result[record['id']]={'cash':int(word[:-1]),'timestamp':t,'matchedGlyphs':word,'maxGlyphDistance':max(dist),'crossChecked':record['known'] is None or record['known']==int(word[:-1])}
 tile=Image.new('RGB',(570,112),(45,40,40));tile.paste(im,(0,26));d=ImageDraw.Draw(tile);d.text((6,4),record['id'][:47]+f' {t}s -> {word}',fill='white' if valid else 'red');tiles.append(tile)
contact=Image.new('RGB',(1710,112*((len(tiles)+2)//3)))
for i,tile in enumerate(tiles):contact.paste(tile,((i%3)*570,(i//3)*112))
contact.save('reference/contact-sheets/balance-validation.png')
Path('src/reference-balances.ts').write_text('/** Balances visibly present at the start of recorded segments; used only by the disclosed recording-checkpoint mode. */\nexport const REFERENCE_BALANCES:Record<string,{cash:number;timestamp:number;matchedGlyphs:string;maxGlyphDistance:number;crossChecked:boolean}> = '+json.dumps(result,indent=2)+';\n')
print('Matched',len(result),'of',len(items));print('Conflicts',[(k,v) for k,v in result.items() if not v['crossChecked']])
