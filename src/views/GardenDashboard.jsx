import { useMemo, useState } from "react";
import {
  Droplets,
  FlaskConical,
  Heart,
  MessageCircle,
  NotebookPen,
  Scissors,
  Sparkles,
} from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import VitalMeter from "../components/VitalMeter.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ActionButton from "../components/ActionButton.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import { STAGES, TALK_LINES, VITALS } from "../game/constants.js";
import { daysOld, stageProgress, statusOf } from "../game/engine.js";

const VITAL_ICONS = { moisture: Droplets, nutrition: FlaskConical, attention: Heart };

export default function GardenDashboard({ state, dispatch, notify, onGoPlant }) {
  const [logOpen, setLogOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logHeight, setLogHeight] = useState("");
  const [pulse, setPulse] = useState(0); // re-trigger bounce animation

  const plant = useMemo(
    () => state.plants.find((p) => p.id === state.activePlantId) || state.plants[0],
    [state.plants, state.activePlantId]
  );

  if (!plant) {
    return (
      <div className="flex flex-col items-center pt-14 px-6 text-center">
        <PixelSprite stageIndex={0} status="stable" size={170} />
        <p className="font-pixel text-[10px] leading-6 text-bone/80 mt-6 max-w-xs">
          YOUR GARDEN IS EMPTY! ADD A PLANT OR GERMINATE A SEED FROM THE VAULT.
        </p>
        <PixelButton className="mt-6" onClick={onGoPlant}>
          + ADD A PLANT
        </PixelButton>
      </div>
    );
  }

  const status = statusOf(plant);
  const stage = STAGES[plant.stageIndex];
  const progress = stageProgress(plant);
  const age = daysOld(plant);

  const care = (action) => {
    dispatch({ type: "CARE", plantId: plant.id, action });
    setPulse((n) => n + 1);
    if (action === "talk") {
      notify(`"${TALK_LINES[Math.floor(Math.random() * TALK_LINES.length)]}"`);
    } else {
      notify(
        { water: "💧 Glug glug!", feed: "🧪 Yum, nutrients!", prune: "✂️ Fresh trim!" }[action]
      );
    }
  };

  const saveLog = () => {
    if (!logText.trim() && !logHeight) return notify("Add a note or height first!");
    dispatch({
      type: "LOG_PROGRESS",
      plantId: plant.id,
      text: logText.trim(),
      height: logHeight,
    });
    setLogOpen(false);
    setLogText("");
    setLogHeight("");
    notify("📓 Progress logged! +20 XP");
  };

  return (
    <div className="px-4 pb-6">
      {/* plant switcher chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 -mx-4 px-4">
        {state.plants.map((p) => (
          <button
            key={p.id}
            onClick={() => dispatch({ type: "SET_ACTIVE", plantId: p.id })}
            className={`shrink-0 font-pixel text-[8px] px-3.5 py-2.5 border-2 border-bark-deep tracking-wide ${
              p.id === plant.id ? "bg-foliage text-bark" : "bg-bark-card text-bone/70"
            }`}
          >
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* LCD screen */}
      <div className="pixel-frame bg-lcd mx-2 mt-3 relative scanlines">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-pixel text-[10px] text-foliage-neon tracking-wide">
                {plant.name.toUpperCase()}
              </div>
              <div className="font-lcd text-lg text-bone/60 leading-tight">
                {plant.variety} · Day {age}
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          <div key={pulse} className={`flex justify-center py-2 ${pulse ? "anim-bounce" : ""}`}>
            <PixelSprite
              stageIndex={plant.stageIndex}
              status={status}
              size={Math.min(216, Math.round(window.innerWidth * 0.56))}
            />
          </div>

          {/* stage + growth progress */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-sun shrink-0" aria-hidden />
            <span className="font-pixel text-[8px] text-bone/80 tracking-wider">
              {stage.label.toUpperCase()}
            </span>
            <div className="flex-1 h-2.5 bg-lcd-lit border-2 border-bark-deep overflow-hidden">
              <div
                className="h-full bg-sun transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-pixel text-[8px] text-sun">{progress}%</span>
          </div>
        </div>
      </div>

      {/* vitals */}
      <div className="mx-2 mt-7 space-y-3 bg-bark-card border-2 border-bark-edge p-4">
        {VITALS.map((v) => (
          <VitalMeter
            key={v.key}
            icon={VITAL_ICONS[v.key]}
            label={v.label}
            value={plant.vitals[v.key]}
            color={v.color}
          />
        ))}
      </div>

      {/* action bar */}
      <div className="flex justify-around mt-5 px-1">
        <ActionButton icon={Droplets} label="Water" color="var(--color-aqua)" onClick={() => care("water")} />
        <ActionButton icon={FlaskConical} label="Feed" color="var(--color-mango)" onClick={() => care("feed")} />
        <ActionButton icon={Scissors} label="Prune" color="var(--color-foliage)" onClick={() => care("prune")} />
        <ActionButton icon={MessageCircle} label="Talk" color="var(--color-orchid)" onClick={() => care("talk")} />
        <ActionButton icon={NotebookPen} label="Log" color="var(--color-sun)" onClick={() => setLogOpen(true)} />
      </div>

      {/* recent log */}
      <div className="mx-2 mt-6">
        <h3 className="font-pixel text-[9px] text-bone/60 tracking-wider mb-2">CARE LOG</h3>
        <ul className="space-y-1.5">
          {plant.logs.slice(0, 6).map((entry, i) => (
            <li
              key={entry.ts + "-" + i}
              className="flex justify-between items-start gap-3 bg-bark-card border-2 border-bark-edge px-3 py-1.5 font-lcd text-lg"
            >
              <span className="break-words min-w-0">{entry.text}</span>
              <span className="text-bone/40 shrink-0">
                {new Date(entry.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {logOpen && (
        <Modal title="LOG PROGRESS" onClose={() => setLogOpen(false)}>
          <Field label="Height (cm, optional)">
            <input
              type="number"
              min="0"
              step="0.5"
              className={inputCls}
              value={logHeight}
              onChange={(e) => setLogHeight(e.target.value)}
              placeholder="12.5"
            />
          </Field>
          <Field label="Note">
            <input
              type="text"
              className={inputCls}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="First true leaves appeared!"
            />
          </Field>
          <PixelButton className="w-full mt-1" onClick={saveLog}>
            SAVE ENTRY (+20 XP)
          </PixelButton>
        </Modal>
      )}
    </div>
  );
}
