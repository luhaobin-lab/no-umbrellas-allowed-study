/**
 * Auxiliary screens observed in 参考视频.mp4; coordinates remain native 1920x1080.
 * Assets are direct crops/frames, so the caller owns changing money/item overlays.
 * Navigation hotspots mark doors/arrows/prompts actually visible in the footage.
 * A hotspot on a door is an interaction target; original street locomotion is separate.
 */
export type ScreenRect = [number, number, number, number];
export interface AuxiliaryHotspot { id: string; label: string; rect: ScreenRect; action: string }
export interface AuxiliaryScreen { asset: string; rect: ScreenRect; hotspots: AuxiliaryHotspot[] }

export const NAV_ACTIONS = {
  shop: 'nav:shop',
  street: 'nav:street',
  streetWest: 'nav:street-west',
  streetEast: 'nav:street-east',
  lowerFloor: 'nav:street-b2',
  publicSquare: 'nav:public-square',
  flowerShop: 'nav:flower-shop',
  gemShop: 'nav:gem-shop',
  inventory: 'inventory:toggle',
  calendarClose: 'aux:close',
  calendarPrevious: 'calendar:previous',
  calendarNext: 'calendar:next',
  loanClose: 'aux:close',
  payDarcy: 'loan:pay:darcy',
  payExecutor: 'loan:pay:executor',
  getDarcyLoan: 'loan:get:darcy',
  flowerInspect: 'flower:inspect:horong',
  flowerBuy: 'flower:buy:horong',
  flowerTalk: 'flower:talk',
  summaryPrevious: 'summary:previous',
  summaryNext: 'summary:next',
  summarySleep: 'day:sleep',
  summaryBest: 'summary:best:show',
  summaryWorst: 'summary:worst:show',
  summaryTextScroll: 'summary:text:scroll',
  tutorialOkay: 'tutorial:okay',
  report: 'report:submit',
  gemShow: 'gem:show-item',
} as const;

/** Observed values only; no unobserved random probabilities or fabricated price formulas. */
export const AUXILIARY_MECHANICS = {
  horong: {
    cost: 50,
    durationDays: 3,
    quotedAt: 725,
    paidAt: 741,
    cashBefore: 548,
    cashAfter: 498,
    appearsOnCounterAt: 757,
    description: 'The pink heart-shaped plant is sent to the shop and brings good luck for the next 3 days.',
    luckNumericalEffect: null,
  },
  loans: {
    darcy: { indebted: 500, interest: 25, interestPeriodDays: 1, observedAt: 2521, paidAt: 2527, cashBefore: 1851, cashAfter: 1351 },
    executor: { indebted: 1950, interest: 450, interestPeriodDays: 3, observedAt: 2521 },
  },
  privateSlot: {
    maxCards: 2,
    tutorialAt: 3202,
    revealOnDisplay: true,
    secretUntilPurchased: true,
    mayCauseComplaintOrRumor: true,
    tutorialExample: { publicValue: 172, privateValue: 344 },
  },
  day6: {
    shownAt: 669,
    pageCountShown: 2,
    capturedPages: [1],
    visibleItemSlots: 9,
    best: 'Early Poster of AVAC',
    worst: '12 Reasons',
    cashBeforeSummary: 573,
    cashAfterSleep: 548,
    difference: -25,
    feeCauseConfirmed: false,
  },
  calendar: {
    week: 2,
    columns: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    days: {
      MON: ['Paid 15V interest to Darcy', 'Paid 25V interest to Darcy'],
      TUE: ['Interest 25V due to Darcy'],
      WED: ['Interest 25V due to Darcy'],
      THU: ['Umbrella Pickup', 'Interest 25V due to Darcy'],
      FRI: ['Get AVAC card & Time Cinema', 'Merchant Registration -1300V', 'Interest 25V due to Darcy'],
    },
    laterFriday: ['Get AVAC card & Time Cinema', 'Merchant Registration -1300V', 'Interest 450V due to Executor'],
  },
  gemTutorial: { observedAt: 3212, analyzes: ['kind', 'quality'], manualCardSelection: true },
} as const;

const full: ScreenRect = [0, 0, 1920, 1080];
const h = (id: string, label: string, rect: ScreenRect, action: string): AuxiliaryHotspot => ({ id, label, rect, action });
const s = (name: string, hotspots: AuxiliaryHotspot[], rect: ScreenRect = full): AuxiliaryScreen => ({ asset: `/assets/surfaces/${name}.png`, rect, hotspots });
const exitRight = () => h('exit-right', 'Move to Street', [1881, 455, 39, 149], NAV_ACTIONS.street);
const inventory = () => h('inventory', 'Inventory', [1881, 455, 39, 149], NAV_ACTIONS.inventory);
const calendarHotspots = () => [
  h('close', 'Close', [1475, 279, 64, 64], NAV_ACTIONS.calendarClose),
  h('previous', 'Previous week', [748, 288, 86, 63], NAV_ACTIONS.calendarPrevious),
  h('next', 'Next week', [1093, 288, 86, 63], NAV_ACTIONS.calendarNext),
];
const tutorialHotspots = () => [h('okay', 'Okay', [1617, 96, 192, 129], NAV_ACTIONS.tutorialOkay)];

