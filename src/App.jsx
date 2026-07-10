import { useEffect, useReducer, useRef, useState } from "react";
import { Archive, Flame, Flower2, Sprout } from "lucide-react";
import { reducer } from "./game/engine.js";
import { loadState, saveState } from "./game/storage.js";
import GardenDashboard from "./views/GardenDashboard.jsx";
import PlantManager from "./views/PlantManager.jsx";
import SeedVault from "./views/SeedVault.jsx";

const TABS = [
  { key: "garden", label: "Garden", icon: Flower2 },
  { key: "plants", label: "Plants", icon: Sprout },
  { key: "vault", label: "Vault", icon: Archive },
];

export default function App() {
  // loadState applies delta-time decay for the hours the app was closed.
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [tab, setTab] = useState("garden");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  // Offline persistence: save on every state change.
  useEffect(() => saveState(state), [state]);

  // Slow heartbeat tick keeps vitals decaying while the app stays open.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK" }), 60_000);
    // Also catch up instantly when the tab becomes visible again.
    const onVisible = () =>
      document.visibilityState === "visible" && dispatch({ type: "TICK" });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const viewProps = {
    state,
    dispatch,
    notify,
    onGoGarden: () => setTab("garden"),
    onGoPlant: () => setTab("plants"),
  };

  return (
    <div className="max-w-md mx-auto min-h-dvh flex flex-col">
      {/* header */}
      <header className="text-center pt-5 pb-1">
        <h1 className="font-pixel text-sm text-habanero tracking-widest">
          <Flame size={14} className="inline -mt-1 text-mango" aria-hidden /> PEPPER-GOTCHI{" "}
          <Flame size={14} className="inline -mt-1 text-mango" aria-hidden />
        </h1>
        <p className="font-lcd text-lg text-bone/50 mt-1">
          raise 'em spicy · water 'em real
        </p>
      </header>

      {/* active view */}
      <main className="flex-1 pb-24">
        {tab === "garden" && <GardenDashboard {...viewProps} />}
        {tab === "plants" && <PlantManager {...viewProps} />}
        {tab === "vault" && <SeedVault {...viewProps} />}
      </main>

      {/* bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bark-deep border-t-2 border-bark-edge pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto flex">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? "text-foliage-neon" : "text-bone/40"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />
                <span className="font-pixel text-[7px] tracking-wider">
                  {label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className="bg-bark-deep border-2 border-foliage px-4 py-2 font-lcd text-xl text-center break-words max-w-full"
            style={{ animation: "px-toast-in .25s ease-out both" }}
          >
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
