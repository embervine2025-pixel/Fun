import { useMemo, useState } from "react";
import { Bean, CalendarDays, Dna, Flame, NotebookPen, Ruler, Sprout } from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import PixelBee from "../components/PixelBee.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import { DAY, STAGES } from "../game/constants.js";
import { daysOld, growth, latestHeight, parentageOptions } from "../game/engine.js";

export default function GardenDashboard({ state, dispatch, notify, onGoPlant }) {
  const [logOpen, setLogOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logHeight, setLogHeight] = useState("");
  const [seedsOpen, setSeedsOpen] = useState(false);
  const [seedQty, setSeedQty] = useState(10);
  const [seedParentage, setSeedParentage] = useState("self");

  const plant = useMemo(
    () => state.plants.find((p) => p.id === state.activePlantId) || state.plants[0],
    [state.plants, state.activePlantId]
  );

  if (!plant) {
    return (
      <div className="flex flex-col items-center pt-14 px-6 text-center">
        <PixelSprite stageIndex={2} size={170} />
        <p className="font-pixel text-[10px] leading-6 text-bone/80 mt-6 max-w-xs">
          NO PLANTS TRACKED YET. ADD ONE OR GERMINATE A SEED FROM THE VAULT.
        </p>
        <PixelButton className="mt-6" onClick={onGoPlant}>
          + ADD A PLANT
        </PixelButton>
      </div>
    );
  }

  const g = growth(plant);
  const age = daysOld(plant);
  const height = latestHeight(plant);
  const measurements = plant.logs.filter((e) => e.height != null).length;
  const crosses = state.crosses || [];
  const plantCrosses = crosses.filter(
    (c) => c.motherId === plant.id || c.fatherId === plant.id
  );
  const recentCross = plantCrosses.some((c) => Date.now() - c.date < 30 * DAY);
  const showBee = g.stageIndex === 3 || recentCross;
  const seedOpts = parentageOptions(plant, crosses);
  const chosenOpt = seedOpts.find((o) => o.key === seedParentage) || seedOpts[0];

  const saveLog = () => {
    if (!logText.trim() && !logHeight) return notify("Add a note or height first!");
    dispatch({ type: "LOG_MEASURE", plantId: plant.id, text: logText, height: logHeight });
    setLogOpen(false);
    setLogText("");
    setLogHeight("");
    notify("📓 Entry saved");
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

      {/* LCD screen — the living plant */}
      <div className="pixel-frame bg-lcd mx-2 mt-3 relative scanlines">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-pixel text-[10px] text-foliage-neon tracking-wide">
                {plant.name.toUpperCase()}
              </div>
              <div className="font-lcd text-lg text-bone/60 leading-tight">
                {plant.variety}
              </div>
            </div>
            <span className="font-pixel text-[8px] px-2 py-1.5 border-2 border-bark-deep bg-lcd-lit text-foliage-neon tracking-wider">
              {g.stage.label.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-center py-2 relative">
            <PixelSprite
              stageIndex={g.stageIndex}
              variety={plant.variety}
              size={Math.min(216, Math.round(window.innerWidth * 0.56))}
            />
            {showBee && <PixelBee className="left-[16%] top-[38%]" />}
          </div>

          {/* slow automatic growth toward the next stage */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-lcd-lit border-2 border-bark-deep overflow-hidden">
              <div
                className="h-full bg-sun transition-all duration-700"
                style={{ width: `${g.pct}%` }}
              />
            </div>
            <span className="font-lcd text-base text-bone/60 shrink-0 tabular-nums">
              {g.next
                ? `day ${g.daysIn} / ~${g.typical} → ${g.next.label.toLowerCase()}`
                : `day ${g.daysIn} · fully grown 🌶`}
            </span>
          </div>
        </div>
      </div>

      {/* plant record */}
      <div className="mx-2 mt-7 bg-bark-card border-2 border-bark-edge">
        <div className="grid grid-cols-2 divide-x-2 divide-bark-edge border-b-2 border-bark-edge">
          <div className="p-3">
            <div className="font-pixel text-[7px] text-bone/50 tracking-wider mb-1">PLANTED</div>
            <div className="font-lcd text-xl leading-tight">
              <CalendarDays size={14} className="inline -mt-1 mr-1.5 text-foliage" aria-hidden />
              {new Date(plant.plantedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="font-lcd text-lg text-bone/50">{age} days ago</div>
          </div>
          <div className="p-3">
            <div className="font-pixel text-[7px] text-bone/50 tracking-wider mb-1">HEIGHT</div>
            <div className="font-lcd text-xl leading-tight">
              <Ruler size={14} className="inline -mt-1 mr-1.5 text-aqua" aria-hidden />
              {height != null ? `${height} cm` : "not measured"}
            </div>
            <div className="font-lcd text-lg text-bone/50">
              {measurements} measurement{measurements === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x-2 divide-bark-edge">
          <div className="p-3">
            <div className="font-pixel text-[7px] text-bone/50 tracking-wider mb-1">STAGE</div>
            <div className="font-lcd text-xl leading-tight">
              <Sprout size={14} className="inline -mt-1 mr-1.5 text-foliage" aria-hidden />
              {g.stage.label}
            </div>
            <div className="font-lcd text-lg text-bone/50">
              {g.stageIndex + 1} of {STAGES.length}
            </div>
          </div>
          <div className="p-3">
            <div className="font-pixel text-[7px] text-bone/50 tracking-wider mb-1">VARIETY</div>
            <div className="font-lcd text-xl leading-tight">
              <Flame size={14} className="inline -mt-1 mr-1.5 text-habanero" aria-hidden />
              {plant.variety}
            </div>
            {plant.notes && (
              <div className="font-lcd text-lg text-bone/50 break-words">{plant.notes}</div>
            )}
          </div>
        </div>
        <div className="p-3 flex gap-2 border-t-2 border-bark-edge">
          <PixelButton variant="ghost" className="flex-1" onClick={() => setLogOpen(true)}>
            <Ruler size={11} className="inline -mt-0.5 mr-1" />
            MEASURE
          </PixelButton>
          <PixelButton variant="ghost" className="flex-1" onClick={() => setLogOpen(true)}>
            <NotebookPen size={11} className="inline -mt-0.5 mr-1" />
            NOTE
          </PixelButton>
          <PixelButton
            variant="ghost"
            className="flex-1"
            onClick={() => {
              setSeedParentage(seedOpts[0].key);
              setSeedQty(10);
              setSeedsOpen(true);
            }}
          >
            <Bean size={11} className="inline -mt-0.5 mr-1" />
            SAVE SEEDS
          </PixelButton>
        </div>
      </div>

      {/* breeding record */}
      {(plant.gen >= 1 || plantCrosses.length > 0) && (
        <div className="mx-2 mt-6 bg-bark-card border-2 border-bark-edge p-3">
          <h3 className="font-pixel text-[9px] text-orchid tracking-wider mb-2">
            <Dna size={12} className="inline -mt-0.5 mr-1.5" aria-hidden />
            BREEDING
          </h3>
          {plant.gen >= 1 && (
            <div className="font-lcd text-xl mb-1">
              <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-orchid text-bark border-2 border-bark-deep mr-2">
                F{plant.gen}
              </span>
              hybrid · {plant.variety}
            </div>
          )}
          {plantCrosses.map((c) => (
            <div key={c.id} className="font-lcd text-lg text-bone/70 leading-snug">
              🐝 {new Date(c.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}:{" "}
              {c.motherId === plant.id
                ? `pod parent × ${c.fatherName} (${c.fatherVariety})`
                : `pollen donor for ${c.motherName} (${c.motherVariety})`}
              {" · "}
              {c.method === "hand" ? "hand-pollinated" : "open pollination"}
              {c.note && ` · ${c.note}`}
            </div>
          ))}
          {plant.gen >= 1 && (
            <p className="font-lcd text-lg text-bone/50 mt-1">
              Seeds saved from this plant will be F{plant.gen + 1}.
            </p>
          )}
        </div>
      )}

      {/* journal */}
      <div className="mx-2 mt-6">
        <h3 className="font-pixel text-[9px] text-bone/60 tracking-wider mb-2">JOURNAL</h3>
        <ul className="space-y-1.5">
          {plant.logs.slice(0, 10).map((entry, i) => (
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

      {seedsOpen && (
        <Modal title="SAVE SEEDS" onClose={() => setSeedsOpen(false)}>
          <Field label="Seed parentage">
            <select
              className={inputCls}
              value={seedParentage}
              onChange={(e) => setSeedParentage(e.target.value)}
            >
              {seedOpts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.gen ? `F${o.gen}: ` : ""}{o.label} — {o.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How many seeds?">
            <input
              type="number"
              min="1"
              className={inputCls}
              value={seedQty}
              onChange={(e) => setSeedQty(e.target.value)}
            />
          </Field>
          <p className="font-lcd text-lg text-bone/60 mb-3">
            A new packet goes into the vault:{" "}
            <b className="text-sun">
              {chosenOpt.gen ? `F${chosenOpt.gen} ` : ""}{chosenOpt.label}
            </b>{" "}
            · saved from {plant.name} · {new Date().getFullYear()}
          </p>
          <PixelButton
            className="w-full"
            onClick={() => {
              const qty = Math.max(1, parseInt(seedQty, 10) || 1);
              dispatch({
                type: "SAVE_SEEDS",
                plantId: plant.id,
                qty,
                label: chosenOpt.label,
                gen: chosenOpt.gen,
              });
              setSeedsOpen(false);
              notify(`🌰 ${qty} seeds banked in the vault!`);
            }}
          >
            🌰 BANK THE SEEDS
          </PixelButton>
        </Modal>
      )}

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
    </div>
  );
}
