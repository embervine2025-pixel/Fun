import { useState } from "react";
import { Archive, Minus, Plus, Sprout, Trash2 } from "lucide-react";
import HeatRating from "../components/HeatRating.jsx";
import Modal, { Field, inputCls, PixelButton } from "../components/Modal.jsx";

const emptyForm = {
  variety: "",
  source: "",
  year: new Date().getFullYear(),
  qty: 10,
  heat: 3,
};

export default function SeedVault({ state, dispatch, notify, onGoGarden }) {
  const [form, setForm] = useState(null);
  const [germinating, setGerminating] = useState(null); // seed being germinated
  const [petName, setPetName] = useState("");

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = () => {
    if (!form.variety.trim()) return notify("What variety are they?");
    dispatch({
      type: "ADD_SEED",
      seed: { ...form, qty: Number(form.qty), year: Number(form.year), heat: Number(form.heat) },
    });
    setForm(null);
    notify("🔐 Packet secured in the vault!");
  };

  const bumpQty = (seed, delta) =>
    dispatch({ type: "UPDATE_SEED", seedId: seed.id, patch: { qty: seed.qty + delta } });

  const remove = (seed) => {
    if (!confirm(`Discard the ${seed.variety} packet?`)) return;
    dispatch({ type: "DELETE_SEED", seedId: seed.id });
  };

  const germinate = () => {
    dispatch({
      type: "GERMINATE",
      seedId: germinating.id,
      name: petName.trim() || germinating.variety,
    });
    notify(`🌱 ${petName.trim() || germinating.variety} has sprouted into the garden!`);
    setGerminating(null);
    setPetName("");
    onGoGarden();
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h2 className="font-pixel text-[11px] text-foliage-neon tracking-wide">
          <Archive size={13} className="inline -mt-1 mr-1.5" aria-hidden />
          SEED VAULT ({state.seeds.length})
        </h2>
        <PixelButton onClick={() => setForm({ ...emptyForm })}>
          <Plus size={11} className="inline -mt-0.5 mr-1" />
          ADD
        </PixelButton>
      </div>

      {state.seeds.length === 0 && (
        <div className="text-center py-10 font-lcd text-xl text-bone/50">
          The vault is empty — deposit your first packet!
        </div>
      )}

      <div className="space-y-3">
        {state.seeds.map((s) => (
          <div key={s.id} className="bg-bark-card border-2 border-bark-edge">
            {/* packet stripe */}
            <div
              className="h-2 border-b-2 border-bark-deep"
              style={{
                background:
                  "repeating-linear-gradient(90deg, var(--color-habanero) 0 10px, var(--color-bark-card) 10px 20px)",
              }}
            />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-pixel text-[9px] truncate">{s.variety.toUpperCase()}</div>
                  <div className="font-lcd text-lg text-bone/60 leading-snug">
                    {s.source || "unknown source"} · harvest {s.year}
                  </div>
                </div>
                <HeatRating value={s.heat} />
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bumpQty(s, -1)}
                    aria-label="One less seed"
                    className="w-7 h-7 grid place-items-center bg-lcd border-2 border-bark-deep text-bone"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="font-pixel text-[10px] w-10 text-center text-sun">{s.qty}</span>
                  <button
                    onClick={() => bumpQty(s, 1)}
                    aria-label="One more seed"
                    className="w-7 h-7 grid place-items-center bg-lcd border-2 border-bark-deep text-bone"
                  >
                    <Plus size={13} />
                  </button>
                  <span className="font-lcd text-lg text-bone/50">seeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <PixelButton
                    onClick={() => {
                      if (s.qty <= 0) return notify("Packet is empty! 😢");
                      setGerminating(s);
                      setPetName("");
                    }}
                  >
                    <Sprout size={11} className="inline -mt-0.5 mr-1" />
                    GERMINATE
                  </PixelButton>
                  <button onClick={() => remove(s)} aria-label="Delete packet" className="text-habanero/70 hover:text-habanero">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <Modal title="DEPOSIT SEEDS" onClose={() => setForm(null)}>
          <Field label="Variety name">
            <input className={inputCls} value={form.variety} onChange={set("variety")} placeholder="Ghost Pepper" />
          </Field>
          <Field label="Source / brand">
            <input className={inputCls} value={form.source} onChange={set("source")} placeholder="Saved from 2025 harvest" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harvest year">
              <input type="number" className={inputCls} value={form.year} onChange={set("year")} />
            </Field>
            <Field label="Quantity">
              <input type="number" min="0" className={inputCls} value={form.qty} onChange={set("qty")} />
            </Field>
          </div>
          <Field label="Heat rating">
            <HeatRating value={Number(form.heat)} onChange={(n) => setForm((f) => ({ ...f, heat: n }))} size={24} />
          </Field>
          <PixelButton className="w-full mt-1" onClick={submit}>
            LOCK IT IN
          </PixelButton>
        </Modal>
      )}

      {germinating && (
        <Modal title="GERMINATE SEED" onClose={() => setGerminating(null)}>
          <p className="font-lcd text-xl text-bone/70 mb-3">
            One {germinating.variety} seed will leave the vault and hatch as a new
            level-0 Pepper-gotchi in your garden.
          </p>
          <Field label="Name your new pet">
            <input
              className={inputCls}
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder={germinating.variety}
              autoFocus
            />
          </Field>
          <PixelButton className="w-full mt-1" onClick={germinate}>
            🌱 HATCH IT
          </PixelButton>
        </Modal>
      )}
    </div>
  );
}
