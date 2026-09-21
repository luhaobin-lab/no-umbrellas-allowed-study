/** Evidence-only reconstruction data; all rectangles are native x/y/width/height. */
export type ReportingRect = [number, number, number, number];
export interface ReportingAsset {
  id: string;
  timestamp: number;
  asset: string;
  rect: ReportingRect;
  text?: string;
  note?: string;
}

export const REPORTING_ASSETS: ReportingAsset[] = [
  { id: 'device-00', timestamp: 3143, asset: '/assets/reporting/device-00.png', rect: [1259,811,180,189], note: 'Clean original shell from 3427, original 00/00 display from 3143.' },
  { id: 'device-01', timestamp: 3427, asset: '/assets/reporting/device-01.png', rect: [1259,811,180,189] },
  { id: 'device-02', timestamp: 3467, asset: '/assets/reporting/device-02.png', rect: [1259,811,180,189] },
  { id: 'device-labels', timestamp: 3140, asset: '/assets/reporting/device-labels.png', rect: [1259,811,180,189], text: 'TODAY | THIS WEEK', note: 'Original left/right label pixels from 3140/3141 avoid recorded cursors.' },
  { id: 'counter-labels', timestamp: 3140, asset: '/assets/reporting/counter-labels.png', rect: [1267,841,166,58], text: 'TODAY | THIS WEEK' },
  { id: 'device-collapsed-00', timestamp: 3424.8, asset: '/assets/reporting/device-collapsed-00.png', rect: [1259,911,180,89], note: 'Recorded lower body; identical clean roof pixels shifted down 100px remove recorded cursor.' },
  { id: 'button-hover', timestamp: 3425.5, asset: '/assets/reporting/button-hover.png', rect: [1290,920,120,55], note: 'Source y922, drawn 2px up to compensate for the recorded slide animation.' },
  { id: 'city-progress-90', timestamp: 3153, asset: '/assets/reporting/city-progress-90.png', rect: [213,91,472,155], text: 'Avarice criminals captured this week\nPre-Avarice criminals reported\nStill Left: 90' },
  { id: 'tutorial-counters', timestamp: 3140, asset: '/assets/reporting/reporting-tutorial-counters.png', rect: [707,124,509,173], text: 'On its left is a count of your reports of the day, while the other is a count of your reports of the week.' },
  { id: 'tutorial-secrecy', timestamp: 3148, asset: '/assets/reporting/reporting-tutorial-secrecy.png', rect: [707,124,509,173], text: "And please don't be afraid to press it in the face, since they cannot know if you press it or not." },
  { id: 'tutorial-city', timestamp: 3153, asset: '/assets/reporting/reporting-tutorial-city.png', rect: [707,153,509,144], text: 'Here will be the total number of criminal arrests of the week throughout the city.' },
  { id: 'street-quota-53', timestamp: 3478, asset: '/assets/reporting/street-quota-53.png', rect: [1222,134,266,310], text: '53 Avarice Criminals Left / D-5' },
  { id: 'street-arrested-poster', timestamp: 3478, asset: '/assets/reporting/street-arrested-poster.png', rect: [558,134,267,338], text: 'ARRESTED for avarice crime', note: 'The original crowd overlaps its lower edge.' },
  { id: 'street-donation-message', timestamp: 3522, asset: '/assets/reporting/street-donation-message.png', rect: [284,366,386,92], text: 'Donate for zero-Avarice society.' },
];

export const REPORTING_BY_ID: Readonly<Record<string, ReportingAsset>> =
  Object.fromEntries(REPORTING_ASSETS.map(asset => [asset.id, asset]));

