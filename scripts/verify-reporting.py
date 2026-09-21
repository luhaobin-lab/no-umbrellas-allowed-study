#!/usr/bin/env python3
"""Validate supplied-video reporting/broadcast asset dimensions and exact source pixels.

Optional --strip-color removes PNG colour metadata while preserving IDAT byte-for-byte.
This does not assert unobserved game mechanics or infer causes across video edits.
"""
from pathlib import Path
import argparse
import hashlib
import json
import struct
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
COLOR = {b'gAMA', b'cHRM', b'iCCP', b'sRGB', b'cICP', b'mDCV', b'cLLI'}
FOLDERS = ('reporting', 'broadcasts', 'navigation', 'inventory')
parser = argparse.ArgumentParser()
parser.add_argument('--strip-color', action='store_true')
args = parser.parse_args()

def chunks(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    offset = 8
    while offset < len(data):
        size = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        raw = data[offset:offset+12+size]
        assert len(raw) == size+12
        yield kind, raw
        offset += len(raw)

def idat_digest(data):
    return hashlib.sha256(b''.join(raw for kind, raw in chunks(data) if kind == b'IDAT')).hexdigest()

png_checks = []
png_paths = [p for folder in FOLDERS for p in (ROOT / 'public/assets' / folder).glob('*.png')]
png_paths.extend(ROOT / 'public/assets/surfaces' / name for name in ('sales-wall.png', 'sales-inventory.png'))
for path in sorted(png_paths):
        original = path.read_bytes()
        before_idat = idat_digest(original)
        found = [kind.decode() for kind, _ in chunks(original) if kind in COLOR]
        if args.strip_color and found:
            path.write_bytes(original[:8] + b''.join(raw for kind, raw in chunks(original) if kind not in COLOR))
        after = path.read_bytes()
        assert idat_digest(after) == before_idat, path
        remaining = [kind.decode() for kind, _ in chunks(after) if kind in COLOR]
        assert not remaining, f'{path}: use --strip-color to remove {remaining}'
        png_checks.append({'path': str(path.relative_to(ROOT)), 'metadataRemoved': found if args.strip_color else [], 'idatPreserved': True, 'idatSha256': before_idat})

source_checks = []
for folder in FOLDERS:
    manifest = json.loads((ROOT / 'public/assets' / folder / 'manifest.json').read_text())
    for entry in manifest:
        path = ROOT / 'public' / entry['asset'].lstrip('/')
        actual = Image.open(path).convert('RGB')
        x,y,w,h = entry['rect']
        assert actual.size == (w,h), entry['id']
        if 'source' in entry:
            expected = Image.open(ROOT / entry['source']).convert('RGB').crop((x,y,x+w,y+h))
            assert ImageChops.difference(actual, expected).getbbox() is None, entry['id']
            source_checks.append({'id': entry['id'], 'exactSourcePixels': True})
        else:
            source_checks.append({'id': entry['id'], 'dimensionsMatch': True, 'compositeOrSeparateProvenance': True})

report = {
    'pngChecks': png_checks,
    'assetChecks': source_checks,
    'manualEvidence': [
        {'frames': [3140,3148,3153], 'finding': 'Tutorial identifies today/week player reports; city captures are separate.'},
        {'frames': [3425.9,3426.0], 'finding': 'Continuous REPORT press changes 00/00 to 01/01; cash remains 2501; same seller stays.'},
        {'frames': [3466.15,3466.2], 'finding': 'Hard edit omits second report and -94 cash cause.'},
        {'frames': [3476.3,3476.4], 'finding': 'Hard edit omits +24 cash cause.'},
        {'frames': [3490,3592], 'finding': 'Street remains 53 left, D-5 and 2431; no observed crowd capture interaction.'},
    ],
    'limits': ['No next-day rollover after reporting is shown.', 'No per-report reward, fine, reputation or city-capture conversion is established.'],
}
destination = ROOT / 'reference/reporting/verification.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'PASS: {len(png_checks)} PNGs, preserved IDAT, {len(source_checks)} dimensions/source checks. {destination.relative_to(ROOT)}')
