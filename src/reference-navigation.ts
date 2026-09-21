/** Additional service/clock entry evidence from the supplied video. Rect = native x/y/w/h. */
export const CALENDAR_ENTRY = {
  id: 'calendar-entry', rect: [695,422,89,68] as [number,number,number,number],
  asset: '/assets/navigation/calendar-entry.png', assetTimestamp: 556,
  action: 'nav:calendar', input: 'click',
  beforeTimestamp: 561.2, afterTimestamp: 561.4,
  note: 'Physical date plaque immediately left of the central shop door. Cursor clicks its lower-right area; calendar opens without leaving shop or dismissing TV.',
};

export const SERVICE_NAVIGATION = [
  {
    id: 'stabilizer-office', floor: 'public', action: 'nav:office',
    timestamp: 2913.2, prompt: 'Talk', input: 'E',
    promptAsset: '/assets/navigation/office-talk.png',
    promptRect: [861,360,82,38] as [number,number,number,number],
    interactionArea: [886,369,211,172] as [number,number,number,number],
    sourcePlayerX: 960, sourceLeftLiftX: 692,
    note: 'This is an open street window, not a separate room. E Talk is visible before the 2913.4 dialogue; registration is paid on this same street. Prompt asset is a source crop; StreetWorld owns its dynamic glyph mask.',
    returnTo: 'public-square', entryObserved: true,
  },
  {
    id: 'gem-door-observation', floor: 'b1', action: 'street:unobserved:gem-interior',
    timestamp: 2924.8, prompt: 'Move to GEM byul', input: 'E',
    source: 'reference/street/native/2924.8.png',
    note: 'The GEM prompt is observed, but the player keeps walking right through 2925.8. The recording then cuts to a repair room at 2926. This does not establish that GEM provides repair; the B2 1st REPAIR sign is visible but its entrance is omitted.',
    returnTo: 'street', entryObserved: false,
  },
  {
    id: 'repair-return', floor: 'interior', action: 'nav:street',
    timestamp: 2938, prompt: 'Move to Street', input: 'E',
    promptAsset: '/assets/navigation/repair-exit-prompt.png',
    promptRect: [827,427,240,45] as [number,number,number,number],
    interactionArea: [811,740,310,88] as [number,number,number,number],
    note: 'The exit prompt is observed above Bob while he stands over the floor mat. Actual departure is cut: 2971.6 still in service room, 2971.8 already Darcy sales wall.',
    returnTo: 'street', entryObserved: false,
  },
] as const;