const screens: Record<string, AuxiliaryScreen> = {
  street: s('street-main', [
    h('scented', 'SCENTED', [165, 334, 160, 255], NAV_ACTIONS.flowerShop),
    h('darcy', "DARCY'S", [841, 334, 157, 255], NAV_ACTIONS.shop),
    h('gem', 'GEM', [1532, 334, 150, 255], NAV_ACTIONS.gemShop),
    inventory(),
  ]),
  'street-west': s('street-west', [
    h('scented', 'SCENTED', [1460, 335, 161, 250], NAV_ACTIONS.flowerShop),
    h('lower-floor', 'E Move to lower floor', [1006, 316, 189, 272], NAV_ACTIONS.lowerFloor),
    inventory(),
  ]),
  'street-east': s('street-b1', [
    h('darcy', "DARCY'S", [332, 334, 167, 255], NAV_ACTIONS.shop),
    h('gem', 'GEM', [1012, 334, 172, 255], NAV_ACTIONS.gemShop),
    h('upper-floor', 'Move to upper floor', [1450, 316, 166, 272], NAV_ACTIONS.publicSquare),
    inventory(),
  ]),
  'street-b2': s('street-b2', [
    h('upper-floor', 'Move to upper floor', [1036, 321, 194, 271], NAV_ACTIONS.streetWest),
    inventory(),
  ]),
  'public-square': s('street-public-square', [inventory()]),
  'public-square-later': s('street-arrested', [inventory()]),
  'flower-shop': s('flower-shop', [
    h('horong', 'Horong', [569, 644, 101, 125], NAV_ACTIONS.flowerInspect),
    h('shopkeeper', 'Talk', [825, 430, 209, 387], NAV_ACTIONS.flowerTalk),
    exitRight(),
  ]),
  'flower-buy': s('flower-shop-buy', [
    h('horong-buy', 'E Buy(50V)', [506, 427, 185, 51], NAV_ACTIONS.flowerBuy),
    h('horong-plant', 'Horong — 50V', [569, 644, 101, 125], NAV_ACTIONS.flowerBuy),
    exitRight(),
  ]),
  'gem-shop': s('gem-shop', [
    h('exit-prompt', 'E Move to Street', [824, 418, 251, 65], NAV_ACTIONS.street),
    h('show', 'Show', [1189, 735, 147, 99], NAV_ACTIONS.gemShow),
    h('inventory-tab', 'Inventory', [1304, 454, 37, 151], NAV_ACTIONS.inventory),
  ]),
  calendar: s('week2-calendar-early', calendarHotspots(), [346, 248, 1231, 585]),
  'calendar-later': s('week2-calendar', calendarHotspots(), [346, 248, 1231, 585]),
  loans: s('loans-unpaid', [
    h('close', 'Close loans', [1207, 90, 676, 57], NAV_ACTIONS.loanClose),
    h('pay-darcy', 'Pay Off', [1327, 214, 217, 48], NAV_ACTIONS.payDarcy),
    h('pay-executor', 'Pay Off', [1654, 214, 223, 48], NAV_ACTIONS.payExecutor),
  ], [1206, 90, 678, 417]),
  'loans-paid': s('loans-paid', [
    h('close', 'Close loans', [1207, 90, 676, 57], NAV_ACTIONS.loanClose),
    h('get-darcy', 'Get Loan', [1327, 214, 217, 48], NAV_ACTIONS.getDarcyLoan),
    h('pay-executor', 'Pay Off', [1654, 214, 223, 48], NAV_ACTIONS.payExecutor),
  ], [1206, 90, 678, 417]),
  'day-summary': s('day6-summary', [
    h('best', 'Best deal of the day', [164, 329, 302, 181], NAV_ACTIONS.summaryBest),
    h('worst', 'Worst deal of the day', [164, 576, 302, 192], NAV_ACTIONS.summaryWorst),
    h('next', 'Next page', [1071, 856, 157, 80], NAV_ACTIONS.summaryNext),
    h('previous', 'Previous page', [1233, 856, 157, 80], NAV_ACTIONS.summaryPrevious),
    h('scroll', 'Day 6 record', [1503, 362, 390, 456], NAV_ACTIONS.summaryTextScroll),
    h('sleep', 'Sleep', [1753, 853, 103, 120], NAV_ACTIONS.summarySleep),
  ]),
  'day-summary-best': s('day6-best-hover', [
    h('best', 'Best deal of the day', [164, 329, 302, 181], NAV_ACTIONS.summaryBest),
    h('sleep', 'Sleep', [1753, 853, 103, 120], NAV_ACTIONS.summarySleep),
  ]),
  'private-tutorial': s('private-tutorial', tutorialHotspots()),
  'gem-tutorial': s('gem-tutorial', tutorialHotspots()),
};

const aliases: Record<string, string> = {
  'street-b1': 'street', flower: 'flower-shop', florist: 'flower-shop', gem: 'gem-shop',
  week: 'calendar', 'week2-calendar': 'calendar', summary: 'day-summary', day6: 'day-summary',
  private: 'private-tutorial', 'tutorial-private': 'private-tutorial', 'tutorial-gem': 'gem-tutorial',
};

export function auxiliaryScreen(id: string): AuxiliaryScreen | undefined {
  return screens[aliases[id] ?? id];
}

export const AUXILIARY_SCREEN_IDS = Object.keys(screens);
