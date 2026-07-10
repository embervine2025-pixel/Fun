import { useState } from "react";
import { CalendarDays, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import PixelSprite from "../pixel/PixelSprite.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";
import { STAGES, VITALS } from "../game/constants.js";
import { daysOld, statusOf } from "../game/engine.js";

const emptyForm = { name: "", variety: "", planted: "", stageIndex: 0 };

export default function PlantManager({ state, dispatch, notify, onGoGarden }) {
  const [form, setForm] = useState(null); // null | {id?, ...emptyForm}
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
      stageIndex: p.stageIndex,
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
        patch: { name: form.name.trim(), variety: form.variety.trim(), plantedAt, stageIndex },
      });
      notify("✏️ Plant updated");
    } else {
      dispatch({
        type: "ADD_PLANT",
        plant: { name: form.name, variety: form.variety, plantedAt, stageIndex },
      });
      notify("🌱 New Pepper-gotchi spawned!");
      onGoGarden();
    }
    setForm(null);
  };

  const remove = (p) => {
    if (!confirm(`Remove ${p.name}? Its logs go with it.`)) return;
    dispatch({ type: "DELETE_PLANT", plantId: p.id });
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
          const status = statusOf(p);
          return (
            <div key={p.id} className="bg-bark-card border-2 border-bark-edge p-3 flex gap-3">
              <button
                onClick={() => {
                  dispatch({ type: "SET_ACTIVE", plantId: p.id });
                  onGoGarden();
                }}
                aria-label={`Open ${p.name} in garden`}
                className="shrink-0 bg-lcd border-2 border-bark-deep p-1"
              >
                <PixelSprite stageIndex={p.stageIndex} status={status} size={76} animate={false} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-[9px] truncate">{p.name.toUpperCase()}</span>
                  <StatusBadge status={status} />
                </div>
                <div className="font-lcd text-lg text-bone/60 leading-snug mt-0.5">
                  <Sprout size={13} className="inline mr-1 text-foliage" aria-hidden />
                  {p.variety} · {STAGES[p.stageIndex].label}
                  <br />
                  <CalendarDays size={13} className="inline mr-1 text-bone/40" aria-hidden />
                  {daysOld(p)} days old · {p.logs.length} log entries
                </div>
                {/* mini vitals strip */}
                <div className="flex gap-1 mt-1.5">
                  {VITALS.map((v) => (
                    <div key={v.key} className="flex-1 h-1.5 bg-lcd overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${p.vitals[v.key]}%`, backgroundColor: v.color }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => openEdit(p)} aria-label="Edit" className="text-bone/50 hover:text-bone">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(p)} aria-label="Delete" className="text-habanero/70 hover:text-habanero">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {form && (
        <Modal title={form.id ? "EDIT PLANT" : "NEW PLANT"} onClose={() => setForm(null)}>
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Hacienda Habanero" />
          </Field>
          <Field label="Variety / species">
            <input className={inputCls} value={form.variety} onChange={set("variety")} placeholder="Capsicum chinense" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Planted on">
              <input type="date" className={inputCls} value={form.planted} onChange={set("planted")} />
            </Field>
            <Field label="Growth stage">
              <select className={inputCls} value={form.stageIndex} onChange={set("stageIndex")}>
                {STAGES.map((s, i) => (
                  <option key={s.key} value={i}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <PixelButton className="w-full mt-1" onClick={submit}>
            {form.id ? "SAVE CHANGES" : "SPAWN PEPPER-GOTCHI"}
          </PixelButton>
        </Modal>
      )}
    </div>
  );
}
