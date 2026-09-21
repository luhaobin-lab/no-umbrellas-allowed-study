#!/usr/bin/env python3
"""Independent consistency gate for research artifacts, not game parity tests."""
import argparse
import collections
import datetime
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'reference/original-study'
DOCS = ROOT / 'docs/original-study'


def load(path):
    return json.loads(path.read_text())


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda: f.read(1024 * 1024), b''):
            h.update(data)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--skip-source-hashes', action='store_true')
    args = ap.parse_args()
    catalog = load(DOCS / 'item-tool-catalog.json')
    output = {'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': 'Read-only source integrity, complete enumerations, cross-parser agreement and direct-probe coverage; does not prove all Unity scenes or behavioral sequences executed.', 'versions': {}, 'failures': []}

    def check(condition, label):
        if not condition:
            output['failures'].append(label)

    for version, short in [('windows-1.0.5-demo', 'windows'), ('mac-0.2.5-demo', 'mac')]:
        folder = BASE / version
        idx = load(folder / 'final-index.json')
        index = {x['id']: x for x in idx}
        extraction = load(folder / 'extraction-report.json')
        headers = load(folder / 'header-verification.json')
        original = load(folder / 'source-files.json')
        items = catalog['versions'][version]
        events = load(BASE / 'npc' / f'event-models-{version}.json')
        progression = load(BASE / 'progression' / f'catalog-{version}.json')
        check(len(index) == len(idx), version + ': duplicate serialized object identity')
        errors = [x for x in idx if x.get('error')]
        check(all(x['type'] == 'MonoBehaviour' and not x.get('class') and 'm_PathID == 0' in x['error'] for x in errors), version + ': a non-orphan object failed to decode')
        mono = [x for x in idx if x['type'] == 'MonoBehaviour' and x.get('class') and not x.get('error')]
        check(headers['checked'] == len(mono) and not headers['errors'], version + ': native headers not completely verified')
        for cls, data_key in [('Item', 'items'), ('Card', 'cards')]:
            expected = {x['id'] for x in mono if x['class'] == cls}
            observed = {x['source']['id'] for x in items[data_key]}
            check(expected == observed, version + ': ' + cls + ' catalog coverage differs')
            check(len({x['id'] for x in items[data_key]}) == len(items[data_key]), version + ': duplicate named ' + cls)
        expected_events = {x['id'] for x in mono if x['class'] == 'StoreEvent'}
        check(expected_events == {x['sourceId'] for x in events['events']}, version + ': NPC event coverage differs')
        check(not events['unresolvedPointers'], version + ': unresolved NPC data pointers')
        manual_row = next(x for x in mono if x['class'] == 'ManualConfig')
        generic_manual = load(folder / manual_row['json'])['data']
        independent_manual = load(BASE / 'items' / f'manual-config-{short}.json')['data']
        stripped = [{k: v for k, v in x.items() if k != 'resolvedPageID'} for x in independent_manual['manualPages']]
        check(generic_manual['manualPageIDs'] == independent_manual['manualPageIDs'], version + ': manual page IDs disagree between parsers')
        check(generic_manual['manualPages'] == stripped, version + ': manual fields disagree between independent parsers')
        check(set(generic_manual['manualPageIDs']) == {x['id'] for x in items['manual']['pages']}, version + ': not all manual pages indexed')
        check(not any(x['unresolvedObjects'] for x in items['manual']['pages']), version + ': unresolved manual subtree')
        for item in items['items']:
            check(set(item['tools']) == {'integrity', 'year', 'material', 'signature', 'screwdriver', 'jewel'}, version + ': tool coverage missing for ' + item['id'])
            if item['loadable']:
                check(item.get('dllObservation', {}).get('kind') == 'item', version + ': missing original-DLL observation for ' + item['id'])
            native = load(folder / index[item['source']['id']]['json'])['data']
            check(native['m_Script'] == item['raw']['m_Script'], version + ': stale generated script header in item catalog ' + item['id'])
        probes = [json.loads(line) for line in (BASE / 'items' / f'{short}-dll-probe.jsonl').read_text().splitlines() if line.strip()]
        grids = [x for x in probes if x['kind'] == 'appraisal-grid']
        tested_pairs = sum(x['testedSerializedCards'] for x in grids)
        if short == 'windows':
            check(tested_pairs == len(items['items']) * len(items['cards']), version + ': incomplete native item/card truth grid')
        legacy_proof = None
        if short == 'mac':
            legacy = [json.loads(line) for line in (BASE / 'items/mac-legacy-appraisal-probe.jsonl').read_text().splitlines() if line.strip()]
            legacy_grid = [x for x in legacy if x['kind'] == 'legacy-truth-grid']
            legacy_truth_calls = sum(x['testedCards'] for x in legacy_grid)
            check(legacy_truth_calls == items['counts']['loadableItems'] * len(items['cards']) * 2, version + ': incomplete old appraisal two-state grid')
            check(not any(x['kind'] == 'error' for x in legacy), version + ': original legacy probe failed')
            legacy_proof = {'truthCalls': legacy_truth_calls, 'kinds': dict(collections.Counter(x['kind'] for x in legacy)), 'report': 'reference/original-study/items/mac-legacy-appraisal-probe.jsonl'}
        locales = load(folder / 'localization-tables.json')
        unknown_tables = [x for x in locales if x['unresolvedShared']]
        check(all(x['sharedData'].endswith(':0') for x in unknown_tables), version + ': lost non-null shared localization table')
        check(all(x['collection'] and x['guid'] for x in locales if not x['unresolvedShared']), version + ': collection identity missing')
        check(not progression['summary']['errors'] if 'summary' in progression else not progression.get('errors'), version + ': Odin decode error')
        source_changes = []
        if not args.skip_source_hashes:
            for record in original['files']:
                p = Path(original['sourceRoot']) / record['path']
                if not p.exists() or p.stat().st_size != record['bytes'] or sha(p) != record['sha256']:
                    source_changes.append(record['path'])
            check(not source_changes, version + ': source files changed')
        il = []
        for f in sorted(folder.glob('il-*.json')):
            d = load(f)
            check(sha(Path(d['assembly'])) == d['sha256'], version + ': IL inventory assembly hash mismatch')
            il.append({'file': str(f.relative_to(ROOT)), 'sha256': sha(f), 'methodBodies': len(d['records']), 'literalFields': len(d.get('literalFields', [])), 'instructionConstants': sum(len(x['constants']) for x in d['records'])})
        output['versions'][version] = {'versionMetadata': load(folder / 'version.json'), 'sourceFiles': len(original['files']), 'sourceHashesChecked': not args.skip_source_hashes, 'sourceChanges': source_changes, 'objectsIndexed': len(idx), 'nonNullScriptComponentsDecoded': len(mono), 'sourceNullScriptComponents': len(errors), 'catalog': items['counts'], 'storeEvents': len(events['events']), 'nativeItemCardTruthPairs': tested_pairs, 'itemProbeKinds': dict(collections.Counter(x['kind'] for x in probes)), 'manualIndependentParserAgreement': True, 'localizationTables': len(locales), 'localizedEntries': sum(len(x['entries']) for x in locales), 'nullSharedLocalizationTables': [{'name': x['name'], 'source': x['source']} for x in unknown_tables], 'ilInventories': il}
        if legacy_proof:
            output['versions'][version]['legacyAppraisal'] = legacy_proof
    diff = load(BASE / 'npc/local-differential.json')
    output['currentPrototypeDifferential'] = {'scope': diff['scope'], 'cases': diff['tests'], 'matches': diff['matching'], 'mismatches': len(diff['differences']), 'report': 'reference/original-study/npc/local-differential.json'}
    item_check = load(BASE / 'items/validation-report.json')
    npc_check = load(BASE / 'npc/verification.json')
    progression_check = load(BASE / 'progression/verification.json')
    check(item_check['passed'], 'item research validation failed')
    check(not npc_check['probeErrors'] and npc_check['allEventBasicPointersResolved'], 'NPC probe or reference failure')
    check(progression_check['passed'], 'progression research validation failed')
    output['independentDomainChecks'] = {
        'items': {'report': 'reference/original-study/items/validation-report.json', 'passed': item_check['passed']},
        'npc': {'report': 'reference/original-study/npc/verification.json', 'probeErrors': npc_check['probeErrors'], 'allEventBasicPointersResolved': npc_check['allEventBasicPointersResolved'], 'coverage': npc_check['probeRecordsByKind']},
        'progression': {'report': 'reference/original-study/progression/verification.json', 'passed': progression_check['passed'], 'directDllAssertions': progression_check['directDllAssertions'], 'versions': progression_check['versions']},
    }
    for name, evidence in item_check['artifacts'].items():
        check(sha(DOCS / name) == evidence['sha256'], 'stale item artifact hash: ' + name)
    for name, evidence in npc_check['files'].items():
        check(sha(ROOT / name) == evidence['sha256'], 'stale NPC artifact hash: ' + name)
    links_checked = 0
    for path in DOCS.glob('*.md'):
        for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', path.read_text()):
            target = target.split('#', 1)[0]
            if not target or '://' in target or target.startswith('mailto:'):
                continue
            links_checked += 1
            check((path.parent / target).exists(), f'broken local documentation link: {path.name} -> {target}')
    output['localDocumentationLinksChecked'] = links_checked
    output['sourceConsistencyPassed'] = not output['failures']
    output['allOriginalBehaviorExecuted'] = False
    output['prototypeMatchesAllOriginalRules'] = False
    output['artifacts'] = [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in sorted(DOCS.glob('*')) if p.is_file() and p.name != 'RESEARCH_VERIFICATION.json']
    target = DOCS / 'RESEARCH_VERIFICATION.json'
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'sourceConsistencyPassed': output['sourceConsistencyPassed'], 'failures': output['failures'][:30], 'failureCount': len(output['failures']), 'report': str(target)}, ensure_ascii=False))
    raise SystemExit(0 if output['sourceConsistencyPassed'] else 1)


if __name__ == '__main__':
    main()
