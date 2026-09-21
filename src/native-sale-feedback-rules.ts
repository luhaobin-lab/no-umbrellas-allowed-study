/** Ordered factual rule descriptors from Windows 1.0.5 Sale.mendatoryFeedback. */
export const SALE_FEEDBACK_RULES = [
 {
  "predicate": "hasFakeHalfWrongAppraisal",
  "args": [],
  "branch": "hint_fakeHalf"
 },
 {
  "predicate": "hasFakeWrongAppraisal",
  "args": [],
  "branch": "deny_fake"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_sas_withCC"
  ],
  "branch": "sascc_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_sas_withCC"
  ],
  "branch": "sascc_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_sas_withCC"
  ],
  "branch": "sascc_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_sas_withCC"
  ],
  "branch": "sascc_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_besch_withOz"
  ],
  "branch": "beschoz_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_besch_withOz"
  ],
  "branch": "beschoz_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_besch_withOz"
  ],
  "branch": "beschoz_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_besch_withOz"
  ],
  "branch": "beschoz_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_chirp_withBen"
  ],
  "branch": "chirpben_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_chirp_withBen"
  ],
  "branch": "chirpben_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_chirp_withBen"
  ],
  "branch": "chirpben_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_chirp_withBen"
  ],
  "branch": "chirpben_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_besch_cheap"
  ],
  "branch": "beschcheap_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_besch_cheap"
  ],
  "branch": "beschcheap_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_besch_cheap"
  ],
  "branch": "beschcheap_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_besch_cheap"
  ],
  "branch": "beschcheap_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_swoosh_before"
  ],
  "branch": "swooshbefore_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_swoosh_before"
  ],
  "branch": "swooshbefore_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_swoosh_before"
  ],
  "branch": "swooshbefore_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_swoosh_before"
  ],
  "branch": "swooshbefore_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_blike_self"
  ],
  "branch": "blikeself_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_blike_self"
  ],
  "branch": "blikeself_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_blike_self"
  ],
  "branch": "blikeself_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_blike_self"
  ],
  "branch": "blikeself_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "brand",
   "green_arcadexo_heist"
  ],
  "branch": "arcadexoheist_missingwrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "brand",
   "green_arcadexo_heist"
  ],
  "branch": "arcadexoheist_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "brand",
   "green_arcadexo_heist"
  ],
  "branch": "arcadexoheist_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "brand",
   "green_arcadexo_heist"
  ],
  "branch": "arcadexoheist_error"
 },
 {
  "predicate": "missedRecyclable",
  "args": [],
  "branch": "hint_recycle"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "figure"
  ],
  "branch": "figure_missing"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "figure"
  ],
  "branch": "figure_wrong"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "figure"
  ],
  "branch": "figure_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "condition",
   "blue_junkpotential"
  ],
  "branch": "potentialjunk_wrong"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "condition",
   "blue_junkpotential"
  ],
  "branch": "potentialjunk_missingwrong"
 },
 {
  "predicate": "hasWrongCardOf",
  "args": [
   "condition",
   "blue_junkpotential"
  ],
  "branch": "potentialjunk_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "condition",
   "blue_junkpotential"
  ],
  "branch": "potentialjunk_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "movement"
  ],
  "branch": "movement_missing"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "movement"
  ],
  "branch": "movement_wrong"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "art"
  ],
  "branch": "art_missing"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "art"
  ],
  "branch": "art_error"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "art"
  ],
  "branch": "art_wrong"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "history",
   "blue_archae"
  ],
  "branch": "archae_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "history",
   "blue_archae"
  ],
  "branch": "archae_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "history"
  ],
  "branch": "history_missing"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "history"
  ],
  "branch": "history_error"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "material"
  ],
  "branch": "hint_mat"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "rare"
  ],
  "branch": "rare_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "rare"
  ],
  "branch": "rare_missing"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "rare"
  ],
  "branch": "hint_rare"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt"
  ],
  "branch": "reput_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt"
  ],
  "branch": "reput_error"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "popularity",
   "blue_reput_hurt"
  ],
  "branch": "reput_wrong"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt1"
  ],
  "branch": "reput_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt1"
  ],
  "branch": "reput_error"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "popularity",
   "blue_reput_hurt1"
  ],
  "branch": "reput_wrong"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt2"
  ],
  "branch": "reput_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_reput_hurt2"
  ],
  "branch": "reput_error"
 },
 {
  "predicate": "hasWrongCardShould",
  "args": [
   "popularity",
   "blue_reput_hurt2"
  ],
  "branch": "reput_wrong"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_pop"
  ],
  "branch": "pop_missing"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_pop_all"
  ],
  "branch": "pop_missing"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_pop_young"
  ],
  "branch": "pop_missing"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_pop_mid"
  ],
  "branch": "pop_missing"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_pop_senior"
  ],
  "branch": "pop_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_pop"
  ],
  "branch": "pop_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_pop_all"
  ],
  "branch": "pop_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_pop_young"
  ],
  "branch": "pop_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_pop_mid"
  ],
  "branch": "pop_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_pop_senior"
  ],
  "branch": "pop_error"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_unpop"
  ],
  "branch": "unpop_missing"
 },
 {
  "predicate": "hasMissingCategoryAs",
  "args": [
   "popularity",
   "blue_unpop_certain"
  ],
  "branch": "unpop_missing"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_unpop"
  ],
  "branch": "unpop_error"
 },
 {
  "predicate": "hasWrongCategoryAs",
  "args": [
   "popularity",
   "blue_unpop_certain"
  ],
  "branch": "unpop_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "brand"
  ],
  "branch": "brand_missing"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "brand"
  ],
  "branch": "brand_wrong"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "brand"
  ],
  "branch": "brand_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "rumor"
  ],
  "branch": "rumor_missing"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "rumor"
  ],
  "branch": "rumor_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "time"
  ],
  "branch": "time_missing"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "time"
  ],
  "branch": "time_error"
 },
 {
  "predicate": "hasMissingCategory",
  "args": [
   "danger"
  ],
  "branch": "danger_missing"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "danger"
  ],
  "branch": "danger_error"
 },
 {
  "predicate": "hasWrongCard",
  "args": [
   "jewel"
  ],
  "branch": "hint_jewel"
 },
 {
  "predicate": "hasWrongCategory",
  "args": [
   "jewel"
  ],
  "branch": "jewel_error"
 }
] as const;
