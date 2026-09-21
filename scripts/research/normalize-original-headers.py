#!/usr/bin/env python3
"""Cross-check generated schemas against Unity's dedicated native header reader.

Older schema generators misalign m_Script after the enabled byte. This changes
only extracted JSON headers, and records exactly which headers were corrected.
"""
import argparse
import json
import re
from pathlib import Path
import UnityPy

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('version')
version = ap.parse_args().version
out = ROOT / 'reference/original-study' / version
report = json.loads((out / 'extraction-report.json').read_text())
source = Path(report['sourceRoot'])
index = json.loads((out / 'final-index.json').read_text())
wanted = {x['id']: x for x in index if x['type'] == 'MonoBehaviour' and x.get('json') and 'error' not in x}
files = [p for p in source.rglob('*') if p.is_file() and (p.suffix in ('.assets', '.bundle') or re.fullmatch(r'level\d+|globalgamemanagers', p.name))]
env = UnityPy.load(*map(str, files))
checked, changed, errors = 0, [], []
for o in env.objects:
    ident = f'{Path(o.assets_file.name).name}:{o.path_id}'
    if ident not in wanted:
        continue
    entry = wanted[ident]
    try:
        head = o.parse_monobehaviour_head()
        native = {'m_Name': head.m_Name, 'm_Enabled': head.m_Enabled}
        for field in ['m_GameObject', 'm_Script']:
            ptr = getattr(head, field)
            native[field] = {'m_FileID': ptr.m_FileID, 'm_PathID': ptr.m_PathID}
        path = out / entry['json']
        obj = json.loads(path.read_text())
        diff = {key: {'generated': obj['data'].get(key), 'native': value} for key, value in native.items() if obj['data'].get(key) != value}
        checked += 1
        if diff:
            changed.append({'id': ident, 'fields': diff})
            obj['data'].update(native)
            obj['_source']['headerVerified'] = True
            temp = path.with_suffix('.tmp')
            temp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
            temp.replace(path)
    except Exception as exc:
        errors.append({'id': ident, 'error': str(exc)})
result = {'version': version, 'checked': checked, 'corrected': len(changed), 'corrections': changed, 'errors': errors, 'policy': 'Actual native header bytes override generated schema header fields; gameplay payloads remain unchanged.'}
(out / 'header-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['version', 'checked', 'corrected', 'errors']}), flush=True)
