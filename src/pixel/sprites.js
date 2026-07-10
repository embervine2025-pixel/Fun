// ---------------------------------------------------------------
// Pure-code pixel art, v3 — "real pepper plant" edition.
//
// Instead of hand-drawn blob grids, sprites are COMPOSED like a
// real plant: a central stem, pointed leaves stamped along branch
// nodes, hanging tapered pods, and tiny blossoms. A final pass
// auto-traces a dark outline around the whole silhouette for that
// crisp farm-sim look. Rendered as run-length-merged SVG <rect>s.
//
// Canvas: 32 x 32 cells. Rows 0-24 plant, 25-31 soil + terracotta pot.
// ---------------------------------------------------------------

export const GRID = 32;
const W = 32;
const H = 32;

export const PALETTE = {
  ".": null,
  k: "#1b3a17", // dark outline
  // foliage
  L: "#a2e85b", // leaf highlight
  G: "#58c84b", // leaf light-mid
  D: "#3f9e3c", // leaf mid
  E: "#2c6e31", // deep green / stems
  // pods
  r: "#e8402a", // ripe red
  R: "#a81f12", // red shade
  h: "#ff8c4a", // red-pod highlight
  o: "#ff9e2e", // ripe orange
  O: "#cc6f14", // orange shade
  // blossom & sparkle
  w: "#f7f9ef",
  y: "#ffd93b",
  // seed
  n: "#d9a066",
  N: "#8f5a2b",
  // soil
  s: "#2a2013",
  S: "#4a3620",
  // terracotta pot
  q: "#e08b4f",
  p: "#c96f3b",
  P: "#8f4720",
};

// Which letters count as "plant body" for the outline tracer.
const SOLID = new Set(["L", "G", "D", "E", "r", "R", "h", "o", "O", "w", "y", "n", "N"]);

/* ---------------- tiny raster toolkit ---------------- */

const blank = () => Array.from({ length: H }, () => Array(W).fill("."));

function stamp(g, sx, sy, pattern, flip = false) {
  pattern.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const ch = row[dx];
      if (ch === ".") continue;
      const x = sx + (flip ? row.length - 1 - dx : dx);
      const y = sy + dy;
      if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch;
    }
  });
}

// 2px-wide stem with a lit edge, from yTop down to the soil.
function stem(g, yTop, yBottom = 25, x = 15) {
  for (let y = yTop; y <= yBottom; y++) {
    g[y][x] = "E";
    g[y][x + 1] = "D";
  }
}

// Auto-outline: every empty cell touching the plant becomes 'k'.
// Only applied above the pot so soil/terracotta stay clean.
function outline(g) {
  const out = g.map((row) => row.slice());
  for (let y = 0; y < 26; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x] !== ".") continue;
      const touches =
        (y > 0 && SOLID.has(g[y - 1][x])) ||
        (y < H - 1 && SOLID.has(g[y + 1][x])) ||
        (x > 0 && SOLID.has(g[y][x - 1])) ||
        (x < W - 1 && SOLID.has(g[y][x + 1]));
      if (touches) out[y][x] = "k";
    }
  }
  return out;
}

/* ---------------- plant part stamps ---------------- */

// Pointed leaves; attach on the left edge, flip for left-side leaves.
const LEAF_BIG = [
  ".DGGGL.",
  "EDGGGLL",
  ".EDDGG.",
];
const LEAF_SMALL = [
  ".DGL.",
  "EDGGL",
];

// Hanging tapered pods with a green calyx and a light rib.
const POD_RED = [".E.", "rrh", "Rrh", "Rrr", ".R."];
const POD_ORANGE = [".E.", "ooy", "Ooy", "Ooo", ".O."];
const POD_GREEN = [".E.", "GGL", "DGL", "DGG", ".D."];

const BLOSSOM = [".w.", "wyw", ".w."];

const SEED = [".nn.", "nNNn", ".NN."];

/* ---------------- shared ground: soil + pot ---------------- */

function ground(g) {
  // soil bed sitting inside the pot rim
  for (let x = 10; x <= 21; x++) g[25][x] = (x * 7) % 3 ? "s" : "S";
  for (let x = 9; x <= 22; x++) g[26][x] = "q";
  for (let x = 9; x <= 22; x++) g[27][x] = "P";
  for (let x = 10; x <= 21; x++) g[28][x] = "p";
  for (let x = 10; x <= 21; x++) g[29][x] = "p";
  for (let x = 10; x <= 21; x++) g[30][x] = "P";
  for (let x = 11; x <= 20; x++) g[31][x] = "P";
}

