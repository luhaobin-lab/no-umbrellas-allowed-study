#!/usr/bin/env python3
"""Recover legacy Unity objects using byte-exact embedded schema decoding."""
import argparse
import collections
import json
import re
from pathlib import Path

import UnityPy
from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator
from unity_legacy_typetree import install, fix_generated_string_arrays, set_reference_generator

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    'windows-1.0.5-demo': ROOT / '原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data',
    'mac-0.2.5-demo': ROOT / '原文件/No Umbrellas Allowed.app/Contents/Resources/Data',
}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str) + '\n')


def safe(x):
    return re.sub(r'[^\w.\-]', '_', x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('version', choices=SOURCES)
    ap.add_argument('--final', action='store_true')
    args = ap.parse_args()
    version = args.version
    out = ROOT / 'reference/original-study' / version
    source = SOURCES[version]
    index = json.loads((out / ('recovered-index.json' if args.final else 'objects-index.json')).read_text())
    failed = {x['id']: x for x in index if 'error' in x}
    paths = [p for p in source.rglob('*') if p.is_file() and (p.suffix in ('.assets', '.bundle') or re.fullmatch(r'level\d+|globalgamemanagers', p.name))]
    env = UnityPy.load(*map(str, paths))
    install()
    generator = TypeTreeGenerator(json.loads((out / 'version.json').read_text())['unityVersion'])
    generator.load_local_dll_folder(str(source / 'Managed'))
    env.typetree_generator = generator
    set_reference_generator(generator)
    recovered, errors = [], []
    for o in env.objects:
        ident = f'{Path(o.assets_file.name).name}:{o.path_id}'
        if ident not in failed:
            continue
        entry = failed[ident].copy()
        try:
            if not entry.get('class'):
                raise ValueError('The original component has a null or unresolved script pointer.')
            changes = []
            try:
                data = o.read_typetree()
            except Exception:
                if not args.final:
                    raise
                tree = o.generate_monobehaviour_node()
                fix_generated_string_arrays(tree, changes)
                data = o.parse_as_dict(tree, check_read=True)
            # The dedicated fixed-layout header reader is authoritative for PPtrs.
            head = o.parse_monobehaviour_head()
            for key in ['m_GameObject', 'm_Script']:
                ptr = getattr(head, key)
                data[key] = {'m_FileID': ptr.m_FileID, 'm_PathID': ptr.m_PathID}
            data['m_Name'] = head.m_Name
            data['m_Enabled'] = head.m_Enabled
            rel = Path('objects') / safe(entry['class']) / f'{safe(entry["asset"])}--{entry["pathId"]}.json'
            entry['initialError'] = entry.pop('error')
            entry['json'] = str(rel)
            entry['recoveredWith'] = 'legacy v1 managed-reference reader; exact object byte count checked'
            entry['stringArraySchemaCorrections'] = changes
            dump(out / rel, {'_source': entry, 'data': data})
            recovered.append(entry)
        except Exception as exc:
            errors.append({'id': ident, 'class': entry.get('class'), 'error': str(exc)[:500]})
    recovered_map = {x['id']: x for x in recovered}
    merged = [recovered_map.get(x['id'], x) for x in index]
    dump(out / ('final-index.json' if args.final else 'recovered-index.json'), merged)
    dump(out / ('final-recovery-report.json' if args.final else 'recovery-report.json'), {'initialFailed': len(failed), 'recovered': len(recovered), 'countsByClass': collections.Counter(x['class'] for x in recovered), 'remaining': errors})
    # All language tables are retained. This is an index, not a lossy translation.
    tables, shared = [], {}
    external = json.loads((out / 'serialized-files.json').read_text())
    for x in merged:
        if x.get('class') not in ('StringTable', 'SharedTableData') or 'error' in x:
            continue
        obj = json.loads((out / x['json']).read_text())['data']
        if x['class'] == 'SharedTableData':
            shared[x['id']] = obj
    for x in merged:
        if x.get('class') != 'StringTable' or 'error' in x:
            continue
        obj = json.loads((out / x['json']).read_text())['data']
        ptr = obj['m_SharedData']
        asset = x['asset']
        if ptr['m_FileID']:
            asset = Path(external[asset]['externals'][ptr['m_FileID'] - 1]).name
        shared_id = f'{asset}:{ptr["m_PathID"]}'
        linked = shared.get(shared_id)
        keys = {v['m_Id']: v['m_Key'] for v in linked.get('m_Entries', [])} if linked else {}
        values = [{'id': str(v['m_Id']), 'key': keys.get(v['m_Id']), 'text': v['m_Localized'], 'metadata': v.get('m_Metadata')} for v in obj.get('m_TableData', [])]
        tables.append({'source': x['id'], 'name': obj['m_Name'], 'locale': obj['m_LocaleId']['m_Code'], 'collection': linked.get('m_TableCollectionName', linked.get('m_TableName')) if linked else None, 'guid': linked.get('m_TableCollectionNameGuidString', linked.get('m_TableNameGuidString')) if linked else None, 'sharedData': shared_id, 'unresolvedShared': linked is None, 'entries': values})
    dump(out / 'localization-tables.json', tables)
    print(json.dumps({'version': version, 'recovered': len(recovered), 'remaining': len(errors), 'localizationTables': len(tables), 'sharedTables': len(shared), 'unresolvedSharedTables': sum(x['unresolvedShared'] for x in tables), 'localizedEntries': sum(len(x['entries']) for x in tables), 'remainingByClass': collections.Counter(x['class'] for x in errors)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
