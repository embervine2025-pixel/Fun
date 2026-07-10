// ---------------------------------------------------------------
// Pure-code pixel art, v4 — variety-aware pepper plants.
//
// Sprites are COMPOSED like a real plant: a central stem, pointed
// leaves stamped along branch nodes, hanging pods, and blossoms,
// with an auto-traced dark outline for the crisp farm-sim look.
//
// The pod shape/color is chosen from the plant's variety name:
// habaneros grow orange lanterns, reapers gnarly tailed pods,
// jalapeños chunky green-to-red, wax types yellow, bells blocky.
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
  L: "#a2e85b",
  G: "#58c84b",
  D: "#3f9e3c",
  E: "#2c6e31",
  // pod colors
  r: "#e8402a", // red
  R: "#a81f12",
  h: "#ff8c4a", // warm highlight
  o: "#ff9e2e", // orange
  O: "#cc6f14",
  y: "#ffd93b", // yellow / sparkle
  Y: "#d9a512",
  // blossom
  w: "#f7f9ef",
  // seed
  n: "#d9a066",
  N: "#8f5a2b",
  // soil + pot
  s: "#2a2013",
  S: "#4a3620",
  q: "#e08b4f",
  p: "#c96f3b",
  P: "#8f4720",
};

const SOLID = new Set([
  "L", "G", "D", "E", "r", "R", "h", "o", "O", "y", "Y", "w", "n", "N",
]);

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

function stem(g, yTop, yBottom = 25, x = 15) {
  for (let y = yTop; y <= yBottom; y++) {
    g[y][x] = "E";
    g[y][x + 1] = "D";
  }
}

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

// Recolor a pod pattern (used to render immature green pods).
function recolor(pattern, map) {
  return pattern.map((row) =>
    [...row].map((ch) => map[ch] || ch).join("")
  );
}
const TO_GREEN = { r: "G", R: "D", h: "L", o: "G", O: "D", y: "L", Y: "D" };

/* ---------------- plant part stamps ---------------- */

const LEAF_BIG = [
  ".DGGGL.",
  "EDGGGLL",
  ".EDDGG.",
];
const LEAF_SMALL = [
  ".DGL.",
  "EDGGL",
];
const BLOSSOM = [".w.", "wyw", ".w."];
const SEED = [".nn.", "nNNn", ".NN."];

/* ---------------- variety-aware pod styles ---------------- */

export const POD_STYLES = {
  // slim classic chili — cayenne, thai, generic
  slim: {
    ripe: [".E.", "rrh", "Rrh", "Rrr", ".R."],
    alt: [".E.", "ooy", "Ooy", "Ooo", ".O."],
  },
  // round-shouldered orange lantern — habanero, scotch bonnet
  lantern: {
    ripe: [".E..", "ooyy", "oooy", "Oooo", ".OO."],
    alt: [".E..", "ooyy", "oooy", "Oooo", ".OO."],
  },
  // gnarly pod with the little stinger tail — reaper, ghost, scorpion
  gnarly: {
    ripe: [".E.", "rhh", "Rrh", "rRr", ".Rr", "..r"],
    alt: [".E.", "rhh", "Rrh", "rRr", ".Rr", "..r"],
  },
  // short chunky pod — jalapeño, serrano
  chunky: {
    ripe: [".E.", "rrh", "rrh", ".Rr"],
    alt: [".E.", "GGL", "DGL", ".DG"], // jalapeños get picked green too
  },
  // long yellow wax — banana pepper, lemon drop
  wax: {
    ripe: [".E.", "yyw", "Yyw", "Yyy", ".Yy", ".Y."],
    alt: [".E.", "yyw", "Yyw", "Yyy", ".Yy", ".Y."],
  },
  // big blocky bell — sweet peppers
  bell: {
    ripe: [".E..", "rrhh", "rrrh", "RrrR"],
    alt: [".E..", "yyww", "yyyw", "YyyY"],
  },
};