/* ---------------- growth stage compositions ---------------- */

function seedStage(g) {
  stamp(g, 14, 22, SEED);
}

function sproutStage(g) {
  stem(g, 21);
  stamp(g, 17, 20, LEAF_SMALL);
  stamp(g, 10, 20, LEAF_SMALL, true);
  g[19][16] = "L"; // fresh tip
}

function vegetativeStage(g) {
  stem(g, 12);
  stamp(g, 17, 12, LEAF_SMALL);
  stamp(g, 10, 12, LEAF_SMALL, true);
  stamp(g, 17, 15, LEAF_BIG);
  stamp(g, 8, 17, LEAF_BIG, true);
  stamp(g, 17, 19, LEAF_BIG);
  stamp(g, 10, 22, LEAF_SMALL, true);
  g[11][16] = "L";
}

function floweringStage(g) {
  stem(g, 9);
  stamp(g, 17, 9, LEAF_SMALL);
  stamp(g, 10, 9, LEAF_SMALL, true);
  stamp(g, 17, 12, LEAF_BIG);
  stamp(g, 8, 14, LEAF_BIG, true);
  stamp(g, 17, 16, LEAF_BIG);
  stamp(g, 8, 18, LEAF_BIG, true);
  stamp(g, 17, 20, LEAF_SMALL);
  g[8][16] = "L";
  // blossoms at the branch tips
  stamp(g, 22, 10, BLOSSOM);
  stamp(g, 5, 12, BLOSSOM);
  stamp(g, 21, 18, BLOSSOM);
}

function fruitingStage(g) {
  stem(g, 9);
  stamp(g, 17, 9, LEAF_SMALL);
  stamp(g, 10, 9, LEAF_SMALL, true);
  stamp(g, 17, 12, LEAF_BIG);
  stamp(g, 8, 14, LEAF_BIG, true);
  stamp(g, 17, 16, LEAF_BIG);
  stamp(g, 8, 18, LEAF_BIG, true);
  g[8][16] = "L";
  stamp(g, 22, 9, BLOSSOM); // one late blossom
  // young pods hanging under the branches — mostly still green
  stamp(g, 21, 15, POD_GREEN);
  stamp(g, 9, 17, POD_GREEN);
  stamp(g, 18, 19, POD_RED); // first ripening pod!
}

function harvestStage(g) {
  stem(g, 7);
  stamp(g, 17, 7, LEAF_SMALL);
  stamp(g, 10, 7, LEAF_SMALL, true);
  stamp(g, 17, 10, LEAF_BIG);
  stamp(g, 8, 12, LEAF_BIG, true);
  stamp(g, 17, 14, LEAF_BIG);
  stamp(g, 8, 16, LEAF_BIG, true);
  stamp(g, 17, 18, LEAF_SMALL);
  g[6][16] = "L";
  // loaded with ripe pods
  stamp(g, 22, 11, POD_RED);
  stamp(g, 6, 13, POD_RED);
  stamp(g, 21, 17, POD_ORANGE);
  stamp(g, 9, 19, POD_RED);
  stamp(g, 13, 20, POD_ORANGE);
}

/* ---------------- build + export ---------------- */

const BUILDERS = [
  seedStage,
  sproutStage,
  vegetativeStage,
  floweringStage,
  fruitingStage,
  harvestStage,
];

export const STAGE_SPRITES = BUILDERS.map((build) => {
  let g = blank();
  build(g);
  g = outline(g);
  ground(g);
  return g.map((row) => row.join(""));
});

/* ---------------- status → look modifiers ---------------- */

export const STATUS_FX = {
  thriving: {
    filter: "drop-shadow(0 0 6px rgba(88,200,75,0.5))",
    plantTransform: "",
  },
  stable: { filter: "", plantTransform: "" },
  pale: { filter: "saturate(0.4) brightness(1.1)", plantTransform: "" },
  wilted: {
    filter: "saturate(0.5) sepia(0.3) brightness(0.82)",
    plantTransform: "translate(0 1)",
  },
};

// Run-length-merge a grid row into [x, width, color] spans.
export function rowSpans(row) {
  const spans = [];
  let x = 0;
  while (x < row.length) {
    const ch = row[x];
    if (ch === "." || !PALETTE[ch]) {
      x++;
      continue;
    }
    let w = 1;
    while (x + w < row.length && row[x + w] === ch) w++;
    spans.push([x, w, PALETTE[ch]]);
    x += w;
  }
  return spans;
}
