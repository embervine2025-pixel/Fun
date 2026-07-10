# 🌶️ Pepper-gotchi

A mobile-first pixel-art tracker for real hot-pepper plants and your seed
stash. Each plant is drawn as a living pixel pepper plant that slowly grows
through its real stages — the charm of a virtual pet, the substance of a
grow journal.

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

## 🌱 How it works

- **The plant grows on its own, slowly.** Growth stages (Seed → Sprout →
  Vegetative → Flowering → Fruiting → Harvest Ready) advance automatically
  after each stage's typical real-world duration, anchored to the planted
  date. If the real plant is ahead or behind, correct the stage in the edit
  form and growth re-anchors from there. No chores, no meters, no game-over.
- **Variety-aware pixel art.** The pod shape and color are chosen from the
  variety name: habaneros grow orange lanterns, reapers/ghosts grow gnarly
  tailed pods, jalapeños chunky green-to-red, banana/wax types yellow, bells
  blocky — everyone else gets classic slim chilis.
- **The record is the point.** Per plant: variety, planted date, age, latest
  height, free-form notes, and a dated journal of measurements and
  observations.

## 🖥️ Views

1. **Garden** — the living plant on an LCD screen with its stage, a
   progress bar toward the next stage, a plant-record card (planted /
   height / stage / variety), MEASURE and ADD NOTE actions, and the journal.
2. **Plants** — every tracked plant with its sprite, stage, age, latest
   height, and growth progress; add/edit/remove.
3. **Seed Vault** — seed packet inventory: variety, source/brand, harvest
   year, quantity, 1–5 flame heat rating. **Germinate** decrements the packet
   and starts tracking a new plant from seed.

## 🎨 Pixel art & tech notes

- **Zero image files.** Plants are composed programmatically in
  `src/pixel/sprites.js` — stem, stamped leaves, hanging pods, blossoms —
  then auto-outlined and rendered as run-length-merged SVG `<rect>`s with
  `shape-rendering: crispEdges` + `image-rendering: pixelated`.
- Idle motion is CSS `@keyframes` (GPU-composited); sprite sets are cached
  per pod style.
- All state persists to `localStorage` on every change; older save formats
  are loaded transparently. Stage math is derived from timestamps, so the
  plant is always current no matter how long the app was closed.

## 🗂️ Code map

```
src/
  game/constants.js   growth stages + typical durations
  game/engine.js      pure logic: reducer, automatic growth derivation
  game/storage.js     localStorage load/save + legacy-format normalization
  pixel/sprites.js    composed pixel plants + variety-aware pod styles
  pixel/PixelSprite.jsx  crisp SVG sprite renderer
  components/         Modal, ConfirmDialog, HeatRating, ActionButton
  views/              GardenDashboard, PlantManager, SeedVault
  App.jsx             state wiring, tabs, toasts
```
