/** Evidence-backed item properties. Player appraisal and recorded sale prices are never inputs. */
import {REFERENCE_INSPECTIONS, type ReferenceInspectionTool} from './reference-inspections';
import {RECORDED_TAGS, RECORDED_TRANSACTIONS} from './reference-transactions';
import {REF_BOOK_TAGS, REF_BOOK_RECORDED_TAG_ALIASES} from './reference-book-data';
import {DEMO_CARDS,DEMO_ITEMS,DEMO_VISIT_ITEM_IDS,type DemoCard} from './demo-item-data';
import {DEMO_MATERIAL_SPRITES,DEMO_SIGNATURE_SPRITES} from './demo-tool-assets';
import {getNativeItem,getNativeCard,createNativeItem,estimateNativeCards,refineNativeCards,isTrueCard} from './native-rules';
import {inspectNativeItem} from './native-tools';
import type {NativeItemInstance} from './native-types';

export type InspectionTool = ReferenceInspectionTool;
export type EvidenceConfidence = 'observed' | 'manual-derived' | 'official-demo' | 'unknown';
export interface FactSource {kind:'video'|'manual'|'official-demo'|'identity-link';reference:string;timestamp?:number;note?:string}
export interface Readout {
  observation:string; source:FactSource[]; confidence:EvidenceConfidence;
  asset?:string; rect?:readonly [number,number,number,number]; bookPage?:string;
  year?:number; integrity?:number; needleAngle?:number; materialCardId?:string;
  hasSignature?:boolean; signatureSprite?:string; nativeCardIds?:string[];
  materialSprite?:string; materialTint?:{r:number;g:number;b:number;a:number};
}
export interface InspectionResult {
  status:'available'|'unsupported'|'unknown'; tool:string; itemDefinitionId:string|null;
  reason:string; readout?:Readout;
}
export interface AppraisalCard {id:string;group?:string}
export interface CardConstraint {
  field:string; correctCardIds:string[]; incorrectCardIds?:string[];
  required:boolean; exhaustive:boolean; reason:string; source:FactSource[];
  confidence:EvidenceConfidence;
}
export interface ItemFactDefinition {
  id:string; name:string; source:FactSource[];
  readouts:Partial<Record<InspectionTool,Readout>>;
  constraints:CardConstraint[];
  unsupportedTools?:InspectionTool[];
  /** Only true for a complete authoritative item-card list, never a recording's final cards. */
  completeCardEvidence?:boolean;
  officialIntegrity?:number;
  officialConditionCards?:{id:string;tier:number}[];
  nativeCards?:DemoCard[];
  nativeValue?:number;
  nativeDefinitionId?:string;
  nativeContent?:string;
  conflicts?:{field:string;videoObservation:string;officialValue:string;resolution:string;resolved?:boolean}[];
}
export interface AppraisalIssue {
  field:string;cardId?:string;expectedCardIds:string[];reason:string;
  source:FactSource[];confidence:EvidenceConfidence;
}
export interface AppraisalAudit {
  itemDefinitionId:string|null;
  knownWrong:AppraisalIssue[];knownMissing:AppraisalIssue[];unknownEvidence:AppraisalIssue[];
  checkedFields:string[];complete:boolean;
}
export type ItemFactQuery = string | {visitId?:string;itemDefinitionId?:string} | NativeItemInstance;
export const INSPECTION_TOOLS:readonly InspectionTool[]=['damage','material','year','signature','gem','screwdriver'];
const officialSource:FactSource={kind:'official-demo',reference:'HoochooGames.NoUmbrellasAllowed.dll:EvaluateAppraisal.evaluateConditionAppraisal',note:'Official Windows demo labelled 1.0.5; algorithm independently rewritten, not copied source.'};
const aliases:Record<string,string>={...REF_BOOK_RECORDED_TAG_ALIASES,
  'signature-businessman':'businessman-signature',
  blue_perfect:'perfect',blue_slightdmg:'slightly-damaged',blue_fairlydmg:'fairly-damaged',blue_novalue:'valueless'};
