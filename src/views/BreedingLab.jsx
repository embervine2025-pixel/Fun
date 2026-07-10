import { useState } from "react";
import { Dna, Plus, Trash2 } from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import PixelBee from "../components/PixelBee.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { growth } from "../game/engine.js";

// A parent's live sprite if the plant still exists; otherwise a
// flowering stand-in drawn from the variety recorded on the cross.
function ParentSprite({ plant, variety, size }) {
  return (
    <PixelSprite
      stageIndex={plant ? growth(plant).stageIndex : 3}
      variety={plant ? plant.variety : variety}
      size={size}
    />
  );
}

export default function BreedingLab({ state, dispatch, notify }) {
  const [crossForm, setCrossForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const crosses = state.crosses || [];

  const openNew = () =>
    setCrossForm({
      motherId: state.plants[0]?.id,
      fatherId: state.plants[1]?.id,
      method: "hand",
      note: "",
    });

  const offspringOf = (c) => {
    const label = `${c.motherVariety} × ${c.fatherVariety}`;
    const packets = state.seeds.filter((s) => s.variety === label);
    const seedCount = packets.reduce((n, s) => n + s.qty, 0);
    const plants = state.plants.filter((p) => p.variety === label);
    return { label, packets: packets.length, seedCount, plants };
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h2 className="font-pixel text-[11px] text-orchid tracking-wide">
          <Dna size={13} className="inline -mt-1 mr-1.5" aria-hidden />
          CROSSES ({crosses.length})
        </h2>
        {state.plants.length >= 2 && (
          <PixelButton onClick={openNew}>
            <Plus size={11} className="inline -mt-0.5 mr-1" />
            NEW CROSS
          </PixelButton>
        )}
      </div>

      {crosses.length === 0 && (
        <div className="text-center py-8 px-4 font-lcd text-xl text-bone/50">
          {state.plants.length >= 2 ? (
            <>No crosses yet. Pollinate one plant with another's pollen, record it here, and track the hybrid line for generations. 🐝</>
          ) : (
            <>Track at least two plants to record a cross between them.</>
          )}
        </div>
      )}

      <div className="space-y-4">
        {crosses.map((c) => {
          const mother = state.plants.find((p) => p.id === c.motherId);
          const father = state.plants.find((p) => p.id === c.fatherId);
          const kids = offspringOf(c);
          return (
            <div key={c.id} className="bg-bark-card border-2 border-bark-edge">
              {/* the couple, side by side on their own LCD */}
              <div className="bg-lcd relative scanlines border-b-2 border-bark-edge">
                <div className="flex justify-center items-end gap-1 px-2 pt-3 relative">
                  <div className="text-center">
                    <ParentSprite plant={mother} variety={c.motherVariety} size={118} />
                    <div className="font-pixel text-[7px] text-foliage-neon tracking-wider pb-1">
                      ♀ {c.motherName.toUpperCase()}
                    </div>
                    <div className="font-lcd text-base text-bone/50 pb-2 leading-tight">
                      {c.motherVariety}
                    </div>
                  </div>
                  <div className="font-pixel text-[10px] text-orchid pb-16">×</div>
                  <div className="text-center">
                    <ParentSprite plant={father} variety={c.fatherVariety} size={118} />
                    <div className="font-pixel text-[7px] text-aqua tracking-wider pb-1">
                      ♂ {c.fatherName.toUpperCase()}
                    </div>
                    <div className="font-lcd text-base text-bone/50 pb-2 leading-tight">
                      {c.fatherVariety}
                    </div>
                  </div>
                  <PixelBee className="left-[30%] top-[30%]" />
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-pixel text-[9px] leading-5">
                    <span className="px-1 py-0.5 bg-orchid text-bark border border-bark-deep mr-1.5 text-[7px]">
                      F1
                    </span>
                    {kids.label.toUpperCase()}
                  </div>
                  <button
                    onClick={() => setToDelete(c)}
                    aria-label="Delete cross"
                    className="p-2 -m-1 text-habanero/70 hover:text-habanero shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="font-lcd text-lg text-bone/60 mt-1 leading-snug">
                  🐝 {new Date(c.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  {" · "}
                  {c.method === "hand" ? "hand-pollinated" : "open pollination"}
                  {c.note && <><br />📝 {c.note}</>}
                </div>
                <div className="font-lcd text-lg mt-1.5">
                  {kids.seedCount > 0 || kids.plants.length > 0 ? (
                    <>
                      {kids.seedCount > 0 && (
                        <span className="text-sun">
                          🌰 {kids.seedCount} F1 seed{kids.seedCount === 1 ? "" : "s"} banked
                        </span>
                      )}
                      {kids.seedCount > 0 && kids.plants.length > 0 && " · "}
                      {kids.plants.length > 0 && (
                        <span className="text-foliage-neon">
                          🌱 {kids.plants.map((p) => p.name).join(", ")} growing
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-bone/40">
                      no offspring yet — SAVE SEEDS on {c.motherName} when pods ripen
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="DELETE CROSS?"
          message={`Remove the ${toDelete.motherVariety} × ${toDelete.fatherVariety} record? Seeds and plants from it are kept.`}
          confirmLabel="DELETE"
          onConfirm={() => {
            dispatch({ type: "DELETE_CROSS", crossId: toDelete.id });
            setToDelete(null);
            notify("🗑️ Cross record removed");
          }}
          onCancel={() => setToDelete(null)}
        />
      )}

      {crossForm && (
        <Modal title="🐝 NEW CROSS" onClose={() => setCrossForm(null)}>
          <p className="font-lcd text-lg text-bone/60 mb-3">
            Record a real pollination between two of your plants. Seeds you
            later save from the pod parent can be banked as F1 hybrids.
          </p>
          <Field label="Pod parent (mother — grows the crossed pods)">
            <select
              className={inputCls}
              value={crossForm.motherId}
              onChange={(e) => setCrossForm((f) => ({ ...f, motherId: e.target.value }))}
            >
              {state.plants.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.variety}</option>
              ))}
            </select>
          </Field>
          <Field label="Pollen donor (father)">
            <select
              className={inputCls}
              value={crossForm.fatherId}
              onChange={(e) => setCrossForm((f) => ({ ...f, fatherId: e.target.value }))}
            >
              {state.plants.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.variety}</option>
              ))}
            </select>
          </Field>
          <Field label="Method">
            <select
              className={inputCls}
              value={crossForm.method}
              onChange={(e) => setCrossForm((f) => ({ ...f, method: e.target.value }))}
            >
              <option value="hand">Hand-pollinated (bagged flower)</option>
              <option value="open">Open pollination (plants side by side)</option>
            </select>
          </Field>
          <Field label="Note (which flower, truss, date bagged…)">
            <input
              className={inputCls}
              value={crossForm.note}
              onChange={(e) => setCrossForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="3rd truss, bagged after brushing"
            />
          </Field>
          <PixelButton
            className="w-full mt-1"
            onClick={() => {
              if (crossForm.motherId === crossForm.fatherId)
                return notify("Pick two different plants!");
              dispatch({ type: "ADD_CROSS", ...crossForm });
              setCrossForm(null);
              notify("🐝 Cross recorded — good luck!");
            }}
          >
            🐝 RECORD CROSS
          </PixelButton>
        </Modal>
      )}
    </div>
  );
}
