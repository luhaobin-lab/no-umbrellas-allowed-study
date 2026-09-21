/** Serializable inputs/state for the independently implemented Windows 1.0.5 rules. */
export type NativePersonality = 'WishyWashy' | 'Active' | 'Cautious' | 'Emotional' | 'Fixie';
export type NativeModifier = 'AddedCustomerToday' | 'AddedCustomerTomorrow' | 'DeceivingAsBusy' | 'Rain' | 'Busy' | 'Easy' | 'FrightenedReported' | 'ConfusedReported' | 'AngryReported' | 'FrustratedReported' | 'Enthusiast' | 'Junuk' | 'SingSing' | 'DarcyFriend';
export type NativeColor = 'Gray' | 'Green' | 'Blue' | 'Red' | 'Yellow' | 'Pink';
export interface NativeCardInfo { id: string; category: string; color: NativeColor; tier: number }
export interface NativeHaggleAction { type: 'PriceStamp' | 'PlayerSuggestPrice' | 'CustomerSuggestPrice' | 'PlayerDeclinePrice' | 'CustomerDeclinePrice' | 'CustomerAcceptDeal' | 'CustomerDeclineDeal' | 'PlayerSuggestCard' | 'CustomerAcceptCard' | 'CustomerDeclineCard' | 'CustomerDeclareCard' | 'PlayerHideCard' | 'PlayerUseTool' | 'CustomerAskForPrice' | 'CustomerAskForCard' | 'CustomerNagging' | 'Tick'; tick: number; amount?: number; cardId?: string; category?: string; correct?: boolean | null; toolId?: string }
export interface NativeNegotiationInput {
  /** Exact CustomFunction registry key from the current StoreEvent. */
  scriptId?: string | null;
  personality?: NativePersonality;
  entryPoint?: 'controller' | 'io';
  modifier?: NativeModifier | null;
  /** Only the generated-customer entry point selects a random modifier. */
  autoSelectModifier?: boolean;
  challenge?: boolean;
  day?: number;
  globals?: Record<string,string | number | boolean>;
  actualFake?: boolean | null;
  itemCondition?: number;
  shopBalance?: number;
  sameTypeStockValues?: number[];
  redCardRolls?: {once:number;last:number;report:number};
  appraiseProportion?: number | null;
  missingCategories?: number | null;
  nonCorrectCategories?: number | null;
  hasUnappraisedPositiveCard?: boolean | null;
  customerCardIds?: string[];
  playerCardIds?: string[];
  trueCardIds?: string[];
  referenceCardIds?: string[];
  priceHookActive?: boolean;
  cardHookActive?: boolean;
  normalIdle?: boolean;
  /** A source event's opening ask, if supplied by its actual script. */
  initialCounter?: number;
  /** A caller may pin a source-observed construction variant; omitted means sample .5. */
  feelSorry?: boolean;
}
export interface NativeDelayedAction { kind: 'accept'|'counter'|'leave'; amount:number; dueTick:number; counter?:number; source:string; contextLength:number }
export interface NativeNegotiationState {
  script?: import('./native-script-hooks').NativeScriptState | null;
  scriptEffects?: import('./native-script-hooks').NativeScriptEffect[];
  /** Diagnostic actions that do not belong to the source Haggle.context. */
  actionLog?: NativeHaggleAction[];
  personality: NativePersonality;
  entryPoint: 'controller' | 'io';
  family: 'Active' | 'WishyWashy' | 'Fixie';
  modifier: NativeModifier | null;
  selectedModifier: NativeModifier | null;
  context: NativeHaggleAction[];
  pricePipes: string[];
  cardPipes: string[];
  globals: Record<string,string | number | boolean>;
  day: number | null;
  actualFake: boolean | null;
  itemCondition: number | null;
  shopBalance: number | null;
  sameTypeStockValues: number[] | null;
  redCardRolls: {once:number;last:number;report:number} | null;
  missingCategories: number | null;
  nonCorrectCategories: number | null;
  customerCardIds: string[];
  playerCardIds: string[];
  trueCardIds: string[];
  referenceCardIds: string[];
  priceHookActive: boolean;
  cardHookActive: boolean;
  normalIdle: boolean;
  pending: NativeDelayedAction | null;
  delayedActions?:NativeDelayedAction[];
  ticks: number;
  tickRemainder: number;
  hideCount: number;
  warningUsed: boolean;
  confusedPrevious: number | null;
  sourceBranch: string;
  /** Explicit limitations when the controller cannot provide required facts. */
  unknownFacts: string[];
  nagMode: 'nagging' | 'et' | 'by-time' | 'up-down';
  originalFairValue: number;
  nagging?: { kind: 'fixie'|'busy'|'deceiving'|'confused'|'enthusiast'|'junuk'|'singsing'|'nagging'|'et'|'by-time'|'up-down'; threshold:number; stage:number; flower:boolean };
}
export interface NativeCardAction extends Partial<NativeCardInfo> {
  cardId: string;
  category: string;
  correct: boolean | null;
  proposedPublicValue: number;
  proposedCustomerCardIds?: string[];
  missingCategories?: number | null;
  nonCorrectCategories?: number | null;
  customerCardIds?: string[];
  playerCardIds?: string[];
  referenceCardIds?: string[];
  /** Controller can pass exact source classification; unknown stays unknown. */
  subjective?: boolean;
}
export interface NativeSaleItem {
  instanceId: string;
  definitionId: string;
  fairValue: number;
  publicValue: number;
  listingPrice: number;
  available: boolean;
}
export interface NativeSaleInput {
  itemId?: string;
  definitionId?: string;
  visitors?: number;
  gatherTrashCount?: number;
  totallyWrecked?:boolean;
  ratioValue?:number;
  /** Source mandatory-feedback evaluator must explicitly supply its decision. */
  mandatoryFeedback?: { accept: boolean; branch: string } | null;
  conditionFeedback?: { accept: boolean; branch: string } | null;
  eligibleSecondItems?: NativeSaleItem[];
  isAdditionalSale?: boolean;
}
export interface NativeSalePlan {
  kind: 'single' | 'bundle' | 'counter-then-additional';
  itemIds: string[];
  second?: NativeSaleItem;
  total: number;
}