export const canonicalCardId=(id:string):string=>aliases[id]??id;
/** Official numeric definitions indexed by current UI IDs, original native IDs, and known book aliases. */
export const nativeCardById:Record<string,DemoCard>={};
for(const c of Object.values(DEMO_CARDS)){nativeCardById[c.nativeId]=c;const alias=canonicalCardId(c.id),old=nativeCardById[alias];if(!old||c.tier<old.tier)nativeCardById[alias]=c;}
for(const [alias,id] of Object.entries(aliases))if(nativeCardById[id])nativeCardById[alias]=nativeCardById[id];
nativeCardById['time-sensitive']={...DEMO_CARDS.blue_time_sensitive,id:'time-sensitive'};
const groups=new Map<string,string>();
for(const c of [...REF_BOOK_TAGS,...RECORDED_TAGS])groups.set(canonicalCardId(c.id),c.group);
for(const c of Object.values(DEMO_CARDS))groups.set(canonicalCardId(c.id),c.group);
const normalizeGroup=(group:string):string=>['material-brand','brand-reason','question'].includes(group)?'brand':group;
const groupOf=(c:AppraisalCard):string=>normalizeGroup(groups.get(canonicalCardId(c.id))??c.group??'unknown');
const manual=(page:string,timestamp?:number):FactSource=>({kind:'manual',reference:`/assets/book/${page}.png`,timestamp});
const video=(id:string,tool:string,timestamp:number):FactSource=>({kind:'video',reference:`reference-inspections:${id}/${tool}`,timestamp});

/** Explicit continuity links; deliberately excludes the purchased and gifted AVAC ID cards. */
export const ITEM_FACT_CONTINUITY_LINKS:Readonly<Record<string,{definitionId:string;reason:string}>>={
  'day7-backpack-resale':{definitionId:'day6-backpack-soldier',reason:'Inventory detail shows Bought at 45, same acquired backpack.'},
  'day7-boots-refused-sale':{definitionId:'day6-combat-boots',reason:'Recorded acquisition and subsequent unsold boots display.'},
  'day9-boots-declined-sale':{definitionId:'day6-combat-boots',reason:'Same boots remained unsold after day 7 rejection.'},
  'day8-fixie-bag-sale':{definitionId:'day7-fixie-bag',reason:'Recorded unique acquisition then displayed sale.'},
  'day8-golden-glasses-sale':{definitionId:'day7-golden-glasses',reason:'Inventory detail retains Bought at 75.'},
  'day8-doll-declined-sale':{definitionId:'day8-doll',reason:'Recorded doll purchase followed by unsold display.'},
  'day9-doll-sale':{definitionId:'day8-doll',reason:'Same unsold doll subsequently requested; explicit video audit link.'},
  'day9-bookmark-sale':{definitionId:'day7-bookmark',reason:'Inventory detail retains Bought at 350.'},
  'day10-crocodile-sale':{definitionId:'day8-crocodile',reason:'Recorded acquired painting displayed in inventory; price remains unknown.'},
  'day10-time-device-sale':{definitionId:'day9-time-device',reason:'Recorded unique Prof. Choi device acquisition and following-day sale.'},
  'day11-rabbit-sale':{definitionId:'day8-rabbit',reason:'Inventory detail retains Bought at 1789.'},
  'day9-my-mom-declined-sale':{definitionId:'day8-my-mom',reason:'Inventory detail retains Bought at 50; later signature evidence belongs to this item.'},
};

/** Exact normal-condition tolerance from the official demo; special tiered cards override it. */
export function conditionCardCandidates(integrity:number,specialCards:readonly {id:string;tier:number}[]=[]):string[]{
  if(!Number.isFinite(integrity)||integrity<0||integrity>100)return [];
  const special=specialCards.reduce<{id:string;tier:number}|undefined>((best,c)=>!best||c.tier>best.tier?c:best,undefined);
  if(special&&special.tier>0)return [canonicalCardId(special.id)];
  const candidates=integrity<=5?['perfect']:integrity<=15?['perfect','slightly-damaged']:
    integrity<=25?['slightly-damaged']:integrity<=35?['slightly-damaged','fairly-damaged']:
    integrity<=50?['fairly-damaged']:integrity<=65?['fairly-damaged','valueless']:['valueless'];
  // The source validator accepts an exact sole condition card before consulting the gauge tolerance.
  if(specialCards.length===1)candidates.push(canonicalCardId(specialCards[0].id));
  return [...new Set(candidates)];
}

