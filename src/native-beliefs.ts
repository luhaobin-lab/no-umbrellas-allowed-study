import type { NativeCardInfo, NativePersonality } from './native-negotiation-types';
import { nativeRandom } from './native-random';
/** Factual card substitution relationships from GenerativeInfoscreen.mistaken, Windows 1.0.5. */
export const NATIVE_BELIEF_MISTAKES: Readonly<Record<string, readonly string[]>> = {
  "blue_archae": [
    "blue_nationalhis"
  ],
  "blue_fairlydmg": [
    "blue_slightdmg",
    "blue_novalue"
  ],
  "blue_minor": [
    "blue_pop",
    "blue_unpop"
  ],
  "blue_novalue": [
    "blue_fairlydmg"
  ],
  "blue_perfect": [
    "blue_slightdmg"
  ],
  "blue_pop_mid": [
    "blue_pop_senior",
    "blue_pop_young",
    "blue_unpop_certain"
  ],
  "blue_pop_senior": [
    "blue_pop_mid",
    "blue_pop_young",
    "blue_unpop_certain"
  ],
  "blue_pop_young": [
    "blue_pop_mid",
    "blue_pop_senior",
    "blue_unpop_certain"
  ],
  "blue_slightdmg": [
    "blue_perfect",
    "blue_fairlydmg"
  ],
  "blue_unpop": [
    "blue_minor"
  ],
  "blue_unpop_certain": [
    "blue_pop_mid",
    "blue_pop_senior",
    "blue_pop_young"
  ],
  "green_24kGold": [
    "green_whitegold",
    "green_yellowgold",
    "green_silver",
    "green_platinium",
    "green_basemetal"
  ],
  "green_aluminum": [
    "green_platinium",
    "green_surgical",
    "green_basemetal",
    "green_stainlesssteel"
  ],
  "green_amethyst": [
    "green_garnet",
    "green_quartz",
    "green_topaz"
  ],
  "green_art_bad": [
    "green_art_good"
  ],
  "green_art_deceased": [
    "green_art_artist",
    "green_art_best",
    "green_art_good"
  ],
  "green_art_good": [
    "green_art_bad"
  ],
  "green_art_worst": [
    "green_art_bad",
    "green_art_good"
  ],
  "green_async_lab": [
    "green_async_logo",
    "green_async_premium",
    "green_besch_cowhide"
  ],
  "green_async_logo": [
    "green_async_lab",
    "green_async_premium",
    "green_besch_cowhide"
  ],
  "green_async_premium": [
    "green_async_logo",
    "green_async_lab",
    "green_besch_cowhide"
  ],
  "green_basemetal": [
    "green_platinium",
    "green_surgical",
    "green_stainlesssteel",
    "green_aluminum"
  ],
  "green_ben_easy": [
    "green_ben_golden",
    "green_ben_legendary",
    "green_besch_cowhide"
  ],
  "green_ben_golden": [
    "green_ben_easy",
    "green_ben_legendary",
    "green_besch_cowhide"
  ],
  "green_ben_legendary": [
    "green_ben_easy",
    "green_ben_golden",
    "green_besch_cowhide"
  ],
  "green_besch_bscplatinum": [
    "green_platinium"
  ],
  "green_besch_cowhide": [
    "green_fauxleather",
    "green_pvc"
  ],
  "green_canvas": [
    "green_cotton",
    "green_paper"
  ],
  "green_casualcat_horse": [
    "green_casualcat_leather",
    "green_casualcat_leather",
    "green_besch_cowhide"
  ],
  "green_casualcat_lab": [
    "green_casualcat_horse",
    "green_casualcat_leather",
    "green_besch_cowhide"
  ],
  "green_casualcat_leather": [
    "green_casualcat_lab",
    "green_casualcat_horse",
    "green_besch_cowhide"
  ],
  "green_cotton": [
    "green_canvas",
    "green_pvc",
    "green_velvet"
  ],
  "green_cubic": [
    "green_amethyst",
    "green_garnet",
    "green_quartz",
    "green_topaz"
  ],
  "green_dramaticdil_fake": [
    "green_dramaticdil_pvc",
    "green_dramaticdil_lab",
    "green_besch_cowhide"
  ],
  "green_dramaticdil_lab": [
    "green_dramaticdil_fake",
    "green_dramaticdil_pvc",
    "green_besch_cowhide"
  ],
  "green_dramaticdil_pvc": [
    "green_dramaticdil_fake",
    "green_dramaticdil_lab",
    "green_besch_cowhide"
  ],
  "green_easyenough_military": [
    "green_easyenough_pvc",
    "green_easyenough_premium"
  ],
  "green_easyenough_premium": [
    "green_easyenough_pvc",
    "green_easyenough_military"
  ],
  "green_easyenough_pvc": [
    "green_easyenough_military",
    "green_easyenough_premium"
  ],
  "green_fauxleather": [
    "green_pvc"
  ],
  "green_fuzz_carbon": [
    "green_platinium",
    "green_surgical",
    "green_stainlesssteel",
    "green_aluminum"
  ],
  "green_fxxx_eco": [
    "green_fxxx_pvc",
    "green_fxxx_fabric"
  ],
  "green_fxxx_fabric": [
    "green_fxxx_pvc",
    "green_fxxx_eco"
  ],
  "green_fxxx_pvc": [
    "green_fxxx_eco",
    "green_fxxx_fabric"
  ],
  "green_garnet": [
    "green_amethyst",
    "green_quartz",
    "green_topaz"
  ],
  "green_pearl": [
    "green_quartz"
  ],
  "green_platinium": [
    "green_surgical",
    "green_stainlesssteel",
    "green_basemetal",
    "green_aluminum"
  ],
  "green_pvc": [
    "green_fauxleather",
    "green_cotton"
  ],
  "green_quartz": [
    "green_amethyst",
    "green_garnet",
    "green_topaz"
  ],
  "green_silver": [
    "green_whitegold",
    "green_platinium",
    "green_surgical",
    "green_basemetal",
    "green_stainlesssteel"
  ],
  "green_surgical": [
    "green_stainlesssteel",
    "green_basemetal",
    "green_platinium",
    "green_aluminum"
  ],
  "green_topaz": [
    "green_amethyst",
    "green_garnet",
    "green_quartz"
  ],
  "green_velvet": [
    "green_cotton"
  ],
  "green_whitegold": [
    "green_silver",
    "green_24kGold",
    "green_yellowgold"
  ],
  "green_yellowgold": [
    "green_24kGold",
    "green_whitegold"
  ]
} as const;
export function generateNativeBeliefs(input:{cards:NativeCardInfo[];references:NativeCardInfo[];cardCatalog:Readonly<Record<string,NativeCardInfo>>;personality:NativePersonality;day:number;seed:number}) {
 const random=nativeRandom(input.seed);const unknown:string[]=[];
 const cards=input.cards.filter(c=>c.color==='Gray'||(c.color==='Green'&&c.tier===0&&c.category!=='art')||(input.personality!=='Fixie'&&c.color==='Blue'&&c.tier===0&&c.category==='condition')).map(original=>{
  let card=original;const alternatives=NATIVE_BELIEF_MISTAKES[card.id];
  if(input.day!==1&&input.personality!=='Fixie'&&alternatives&&random.next()>=.3){
   // The source picks by Guid ordering. Independent uniform permutation preserves selection probability.
   const choice=alternatives.map(id=>({id,key:random.next()})).sort((a,b)=>a.key-b.key)[0].id;
   if(input.cardCatalog[choice])card=input.cardCatalog[choice];else unknown.push(choice);
  }
  if(card.category==='material'||card.category==='jewel')card=input.references.find(c=>c.category===card.category)??card;
  return {...card};
 });
 return{cards,rngState:random.state,unknownCardIds:unknown};
}
