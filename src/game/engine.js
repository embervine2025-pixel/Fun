// ---------------------------------------------------------------
// Core logic: pure functions + the global state reducer.
// Everything is derived from real timestamps, so "decay" needs no
// background ticks — reading the state at time T gives the truth.
// ---------------------------------------------------------------
import { CARE_TYPES, DAY, DEFAULT_INTERVALS, GRACE, STAGES } from "./constants.js";

export const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const daysOld = (plant, now = Date.now()) =>
  Math.max(0, Math.floor((now - plant.plantedAt) / DAY));

export const daysSince = (ts, now = Date.now()) => (now - ts) / DAY;

/* ---------- derived care state ---------- */

// Meter %: full right after care, empty at interval * GRACE days.
export function carePct(plant, key, now = Date.now()) {
  const interval = plant.intervals[key] || DEFAULT_INTERVALS[key];
  return clamp(
    Math.round(100 * (1 - daysSince(plant.care[key], now) / (interval * GRACE)))
  );
}

// Days until this care is due (negative = overdue).
export function dueInDays(plant, key, now = Date.now()) {
  const interval = plant.intervals[key] || DEFAULT_INTERVALS[key];
  return interval - daysSince(plant.care[key], now);
}

export function dueText(plant, key, now = Date.now()) {
  const d = dueInDays(plant, key, now);
  if (d <= -1) return `overdue ${Math.floor(-d)}d!`;
  if (d <= 0) return "due today";
  if (d <= 1) return "due tomorrow";
  return `due in ${Math.ceil(d)}d`;
}

export function statusOf(plant, now = Date.now()) {
  if (carePct(plant, "water", now) <= 0) return "wilted";
  if (carePct(plant, "feed", now) <= 0) return "pale";
  const allFresh = CARE_TYPES.every((c) => carePct(plant, c.key, now) >= 70);
  return allFresh ? "thriving" : "stable";
}

/* ---------- growth stage (manual, with a hint) ---------- */

export function daysInStage(plant, now = Date.now()) {
  return Math.floor(daysSince(plant.stageChangedAt || plant.plantedAt, now));
}

export function stageHint(plant, now = Date.now()) {
  const stage = STAGES[plant.stageIndex];
  const days = daysInStage(plant, now);
  return {
    days,
    typical: stage.typicalDays,
    pct: isFinite(stage.typicalDays)
      ? clamp(Math.round((days / stage.typicalDays) * 100))
      : 100,
    readyToAdvance:
      isFinite(stage.typicalDays) &&
      days >= stage.typicalDays &&
      plant.stageIndex < STAGES.length - 1,
  };
}

// Latest logged height, if any.
export function latestHeight(plant) {
  const entry = plant.logs.find((e) => e.height != null);
  return entry ? entry.height : null;
}

/* ---------- factories ---------- */

export function createPlant({ name, variety, plantedAt, stageIndex = 0, waterEveryDays }) {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim(),
    variety: (variety || "Mystery Pepper").trim(),
    plantedAt: plantedAt || now,
    stageIndex,
    stageChangedAt: now,
    intervals: {
      ...DEFAULT_INTERVALS,
      ...(waterEveryDays ? { water: waterEveryDays } : {}),
    },
    care: { water: now, feed: now, prune: now },
    logs: [{ ts: now, text: "🌱 Tracking started" }],
  };
}

export function createSeed({ variety, source, year, qty, heat }) {
  return {
    id: uid(),
    variety: variety.trim(),
    source: (source || "").trim(),
    year: year || new Date().getFullYear(),
    qty: Math.max(0, qty | 0),
    heat: clamp(heat | 0, 1, 5),
    addedAt: Date.now(),
  };
}

function addLog(plant, entry) {
  return { ...plant, logs: [entry, ...plant.logs].slice(0, 80) };
}

export const initialState = {
  plants: [],
  seeds: [],
  activePlantId: null,
  lastSavedTimestamp: Date.now(),
};

const mapPlant = (state, id, fn) => ({
  ...state,
  plants: state.plants.map((p) => (p.id === id ? fn(p) : p)),
});

/* ---------- reducer ---------- */

export function reducer(state, action) {
  const now = action.now || Date.now();
  switch (action.type) {
    case "CARE": {
      const spec = CARE_TYPES.find((c) => c.key === action.care);
      if (!spec) return state;
      return mapPlant(state, action.plantId, (p) =>
        addLog(
          { ...p, care: { ...p.care, [spec.key]: now } },
          { ts: now, text: spec.log }
        )
      );
    }

    case "LOG_MEASURE": {
      const height = action.height ? parseFloat(action.height) : null;
      const text = action.text?.trim() || (height != null ? "measured" : "");
      if (height == null && !text) return state;
      return mapPlant(state, action.plantId, (p) =>
        addLog(p, {
          ts: now,
          height,
          text: `📓 ${height != null ? height + " cm" : ""}${height != null && text ? " — " : ""}${text}`,
        })
      );
    }

    case "SET_STAGE":
      return mapPlant(state, action.plantId, (p) => {
        if (action.stageIndex === p.stageIndex) return p;
        return addLog(
          { ...p, stageIndex: action.stageIndex, stageChangedAt: now },
          { ts: now, text: `🌿 Entered ${STAGES[action.stageIndex].label} stage` }
        );
      });

    case "ADD_PLANT": {
      const plant = createPlant(action.plant);
      return { ...state, plants: [...state.plants, plant], activePlantId: plant.id };
    }

    case "UPDATE_PLANT":
      return mapPlant(state, action.plantId, (p) => {
        const next = { ...p, ...action.patch };
        if (
          action.patch.stageIndex != null &&
          action.patch.stageIndex !== p.stageIndex
        ) {
          next.stageChangedAt = now;
        }
        return next;
      });

    case "DELETE_PLANT": {
      const plants = state.plants.filter((p) => p.id !== action.plantId);
      return {
        ...state,
        plants,
        activePlantId:
          state.activePlantId === action.plantId
            ? plants[0]?.id ?? null
            : state.activePlantId,
      };
    }

    case "SET_ACTIVE":
      return { ...state, activePlantId: action.plantId };

    case "ADD_SEED":
      return { ...state, seeds: [createSeed(action.seed), ...state.seeds] };

    case "UPDATE_SEED":
      return {
        ...state,
        seeds: state.seeds.map((s) =>
          s.id === action.seedId
            ? { ...s, ...action.patch, qty: Math.max(0, action.patch.qty ?? s.qty) }
            : s
        ),
      };

    case "DELETE_SEED":
      return { ...state, seeds: state.seeds.filter((s) => s.id !== action.seedId) };

    case "GERMINATE": {
      const seed = state.seeds.find((s) => s.id === action.seedId);
      if (!seed || seed.qty <= 0) return state;
      const plant = createPlant({
        name: action.name || seed.variety,
        variety: seed.variety,
      });
      return {
        ...state,
        seeds: state.seeds.map((s) =>
          s.id === seed.id ? { ...s, qty: s.qty - 1 } : s
        ),
        plants: [...state.plants, plant],
        activePlantId: plant.id,
      };
    }

    case "IMPORT":
      return action.state;

    case "WIPE":
      return { ...initialState, lastSavedTimestamp: now };

    default:
      return state;
  }
}