const exact=(field:string,ids:string[],reason:string,source:FactSource[],required=true):CardConstraint=>({field,correctCardIds:ids.map(canonicalCardId),required,exhaustive:true,reason,source,confidence:'manual-derived'});
const physicalMaterials:Record<string,string>={
  'day6-backpack-soldier':'canvas','day6-combat-boots':'ee-pvc-premium',
  'day7-fixie-bag':'ff-fabric','day7-bookmark':'gold-24k','day8-doll':'cotton',
  'day8-rabbit':'wooden','day9-seoul-stamp':'paper','day11-meaningful-paper':'paper',
};
const knownArtistPages:Record<string,string>={
  'day7-fixie-bag':'celebrity-ahn-lee','day8-crocodile':'celebrity-ahn-lee',
  'day8-rabbit':'celebrity-lee-choi','day8-doll':'celebrity-moo-mo',
};

function videoDefinitions():ItemFactDefinition[]{
  const map=new Map<string,ItemFactDefinition>();
  for(const t of RECORDED_TRANSACTIONS){
    if(!t.item)continue;
    const id=ITEM_FACT_CONTINUITY_LINKS[t.id]?.definitionId??t.id;
    if(!map.has(id))map.set(id,{id,name:t.item.name,source:[],readouts:{},constraints:[],unsupportedTools:['screwdriver']});
  }
  for(const r of REFERENCE_INSPECTIONS){
    const id=ITEM_FACT_CONTINUITY_LINKS[r.transactionId]?.definitionId??r.transactionId;
    const d=map.get(id);if(!d)continue;
    const source=[video(r.transactionId,r.tool,r.timestamp)];
    const readout:Readout={observation:r.observation,source,confidence:'observed',asset:r.asset,rect:[...r.rect],bookPage:r.bookPage};
    if(r.tool==='year'&&/^\d{4}$/.test(r.observation))readout.year=Number(r.observation);
    if(r.tool==='signature'&&r.observation==='No Signature Found')readout.hasSignature=false;
    else if(r.tool==='signature')readout.hasSignature=true;
    if(r.tool==='material'&&physicalMaterials[id])readout.materialCardId=physicalMaterials[id];
    d.readouts[r.tool]=readout;d.source.push(...source);
  }
  for(const d of map.values()){
    const material=d.readouts.material;
    if(material?.materialCardId)d.constraints.push(exact('material',[material.materialCardId],`Observed texture matches the manual's ${material.materialCardId} sample.`,[...material.source,manual(material.materialCardId.startsWith('ee-')?'brand-easy-enough':material.materialCardId.startsWith('ff-')?'brand-fxxx-fxxx':'material')]));
    const year=d.readouts.year;
    if(year?.year!==undefined){
      const antique=year.year<2000;
      d.constraints.push({field:'history',correctCardIds:antique?['archaeological']:[],incorrectCardIds:antique?[]:['archaeological'],required:antique,exhaustive:false,reason:antique?`Production year ${year.year} meets the pre-2000 archaeological rule.`:`Production year ${year.year} rules out pre-2000 archaeology; other historical relevance is not established by year alone.`,source:[...year.source,manual('history')],confidence:'manual-derived'});
    }
    const signature=d.readouts.signature;
    if(signature?.hasSignature===false)d.constraints.push(exact('signature',[],'Detector explicitly reports no signature; adding a signature category is unsupported by this item.',signature.source,false));
    else if(signature&&knownArtistPages[d.id])d.constraints.push(exact('signature',['artist-signature'],'Observed autograph matches a painter, sculptor, or actor in the recorded celebrity page.',[...signature.source,manual(knownArtistPages[d.id])]));
    // The figure-category ambiguity for Emily, Choi, and Hwang remains unknown, not the recording's chosen answer.
    if(d.id==='day6-backpack-soldier')d.constraints.push(exact('brand',['wrong-material'],'Canvas is outside Easy Enough exclusive materials; the displayed Easy Enough claim therefore fails its material requirement.',[...(material?.source??[]),manual('brand-easy-enough'),manual('brand-wildcards')]));
    if(d.id==='day8-rabbit')d.constraints.push(exact('artwork',['deceased-artist'],'The matched sculptor is explicitly considered dead in the manual; the artwork hierarchy selects deceased artist.',[...(signature?.source??[]),manual('celebrity-lee-choi'),manual('artwork-help')]));
    if(d.id==='day8-gioconda')d.constraints.push(exact('artwork',['failed-piece','poor-piece','fine-piece'],'An unsigned artwork uses the unknown-artist set; picture quality itself is not established by the detector.',[...(signature?.source??[]),manual('artwork-help')]));
    if(d.id==='day8-doll')d.constraints.push(exact('popularity',['popular-youth'],'The matched actor page explicitly says youngsters like him.',[...(signature?.source??[]),manual('celebrity-moo-mo')]));
    if(d.id==='day11-meaningful-paper'){
      d.constraints.push(exact('signature',['politician-signature'],'The observed HAN, Sol autograph matches the former president on the recorded page.',[...(signature?.source??[]),manual('celebrity-gong-han')]));
      d.constraints.push(exact('popularity',['popular'],'HAN, Sol is explicitly described as retaining great popularity.',[...(signature?.source??[]),manual('celebrity-gong-han')]));
    }
  }
  return [...map.values()];
}