// Guess the pod style from the variety name.
export function getPodStyle(variety = "") {
  const v = variety.toLowerCase();
  if (/(habanero|bonnet|rocoto|aji charapita)/.test(v)) return "lantern";
  if (/(reaper|ghost|bhut|scorpion|naga|7[- ]?pot|primo)/.test(v)) return "gnarly";
  if (/(jalape|serrano|poblano|fresno)/.test(v)) return "chunky";
  if (/(banana|wax|lemon|sugar rush|aji limon|yellow)/.test(v)) return "wax";
  if (/(bell|sweet|pimiento|shishito|padron)/.test(v)) return "bell";
  return "slim";
}

// Hybrids are written "Mother × Father" (or "... x ...") — a hybrid
// plant grows BOTH parents' pods side by side.
export function getPodStyles(variety = "") {
  const parts = variety.split(/\s+[x×]\s+|×/i).filter((p) => p.trim());
  if (parts.length >= 2) {
    const a = getPodStyle(parts[0]);
    const b = getPodStyle(parts[1]);
    return a === b ? [a] : [a, b];
  }
  return [getPodStyle(variety)];
}

/* ---------------- shared ground: soil + pot ---------------- */

function ground(g) {
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
  g[19][16] = "L";
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
  stamp(g, 22, 10, BLOSSOM);
  stamp(g, 5, 12, BLOSSOM);
  stamp(g, 21, 18, BLOSSOM);
}

// podsAt(i): hybrids alternate between the two parents' pod styles.
function fruitingStage(g, podsAt) {
  stem(g, 9);
  stamp(g, 17, 9, LEAF_SMALL);
  stamp(g, 10, 9, LEAF_SMALL, true);
  stamp(g, 17, 12, LEAF_BIG);
  stamp(g, 8, 14, LEAF_BIG, true);
  stamp(g, 17, 16, LEAF_BIG);
  stamp(g, 8, 18, LEAF_BIG, true);
  g[8][16] = "L";
  stamp(g, 22, 9, BLOSSOM);
  // young pods, mostly still green — one just ripening
  stamp(g, 21, 15, recolor(podsAt(0).ripe, TO_GREEN));
  stamp(g, 9, 17, recolor(podsAt(1).ripe, TO_GREEN), true);
  stamp(g, 18, 19, podsAt(0).ripe);
}

function harvestStage(g, podsAt) {
  stem(g, 7);
  stamp(g, 17, 7, LEAF_SMALL);
  stamp(g, 10, 7, LEAF_SMALL, true);
  stamp(g, 17, 10, LEAF_BIG);
  stamp(g, 8, 12, LEAF_BIG, true);
  stamp(g, 17, 14, LEAF_BIG);
  stamp(g, 8, 16, LEAF_BIG, true);
  stamp(g, 17, 18, LEAF_SMALL);
  g[6][16] = "L";
  // loaded with ripe pods (hybrids show both parents' pods)
  stamp(g, 22, 11, podsAt(0).ripe);
  stamp(g, 6, 13, podsAt(1).ripe, true);
  stamp(g, 21, 17, podsAt(0).alt);
  stamp(g, 9, 19, podsAt(1).ripe, true);
  stamp(g, 13, 20, podsAt(0).alt);
}

/* ---------------- build + cache + export ---------------- */

function buildSet(styleKeys) {
  const list = styleKeys.map((k) => POD_STYLES[k] || POD_STYLES.slim);
  const podsAt = (i) => list[i % list.length];
  const builders = [
    seedStage,
    sproutStage,
    vegetativeStage,
    floweringStage,
    (g) => fruitingStage(g, podsAt),
    (g) => harvestStage(g, podsAt),
  ];
  return builders.map((build) => {
    let g = blank();
    build(g);
    g = outline(g);
    ground(g);
    return g.map((row) => row.join(""));
  });
}

const cache = new Map();
export function getStageSprites(variety = "") {
  const styles = getPodStyles(variety);
  const key = styles.join("+");
  if (!cache.has(key)) cache.set(key, buildSet(styles));
  return cache.get(key);
}

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