export const REPORTING_DEVICE = {
  expandedRect: [1259,811,180,189] as ReportingRect,
  collapsedRect: [1259,911,180,89] as ReportingRect,
  collapsedOffsetY: 100,
  topToggleRect: [1306,811,88,31] as ReportingRect,
  collapsedTopToggleRect: [1306,911,88,31] as ReportingRect,
  counterHoverRect: [1267,841,166,58] as ReportingRect,
  collapsedCounterHoverRect: [1267,941,166,58] as ReportingRect,
  todayDigitsRect: [1284,849,51,45] as ReportingRect,
  weekDigitsRect: [1365,849,52,45] as ReportingRect,
  reportButtonRect: [1290,925,120,54] as ReportingRect,
  cityProgressIconRect: [217,23,60,60] as ReportingRect,
  todayLabel: 'TODAY',
  weekLabel: 'THIS WEEK',
  todayMeaning: 'The player’s reports of the day; explicitly stated by the tutorial.',
  weekMeaning: 'The player’s reports of the week; explicitly stated by the tutorial.',
  targetOfObservedPress: 'The customer currently at the counter.',
  observedCashChangeOnPress: 0,
};

export interface ReportingObservation {
  id: string;
  from: number;
  to: number;
  evidence: 'continuous-visible' | 'edited-transition' | 'tutorial-text' | 'street-observation';
  reportsBefore?: [number,number];
  reportsAfter?: [number,number];
  cashBefore?: number;
  cashAfter?: number;
  note: string;
}

export const REPORTING_OBSERVATIONS: ReportingObservation[] = [
  { id: 'counter-meanings', from: 3140, to: 3142, evidence: 'tutorial-text', reportsAfter: [0,0], cashAfter: 460,
    note: 'Hovering counter display swaps numbers for TODAY / THIS WEEK labels. The tutorial identifies both as player report totals.' },
  { id: 'city-quota', from: 3150, to: 3154, evidence: 'tutorial-text',
    note: 'Citywide panel has distinct captured-this-week and pre-Avarice-reported series; Still Left is 90. The player’s two counters are not the city capture total.' },
  { id: 'expand-device', from: 3424.8, to: 3425.6, evidence: 'continuous-visible', reportsBefore: [0,0], reportsAfter: [0,0], cashBefore: 2501, cashAfter: 2501,
    note: 'Pointer activates the green roof chevron; collapsed device moves upward 100px, revealing REPORT. This alone does not report.' },
  { id: 'first-report', from: 3425.9, to: 3426.0, evidence: 'continuous-visible', reportsBefore: [0,0], reportsAfter: [1,1], cashBefore: 2501, cashAfter: 2501,
    note: 'Press REPORT while the red-haired Hoverboard for Display seller remains at the counter. Both counters increase once; no confirmation, suspect picker, arrest animation, cash change or interrupted trade is visible.' },
  { id: 'second-report-cut', from: 3466.15, to: 3466.2, evidence: 'edited-transition', reportsBefore: [1,1], reportsAfter: [2,2], cashBefore: 2501, cashAfter: 2407,
    note: 'Hard cut from the seller with offer 14 to Darcy already discussing rent. The second button press, its target, and the cause of the 94 cash decrease are omitted from the recording.' },
  { id: 'street-cut', from: 3476.3, to: 3476.4, evidence: 'edited-transition', reportsBefore: [2,2], cashBefore: 2407, cashAfter: 2431,
    note: 'Hard cut from the rent conversation to the street. The 24 increase is visible across the cut but no payout/receipt/source is shown.' },
  { id: 'final-street', from: 3476.4, to: 3592, evidence: 'street-observation', cashBefore: 2431, cashAfter: 2431,
    note: 'Street board remains 53 Avarice Criminals Left, D-5. Player walks horizontally and opens inventory. Donation slogans appear near the magenta donation terminal; no crowd selection or capture action, reward, deduction or quota change is observed.' },
];

/** Boundaries prevent the runtime from presenting invented reward/penalty rules as video evidence. */
export const REPORTING_UNOBSERVED = {
  cashRewardPerReport: null,
  cashPenaltyPerReport: null,
  reputationChangePerReport: null,
  repeatedReportAgainstSameCustomer: null,
  secondReportedCustomer: null,
  conversionOfOneReportIntoCityCapture: null,
  captureByClickingStreetCrowd: null,
  nextDayResetAfterSubmittingReport: null,
} as const;