export function createItemFactRegistry(definitions:readonly ItemFactDefinition[],links:Readonly<Record<string,{definitionId:string;reason:string}>>={}){
  const byId=new Map<string,ItemFactDefinition>(definitions.map(d=>[d.id,structuredClone(d)]));
  const identityLinks=new Map(Object.entries(links));
  function resolve(query:ItemFactQuery):ItemFactDefinition|undefined{
    const key=typeof query==='string'?query:'definitionId' in query?query.definitionId:query.itemDefinitionId??query.visitId;
    return key?byId.get(identityLinks.get(key)?.definitionId??key):undefined;
  }
  function getItemFacts(query:ItemFactQuery):ItemFactDefinition|undefined{
    const d=resolve(query);return d?structuredClone(d):undefined;
  }
  function inspectItem(query:ItemFactQuery,tool:string):InspectionResult{
    const d=resolve(query);
    if(!INSPECTION_TOOLS.includes(tool as InspectionTool))return {status:'unsupported',tool,itemDefinitionId:d?.id??null,reason:'Unknown tool identifier.'};
    if(!d)return {status:'unknown',tool,itemDefinitionId:null,reason:'No explicitly identified item definition.'};
    const readout=d.readouts[tool as InspectionTool];
    if(readout)return {status:'available',tool,itemDefinitionId:d.id,reason:'A source-backed readout is available.',readout:structuredClone(readout)};
    if(d.unsupportedTools?.includes(tool as InspectionTool))return {status:'unsupported',tool,itemDefinitionId:d.id,reason:'This tool does not apply to the explicitly identified item type.'};
    return {status:'unknown',tool,itemDefinitionId:d.id,reason:'No readout has been established. This is not a negative or empty measurement.'};
  }
  function auditAppraisal(query:ItemFactQuery,publicCards:readonly (string|AppraisalCard)[],hiddenCards:readonly (string|AppraisalCard)[]=[]):AppraisalAudit{
    const d=resolve(query);
    const result:AppraisalAudit={itemDefinitionId:d?.id??null,knownWrong:[],knownMissing:[],unknownEvidence:[],checkedFields:[],complete:false};
    const cards=[...publicCards,...hiddenCards].map(c=>typeof c==='string'?{id:canonicalCardId(c)}:{...c,id:canonicalCardId(c.id)});
    if(!d){result.unknownEvidence.push({field:'item',expectedCardIds:[],reason:'No explicit item identity; names are never used as an automatic join.',source:[],confidence:'unknown'});return result;}
    const rules=structuredClone(d.constraints);
    if(d.officialIntegrity!==undefined){
      const candidateIds=conditionCardCandidates(d.officialIntegrity,d.officialConditionCards);
      if(candidateIds.length)rules.push({...exact('condition',candidateIds,`Official integrity ${d.officialIntegrity}, with the documented condition-card tolerance.`,[officialSource]),confidence:'official-demo'});
    }
    for(const rule of rules){
      const selected=cards.filter(c=>groupOf(c)===rule.field);
      const issue=(cardId?:string):AppraisalIssue=>({field:rule.field,cardId,expectedCardIds:[...rule.correctCardIds],reason:rule.reason,source:structuredClone(rule.source),confidence:rule.confidence});
      result.checkedFields.push(rule.field);
      if(!selected.length){if(rule.required)result.knownMissing.push(issue());continue;}
      for(const c of selected){
        if(rule.correctCardIds.includes(c.id))continue;
        if(rule.exhaustive||rule.incorrectCardIds?.includes(c.id))result.knownWrong.push(issue(c.id));
        else result.unknownEvidence.push({...issue(c.id),reason:'This card is not determined by the partial evidence. '+rule.reason,confidence:'unknown'});
      }
    }
    const checked=new Set(result.checkedFields);
    for(const card of cards){const field=groupOf(card);if(checked.has(field)||field==='shop'||field==='type')continue;
      result.unknownEvidence.push({field,cardId:card.id,expectedCardIds:[],reason:'No authoritative rule for this item/category; the recorded player card is not ground truth.',source:d.source,confidence:'unknown'});
    }
    for(const tool of ['damage','material','year','signature'] as const){
      const field={damage:'condition',material:'material',year:'history',signature:'signature'}[tool];
      if(!checked.has(field))result.unknownEvidence.push({field,expectedCardIds:[],reason:d.readouts[tool]?'Readout exists, but its exact card classification is not established.':'No source-backed readout for this item property.',source:d.readouts[tool]?.source??[],confidence:'unknown'});
    }
    result.checkedFields=[...new Set(result.checkedFields)];
    result.complete=!!d.completeCardEvidence&&result.unknownEvidence.length===0;
    return result;
  }
  /** Explicit admission hook for separately verified official item assets, never for player tags. */
  function addVerifiedItemDefinition(definition:ItemFactDefinition,visitIds:readonly string[]=[]){
    byId.set(definition.id,structuredClone(definition));
    for(const id of visitIds)identityLinks.set(id,{definitionId:definition.id,reason:'Explicit authoritative item mapping.'});
  }
  return {getItemFacts,inspectItem,auditAppraisal,addVerifiedItemDefinition};
}

