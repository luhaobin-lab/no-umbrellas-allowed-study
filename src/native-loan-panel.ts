/** Native loan-panel composition; no prerecorded balances or UI screenshots.
 * Layout: user video at 2521 s / 3395 s, 1920 × 1080.
 * Art: official 1.0.5 Demo sprites, integer 3× sampling. See
 * docs/research/NATIVE_LOAN_PANEL.md for source and remaining visual limits.
 */
export type LoanPanelRect = [number, number, number, number];
export type LoanPanelAction = 'pay' | 'get';
export type LoanPanelStatus = 'active' | 'offered' | 'repaid' | 'aborted';

export interface LoanPanelEntry {
  /** Creditor id used by the engine, e.g. darcy / executor / avac. */
  id: string;
  name: string;
  principal: number;
  /** Actual current repayment quote, including any applicable interest. */
  payoff: number;
  /** Amount charged for one cycle; not a percentage. */
  interest: number;
  cycle: number;
  overdue: number;
  active: boolean;
  /** Omit for the active/offered state implied by active. Closed records may
   * be supplied separately from a fresh offer from the same creditor. */
  status?: LoanPanelStatus;
  /** Optional stable key when one creditor has both an offer and a paid record. */
  key?: string;
  portrait?: string;
  disabled?: boolean;
}

export type LoanPanelDraw = (asset: string, x: number, y: number, w?: number, h?: number) => void;
export type LoanPanelText = (s: string, x: number, y: number, size?: number, color?: string, align?: CanvasTextAlign) => void;
export type LoanPanelHit = (id: string, label: string, rect: LoanPanelRect, action: () => void, extras?: { disabled?: boolean }) => void;

export interface LoanPanelOptions {
  entries: readonly LoanPanelEntry[];
  draw: LoanPanelDraw;
  /** OrangeKid text renderer, with alphabetic baseline coordinates. */
  text: LoanPanelText;
  hit: LoanPanelHit;
  onClose: () => void;
  onAction: (id: string, action: LoanPanelAction) => void;
  /** Omit when the host handles affordability feedback itself. */
  cash?: number;
  /** Existing pointer state is optional; it only changes native button art. */
  pressedId?: string | null;
  fontFamily?: string;
  currency?: string;
}

export const NATIVE_LOAN_LAYOUT = Object.freeze({
  panel: [1206, 90, 678, 420] as LoanPanelRect,
  close: [1206, 90, 678, 57] as LoanPanelRect,
  columns: 2,
  maximumEntries: 6,
  cardOrigin: [1215, 147] as const,
  columnStep: 330,
  rowStep: 120,
  cardSize: [330, 114] as const,
  // These sizes are font em sizes; actual OrangeKid glyph ink is smaller.
  informationSize: 26,
  buttonSize: 34,
  availableColor: '#473f2f',
  debtColor: '#922b25',
  stampColor: '#ae1936',
});

export const NATIVE_LOAN_ASSETS = Object.freeze({
  main: '/assets/demo-panels/loan_main.png',
  slot: '/assets/demo-panels/loan_slot.png',
  button: '/assets/demo-panels/loan_button.png',
  pressed: '/assets/demo-panels/loan_button_pressed.png',
  stamp: '/assets/demo-panels/loan_status.png',
  darcy: '/assets/demo-panels/loan_Darcy.png',
  executor: '/assets/demo-panels/loan_executor.png',
  avac: '/assets/demo-panels/loan_ajik.png',
  bluebird: '/assets/demo-panels/loan_bbCapital.png',
});

const integer = (value: number) => Number.isFinite(value) ? String(Math.max(0, Math.trunc(value))) : '—';

