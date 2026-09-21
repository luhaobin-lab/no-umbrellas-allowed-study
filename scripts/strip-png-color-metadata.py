from pathlib import Path
import struct,json,hashlib
records=[]
for path in Path('public/assets').rglob('*.png'):
 data=path.read_bytes();out=data[:8];offset=8;removed=[]
 while offset<len(data):
  n=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];chunk=data[offset:offset+12+n]
  if kind in (b'gAMA',b'cHRM',b'iCCP',b'sRGB',b'cICP',b'mDCV',b'cLLI'):removed.append(kind.decode())
  else:out+=chunk
  offset+=12+n
 if removed:path.write_bytes(out);records.append({'path':str(path),'removed':removed,'idatUnchanged':True})
history=Path('reference/png-color-normalization.json');old=json.loads(history.read_text()) if history.exists() else [];combined={r['path']:r for r in old};
for r in records:
 previous=combined.get(r['path']);r['removed']=sorted(set(r['removed']+(previous['removed'] if previous else [])));combined[r['path']]=r
history.write_text(json.dumps(list(combined.values()),indent=2));print(f'Normalized {len(records)} PNGs; original image data chunks unchanged.')
