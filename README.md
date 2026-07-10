# 🌶️ Pepper-gotchi

A mobile-first, retro pixel-art virtual pet that's secretly a real hot-pepper
grow tracker. Your digital pet's health, mood, and growth stage are tied to
how you log your real-life gardening — water the real plant, press WATER, and
your Pepper-gotchi perks up.

Built with **React + Tailwind CSS v4 + Lucide icons**, bundled by Vite into a
single self-contained HTML file.

## ▶️ Run it

**No install needed:** open `dist/index.html` in any browser — everything
(JS, CSS, pixel fonts) is inlined into that one file.

For development:

```bash
npm install
npm run dev     # dev server with HMR
npm run build   # rebuilds dist/index.html
```

## 🎮 The game loop

| Vital | Decay | Refill |
|---|---|---|
| 💧 Moisture | −15% / 24h | **Water** (+45) |
| 🧪 Nutrition | −5% / 24h | **Feed** (+40) |
| 💗 Attention | −10% / 24h | **Prune** (+35) / **Talk** (+15) |

- **Status effects:** Moisture at 0 → `WILTED` (x-eyes, desaturated droop).
  Nutrition at 0 → `PALE` (washed out). All vitals above 70 → `THRIVING!`
  (glow, blush, sparkles).
- **Growth stages:** Seed → Sprout → Vegetative → Flowering → Fruiting →
  Harvest Ready. Every care action earns XP; your pet auto-evolves as
  thresholds are crossed.
- **Delta-time background calculus:** on load, the elapsed time since
  `lastTick` is computed and the correct decay is deducted — leave for three
  days and you'll come back to a genuinely thirsty pepper.

## 🖥️ Views

1. **Garden Dashboard** — the active pet on an LCD screen (scanlines
   included) with animated segmented vital meters, status badge, XP progress,
   care buttons, and a care log.
2. **Plant Manager** — track multiple live plants with days-old counters,
   variety, mini vital strips, edit/delete.
3. **Seed Vault** — inventory of seed packets: variety, source/brand, harvest
   year, quantity, and a 1–5 flame heat rating. **Germinate** decrements the
   packet and hatches a level-0 pet straight into the garden.

## 🎨 Pixel art & performance notes

- **Zero image files.** Every sprite is a palette-letter grid in
  `src/pixel/sprites.js`, run-length merged into crisp SVG `<rect>` spans with
  `shape-rendering: crispEdges` and `image-rendering: pixelated`.
- The pet's kawaii face lives on the terracotta pot and is drawn
  procedurally, so every growth stage has personality and moods (happy /
  neutral / meh / sad) are swappable without new art.
- All idle motion (float, wilt sway, blink, sparkle) is CSS `@keyframes` —
  GPU-composited transforms, no JS animation loops.
- State persists to `localStorage` on every change; the heartbeat tick runs
  once a minute and on tab-visibility changes.

## 🗂️ Code map

```
src/
  game/constants.js   game rules: stages, decay rates, actions, XP
  game/engine.js      pure logic: reducer, decay, status, XP/evolution
  game/storage.js     localStorage load/save + offline catch-up
  pixel/sprites.js    pixel-art grids + palette (the "asset files")
  pixel/PixelSprite.jsx  crisp SVG sprite renderer w/ faces & status FX
  components/         VitalMeter, StatusBadge, ActionButton, HeatRating, Modal
  views/              GardenDashboard, PlantManager, SeedVault
  App.jsx             state wiring, tick loop, tabs, toasts
```
