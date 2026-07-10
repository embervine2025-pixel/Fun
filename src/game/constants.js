// ---------------------------------------------------------------
// Pepper-gotchi, v4 — a tracker with a living plant.
//
// No chores, no meters: the pixel plant simply grows through its
// stages on a realistic timeline. Stages advance automatically
// after each stage's typical duration; you can correct the stage
// any time in the plant's edit form (it re-anchors from there).
// ---------------------------------------------------------------

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export const STAGES = [
  { key: "seed", label: "Seed", typicalDays: 10 },
  { key: "sprout", label: "Sprout", typicalDays: 14 },
  { key: "vegetative", label: "Vegetative", typicalDays: 28 },
  { key: "flowering", label: "Flowering", typicalDays: 21 },
  { key: "fruiting", label: "Fruiting", typicalDays: 30 },
  { key: "harvest", label: "Harvest Ready", typicalDays: Infinity },
];
