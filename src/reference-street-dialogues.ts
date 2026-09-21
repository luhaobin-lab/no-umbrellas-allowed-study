/** Original visible ambient speech. No Participate key press is established by the video. */
export interface StreetDialogue { asset: string; rect: [number, number, number, number]; timestamp: number; transcript: string; group: string; trigger: 'ambient'; participateKeyPressConfirmed: false }
export const STREET_PROTEST_DIALOGUES: StreetDialogue[] = [
  {
    "asset": "/assets/street/dialogues/protest-intimidation.png",
    "rect": [
      801,
      211,
      795,
      103
    ],
    "timestamp": 656.5,
    "transcript": "AVAC SHOULD STOP INTIMIDATING US! / THE UNION IS AGAINST FIXERAIN!",
    "group": "protest",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  },
  {
    "asset": "/assets/street/dialogues/protest-freedom.png",
    "rect": [
      837,
      218,
      806,
      98
    ],
    "timestamp": 661.5,
    "transcript": "AVAC WILL TAKE AWAY OUR FREEDOM / THE UNION IS AGAINST FIXERAIN!",
    "group": "protest",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  },
  {
    "asset": "/assets/street/dialogues/protest-fixerain.png",
    "rect": [
      462,
      177,
      498,
      127
    ],
    "timestamp": 665.5,
    "transcript": "AVAC CAN\u2019T RESUME FIXERAIN PROJECT AT WILL!",
    "group": "protest",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  }
];
export const STREET_AMBIENT_DIALOGUES: StreetDialogue[] = [
  {
    "asset": "/assets/street/dialogues/donation-support.png",
    "rect": [
      427,
      365,
      247,
      91
    ],
    "timestamp": 659.5,
    "transcript": "Support the AVAC.",
    "group": "donation",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  },
  {
    "asset": "/assets/street/dialogues/donation-zero-avarice.png",
    "rect": [
      1439,
      399,
      386,
      91
    ],
    "timestamp": 661.5,
    "transcript": "Donate for zero-Avarice society.",
    "group": "donation",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  },
  {
    "asset": "/assets/street/dialogues/office-bus.png",
    "rect": [
      413,
      332,
      341,
      92
    ],
    "timestamp": 654.5,
    "transcript": "I don\u2019t want to catch the bus.",
    "group": "office",
    "trigger": "ambient",
    "participateKeyPressConfirmed": false
  }
];
