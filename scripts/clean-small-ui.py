"""Remove recorded pointers by copying identical empty/source UI pixels; no repainting text."""
from pathlib import Path
from PIL import Image,ImageDraw
p=Path('public/assets/ui')
before=Image.open('reference/loans/3395.6.png').convert('RGBA');after=Image.open('reference/loans/3399.png').convert('RGBA')
before.paste(after.crop((0,0,678,57)),(0,0));before.save(p/'loans-day11-before.png');after.save(p/'loans-day11-after.png')
for n in ['week2-calendar-early','week2-calendar']:
 path=Path(f'public/assets/surfaces/{n}.png');a=Image.open(path).convert('RGBA')
 # The arrow in the early-calendar blank Thursday cell is excluded, using the same cell below it.
 if n.endswith('early'):a.paste(a.crop((876,383,913,426)),(876,330))
 mask=Image.new('L',a.size);ImageDraw.Draw(mask).polygon([(0,46),(49,0),(1183,0),(1230,46),(1230,535),(1181,584),(48,584),(0,539)],fill=255);a.putalpha(mask);a.save(path)
path=p/'executor-loan.png';a=Image.open(path).convert('RGBA');a.paste(a.crop((177,172,211,203)),(213,172));a.save(path)
print('Saved two exact day-11 loan panels; removed recorded cursors from small UI assets.')