export const VIDEO_ITEM_FACT_DEFINITIONS:readonly ItemFactDefinition[]=videoDefinitions();
const registry=createItemFactRegistry(VIDEO_ITEM_FACT_DEFINITIONS,ITEM_FACT_CONTINUITY_LINKS);
export const {getItemFacts,addVerifiedItemDefinition}=registry;
function nativeQuery(query:ItemFactQuery):NativeItemInstance|undefined{
 if(typeof query==='object'&&'definitionId' in query)return query;
 const id=registry.getItemFacts(query)?.nativeDefinitionId;
 return id?createNativeItem(id,{randomizeJewelry:false}):undefined;
}
export function inspectItem(query:ItemFactQuery,tool:string):InspectionResult{
 const native=nativeQuery(query),old=registry.inspectItem(query,tool);
 if(!native||!INSPECTION_TOOLS.includes(tool as InspectionTool))return old;
 const result=inspectNativeItem(native,tool as InspectionTool);
 if(result.status!=='available')return {...old,status:result.status==='source-error'?'unknown':'unsupported',reason:result.reason,readout:undefined};
 const source:FactSource={kind:'official-demo',reference:`${result.sourceToolId}:${native.definitionId}`,note:'Original Windows 1.0.5 measurements; independent of player or NPC appraisal.'};
 return {status:'available',tool,itemDefinitionId:old.itemDefinitionId??native.definitionId,reason:result.reason,readout:{...old.readout,observation:result.observation??(result.open?'Opened mechanism':'Closed mechanism'),source:[source,...(old.readout?.source??[])],confidence:'official-demo',year:result.year,integrity:result.integrity,needleAngle:result.needleAngle,hasSignature:result.hasSignature,signatureSprite:tool==='signature'?result.sprite?.asset:undefined,materialSprite:tool==='material'?result.sprite?.asset:undefined,materialCardId:result.materialCardId?canonicalCardId(DEMO_CARDS[result.materialCardId]?.id??result.materialCardId):undefined,materialTint:result.materialTint,nativeCardIds:result.assumedCard?[result.assumedCard.id]:undefined,...(tool==='screwdriver'?{asset:result.sprite?.asset}:{}),bookPage:old.readout?.bookPage??result.bookPage}};
}
export function auditAppraisal(query:ItemFactQuery,publicCards:readonly(string|AppraisalCard)[],hiddenCards:readonly(string|AppraisalCard)[]=[]):AppraisalAudit{
 const native=nativeQuery(query);if(!native)return registry.auditAppraisal(query,publicCards,hiddenCards);
 const facts=registry.getItemFacts(query),source=facts?.source??[];
 const selected=[...publicCards,...hiddenCards].map(c=>typeof c==='string'?c:c.id);
 const cards=selected.map(id=>({id:canonicalCardId(id),card:getNativeCard(nativeCardById[id]?.nativeId??id,{factory:true})}));
 const actual=refineNativeCards(native.cardIds),categories=new Set([...actual.map(c=>c.category),...cards.flatMap(c=>c.card?[c.card.category]:[])]);
 const result:AppraisalAudit={itemDefinitionId:facts?.id??native.definitionId,knownWrong:[],knownMissing:[],unknownEvidence:[],checkedFields:[],complete:true};
 for(const category of categories){
  if(['trusted','appraised','recommended','repair','lost'].includes(category))continue;
  const field=DEMO_CARDS[actual.find(c=>c.category===category)?.id??'']?.group??({figure:'signature',art:'artwork',product:'type'}[category]??category);
  result.checkedFields.push(field);
  const expected=actual.filter(c=>c.category===category).map(c=>canonicalCardId(DEMO_CARDS[c.id]?.id??c.id));
  const inCategory=cards.filter(c=>c.card?.category===category);
  const issue=(cardId?:string):AppraisalIssue=>({field,cardId,expectedCardIds:expected,reason:'Original EvaluateAppraisal category rule, independently checked against all serialized item/card pairs.',source,confidence:'official-demo'});
  if(!inCategory.length&&expected.length)result.knownMissing.push(issue());
  for(const c of inCategory)if(!isTrueCard(native,c.card!))result.knownWrong.push(issue(c.id));
 }
 for(const c of cards)if(!c.card||c.card.category==='lost'){result.unknownEvidence.push({field:'unknown',cardId:c.id,expectedCardIds:[],reason:'No identified source card.',source,confidence:'unknown'});result.complete=false;}
 return result;
}

