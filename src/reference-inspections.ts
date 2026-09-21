/** Observed per-item tool readouts cropped from the user-provided video. Missing rows mean no observed result. */
export type ReferenceInspectionTool = "damage" | "material" | "year" | "signature" | "gem" | "screwdriver";
export interface ReferenceInspection { transactionId:string; tool:ReferenceInspectionTool; timestamp:number; asset:string; rect:[number,number,number,number]; observation:string; bookPage?:string; }
export const REFERENCE_INSPECTIONS: ReferenceInspection[] = [
  {
    "transactionId": "day6-backpack-soldier",
    "tool": "damage",
    "timestamp": 114,
    "asset": "/assets/inspections/day6-backpack-soldier-damage.png",
    "rect": [
      870,
      761,
      150,
      103
    ],
    "observation": "Needle points near the green face.",
    "bookPage": "condition"
  },
  {
    "transactionId": "day6-backpack-soldier",
    "tool": "material",
    "timestamp": 136,
    "asset": "/assets/inspections/day6-backpack-soldier-material.png",
    "rect": [
      918,
      741,
      119,
      157
    ],
    "observation": "Canvas weave shown in magnifier.",
    "bookPage": "material"
  },
  {
    "transactionId": "day6-backpack-soldier",
    "tool": "year",
    "timestamp": 221,
    "asset": "/assets/inspections/day6-backpack-soldier-year.png",
    "rect": [
      860,
      753,
      148,
      95
    ],
    "observation": "2068",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day6-backpack-soldier",
    "tool": "signature",
    "timestamp": 240,
    "asset": "/assets/inspections/day6-backpack-soldier-signature.png",
    "rect": [
      802,
      775,
      188,
      121
    ],
    "observation": "No Signature Found",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day6-combat-boots",
    "tool": "damage",
    "timestamp": 374,
    "asset": "/assets/inspections/day6-combat-boots-damage.png",
    "rect": [
      933,
      759,
      149,
      105
    ],
    "observation": "Needle points at the green face.",
    "bookPage": "condition"
  },
  {
    "transactionId": "day6-combat-boots",
    "tool": "material",
    "timestamp": 382,
    "asset": "/assets/inspections/day6-combat-boots-material.png",
    "rect": [
      861,
      722,
      116,
      155
    ],
    "observation": "EE PVC Premium pattern.",
    "bookPage": "material"
  },
  {
    "transactionId": "day6-combat-boots",
    "tool": "year",
    "timestamp": 470,
    "asset": "/assets/inspections/day6-combat-boots-year.png",
    "rect": [
      902,
      754,
      150,
      97
    ],
    "observation": "2070",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day6-combat-boots",
    "tool": "signature",
    "timestamp": 473,
    "asset": "/assets/inspections/day6-combat-boots-signature.png",
    "rect": [
      883,
      778,
      198,
      120
    ],
    "observation": "No Signature Found",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day7-fixie-bag",
    "tool": "damage",
    "timestamp": 775,
    "asset": "/assets/inspections/day7-fixie-bag-damage.png",
    "rect": [
      878,
      761,
      147,
      103
    ],
    "observation": "Needle points at the green face.",
    "bookPage": "condition"
  },
  {
    "transactionId": "day7-fixie-bag",
    "tool": "material",
    "timestamp": 810,
    "asset": "/assets/inspections/day7-fixie-bag-material.png",
    "rect": [
      917,
      777,
      117,
      151
    ],
    "observation": "FF Fabric weave.",
    "bookPage": "material"
  },
  {
    "transactionId": "day7-fixie-bag",
    "tool": "year",
    "timestamp": 845,
    "asset": "/assets/inspections/day7-fixie-bag-year.png",
    "rect": [
      881,
      775,
      150,
      98
    ],
    "observation": "2080",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day7-fixie-bag",
    "tool": "signature",
    "timestamp": 850,
    "asset": "/assets/inspections/day7-fixie-bag-signature.png",
    "rect": [
      847,
      752,
      199,
      124
    ],
    "observation": "Green signature, matching LEE, Eunjeong.",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day7-research-poster",
    "tool": "damage",
    "timestamp": 1044.5,
    "asset": "/assets/inspections/day7-research-poster-damage.png",
    "rect": [
      890,
      754,
      152,
      107
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day7-research-poster",
    "tool": "year",
    "timestamp": 1047.5,
    "asset": "/assets/inspections/day7-research-poster-year.png",
    "rect": [
      896,
      774,
      151,
      98
    ],
    "observation": "2077",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day7-research-poster",
    "tool": "signature",
    "timestamp": 1084.5,
    "asset": "/assets/inspections/day7-research-poster-signature.png",
    "rect": [
      862,
      757,
      201,
      124
    ],
    "observation": "Signature of MOO, Manjo",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day7-crabgrass",
    "tool": "damage",
    "timestamp": 1275.5,
    "asset": "/assets/inspections/day7-crabgrass-damage.png",
    "rect": [
      874,
      804,
      149,
      108
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day7-crabgrass",
    "tool": "signature",
    "timestamp": 1279.5,
    "asset": "/assets/inspections/day7-crabgrass-signature.png",
    "rect": [
      862,
      796,
      202,
      122
    ],
    "observation": "Choi",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day7-bookmark",
    "tool": "damage",
    "timestamp": 1384.5,
    "asset": "/assets/inspections/day7-bookmark-damage.png",
    "rect": [
      895,
      773,
      148,
      109
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day7-bookmark",
    "tool": "material",
    "timestamp": 1388.5,
    "asset": "/assets/inspections/day7-bookmark-material.png",
    "rect": [
      954,
      759,
      118,
      157
    ],
    "observation": "Yellow metal texture",
    "bookPage": "material"
  },
  {
    "transactionId": "day7-golden-glasses",
    "tool": "signature",
    "timestamp": 1554.5,
    "asset": "/assets/inspections/day7-golden-glasses-signature.png",
    "rect": [
      797,
      757,
      204,
      124
    ],
    "observation": "Signature of KIM, Emily",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day8-gioconda",
    "tool": "damage",
    "timestamp": 1699.5,
    "asset": "/assets/inspections/day8-gioconda-damage.png",
    "rect": [
      852,
      777,
      149,
      106
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day8-gioconda",
    "tool": "year",
    "timestamp": 1709.5,
    "asset": "/assets/inspections/day8-gioconda-year.png",
    "rect": [
      886,
      834,
      152,
      101
    ],
    "observation": "1503",
    "bookPage": "history"
  },
  {
    "transactionId": "day8-gioconda",
    "tool": "signature",
    "timestamp": 1721.5,
    "asset": "/assets/inspections/day8-gioconda-signature.png",
    "rect": [
      889,
      763,
      201,
      125
    ],
    "observation": "No Signature Found",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day8-avac-card",
    "tool": "damage",
    "timestamp": 1836.5,
    "asset": "/assets/inspections/day8-avac-card-damage.png",
    "rect": [
      893,
      766,
      151,
      108
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day8-avac-card",
    "tool": "material",
    "timestamp": 1844.5,
    "asset": "/assets/inspections/day8-avac-card-material.png",
    "rect": [
      893,
      751,
      134,
      163
    ],
    "observation": "Dark blue material surface",
    "bookPage": "material"
  },
  {
    "transactionId": "day8-avac-card",
    "tool": "year",
    "timestamp": 1848.5,
    "asset": "/assets/inspections/day8-avac-card-year.png",
    "rect": [
      886,
      809,
      153,
      103
    ],
    "observation": "2079",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day8-doll",
    "tool": "damage",
    "timestamp": 1947.5,
    "asset": "/assets/inspections/day8-doll-damage.png",
    "rect": [
      906,
      780,
      147,
      110
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day8-doll",
    "tool": "material",
    "timestamp": 1969.5,
    "asset": "/assets/inspections/day8-doll-material.png",
    "rect": [
      903,
      763,
      116,
      159
    ],
    "observation": "Gold-brown woven texture",
    "bookPage": "material"
  },
  {
    "transactionId": "day8-doll",
    "tool": "signature",
    "timestamp": 1979.5,
    "asset": "/assets/inspections/day8-doll-signature.png",
    "rect": [
      862,
      774,
      207,
      124
    ],
    "observation": "Signature of MO, Yeon-gi",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day8-rabbit",
    "tool": "damage",
    "timestamp": 2035.5,
    "asset": "/assets/inspections/day8-rabbit-damage.png",
    "rect": [
      889,
      795,
      152,
      110
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day8-rabbit",
    "tool": "material",
    "timestamp": 2040.5,
    "asset": "/assets/inspections/day8-rabbit-material.png",
    "rect": [
      900,
      775,
      119,
      161
    ],
    "observation": "Wood grain",
    "bookPage": "material"
  },
  {
    "transactionId": "day8-rabbit",
    "tool": "year",
    "timestamp": 2046.5,
    "asset": "/assets/inspections/day8-rabbit-year.png",
    "rect": [
      885,
      793,
      157,
      105
    ],
    "observation": "2064",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day8-rabbit",
    "tool": "signature",
    "timestamp": 2052.5,
    "asset": "/assets/inspections/day8-rabbit-signature.png",
    "rect": [
      839,
      773,
      207,
      127
    ],
    "observation": "Signature of LEE, Dongjun",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day8-crocodile",
    "tool": "material",
    "timestamp": 2260.5,
    "asset": "/assets/inspections/day8-crocodile-material.png",
    "rect": [
      896,
      756,
      121,
      161
    ],
    "observation": "Green canvas texture",
    "bookPage": "material"
  },
  {
    "transactionId": "day8-crocodile",
    "tool": "signature",
    "timestamp": 2266.5,
    "asset": "/assets/inspections/day8-crocodile-signature.png",
    "rect": [
      859,
      761,
      203,
      125
    ],
    "observation": "Signature of LEE, Eunjeong",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day8-fantastic-hoverboard",
    "tool": "damage",
    "timestamp": 2427.5,
    "asset": "/assets/inspections/day8-fantastic-hoverboard-damage.png",
    "rect": [
      876,
      769,
      151,
      111
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day9-time-device",
    "tool": "damage",
    "timestamp": 2699.5,
    "asset": "/assets/inspections/day9-time-device-damage.png",
    "rect": [
      871,
      772,
      153,
      111
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day9-time-device",
    "tool": "signature",
    "timestamp": 2711.5,
    "asset": "/assets/inspections/day9-time-device-signature.png",
    "rect": [
      821,
      757,
      209,
      128
    ],
    "observation": "Choi",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day9-my-mom-declined-sale",
    "tool": "signature",
    "timestamp": 2743.5,
    "asset": "/assets/inspections/day9-my-mom-declined-sale-signature.png",
    "rect": [
      892,
      799,
      215,
      128
    ],
    "observation": "Two green characters, not identified in the shown pages",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day9-seoul-stamp",
    "tool": "damage",
    "timestamp": 2803.5,
    "asset": "/assets/inspections/day9-seoul-stamp-damage.png",
    "rect": [
      875,
      785,
      151,
      111
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day9-seoul-stamp",
    "tool": "material",
    "timestamp": 2813.5,
    "asset": "/assets/inspections/day9-seoul-stamp-material.png",
    "rect": [
      941,
      734,
      119,
      159
    ],
    "observation": "Paper surface",
    "bookPage": "material"
  },
  {
    "transactionId": "day9-seoul-stamp",
    "tool": "year",
    "timestamp": 2816.5,
    "asset": "/assets/inspections/day9-seoul-stamp-year.png",
    "rect": [
      866,
      765,
      155,
      106
    ],
    "observation": "1988",
    "bookPage": "history"
  },
  {
    "transactionId": "day11-meaningful-paper",
    "tool": "damage",
    "timestamp": 3232.5,
    "asset": "/assets/inspections/day11-meaningful-paper-damage.png",
    "rect": [
      878,
      790,
      146,
      111
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day11-meaningful-paper",
    "tool": "material",
    "timestamp": 3237.5,
    "asset": "/assets/inspections/day11-meaningful-paper-material.png",
    "rect": [
      884,
      753,
      117,
      161
    ],
    "observation": "Light blue paper surface",
    "bookPage": "material"
  },
  {
    "transactionId": "day11-meaningful-paper",
    "tool": "year",
    "timestamp": 3240.5,
    "asset": "/assets/inspections/day11-meaningful-paper-year.png",
    "rect": [
      888,
      797,
      152,
      104
    ],
    "observation": "2060",
    "bookPage": "chronology-recent"
  },
  {
    "transactionId": "day11-meaningful-paper",
    "tool": "signature",
    "timestamp": 3312.5,
    "asset": "/assets/inspections/day11-meaningful-paper-signature.png",
    "rect": [
      855,
      797,
      203,
      124
    ],
    "observation": "Signature of HAN, Sol",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day11-hoverboard-display",
    "tool": "damage",
    "timestamp": 3418.5,
    "asset": "/assets/inspections/day11-hoverboard-display-damage.png",
    "rect": [
      855,
      773,
      148,
      111
    ],
    "observation": "Condition dial",
    "bookPage": "condition"
  },
  {
    "transactionId": "day11-hoverboard-display",
    "tool": "signature",
    "timestamp": 3445.5,
    "asset": "/assets/inspections/day11-hoverboard-display-signature.png",
    "rect": [
      875,
      756,
      198,
      124
    ],
    "observation": "Signature of HWANG, hon",
    "bookPage": "celebrity-index"
  },
  {
    "transactionId": "day9-seoul-stamp",
    "tool": "signature",
    "timestamp": 2825.15,
    "asset": "/assets/inspections/day9-seoul-stamp-signature.png",
    "rect": [
      858,
      770,
      202,
      122
    ],
    "observation": "No Signature Found",
    "bookPage": "celebrity-index"
  }
];
export const REF_INSPECTIONS = REFERENCE_INSPECTIONS;
export const REF_INSPECTION_BY_TRANSACTION = Object.fromEntries([...new Set(REFERENCE_INSPECTIONS.map(r=>r.transactionId))].map(id=>[id,Object.fromEntries(REFERENCE_INSPECTIONS.filter(r=>r.transactionId===id).map(r=>[r.tool,r]))]));
