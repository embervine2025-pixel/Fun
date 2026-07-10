// localStorage persistence with delta-time catch-up on load.
import { decayPlant, initialState } from "./engine.js";

const KEY = "pepper-gotchi-v2";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.plants) || !Array.isArray(saved.seeds)) {
      return initialState;
    }
    // Background calculus: apply decay for time the app was closed.
    const now = Date.now();
    return {
      ...initialState,
      ...saved,
      plants: saved.plants.map((p) => decayPlant(p, now)),
    };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, lastSavedTimestamp: Date.now() })
    );
  } catch {
    /* storage full / private mode — game still works in memory */
  }
}
