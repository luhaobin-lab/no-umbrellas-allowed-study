from PIL import Image
from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parent.parent
out=root/'public/assets/ui';out.mkdir(parents=True,exist_ok=True)
found={}
for t in range(42,3550,47):
 raw=subprocess.check_output(['ffmpeg','-loglevel','error','-ss',str(t),'-i',str(root/'参考视频.mp4'),'-vf','crop=160:66:1600:18','-frames:v','1','-f','image2pipe','-vcodec','png','-threads','1','-'])
 import io
 im=Image.open(io.BytesIO(raw)).convert('RGB')
 mask=im.point(lambda x:255 if x>205 else 0).convert('L').point(lambda x:255 if x>220 else 0)
 # Cash is white on pure black; connected x columns separate each glyph.
 seg=[];active=None
 for x in range(mask.width):
  has=any(mask.getpixel((x,y))>0 for y in range(mask.height))
  if has and active is None:active=x
  if not has and active is not None:seg.append((active,x));active=None
 if active is not None:seg.append((active,mask.width))
 seg=[(a,b) for a,b in seg if b-a>=8]
 tmp=root/'reference/frames/cash-ocr.png';mask.save(tmp)
 res=subprocess.run(['tesseract',str(tmp),'stdout','--psm','7','-c','tessedit_char_whitelist=0123456789U'],capture_output=True,text=True).stdout.strip()
 if len(res)!=len(seg):continue
 for char,(a,b) in zip(res,seg):
  if char in found:continue
  glyph=mask.crop((a,0,b,mask.height));box=glyph.getbbox()
  if not box:continue
  glyph=glyph.crop(box)
  if glyph.height<25:continue
  # Save white silhouettes with original anti-aliasing masked, matching video raster lattice.
  rgba=Image.new('RGBA',glyph.size,(255,255,255,0));rgba.putalpha(glyph)
  rgba.save(out/f'digit-{char}.png');found[char]={'timestamp':t,'width':glyph.width,'height':glyph.height,'ocr':res}
 if all(c in found for c in '0123456789U'):break
(out/'digits.json').write_text(json.dumps(found,indent=2))
print(json.dumps(found))
