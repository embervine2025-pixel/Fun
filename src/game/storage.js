// localStorage persistence. Because all care state is timestamps,
// no catch-up math is needed on load — derived values are always
// correct for "now". Includes a one-time migration from the v2
// arcade-vitals format so nobody loses their plants.
import { DAY, DEFAULT_INTERVALS, GRACE } from "./constants.js";
import { initialState } from "./engine.js";

const KEY = "pepper-gotchi-v3";
const V2_KEY = "pepper-gotchi-v2";

// v2 stored abstract 0-100 vitals; recover approximate timestamps.
function migrateV2(saved) {
  const now = Date.now();
  const v2Decay = { moisture: 15, nutrition: 5, attention: 10 }; // %/day
  return {
    ...initialState,
    seeds: saved.seeds || [],
    activePlantId: saved.activePlantId ?? null,
    plants: (saved.plants || []).map((p) => {
      const elapsed = (key, vitalKey) =>
        ((100 - (p.vitals?.[vitalKey] ?? 100)) / v2Decay[vitalKey]) * DAY;
      return {
        id: p.id,
        name: p.name,
        variety: p.variety,
        plantedAt: p.plantedAt || now,
        stageIndex: p.stageIndex || 0,
        stageChangedAt: now,
        intervals: { ...DEFAULT_INTERVALS },
        care: {
          water: now - Math.min(elapsed("water", "moisture"), DEFAULT_INTERVALS.water * GRACE * DAY),
          feed: now - Math.min(elapsed("feed", "nutrition"), DEFAULT_INTERVALS.feed * GRACE * DAY),
          prune: now - Math.min(elapsed("prune", "attention"), DEFAULT_INTERVALS.prune * GRACE * DAY),
        },
        logs: (p.logs || []).slice(0, 80),
      };
    }),
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.plants) && Array.isArray(saved.seeds)) {
        return { ...initialState, ...saved };
      }
    }
    const v2raw = localStorage.getItem(V2_KEY);
    if (v2raw) return migrateV2(JSON.parse(v2raw));
  } catch {
    /* fall through to fresh state */
  }
  return initialState;
}

export function saveState(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, lastSavedTimestamp: Date.now() })
    );
  } catch {
    /* storage full / private mode — app still works in memory */
  }
}
