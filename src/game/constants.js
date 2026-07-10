// ---------------------------------------------------------------
// Pepper-gotchi game rules: growth stages, vital decay, care moves
// ---------------------------------------------------------------

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

// Vital decay in % per 24h
export const DECAY_PER_DAY = {
  moisture: 15,
  nutrition: 5,
  attention: 10,
};

export const VITALS = [
  { key: "moisture", label: "Moisture", color: "var(--color-aqua)" },
  { key: "nutrition", label: "Nutrition", color: "var(--color-mango)" },
  { key: "attention", label: "Attention", color: "var(--color-orchid)" },
];

export const STAGES = [
  { key: "seed", label: "Seed", xpToNext: 40 },
  { key: "sprout", label: "Sprout", xpToNext: 100 },
  { key: "vegetative", label: "Vegetative", xpToNext: 190 },
  { key: "flowering", label: "Flowering", xpToNext: 300 },
  { key: "fruiting", label: "Fruiting", xpToNext: 440 },
  { key: "harvest", label: "Harvest Ready", xpToNext: Infinity },
];

// Care actions: which vital they refill, by how much, and XP earned
export const ACTIONS = {
  water: { label: "Water", vital: "moisture", amount: 45, xp: 10, log: "Watered 💧" },
  feed: { label: "Feed", vital: "nutrition", amount: 40, xp: 14, log: "Fed nutrients 🧪" },
  prune: { label: "Prune", vital: "attention", amount: 35, xp: 12, log: "Pruned & tidied ✂️" },
  talk: { label: "Talk", vital: "attention", amount: 15, xp: 5, log: "Had a chat 💬" },
};

export const LOG_PROGRESS_XP = 20;

export const STATUS = {
  wilted: { label: "WILTED", tone: "danger", face: "sad" },
  pale: { label: "PALE", tone: "warn", face: "meh" },
  thriving: { label: "THRIVING!", tone: "great", face: "happy" },
  stable: { label: "STABLE", tone: "ok", face: "neutral" },
};

export const TALK_LINES = [
  "You're doing great, little one!",
  "Grow big and spicy!",
  "Who's the hottest pepper? You are!",
  "Photosynthesize like you mean it!",
  "One day you'll be salsa. The good kind.",
  "Scoville dreams, my friend.",
];
