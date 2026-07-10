// ---------------------------------------------------------------
// Pure-code pixel art. Every sprite is a grid of palette letters,
// rendered as run-length-merged SVG <rect>s — zero image files.
//
// Canvas: 24 x 24 cells. Rows 0-13 are the plant, rows 14-23 are
// the shared soil + terracotta pot (the pet's face lives on the pot
// so every growth stage has personality).
// ---------------------------------------------------------------

export const PALETTE = {
  ".": null,
  // foliage — neon arcade greens
  L: "#a8ff5e", // leaf highlight
  G: "#5ee04a", // leaf mid
  D: "#2ea836", // leaf shade
  E: "#177a2c", // stem / deep shade
  // peppers
  r: "#ff4d2e", // habanero red
  R: "#c72c12", // red shade
  o: "#ff9e2e", // mango orange
  O: "#d97a10", // orange shade
  // flowers & sparkle
  w: "#f4f7ee",
  y: "#ffd93b",
  // seed
  n: "#d9a066",
  N: "#8f5a2b",
  // soil
  s: "#2a2013",
  S: "#4a3620",
  // terracotta pot
  q: "#e08b4f", // rim light
  p: "#c96f3b", // body
  P: "#8f4720", // shade
};

const POT = [
  ".....sSsssSsSssSsS......",
  "....qqqqqqqqqqqqqqqq....",
  "....pppppppppppppppp....",
  "....PPPPPPPPPPPPPPPP....",
  ".....pppppppppppppp.....",
  ".....pppppppppppppp.....",
  ".....pppppppppppppp.....",
  ".....pPPPPPPPPPPPPp.....",
  "......PPPPPPPPPPPP......",
  "........................",
];

const EMPTY = "........................";
const pad = (rows) => [
  ...Array(14 - rows.length).fill(EMPTY),
  ...rows,
  ...POT,
];

// -------------------- growth stage sprites --------------------

const SEED = pad([
  "...........nn...........",
  "..........nnNn..........",
  "..........NNNN..........",
]);

const SPROUT = pad([
  "..........LL............",
  ".........LGGL...........",
  "......LL..GG..LL........",
  ".....LGGD.DD.DGGL.......",
  "......LL..DD..LL........",
  "..........EE............",
]);

const VEGETATIVE = pad([
  ".........LLLL...........",
  "......LLLGGGGLL.........",
  ".....LGGGGDGGGGL........",
  "....LGGDGGGGGDGGL.......",
  "....GGDDGGDDGGDDG.......",
  ".....GGGDDDDDDGG........",
  "...LL.GGGDDGGG.LL.......",
  "..LGGL.DDDDDD.LGGL......",
  "...LL..DEEEED..LL.......",
  "........EEEE............",
]);

const FLOWERING = pad([
  "......ww....ww..........",
  ".....wyw.LLLLwyw........",
  "......wLLGGGGLw.........",
  ".....LGGGGDGGGGL........",
  "..ww.GGDGGGGGDGG.ww.....",
  ".wyw.GDDGGDDGGDD.wyw....",
  "..ww.GGGDDDDDDG..ww.....",
  "...LL.GGGDDGGG.LL.......",
  "..LGGL.DEEEED.LGGL......",
  "...LL..DEEEED..LL.......",
  "........EEEE............",
]);

const FRUITING = pad([
  ".........LLLL...........",
  "......LLLGGGGLL.........",
  ".....LGGGGDGGGGL........",
  "....LGGDGGGGGDGGL.......",
  "..o.GGDDGGDDGGDDG.r.....",
  ".oOo.GGGDDDDDDGG.rRr....",
  ".oOo..GGGDDGGG..rRr.....",
  "..o.L..DEEEED..L.r......",
  "...LL..DEEEED..LL.......",
  "........EEEE............",
]);

const HARVEST = pad([
  "..y......LLLL......y....",
  "......LLLGGGGLLL........",
  "....LLGGGGDGGGGLL.......",
  "...LGGDGGGGGGGDGGL......",
  "..rr.GGDDGGDDGGDD.rr....",
  ".rRr.GDGGDDDDGGDG.rRr...",
  ".rRr.GGGDDDDDDGGG.rRr...",
  "..rr.GGGDDDDDDGG..rr....",
  "..oo..GGGDDGGG..oo......",
  ".oOo...DEEEED...oOo.....",
  "..oo...DEEEED...oo......",
  "........EEEE............",
]);

export const STAGE_SPRITES = [SEED, SPROUT, VEGETATIVE, FLOWERING, FRUITING, HARVEST];

export const GRID = 24;

// -------- face geometry (drawn procedurally on the pot) --------
// Coordinates are grid cells; pot body rows are 18-21.
export const FACE = {
  eyeY: 18.6,
  eyeLX: 8,
  eyeRX: 14,
  mouthY: 21.2,
  mouthX: 10.5,
  blushY: 19.4,
};

// ------------- status → look modifiers -------------
export const STATUS_FX = {
  thriving: {
    filter: "drop-shadow(0 0 6px rgba(94,224,74,0.55))",
    plantTransform: "",
  },
  stable: { filter: "", plantTransform: "" },
  pale: {
    filter: "saturate(0.35) brightness(1.12)",
    plantTransform: "",
  },
  wilted: {
    filter: "saturate(0.55) sepia(0.25) brightness(0.85)",
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
