#!/usr/bin/env python3
"""Read-only Unity data inventory and reproducible mechanics-object extraction.

Run with /tmp/nua-unitypy-env/bin/python. Does not run or modify either game.
Outputs stay outside src/public/dist; IDs include file name to avoid collisions.
"""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path

import UnityPy
from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator

ROOT = Path(__file__).resolve().parents[2]
VERSIONS = {
    'windows-1.0.5-demo': ROOT / '原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data',
    'mac-0.2.5-demo': ROOT / '原文件/No Umbrellas Allowed.app/Contents/Resources/Data',
}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str) + '\n')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def safe(value):
    return re.sub(r'[^\w.\-]', '_', value)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('version', choices=VERSIONS)
    args = ap.parse_args()
    source = VERSIONS[args.version]
    out = ROOT / 'reference/original-study' / args.version
    out.mkdir(parents=True, exist_ok=True)
    paths = sorted(p for p in source.rglob('*') if p.is_file())
    inventory = [{'path': str(p.relative_to(source)), 'bytes': p.stat().st_size, 'sha256': digest(p)} for p in paths]
    dump(out / 'source-files.json', {'sourceRoot': str(source), 'files': inventory})
    serialized = [p for p in paths if p.suffix in ('.assets', '.bundle') or re.fullmatch(r'level\d+|globalgamemanagers', p.name)]
    env = UnityPy.load(*(str(p) for p in serialized))
    unity_version = '.'.join(map(str, next(o.version for o in env.objects)))
    # BuildSettings contains the exact engine revision; no auth/build tokens exported.
    settings = {}
    for o in env.objects:
        if o.type.name == 'PlayerSettings':
            d = o.read_typetree()
            settings['player'] = {k: d.get(k) for k in ['companyName', 'productName', 'bundleVersion', 'defaultScreenWidth', 'defaultScreenHeight']}
        elif o.type.name == 'BuildSettings':
            d = o.read_typetree()
            settings['build'] = {k: d.get(k) for k in ['scenes', 'm_Version', 'isDebugBuild']}
            unity_version = d.get('m_Version', unity_version)
    generator = TypeTreeGenerator(unity_version)
    generator.load_local_dll_folder(str(source / 'Managed'))
    env.typetree_generator = generator
    dump(out / 'version.json', {'label': args.version, 'unityVersion': unity_version, **settings})
    counts = collections.Counter()
    classes = collections.Counter()
    index, errors, resource_paths, files = [], [], {}, {}
    for key, value in env.container.items():
        try:
            obj = value.deref()
            ident = f'{Path(obj.assets_file.name).name}:{obj.path_id}'
            resource_paths.setdefault(ident, []).append(key)
        except Exception:
            pass
    for n, o in enumerate(env.objects):
        kind = o.type.name
        asset = Path(o.assets_file.name).name
        if asset not in files:
            files[asset] = {'externals': [getattr(x, 'path', getattr(x, 'path_name', str(x))) for x in o.assets_file.externals]}
        ident = f'{asset}:{o.path_id}'
        counts[kind] += 1
        entry = {'id': ident, 'asset': asset, 'pathId': o.path_id, 'type': kind, 'resourcePaths': resource_paths.get(ident, [])}
        try:
            if kind == 'MonoBehaviour':
                head = o.parse_monobehaviour_head()
                entry['name'] = head.m_Name
                script = head.m_Script.deref_parse_as_object()
                entry['class'] = script.m_ClassName
                entry['namespace'] = script.m_Namespace
                entry['assembly'] = script.m_AssemblyName
                classes[script.m_ClassName] += 1
                data = o.parse_as_dict(o.generate_monobehaviour_node())
                # Dedicated native header parsing avoids generator alignment
                # errors around the one-byte enabled flag and script PPtr.
                for key in ['m_GameObject', 'm_Script']:
                    ptr = getattr(head, key)
                    data[key] = {'m_FileID': ptr.m_FileID, 'm_PathID': ptr.m_PathID}
                data['m_Name'] = head.m_Name
                data['m_Enabled'] = head.m_Enabled
                rel = Path('objects') / safe(script.m_ClassName) / f'{safe(asset)}--{o.path_id}.json'
                entry['json'] = str(rel)
                dump(out / rel, {'_source': entry.copy(), 'data': data})
            elif kind in ('MonoScript', 'GameObject', 'Transform', 'RectTransform', 'Sprite', 'TextAsset', 'ResourceManager'):
                data = o.read_typetree()
                entry['name'] = data.get('m_Name', '')
                if kind == 'TextAsset':
                    rel = Path('texts') / f'{safe(asset)}--{o.path_id}--{safe(entry["name"])}.txt'
                    val = data.get('m_Script', '')
                    (out / rel).parent.mkdir(parents=True, exist_ok=True)
                    (out / rel).write_bytes(val if isinstance(val, bytes) else val.encode('utf-8', errors='surrogateescape'))
                    entry['text'] = str(rel)
                elif kind in ('GameObject', 'Transform', 'RectTransform', 'ResourceManager'):
                    rel = Path('objects') / kind / f'{safe(asset)}--{o.path_id}.json'
                    entry['json'] = str(rel)
                    dump(out / rel, {'_source': entry.copy(), 'data': data})
                elif kind == 'MonoScript':
                    entry.update({k: data.get(k) for k in ['m_ClassName', 'm_Namespace', 'm_AssemblyName']})
                elif kind == 'Sprite':
                    entry['rect'] = data.get('m_Rect')
            elif kind in ('Texture2D', 'Font', 'AudioClip'):
                # Names are enough for a mechanics/resource inventory; binary payloads remain in source.
                entry['name'] = o.read().m_Name
        except Exception as exc:
            entry['error'] = str(exc)[:500]
            errors.append({'id': ident, 'type': kind, 'class': entry.get('class'), 'error': str(exc)[:500]})
        index.append(entry)
        if n and n % 10000 == 0:
            print(args.version, n, 'objects', len(errors), 'errors', flush=True)
    dump(out / 'objects-index.json', index)
    dump(out / 'serialized-files.json', files)
    dump(out / 'extraction-report.json', {'version': args.version, 'sourceRoot': str(source), 'sourceFiles': len(inventory), 'sourceBytes': sum(x['bytes'] for x in inventory), 'serializedFiles': len(serialized), 'objectCounts': counts, 'monoClassCounts': classes, 'errors': errors, 'objectsIndexed': len(index), 'scope': 'Asset presence and successful decoding do not establish runtime reachability or complete behavior parity.'})
    print(json.dumps({'version': args.version, 'objects': len(index), 'mono': counts['MonoBehaviour'], 'errors': len(errors), 'classes': len(classes)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
