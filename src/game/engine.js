// ---------------------------------------------------------------
// Core business logic: pure functions + the global state reducer.
// No React imports here — fully testable in isolation.
// ---------------------------------------------------------------
import {
  ACTIONS,
  DAY,
  DECAY_PER_DAY,
  LOG_PROGRESS_XP,
  STAGES,
} from "./constants.js";

export const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const daysOld = (plant, now = Date.now()) =>
  Math.max(0, Math.floor((now - plant.plantedAt) / DAY));

export function statusOf(plant) {
  const { moisture, nutrition, attention } = plant.vitals;
  if (moisture <= 0) return "wilted";
  if (nutrition <= 0) return "pale";
  if (moisture > 70 && nutrition > 70 && attention > 70) return "thriving";
  return "stable";
}

export function stageProgress(plant) {
  const stage = STAGES[plant.stageIndex];
  if (!isFinite(stage.xpToNext)) return 100;
  const prev = plant.stageIndex === 0 ? 0 : STAGES[plant.stageIndex - 1].xpToNext;
  return clamp(Math.round(((plant.xp - prev) / (stage.xpToNext - prev)) * 100));
}

export function createPlant({ name, variety, plantedAt, stageIndex = 0 }) {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim(),
    variety: (variety || "Mystery Pepper").trim(),
    plantedAt: plantedAt || now,
    stageIndex,
    xp: stageIndex === 0 ? 0 : STAGES[stageIndex - 1].xpToNext,
    vitals: { moisture: 100, nutrition: 100, attention: 100 },
    lastTick: now,
    logs: [{ ts: now, text: "🥚 A new Pepper-gotchi is born!" }],
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

// Delta-time decay: deduct vitals for the hours elapsed since lastTick.
export function decayPlant(plant, now = Date.now()) {
  const hours = (now - plant.lastTick) / (DAY / 24);
  if (hours <= 0.005) return plant; // < ~20s elapsed, skip churn
  const vitals = { ...plant.vitals };
  for (const key of Object.keys(DECAY_PER_DAY)) {
    vitals[key] = clamp(vitals[key] - (DECAY_PER_DAY[key] * hours) / 24);
  }
  return { ...plant, vitals, lastTick: now };
}

function addLog(plant, text, now) {
  return { ...plant, logs: [{ ts: now, text }, ...plant.logs].slice(0, 60) };
}

// Grant XP and auto-evolve through stages whose threshold is crossed.
function grantXp(plant, xp, now) {
  let p = { ...plant, xp: plant.xp + xp };
  while (
    p.stageIndex < STAGES.length - 1 &&
    p.xp >= STAGES[p.stageIndex].xpToNext
  ) {
    p = addLog(
      { ...p, stageIndex: p.stageIndex + 1 },
      `🎉 Evolved into ${STAGES[p.stageIndex + 1].label}!`,
      now
    );
    p.evolvedAt = now; // lets the UI play a celebration
  }
  return p;
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

export function reducer(state, action) {
  const now = action.now || Date.now();
  switch (action.type) {
    case "TICK":
      return {
        ...state,
        plants: state.plants.map((p) => decayPlant(p, now)),
      };

    case "CARE": {
      const spec = ACTIONS[action.action];
      if (!spec) return state;
      return mapPlant(state, action.plantId, (plant) => {
        let p = decayPlant(plant, now);
        p = {
          ...p,
          vitals: {
            ...p.vitals,
            [spec.vital]: clamp(p.vitals[spec.vital] + spec.amount),
          },
        };
        p = addLog(p, spec.log, now);
        return grantXp(p, spec.xp, now);
      });
    }

    case "LOG_PROGRESS":
      return mapPlant(state, action.plantId, (plant) => {
        let p = decayPlant(plant, now);
        const height = action.height ? `${action.height} cm — ` : "";
        p = addLog(p, `📓 ${height}${action.text || "progress logged"}`, now);
        return grantXp(p, LOG_PROGRESS_XP, now);
      });

    case "ADD_PLANT": {
      const plant = createPlant(action.plant);
      return { ...state, plants: [...state.plants, plant], activePlantId: plant.id };
    }

    case "UPDATE_PLANT":
      return mapPlant(state, action.plantId, (p) => {
        const next = { ...p, ...action.patch };
        // Manual stage change re-anchors XP so progress bars stay sane.
        if (action.patch.stageIndex != null && action.patch.stageIndex !== p.stageIndex) {
          next.xp =
            action.patch.stageIndex === 0
              ? 0
              : STAGES[action.patch.stageIndex - 1].xpToNext;
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
          s.id === action.seedId ? { ...s, ...action.patch, qty: Math.max(0, action.patch.qty ?? s.qty) } : s
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
