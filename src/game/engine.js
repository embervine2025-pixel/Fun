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

export function createPlant({ name, variety, plantedAt, stageIndex = 0, notes, gen = 0 }) {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim(),
    variety: (variety || "Mystery Pepper").trim(),
    notes: (notes || "").trim(),
    gen, // 0 = true-to-type, 1 = F1 hybrid, 2 = F2, ...
    plantedAt: plantedAt || now,
    stageIndex,
    stageChangedAt: now,
    logs: [{ ts: now, text: "🌱 Tracking started" }],
  };
}

export function createSeed({ variety, source, year, qty, heat, gen = 0 }) {
  return {
    id: uid(),
    variety: variety.trim(),
    source: (source || "").trim(),
    year: year || new Date().getFullYear(),
    qty: Math.max(0, qty | 0),
    heat: clamp(heat | 0, 1, 5),
    gen,
    addedAt: Date.now(),
  };
}

/* ---------- breeding ---------- */

// Seed-saving options for a plant: true-to-type (or next hybrid
// generation), plus an F1 option for every cross it mothered.
export function parentageOptions(plant, crosses = []) {
  const opts = [];
  if (plant.gen >= 1) {
    opts.push({
      key: "self",
      label: plant.variety,
      gen: plant.gen + 1,
      desc: `F${plant.gen + 1} — next generation of this hybrid`,
    });
  } else {
    opts.push({
      key: "self",
      label: plant.variety,
      gen: 0,
      desc: "true to type (no cross)",
    });
  }
  for (const c of crosses) {
    if (c.motherId !== plant.id) continue;
    opts.push({
      key: c.id,
      label: `${c.motherVariety} × ${c.fatherVariety}`,
      gen: 1,
      desc: `F1 — crossed ${new Date(c.date).toLocaleDateString()}`,
    });
  }
  return opts;
}

function addLog(plant, entry) {
  return { ...plant, logs: [entry, ...plant.logs].slice(0, 100) };
}

export const initialState = {
  plants: [],
  seeds: [],
  crosses: [],
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

    case "ADD_CROSS": {
      const mother = state.plants.find((p) => p.id === action.motherId);
      const father = state.plants.find((p) => p.id === action.fatherId);
      if (!mother || !father || mother.id === father.id) return state;
      const cross = {
        id: uid(),
        motherId: mother.id,
        fatherId: father.id,
        motherName: mother.name,
        motherVariety: mother.variety,
        fatherName: father.name,
        fatherVariety: father.variety,
        method: action.method || "hand",
        note: (action.note || "").trim(),
        date: now,
      };
      const methodText =
        cross.method === "hand" ? "hand-pollinated" : "open pollination";
      let next = { ...state, crosses: [cross, ...(state.crosses || [])] };
      next = mapPlant(next, mother.id, (p) =>
        addLog(p, { ts: now, text: `🐝 Crossed with ${father.name} (${father.variety}) — pod parent, ${methodText}` })
      );
      next = mapPlant(next, father.id, (p) =>
        addLog(p, { ts: now, text: `🐝 Pollen donor for ${mother.name} (${mother.variety}) — ${methodText}` })
      );
      return next;
    }

    case "SAVE_SEEDS": {
      const plant = state.plants.find((p) => p.id === action.plantId);
      if (!plant || !action.qty) return state;
      const seed = createSeed({
        variety: action.label,
        source: `saved from ${plant.name}`,
        year: new Date(now).getFullYear(),
        qty: action.qty,
        heat: 3,
        gen: action.gen || 0,
      });
      const genTag = seed.gen ? ` (F${seed.gen})` : "";
      return mapPlant(
        { ...state, seeds: [seed, ...state.seeds] },
        plant.id,
        (p) => addLog(p, { ts: now, text: `🌰 Saved ${seed.qty} seeds — ${seed.variety}${genTag}` })
      );
    }

    case "GERMINATE": {
      const seed = state.seeds.find((s) => s.id === action.seedId);
      if (!seed || seed.qty <= 0) return state;
      const plant = createPlant({
        name: action.name || seed.variety,
        variety: seed.variety,
        gen: seed.gen || 0,
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