function arithmetic(cards:readonly DemoCard[],rate=0):number|null{
  if(!Number.isFinite(rate)||cards.some(c=>c.value===null))return null;
  let n=cards.filter(c=>c.operator==='base'||c.operator==='add').reduce((sum,c)=>sum+c.value!,0);
  for(const c of cards){if(c.operator==='multiply')n*=c.value!;else if(c.operator==='percent')n*=1+c.value!/100;}
  return Math.max(0,Math.floor(n*(1+rate/100)+1e-7));
}

/** Fair value from original item facts, distinct from the player's frozen inventory appraisal. */
export function valuationForItem(query:ItemFactQuery,shopRate=0):number|null{
  const item=nativeQuery(query);if(item)return estimateNativeCards([...item.cardIds,getNativeCard(`pink_appraised_${shopRate}`,{factory:true})!]);
  const cards=getItemFacts(query)?.nativeCards;return cards?arithmetic(cards,shopRate):null;
}

function admitOfficialDefinitions(){
  const categories=[...new Set(Object.values(DEMO_CARDS).map(c=>c.group))].filter(c=>!['','type','yellow','repair'].includes(c));
  for(const raw of Object.values(DEMO_ITEMS)){
    const visitIds=Object.entries(DEMO_VISIT_ITEM_IDS).filter(([,id])=>id===raw.id).map(([id])=>id);
    const original=visitIds.map(id=>registry.getItemFacts(id)).filter((d):d is ItemFactDefinition=>!!d);
    const source:FactSource={kind:'official-demo',reference:`resources.assets:Item/${raw.id}`,note:'Official Windows demo labelled 1.0.5; explicit title/property/continuity mapping, not player appraisal.'};
    const cardList=raw.cardIds.map(id=>DEMO_CARDS[id]).filter(Boolean);
    const byCategory=new Map<string,DemoCard>();
    for(const c of cardList){const previous=byCategory.get(c.group);if(!previous||c.tier>previous.tier)byCategory.set(c.group,c);}
    const nativeCards=refineNativeCards(raw.cardIds).map(c=>DEMO_CARDS[c.id]).filter(Boolean).map(c=>({...c,id:canonicalCardId(c.id)}));
    const readouts:ItemFactDefinition['readouts']={};
    for(const d of original)Object.assign(readouts,d.readouts);
    const material=nativeCards.find(c=>c.group==='material');
    readouts.year={...readouts.year,observation:String(raw.year),year:raw.year,source:[source,...(readouts.year?.source??[])],confidence:'official-demo',bookPage:raw.year<2000?'history':'chronology-recent'};
    readouts.damage={...readouts.damage,observation:`Integrity ${raw.integrity}`,integrity:raw.integrity,needleAngle:52.7-1.054*raw.integrity,source:[source,...(readouts.damage?.source??[])],confidence:'official-demo',bookPage:'condition'};
    if(material)readouts.material={...readouts.material,observation:material.label,materialCardId:material.id,materialSprite:DEMO_MATERIAL_SPRITES[material.nativeId]?.asset,materialTint:{...raw.materialTint},source:[source,...(readouts.material?.source??[])],confidence:'official-demo',bookPage:'material'};
    readouts.signature={...readouts.signature,observation:raw.signaturePathId!==0?(readouts.signature?.observation??`Signature sprite ${raw.signaturePathId}`):'No Signature Found',hasSignature:raw.signaturePathId!==0,signatureSprite:DEMO_SIGNATURE_SPRITES[String(raw.signaturePathId)]?.asset,source:[source,...(readouts.signature?.source??[])],confidence:'official-demo',bookPage:'celebrity-index'};
    const constraints:CardConstraint[]=categories.filter(field=>field!=='condition').map(field=>{
      const selected=nativeCards.filter(c=>c.group===field);
      return {...exact(field,selected.map(c=>c.id),selected.length?`Official item ${raw.id} contains ${selected.map(c=>c.label).join(', ')} as its highest-tier ${field} card.`:`Official item ${raw.id} has no ${field} card.`,[source],selected.length>0),confidence:'official-demo'};
    });
    const conflicts:NonNullable<ItemFactDefinition['conflicts']>=raw.id==='happyCrocTears'?[{field:'material',videoObservation:'Previous human annotation called the visible surface Canvas.',officialValue:'Paper (green_paper)',resolution:'Annotation corrected after direct texture comparison: normalized correlation Paper 0.864 versus Canvas 0.370; see docs/research/crocodile-material-comparison.json. This supports Paper, without claiming full-frame pixel identity.',resolved:true}]:[];
    const nativeValue=estimateNativeCards(createNativeItem(raw.id,{randomizeJewelry:false}).cardIds);
    const definition:ItemFactDefinition={id:`demo:${raw.id}`,name:raw.name,source:[source],readouts,constraints,unsupportedTools:['screwdriver',...(cardList.some(c=>c.group==='jewel')?[]:['gem' as const])],officialIntegrity:raw.integrity,officialConditionCards:cardList.filter(c=>c.group==='condition').map(c=>({id:c.id,tier:c.tier})),nativeCards,nativeDefinitionId:raw.id,nativeContent:raw.content,completeCardEvidence:conflicts.every(c=>c.resolved),conflicts,...(nativeValue===null?{}:{nativeValue})};
    if(raw.openSpritePathId)definition.unsupportedTools=definition.unsupportedTools?.filter(t=>t!=='screwdriver');
    registry.addVerifiedItemDefinition(definition,[...visitIds,raw.id]);
  }
}
admitOfficialDefinitions();
