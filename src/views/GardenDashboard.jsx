import { useMemo, useState } from "react";
import {
  ArrowUp,
  Droplets,
  FlaskConical,
  NotebookPen,
  Ruler,
  Scissors,
} from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import VitalMeter from "../components/VitalMeter.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { CARE_TYPES, STAGES } from "../game/constants.js";
import {
  carePct,
  daysOld,
  daysSince,
  dueText,
  latestHeight,
  stageHint,
  statusOf,
} from "../game/engine.js";

const CARE_ICONS = { water: Droplets, feed: FlaskConical, prune: Scissors };

function agoText(ts) {
  const d = daysSince(ts);
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  return `${Math.floor(d)}d ago`;
}

export default function GardenDashboard({ state, dispatch, notify, onGoPlant }) {
  const [logOpen, setLogOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logHeight, setLogHeight] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [pulse, setPulse] = useState(0);

  const plant = useMemo(
    () => state.plants.find((p) => p.id === state.activePlantId) || state.plants[0],
    [state.plants, state.activePlantId]
  );

  if (!plant) {
    return (
      <div className="flex flex-col items-center pt-14 px-6 text-center">
        <PixelSprite stageIndex={2} status="stable" size={170} />
        <p className="font-pixel text-[10px] leading-6 text-bone/80 mt-6 max-w-xs">
          NO PLANTS TRACKED YET. ADD ONE OR GERMINATE A SEED FROM THE VAULT.
        </p>
        <PixelButton className="mt-6" onClick={onGoPlant}>
          + ADD A PLANT
        </PixelButton>
      </div>
    );
  }

  const status = statusOf(plant);
  const stage = STAGES[plant.stageIndex];
  const hint = stageHint(plant);
  const age = daysOld(plant);
  const height = latestHeight(plant);

  const care = (key) => {
    dispatch({ type: "CARE", plantId: plant.id, care: key });
    setPulse((n) => n + 1);
    notify(
      { water: "💧 Watering logged", feed: "🧪 Feeding logged", prune: "✂️ Pruning logged" }[key]
    );
  };

  const saveLog = () => {
    if (!logText.trim() && !logHeight) return notify("Add a note or height first!");
    dispatch({ type: "LOG_MEASURE", plantId: plant.id, text: logText, height: logHeight });
    setLogOpen(false);
    setLogText("");
    setLogHeight("");
    notify("📓 Entry saved");
  };

  const advanceStage = () => {
    dispatch({ type: "SET_STAGE", plantId: plant.id, stageIndex: plant.stageIndex + 1 });
    setAdvancing(false);
    setPulse((n) => n + 1);
    notify(`🌿 Now ${STAGES[plant.stageIndex + 1].label}!`);
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
                {height != null && ` · ${height} cm`}
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

          {/* stage tracker — manual, with a typical-duration hint */}
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[8px] text-bone/80 tracking-wider shrink-0">
              {stage.label.toUpperCase()}
            </span>
            <div className="flex-1 h-2.5 bg-lcd-lit border-2 border-bark-deep overflow-hidden">
              <div
                className="h-full bg-sun transition-all duration-700"
                style={{ width: `${hint.pct}%` }}
              />
            </div>
            <span className="font-lcd text-base text-bone/60 shrink-0 tabular-nums">
              day {hint.days}
              {isFinite(hint.typical) && ` / ~${hint.typical}`}
            </span>
          </div>
          {hint.readyToAdvance && (
            <button
              onClick={() => setAdvancing(true)}
              className="mt-2 w-full font-pixel text-[8px] tracking-wider bg-sun text-bark border-2 border-bark-deep py-2.5 active:translate-y-[2px]"
            >
              <ArrowUp size={11} className="inline -mt-0.5 mr-1" />
              LOOKING BIGGER? ADVANCE TO {STAGES[plant.stageIndex + 1].label.toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {/* care schedule — real dates drive the meters */}
      <div className="mx-2 mt-7 bg-bark-card border-2 border-bark-edge divide-y-2 divide-bark-edge">
        {CARE_TYPES.map((c) => {
          const pct = carePct(plant, c.key);
          return (
            <div key={c.key} className="p-3.5">
              <VitalMeter icon={CARE_ICONS[c.key]} label={c.meterLabel} value={pct} color={c.color} />
              <div className="flex items-center justify-between mt-2 pl-6">
                <span className="font-lcd text-lg text-bone/60">
                  {c.past} {agoText(plant.care[c.key])} · every{" "}
                  {plant.intervals[c.key]}d ·{" "}
                  <span className={pct <= 20 ? "text-habanero" : "text-bone/60"}>
                    {dueText(plant, c.key)}
                  </span>
                </span>
                <PixelButton onClick={() => care(c.key)}>{c.label.toUpperCase()}</PixelButton>
              </div>
            </div>
          );
        })}
        <div className="p-3.5 flex gap-3">
          <PixelButton variant="ghost" className="flex-1" onClick={() => setLogOpen(true)}>
            <Ruler size={11} className="inline -mt-0.5 mr-1.5" />
            MEASURE
          </PixelButton>
          <PixelButton variant="ghost" className="flex-1" onClick={() => setLogOpen(true)}>
            <NotebookPen size={11} className="inline -mt-0.5 mr-1.5" />
            ADD NOTE
          </PixelButton>
        </div>
      </div>

      {/* journal */}
      <div className="mx-2 mt-6">
        <h3 className="font-pixel text-[9px] text-bone/60 tracking-wider mb-2">JOURNAL</h3>
        <ul className="space-y-1.5">
          {plant.logs.slice(0, 8).map((entry, i) => (
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
        <Modal title="JOURNAL ENTRY" onClose={() => setLogOpen(false)}>
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
            SAVE ENTRY
          </PixelButton>
        </Modal>
      )}

      {advancing && (
        <ConfirmDialog
          title="ADVANCE STAGE?"
          message={`Move ${plant.name} from ${stage.label} to ${STAGES[plant.stageIndex + 1].label}? Do this when the real plant has visibly progressed.`}
          confirmLabel="ADVANCE"
          variant="primary"
          onConfirm={advanceStage}
          onCancel={() => setAdvancing(false)}
        />
      )}
    </div>
  );
}
