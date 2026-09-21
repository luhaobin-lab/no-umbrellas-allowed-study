/** Exact raster crops and measured hit areas from the user-provided reference video.
 * Coordinates are local to the 570 × 800 crop at video x=1350, y=155.
 * null numeric values mean not evidenced in this recording; do not invent them.
 */
export type ReferenceBookRect = readonly [number, number, number, number];
export interface ReferenceBookTag {
  id: string; label: string; group: string;
  operator: 'add' | 'percent' | 'multiply' | 'none';
  value: number | null; verified: boolean; sourceTimestamp: number;
  note?: string;
}
export interface ReferenceBookHotspot {
  id: string; kind: 'tag' | 'jump' | 'info' | 'locked' | 'close';
  rect: ReferenceBookRect; label: string; tagId?: string; target?: string;
  note?: string;
}
export interface ReferenceBookPage {
  id: string; title: string; chapter: string; assetURL: string; timestamp: number;
  hotspots: ReferenceBookHotspot[]; previous?: string; next?: string;
  note?: string;
}
const tag = (id: string, label: string, group: string, operator: ReferenceBookTag['operator'], value: number | null, sourceTimestamp: number, note?: string): ReferenceBookTag => ({id,label,group,operator,value,verified:value !== null,sourceTimestamp,note});
export const REF_BOOK_TAGS: ReferenceBookTag[] = [
  tag('perfect','In Perfect Condition','condition','percent',10,120),
  tag('slightly-damaged','Slightly Damaged','condition','percent',-20,120),
  tag('fairly-damaged','Fairly Damaged','condition','percent',-60,120),
  tag('valueless','Valueless','condition','percent',-90,120),
  tag('potential-garbage','Potential Garbage','condition','none',null,120),
  tag('stainless-steel','Stainless Steel','material','add',50,2610),
  tag('paper','Paper','material','add',5,1670),
  tag('plastic','Plastic','material','add',5,2450),
  tag('canvas','Canvas','material','add',0,177.5),
  tag('wooden','Wooden','material','add',0,3390),
  tag('24k-gold','24K Gold','material','add',500,2870),
  tag('easy-enough','Brand <Easy Enough>','brand','add',80,120),
  tag('ff-fabric','FF Fabric','material','add',0,825),
  tag('ff-pvc','FF PVC','material','add',-5,830),
  tag('ff-eco','FF Fabric Eco-Friendly','material','add',65,836.25),
  tag('ff-brand','Brand <Fxxx Fxxx>','brand','add',-40,770),
  tag('ee-pvc','EE PVC','material','add',-50,391.75),
  tag('ee-premium','EE PVC Premium','material','add',20,390.75),
  tag('ee-military','EE Military Grade PVC','material','add',100,392.75),
  tag('silver','Silver','material','add',70,1406.5),
  tag('cotton','Cotton','material','add',0,1974.25),
  tag('archaeological-value','Archaeological Value','history','multiply',3,2410),
  tag('national-historic-value','National Historical Value','history','multiply',2,1070),
  tag('time-sensitive','Time-sensitive','history','none',null,1770),
  tag('signature-artist','Signature of an Artist','signature','multiply',2,3390),
  tag('signature-businessman','Signature of a Businessman','signature','percent',-40,1170),
  tag('signature-unidentified','Signature Unidentified','signature','percent',-20,1572.2),
  tag('signature-national-hero','National Hero','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-criminal','Criminal','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-activist','Activist','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-scholar','Scholar','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-athlete','Athlete','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-journalist','Journalist','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-jeweler','Jeweler','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-mere-celebrity','Mere Celebrity','signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-great-figure',"Great Figure in World's History",'signature','none',null,929,'Visible page caption; its tooltip label and numeric effect are not shown.'),
  tag('signature-politician','Signature of a Politician','signature','percent',-30,3336.5),
  tag('popular-youth','Popular Item among Youth','popularity','percent',10,1995.5),
  tag('popular-item','Popular Item','popularity','percent',20,3274.5),
  tag('brand-eraser','Brand Eraser','brand-reason','none',0,211,'Removes the brand tag; no numeric price printed.'),
  tag('wrong-slogan','Wrong or Missing Slogan','brand-reason','none',0,211),
  tag('wrong-year','Wrong Prod. Year','brand-reason','none',0,211),
  tag('wrong-autograph','Wrong or Missing Verifying Autograph','brand-reason','none',0,211),
  tag('wrong-material','Wrong Material','brand-reason','none',0,213.5),
  tag('wrong-gems','Wrong Gems','brand-reason','none',0,211),
  tag('great-piece','Great Piece','artwork','add',150,1710),
  tag('poor-piece','Poor Piece','artwork','add',-200,2350),
  tag('failed-piece','Failed Piece','artwork','add',null,1750),
  tag('fine-piece','Fine Piece','artwork','add',50,2410),
  tag('prime-piece',"Work of one's prime",'artwork','add',300,2135.2),
  tag('deceased-piece','Work by a deceased artist','artwork','add',1500,3390),
];
const jump = (id: string, label: string, rect: ReferenceBookRect, target: string): ReferenceBookHotspot => ({id,kind:'jump',label,rect,target});
const card = (id: string, label: string, rect: ReferenceBookRect, tagId = id): ReferenceBookHotspot => ({id,kind:'tag',label,rect,tagId});
const unavailable = (id: string, label: string, rect: ReferenceBookRect, note = 'The destination page is not visible in the supplied recording.'): ReferenceBookHotspot => ({id,kind:'locked',label,rect,note});
const chrome: ReferenceBookHotspot[] = [jump('index','Index',[29,23,61,50],'index'),{id:'close',kind:'close',label:'Close book',rect:[498,10,67,79]}];
const page = (id: string, title: string, chapter: string, timestamp: number, hotspots: ReferenceBookHotspot[], previous?: string, next?: string): ReferenceBookPage => ({id,title,chapter,timestamp,assetURL:`/assets/book/${id}.png`,hotspots:[...chrome,...hotspots],previous,next});
export const REF_BOOK_PAGES: ReferenceBookPage[] = [
  page('index','Index','index',2750,[
    unavailable('tools','Tools',[91,327,202,49]),
    jump('condition','Condition',[91,386,207,49],'condition'),
    jump('material','Materials',[91,443,207,49],'material'),
    unavailable('rarity','Rarity',[84,500,207,49]),
    unavailable('popularity','Popularity',[84,558,207,49]),
    jump('celebrity-types','Celebrity Types',[91,617,225,49],'celebrity-types'),
    unavailable('watch','Watch Movements',[93,677,207,65],'Locked in the video.'),
    jump('brands','Brands',[329,327,202,49],'brand-list'),
    unavailable('gems','Gems',[329,386,202,49],'Locked in the video.'),
    jump('history','History and Time',[329,443,219,49],'history'),
    jump('chronology','Chronological Table',[329,500,219,65],'chronology-recent'),
    jump('artwork','Artwork',[329,567,219,44],'artwork'),
    jump('celebrities','Celebrity List',[329,617,219,49],'celebrity-index'),
    unavailable('updated','Updated Information',[329,677,219,65]),
  ],undefined,'condition'),
  page('condition','Condition','condition',120,[
    card('perfect','In Perfect Condition',[97,158,265,94]),
    card('slightly-damaged','Slightly Damaged',[97,270,265,94]),
    card('fairly-damaged','Fairly Damaged',[97,381,265,94]),
    card('valueless','No Value',[97,492,265,94]),
    card('potential-garbage','Potential Garbage',[136,643,299,93]),
  ],'index','material'),
  page('material','Material','material',190,[
    jump('brands','Brands',[293,714,130,48],'brand-list'),
    card('canvas','Canvas',[134,351,68,84]),
    card('silver','Silver',[134,227,68,84]),
    card('24k-gold','24K Gold',[368,227,68,84]),
    card('wooden','Wooden',[56,575,67,84]),
    card('cotton','Cotton',[368,480,68,84]),
  ],'condition','brand-list'),
  page('brand-list','Brand','brand',150,[
    jump('easy-enough','Easy Enough',[285,429,122,94],'brand-easy-enough'),
    jump('ff','Fxxx Fxxx',[367,542,64,86],'brand-fxxx-fxxx'),
  ],'material','brand-wildcards'),
  page('brand-easy-enough','Brand','brand',160,[
    jump('wildcards','Wildcards for brands',[178,92,219,51],'brand-wildcards'),
    jump('brands','List of brands',[398,92,151,51],'brand-list'),
    card('easy-enough','Easy Enough',[105,145,361,58]),
    card('ee-pvc','EE PVC',[103,631,89,91]),
    card('ee-premium','EE PVC Premium',[240,631,89,91]),
    card('ee-military','EE Military Grade PVC',[377,631,89,91]),
  ],'brand-list','brand-fxxx-fxxx'),
  page('brand-fxxx-fxxx','Brand','brand',822,[
    jump('wildcards','Wildcards for brands',[178,92,219,51],'brand-wildcards'),
    jump('brands','List of brands',[398,92,151,51],'brand-list'),
    card('ff-fabric','FF Fabric',[239,637,92,86]),
    card('ff-pvc','FF PVC',[103,631,89,91]),
    card('ff-eco','FF Fabric Eco-Friendly',[377,631,89,91]),
    card('ff-brand','Fxxx Fxxx',[105,145,361,58]),
  ],'brand-easy-enough','brand-wildcards'),
  page('brand-wildcards','Brand','brand',148.5,[
    jump('brands','List of brands',[398,92,151,51],'brand-list'),
    card('brand-eraser','Brand Eraser',[54,241,468,99]),
    card('wrong-slogan','Wrong or Missing Slogan',[54,460,218,75]),
    card('wrong-year','Wrong Prod. Year',[304,460,218,75]),
    card('wrong-autograph','Wrong or Missing Verifying Autograph',[54,559,218,74]),
    card('wrong-material','Wrong Material',[304,559,218,74]),
    card('wrong-gems','Wrong Gems',[54,658,218,74]),
  ],'brand-fxxx-fxxx','celebrity-types'),
  page('celebrity-types','Celebrity Types & List','celebrity',929,[
    jump('list','Celebrity List',[399,94,147,47],'celebrity-index'),
    card('signature-national-hero','National Hero',[292,196,237,54]),
    card('signature-criminal','Criminal',[39,264,237,54]),
    card('signature-activist','Activist',[292,264,237,54]),
    card('signature-scholar','Scholar',[39,333,237,54]),
    card('signature-athlete','Athlete',[292,333,237,54]),
    card('signature-journalist','Journalist',[292,401,237,54]),
    card('signature-jeweler','Jeweler',[292,469,237,54]),
    card('signature-mere-celebrity','Mere Celebrity',[165,537,237,55]),
    card('signature-great-figure',"Great Figure in World's History",[39,695,491,54]),
    card('signature-artist','Artist',[39,196,237,54]),
    card('signature-businessman','Businessman',[39,401,237,54]),
    card('signature-politician','Politician',[39,469,237,54]),
    card('signature-unidentified','Unidentifiable / Fake Autograph',[39,627,491,53]),
  ],'brand-wildcards','celebrity-index'),
  page('celebrity-index','Celebrity Types & List','celebrity',854,[
    jump('types','Celebrity Types',[377,94,169,47],'celebrity-types'),
    jump('gong','GONG, Deok',[434,229,94,81],'celebrity-gong-han'),
    jump('han','HAN, Sol',[42,314,94,81],'celebrity-gong-han'),
    jump('hwang','HWANG, hon',[42,398,94,81],'celebrity-hwang-kim'),
    jump('gretel','KIM, Gretel',[140,398,94,81],'celebrity-hwang-kim'),
    jump('emily','KIM, Emily',[238,398,94,81],'celebrity-emily-semilia'),
    jump('semilia','KIM, Semilia',[336,398,94,81],'celebrity-emily-semilia'),
    jump('dongjun','LEE, Dongjun',[238,568,94,81],'celebrity-lee-choi'),
    jump('sungho','CHOI, Sungho',[336,568,94,81],'celebrity-lee-choi'),
    jump('manjo','MOO, Manjo',[434,568,94,81],'celebrity-moo-mo'),
    jump('yeongi','MO, Yeon-gi',[42,653,94,81],'celebrity-moo-mo'),
    jump('jurin','Ahn, Jurin',[140,653,94,81],'celebrity-ahn-lee'),
    jump('eunjeong','LEE, Eunjeong',[238,653,94,81],'celebrity-ahn-lee'),
  ],'celebrity-types','celebrity-ahn-lee'),
  page('celebrity-ahn-lee','Celebrity Types & List','celebrity',880,[jump('types','Celebrity Types',[399,94,147,47],'celebrity-types')],'celebrity-index','celebrity-gong-han'),
  page('celebrity-gong-han','Celebrity Types & List','celebrity',3270,[jump('types','Celebrity Types',[377,94,169,47],'celebrity-types'),card('popular-item','enjoyed great popularity',[162,505,367,67])],'celebrity-ahn-lee','celebrity-hwang-kim'),
  page('celebrity-hwang-kim','Celebrity Types & List','celebrity',3450,[jump('types','Celebrity Types',[399,94,147,47],'celebrity-types')],'celebrity-gong-han','celebrity-emily-semilia'),
  page('celebrity-emily-semilia','Celebrity Types & List','celebrity',1550,[jump('types','Celebrity Types',[399,94,147,47],'celebrity-types')],'celebrity-hwang-kim','celebrity-lee-choi'),
  page('celebrity-lee-choi','Celebrity Types & List','celebrity',2070,[jump('types','Celebrity Types',[399,94,147,47],'celebrity-types')],'celebrity-emily-semilia','celebrity-moo-mo'),
  page('celebrity-moo-mo','Celebrity Types & List','celebrity',1130,[jump('types','Celebrity Types',[377,94,169,47],'celebrity-types'),card('popular-youth','Youngsters like him.',[163,534,212,34])],'celebrity-lee-choi','history'),
  page('history','History and Time','history',1770,[
    card('archaeological-value','Archaeological Value',[141,225,272,94]),
    card('national-historic-value','National Historic Value',[141,371,272,94]),
    card('time-sensitive','Time-sensitive',[141,515,272,94]),
  ],'celebrity-moo-mo','chronology-recent'),
  page('chronology-recent','Chronological Table','chronology',230,[
    jump('anti-chippie','The Anti-Chippie Act (2060)',[267,273,246,55],'history-anti-chippie'),
    jump('fiber','Fiber 10 (2077)',[267,604,246,55],'history-fiber-10'),
  ],'history','history-anti-chippie'),
  page('history-anti-chippie','Chronological Table','chronology',3250,[],'chronology-recent','history-fiber-10'),
  page('history-fiber-10','Chronological Table','chronology',1065,[],'history-anti-chippie','artwork'),
  page('artwork','Artwork','artwork',1750,[
    {id:'help',kind:'info',label:'Artwork instructions',rect:[35,104,35,35],target:'artwork-help'},
    card('failed-piece','Failed Piece',[51,247,138,118]),
    card('poor-piece','Poor Piece',[216,247,138,118]),
    card('fine-piece','Fine Piece',[382,247,137,118]),
    card('great-piece','Great Piece',[51,565,138,117]),
    card('prime-piece',"During one's prime",[216,565,138,117]),
    card('deceased-piece','Deceased Artist',[382,565,137,117]),
  ],'history-fiber-10','index'),
  page('artwork-help','Artwork','artwork',2090,[{id:'help',kind:'info',label:'Close instructions',rect:[35,104,35,35],target:'artwork'}],'history-fiber-10','index'),
];
export const REF_BOOK_PAGE_BY_ID = Object.fromEntries(REF_BOOK_PAGES.map(p => [p.id,p]));
export const REF_BOOK_TAG_BY_ID = Object.fromEntries(REF_BOOK_TAGS.map(t => [t.id,t]));
export const REF_BOOK_CROP = {x:1350,y:155,width:570,height:800} as const;

/** Book id -> exact ledger crop id; values are identical where both are visible. */
export const REF_BOOK_RECORDED_TAG_ALIASES: Record<string,string> = {
 'easy-enough':'brand-easy-enough','ff-brand':'brand-fimm-fimm',
 'ee-premium':'ee-pvc-premium','ee-military':'ee-military-pvc',
 '24k-gold':'gold-24k','archaeological-value':'archaeological',
 'national-historic-value':'national-historic','signature-artist':'artist-signature',
 'signature-politician':'politician-signature','signature-unidentified':'unidentified-signature',
 'deceased-piece':'deceased-artist','popular-item':'popular',
};
