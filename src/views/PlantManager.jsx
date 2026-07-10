import { useState } from "react";
import { CalendarDays, Pencil, Plus, Ruler, Sprout, Trash2 } from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { STAGES } from "../game/constants.js";
import { daysOld, growth, latestHeight } from "../game/engine.js";

const emptyForm = { name: "", variety: "", planted: "", stageIndex: 0, notes: "" };

export default function PlantManager({ state, dispatch, notify, onGoGarden }) {
  const [form, setForm] = useState(null); // null | {id?, ...emptyForm}
  const [toDelete, setToDelete] = useState(null);
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const openNew = () =>
    setForm({ ...emptyForm, planted: new Date().toISOString().slice(0, 10) });

  const openEdit = (p) =>
    setForm({
      id: p.id,
      name: p.name,
      variety: p.variety,
      planted: new Date(p.plantedAt).toISOString().slice(0, 10),
      stageIndex: growth(p).stageIndex,
      notes: p.notes || "",
    });

  const submit = () => {
    if (!form.name.trim()) return notify("Give it a name first!");
    const plantedAt = form.planted
      ? new Date(form.planted + "T12:00:00").getTime()
      : Date.now();
    const stageIndex = Number(form.stageIndex) || 0;
    if (form.id) {
      dispatch({
        type: "UPDATE_PLANT",
        plantId: form.id,
        patch: {
          name: form.name.trim(),
          variety: form.variety.trim(),
          plantedAt,
          stageIndex,
          notes: form.notes.trim(),
        },
      });
      notify("✏️ Plant updated");
    } else {
      dispatch({
        type: "ADD_PLANT",
        plant: {
          name: form.name,
          variety: form.variety,
          plantedAt,
          stageIndex,
          notes: form.notes,
        },
      });
      notify("🌱 Now tracking " + form.name.trim() + "!");
      onGoGarden();
    }
    setForm(null);
  };

  const remove = (p) => {
    dispatch({ type: "DELETE_PLANT", plantId: p.id });
    setToDelete(null);
    notify("👋 Farewell, little pepper");
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h2 className="font-pixel text-[11px] text-foliage-neon tracking-wide">
          MY PLANTS ({state.plants.length})
        </h2>
        <PixelButton onClick={openNew}>
          <Plus size={11} className="inline -mt-0.5 mr-1" />
          ADD
        </PixelButton>
      </div>

      {state.plants.length === 0 && (
        <div className="text-center py-10 font-lcd text-xl text-bone/50">
          No plants tracked yet — add your first pepper!
        </div>
      )}

      <div className="space-y-3">
        {state.plants.map((p) => {
          const g = growth(p);
          const height = latestHeight(p);
          return (
            <div key={p.id} className="bg-bark-card border-2 border-bark-edge p-3 flex gap-3">
              <button
                onClick={() => {
                  dispatch({ type: "SET_ACTIVE", plantId: p.id });
                  onGoGarden();
                }}
                aria-label={`Open ${p.name}`}
                className="shrink-0 bg-lcd border-2 border-bark-deep p-1"
              >
                <PixelSprite stageIndex={g.stageIndex} variety={p.variety} size={76} animate={false} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-[9px] truncate">
                    {p.gen >= 1 && (
                      <span className="px-1 py-0.5 bg-orchid text-bark border border-bark-deep mr-1.5 text-[7px]">
                        F{p.gen}
                      </span>
                    )}
                    {p.name.toUpperCase()}
                  </span>
                  <span className="font-pixel text-[7px] px-1.5 py-1 border-2 border-bark-deep bg-lcd text-foliage-neon tracking-wider shrink-0">
                    {g.stage.label.toUpperCase()}
                  </span>
                </div>
                <div className="font-lcd text-lg text-bone/60 leading-snug mt-0.5">
                  <Sprout size={13} className="inline mr-1 text-foliage" aria-hidden />
                  {p.variety}
                  <br />
                  <CalendarDays size={13} className="inline mr-1 text-bone/40" aria-hidden />
                  {daysOld(p)} days old
                  {height != null && (
                    <>
                      {" · "}
                      <Ruler size={13} className="inline mr-1 text-aqua" aria-hidden />
                      {height} cm
                    </>
                  )}
                </div>
                {/* growth-to-next-stage strip */}
                <div className="h-1.5 bg-lcd overflow-hidden mt-1.5">
                  <div className="h-full bg-sun" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
              <div className="flex flex-col justify-between shrink-0 -m-1">
                <button onClick={() => openEdit(p)} aria-label="Edit" className="p-2.5 text-bone/50 hover:text-bone">
                  <Pencil size={17} />
                </button>
                <button onClick={() => setToDelete(p)} aria-label="Delete" className="p-2.5 text-habanero/70 hover:text-habanero">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="REMOVE PLANT?"
          message={`${toDelete.name} and its ${toDelete.logs.length} journal entries will be gone forever.`}
          confirmLabel="REMOVE"
          onConfirm={() => remove(toDelete)}
          onCancel={() => setToDelete(null)}
        />
      )}

      {form && (
        <Modal title={form.id ? "EDIT PLANT" : "NEW PLANT"} onClose={() => setForm(null)}>
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Hacienda Habanero" />
          </Field>
          <Field label="Variety / species">
            <input className={inputCls} value={form.variety} onChange={set("variety")} placeholder="Habanero Orange" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Planted on">
              <input type="date" className={inputCls} value={form.planted} onChange={set("planted")} />
            </Field>
            <Field label="Current stage">
              <select className={inputCls} value={form.stageIndex} onChange={set("stageIndex")}>
                {STAGES.map((s, i) => (
                  <option key={s.key} value={i}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes (location, soil, source…)">
            <input className={inputCls} value={form.notes} onChange={set("notes")} placeholder="south window, 5 gal pot" />
          </Field>
          <PixelButton className="w-full mt-1" onClick={submit}>
            {form.id ? "SAVE CHANGES" : "START TRACKING"}
          </PixelButton>
        </Modal>
      )}
    </div>
  );
}
