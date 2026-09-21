import {writeFileSync} from 'node:fs';
import {REFERENCE_INSPECTIONS} from '../src/reference-inspections';
import {RECORDED_TRANSACTIONS} from '../src/reference-transactions';
import {REF_BOOK_TAGS} from '../src/reference-book-data';

const tools=['damage','material','year','signature','gem','screwdriver'] as const;
const records=RECORDED_TRANSACTIONS.filter(t=>t.item).map(t=>({
  transactionId:t.id,
  itemName:t.item!.name,
  saleType:t.saleType,
  sourceVersion:'1.0.5 user-provided video',
  fields: Object.fromEntries(tools.map(tool=>{
    const rows=REFERENCE_INSPECTIONS.filter(r=>r.transactionId===t.id&&r.tool===tool);
    return [tool,rows.length?{
      status:'observed-readout',
      evidence:rows.map(r=>({timestamp:r.timestamp,observation:r.observation,asset:r.asset,bookPage:r.bookPage??null})),
      playerTagsAreGroundTruth:false,
      numericYear:tool==='year'&&/^\d{4}$/.test(rows[0].observation)?Number(rows[0].observation):null,
    }:{status:'unknown-unobserved',evidence:[],defaultResult:null,admitSyntheticReadout:false}];
  })),
  lastPlayerAppraisal: t.states.at(-1)?.tags??t.initialTags,
  lastPlayerAppraisalCorrectness:'not-established-by-recording',
}));
const report={
  schemaVersion:1,researchDate:'2026-09-21',
  policy:'Read-only research manifest. Missing means unknown, never empty, false, zero, or another item readout.',
  toolApplicability:{
    damage:{input:'physical item',output:'condition gauge',unknownThresholds:true},
    material:{input:'physical item surface',output:'material texture',unknownAttributesMustRemainUnknown:true},
    year:{input:'physical item',output:'production year digits',outsideItemDisplayIsNotAnItemYear:true},
    signature:{input:'physical item',output:'signature glyph or explicitly observed absence',unknownGlyphIsNotNecessarilyFake:true},
    gem:{input:'gem-bearing item',output:'gem properties; scanner does not prove missing socket absence',noVideoResult:true},
    screwdriver:{input:'watch',output:'movement construction and engraving',noVideoResult:true,nonWatch:'not-applicable'},
  },
  summary:{itemVisits:records.length,observedReadouts:REFERENCE_INSPECTIONS.length,byTool:Object.fromEntries(tools.map(t=>[t,REFERENCE_INSPECTIONS.filter(r=>r.tool===t).length])),unknownToolItemPairs:records.reduce((n,r)=>n+Object.values(r.fields).filter(f=>f.status==='unknown-unobserved').length,0)},
  unresolvedBookNumericCards:REF_BOOK_TAGS.filter(t=>t.value===null).map(t=>({id:t.id,label:t.label,sourceTimestamp:t.sourceTimestamp,value:null,status:'visible-label-value-unobserved'})),
  records,
};
writeFileSync('docs/research/inspection-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
