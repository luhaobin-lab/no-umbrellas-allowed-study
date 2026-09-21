/** Original pixels from 参考视频.mp4. Rectangles are x, y, width, height at 1920×1080. */
export interface ReferenceBroadcast {
  id: string;
  kind: 'morning' | 'night' | 'story-card';
  timestamp: number;
  asset: string;
  rect: [number, number, number, number];
  text?: string;
  /** The next observed text state; undefined ends this broadcast sequence. */
  next?: string;
}

export const REFERENCE_BROADCASTS: ReferenceBroadcast[] = [
  {
    id: 'morning-greeting', kind: 'morning', timestamp: 758,
    asset: '/assets/broadcasts/morning-greeting.png', rect: [24, 136, 732, 204],
    text: 'Dear citizens of Ajik City, good morning from the <Association of Victims of Avarice Crimes>.',
    next: 'morning-restraint',
  },
  {
    id: 'morning-restraint', kind: 'morning', timestamp: 762,
    asset: '/assets/broadcasts/morning-restraint.png', rect: [24, 136, 732, 204],
    text: 'Have a restrained and greed-free day. Thank you.',
  },
  {
    id: 'night-end', kind: 'night', timestamp: 1678,
    asset: '/assets/broadcasts/night-end.png', rect: [24, 136, 732, 204],
    text: "Dear citizens, the <Association of Victims of Avarice Crimes> announces the day's end.",
    next: 'night-weather',
  },
  {
    id: 'night-weather', kind: 'night', timestamp: 1684,
    asset: '/assets/broadcasts/night-weather.png', rect: [24, 136, 732, 204],
    text: 'The forecast for tomorrow is clear skies all day. Thank you.',
  },
  {
    id: 'night-day6-end', kind: 'night', timestamp: 559,
    asset: '/assets/broadcasts/night-day6-end.png', rect: [24, 136, 732, 204],
    text: "Dear citizens, the <Association of Victims of Avarice Crimes> announces the day's end.",
    // Identical wording at 558–560. The weather text at 562–564 is covered by the calendar;
    // use the clean, fully observed 1684 state rather than inventing the covered pixels.
    next: 'night-weather',
  },
  {
    id: 'story-weekly-quota', kind: 'story-card', timestamp: 3100,
    asset: '/assets/broadcasts/story-weekly-quota.png', rect: [0, 0, 1920, 1080],
    text: 'From today, all citizens must cooperate to hunt down 90 Avarice criminals each week. By abiding by this one rule, Ajik City will be free from Fixerain forever.',
  },
];

export const BROADCAST_BY_ID: Readonly<Record<string, ReferenceBroadcast>> =
  Object.fromEntries(REFERENCE_BROADCASTS.map(frame => [frame.id, frame]));

export const MORNING_SEQUENCE = ['morning-greeting', 'morning-restraint'] as const;
export const NIGHT_SEQUENCE = ['night-end', 'night-weather'] as const;
export const STORY_SEQUENCE = ['story-weekly-quota'] as const;

/** Small black triangle within the source speech bubbles. The whole bubble is also clickable. */
export const BROADCAST_HOTSPOTS = {
  bubble: [249, 183, 500, 151] as [number, number, number, number],
  continueThreeLines: [710, 272, 28, 24] as [number, number, number, number],
  continueTwoLines: [710, 245, 28, 23] as [number, number, number, number],
  storyContinue: [1751, 975, 32, 20] as [number, number, number, number],
};

/** Shown on the counter after Horong is bought; source crop includes its original table pixels. */
export const HORONG_COUNTER_PATCH = {
  id: 'horong-pink', timestamp: 2521, asset: '/assets/broadcasts/horong-pink.png',
  rect: [1448, 778, 106, 132] as [number, number, number, number],
  firstObservedOnCounter: 757, cost: 50, durationDays: 3,
};

/** AVAC CRT without its speech bubble, if the runtime needs to hold the TV on between lines. */
export const AVAC_CRT_PATCH = {
  timestamp: 1678, asset: '/assets/broadcasts/avac-crt.png',
  rect: [60, 141, 176, 137] as [number, number, number, number],
};
