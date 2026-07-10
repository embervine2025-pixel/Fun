// ---------------------------------------------------------------
// Pepper-gotchi rules, v3 — a real-care tracker with a living plant.
//
// Meters are no longer arcade numbers: each one is derived from the
// timestamp of the last real-world care action vs. that plant's
// schedule. The bar hits 0 at 1.5x the interval (the grace window).
// ---------------------------------------------------------------

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const GRACE = 1.5; // meter is empty at interval * GRACE

export const CARE_TYPES = [
  {
    key: "water",
    label: "Water",
    past: "watered",
    meterLabel: "Moisture",
    defaultIntervalDays: 3,
    color: "var(--color-aqua)",
    log: "Watered 💧",
  },
  {
    key: "feed",
    label: "Feed",
    past: "fed",
    meterLabel: "Nutrition",
    defaultIntervalDays: 14,
    color: "var(--color-mango)",
    log: "Fed nutrients 🧪",
  },
  {
    key: "prune",
    label: "Prune",
    past: "pruned",
    meterLabel: "Upkeep",
    defaultIntervalDays: 7,
    color: "var(--color-orchid)",
    log: "Pruned & tidied ✂️",
  },
];

export const DEFAULT_INTERVALS = Object.fromEntries(
  CARE_TYPES.map((c) => [c.key, c.defaultIntervalDays])
);

// Growth stages mirror the real plant. typicalDays is only a hint —
// the app suggests advancing after that long, but you decide.
export const STAGES = [
  { key: "seed", label: "Seed", typicalDays: 10 },
  { key: "sprout", label: "Sprout", typicalDays: 14 },
  { key: "vegetative", label: "Vegetative", typicalDays: 28 },
  { key: "flowering", label: "Flowering", typicalDays: 21 },
  { key: "fruiting", label: "Fruiting", typicalDays: 30 },
  { key: "harvest", label: "Harvest Ready", typicalDays: Infinity },
];

export const STATUS = {
  wilted: { label: "NEEDS WATER!", tone: "danger" },
  pale: { label: "FEED ME", tone: "warn" },
  thriving: { label: "THRIVING!", tone: "great" },
  stable: { label: "ON TRACK", tone: "ok" },
};