export function renderLoanPanel(ctx: CanvasRenderingContext2D, options: LoanPanelOptions): void {
  const { draw, text, hit, onClose, onAction } = options;
  const layout = NATIVE_LOAN_LAYOUT;
  const currency = options.currency ?? 'V';
  const fontFamily = options.fontFamily ?? 'OrangeKid';

  function line(value: string, x: number, baseline: number, width: number, size: number, color: string, align: CanvasTextAlign = 'left') {
    ctx.save();
    // A long dynamic balance must fit its own information area. The host's
    // text callback keeps font selection consistent with the rest of the UI.
    ctx.font = `${size}px ${fontFamily}`;
    const measured = ctx.measureText(value).width;
    const fittingSize = measured > width ? size * width / measured : size;
    ctx.textBaseline = 'alphabetic';
    text(value, x, baseline, fittingSize, color, align);
    ctx.restore();
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  draw(NATIVE_LOAN_ASSETS.main, ...layout.panel);
  // Block inputs to shop controls underneath the non-modal ledger.
  hit('loan-panel', 'Loan ledger', [...layout.panel], () => {});
  hit('loan-close', 'Close loans', [...layout.close], onClose);

  options.entries.slice(0, layout.maximumEntries).forEach((entry, index) => {
    const x = layout.cardOrigin[0] + index % layout.columns * layout.columnStep;
    const y = layout.cardOrigin[1] + Math.floor(index / layout.columns) * layout.rowStep;
    const status = entry.status ?? (entry.active ? 'active' : 'offered');
    const active = status === 'active';
    const closed = status === 'repaid' || status === 'aborted';
    const action: LoanPanelAction = active ? 'pay' : 'get';
    const actionId = `loan-${action}-${entry.key ?? entry.id}`;
    const disabled = closed || !!entry.disabled || (active && options.cash !== undefined && options.cash < entry.payoff);
    const color = active ? layout.debtColor : layout.availableColor;
    const assetKey = entry.id.toLowerCase();
    const portrait = entry.portrait ?? (assetKey === 'darcy' || assetKey === 'executor' || assetKey === 'avac' || assetKey === 'bluebird' ? NATIVE_LOAN_ASSETS[assetKey] : undefined);
    const button: LoanPanelRect = [x + 111, y + 69, 216, 42];

    draw(NATIVE_LOAN_ASSETS.slot, x, y, ...layout.cardSize);
    if (portrait) draw(portrait, x + 3, y + 3, 105, 108);
    else line(entry.name, x + 55, y + 61, 93, 24, layout.availableColor, 'center');
    draw(options.pressedId === actionId && !disabled ? NATIVE_LOAN_ASSETS.pressed : NATIVE_LOAN_ASSETS.button, ...button);

    line(`Interest: ${integer(entry.interest)}${currency}/${integer(entry.cycle)}days`, x + 118, y + 29, 204, layout.informationSize, color);
    const amount = active ? entry.payoff : entry.principal;
    const statusText = closed ? (status === 'repaid' ? 'Reimbursed' : 'Stopped') : `${active ? 'Indebted' : 'Available'}: ${integer(amount)}${currency}`;
    line(statusText, x + 118, y + 56, 204, layout.informationSize, color);

    ctx.save();
    if (disabled && !closed) ctx.globalAlpha *= .48;
    line(active ? 'Pay Off' : 'Get Loan', x + 217, y + 99, 198, layout.buttonSize, color, 'center');
    ctx.restore();

    if (closed) {
      // The original UI keeps a faded closed record and overlays its native
      // red status frame. Only the dynamic status text is drawn here.
      ctx.fillStyle = 'rgba(229,223,207,.57)';
      ctx.fillRect(x + 3, y + 3, 324, 108);
      draw(NATIVE_LOAN_ASSETS.stamp, x + 75, y + 9, 180, 96);
      ctx.save();
      ctx.translate(x + 165, y + 57);
      ctx.rotate(-5 * Math.PI / 180);
      line(status === 'repaid' ? 'PAID' : 'STOPPED', 0, 13, 156, 45, layout.stampColor, 'center');
      ctx.restore();
    }

    const overdue = entry.overdue > 0 ? `; ${integer(entry.overdue)} payment periods overdue` : '';
    const label = active ? `Pay Off ${entry.id}: ${integer(entry.payoff)}${currency}${overdue}${disabled ? '; insufficient cash' : ''}` : `Get Loan ${entry.id}: ${integer(entry.principal)}${currency}`;
    hit(actionId, label, button, () => { if (!disabled) onAction(entry.id, action); }, { disabled });
  });
  ctx.restore();
}
