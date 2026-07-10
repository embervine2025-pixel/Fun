// localStorage persistence. Older save formats (v2 arcade vitals,
// v3 care schedules) are loaded as-is: the extra fields are simply
// ignored by the v4 engine, and the shared fields (name, variety,
// plantedAt, stageIndex, stageChangedAt, logs) carry over.
import { initialState } from "./engine.js";

const KEYS = ["pepper-gotchi-v3", "pepper-gotchi-v2"]; // newest first

function normalize(saved) {
  const now = Date.now();
  return {
    ...initialState,
    seeds: saved.seeds || [],
    activePlantId: saved.activePlantId ?? null,
    plants: (saved.plants || []).map((p) => ({
      id: p.id,
      name: p.name,
      variety: p.variety || "Mystery Pepper",
      notes: p.notes || "",
      plantedAt: p.plantedAt || now,
      stageIndex: p.stageIndex || 0,
      stageChangedAt: p.stageChangedAt || p.stageStarted || now,
      logs: (p.logs || []).slice(0, 100),
    })),
  };
}

export function loadState() {
  for (const key of KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.plants) && Array.isArray(saved.seeds)) {
        return normalize(saved);
      }
    } catch {
      /* try the next format */
    }
  }
  return initialState;
}

export function saveState(state) {
  try {
    localStorage.setItem(
      KEYS[0],
      JSON.stringify({ ...state, lastSavedTimestamp: Date.now() })
    );
  } catch {
    /* storage full / private mode — app still works in memory */
  }
}
