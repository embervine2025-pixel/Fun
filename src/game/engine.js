// ---------------------------------------------------------------
// Core logic: pure functions + the global state reducer.
// The plant's stage is derived from real elapsed time, so simply
// reading the state at time T always gives the current truth.
// ---------------------------------------------------------------
import { DAY, STAGES } from "./constants.js";

export const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const daysOld = (plant, now = Date.now()) =>
  Math.max(0, Math.floor((now - plant.plantedAt) / DAY));

export const daysSince = (ts, now = Date.now()) => (now - ts) / DAY;

/* ---------- automatic slow growth ---------- */

// Walk forward from the last user-set stage anchor, consuming each
// stage's typical duration. Gives the stage the plant is in *today*,
// how long it's been there, and progress toward the next stage.
export function growth(plant, now = Date.now()) {
  let idx = plant.stageIndex;
  let anchor = plant.stageChangedAt || plant.plantedAt;
  while (
    idx < STAGES.length - 1 &&
    daysSince(anchor, now) >= STAGES[idx].typicalDays
  ) {
    anchor += STAGES[idx].typicalDays * DAY;
    idx++;
  }
  const stage = STAGES[idx];
  const daysIn = Math.floor(daysSince(anchor, now));
  return {
    stageIndex: idx,
    stage,
    daysIn,
    typical: stage.typicalDays,
    pct: isFinite(stage.typicalDays)
      ? clamp(Math.round((daysSince(anchor, now) / stage.typicalDays) * 100))
      : 100,
    next: idx < STAGES.length - 1 ? STAGES[idx + 1] : null,
  };
}

// Latest logged height, if any.
export function latestHeight(plant) {
  const entry = plant.logs.find((e) => e.height != null);
  return entry ? entry.height : null;
}

/* ---------- factories ---------- */

export function createPlant({ name, variety, plantedAt, stageIndex = 0, notes }) {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim(),
    variety: (variety || "Mystery Pepper").trim(),
    notes: (notes || "").trim(),
    plantedAt: plantedAt || now,
    stageIndex,
    stageChangedAt: now,
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
  return { ...plant, logs: [entry, ...plant.logs].slice(0, 100) };
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

    case "ADD_PLANT": {
      const plant = createPlant(action.plant);
      return { ...state, plants: [...state.plants, plant], activePlantId: plant.id };
    }

    case "UPDATE_PLANT":
      return mapPlant(state, action.plantId, (p) => {
        const next = { ...p, ...action.patch };
        // Correcting the stage re-anchors automatic growth from today.
        if (
          action.patch.stageIndex != null &&
          action.patch.stageIndex !== growth(p, now).stageIndex
        ) {
          next.stageChangedAt = now;
          return addLog(next, {
            ts: now,
            text: `🌿 Stage set to ${STAGES[action.patch.stageIndex].label}`,
          });
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
