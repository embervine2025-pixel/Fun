// Crisp SVG pixel-sprite renderer.
// - run-length merged <rect> spans (few DOM nodes, fast paints)
// - shape-rendering="crispEdges" + image-rendering: pixelated
// - procedural kawaii face on the pot, varying by status
// - CSS-only blink / float / wilt animations (GPU friendly)
import { useMemo } from "react";
import {
  FACE,
  GRID,
  STAGE_SPRITES,
  STATUS_FX,
  rowSpans,
} from "./sprites.js";

const INK = "#12140f";
const WHITE = "#f4f7ee";
const BLUSH = "#ff7ac2";

function FaceRects({ face }) {
  const { eyeY, eyeLX, eyeRX, mouthY, mouthX, blushY } = FACE;
  const eyes =
    face === "sad" ? (
      // X eyes
      <>
        {[eyeLX, eyeRX].map((x) => (
          <g key={x} fill={INK}>
            <rect x={x} y={eyeY} width={0.55} height={0.55} />
            <rect x={x + 1.05} y={eyeY} width={0.55} height={0.55} />
            <rect x={x + 0.5} y={eyeY + 0.5} width={0.6} height={0.6} />
            <rect x={x} y={eyeY + 1.05} width={0.55} height={0.55} />
            <rect x={x + 1.05} y={eyeY + 1.05} width={0.55} height={0.55} />
          </g>
        ))}
      </>
    ) : face === "meh" ? (
      // droopy half-closed eyes
      <>
        {[eyeLX, eyeRX].map((x) => (
          <rect key={x} x={x} y={eyeY + 0.8} width={1.6} height={0.8} fill={INK} />
        ))}
      </>
    ) : (
      // open eyes with a white glint, blinking via CSS
      <g className="anim-blink">
        {[eyeLX, eyeRX].map((x) => (
          <g key={x}>
            <rect x={x} y={eyeY} width={1.6} height={1.7} fill={INK} />
            <rect x={x + 0.25} y={eyeY + 0.25} width={0.6} height={0.6} fill={WHITE} />
          </g>
        ))}
      </g>
    );

  const mouth =
    face === "happy" ? (
      <g fill={INK}>
        <rect x={mouthX - 0.8} y={mouthY - 0.55} width={0.55} height={0.55} />
        <rect x={mouthX - 0.35} y={mouthY} width={3.7} height={0.6} />
        <rect x={mouthX + 3.25} y={mouthY - 0.55} width={0.55} height={0.55} />
      </g>
    ) : face === "sad" ? (
      <g fill={INK}>
        <rect x={mouthX - 0.8} y={mouthY + 0.35} width={0.55} height={0.55} />
        <rect x={mouthX - 0.35} y={mouthY - 0.2} width={3.7} height={0.6} />
        <rect x={mouthX + 3.25} y={mouthY + 0.35} width={0.55} height={0.55} />
      </g>
    ) : (
      <rect x={mouthX + 0.2} y={mouthY} width={2.6} height={0.6} fill={INK} />
    );

  return (
    <>
      {eyes}
      {mouth}
      {face === "happy" && (
        <g fill={BLUSH} opacity={0.85}>
          <rect x={eyeLX - 2.1} y={blushY + 1.4} width={1.4} height={0.8} />
          <rect x={eyeRX + 2.3} y={blushY + 1.4} width={1.4} height={0.8} />
        </g>
      )}
    </>
  );
}

export default function PixelSprite({
  stageIndex = 0,
  status = "stable",
  face,
  size = 240,
  animate = true,
  className = "",
}) {
  const grid = STAGE_SPRITES[Math.min(stageIndex, STAGE_SPRITES.length - 1)];
  const fx = STATUS_FX[status] || STATUS_FX.stable;
  const resolvedFace =
    face ||
    { thriving: "happy", wilted: "sad", pale: "meh", stable: "neutral" }[status] ||
    "neutral";

  // Memoize the rect spans — grids are static per stage.
  const rects = useMemo(() => {
    const out = [];
    grid.forEach((row, y) => {
      for (const [x, w, color] of rowSpans(row)) {
        out.push({ x, y, w, color });
      }
    });
    return out;
  }, [grid]);

  const motionClass = !animate
    ? ""
    : status === "wilted"
      ? "anim-wilt"
      : "anim-float";

  return (
    <div
      className={`pixelated ${motionClass} ${className}`}
      style={{ width: size, height: size, filter: fx.filter }}
    >
      <svg
        viewBox={`0 0 ${GRID} ${GRID}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className="pixelated"
        aria-hidden="true"
      >
        {/* plant + pot pixels (rows are pre-merged into spans) */}
        <g transform={fx.plantTransform || undefined}>
          {rects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height={1.02}
              fill={r.color}
            />
          ))}
        </g>
        <FaceRects face={resolvedFace} />
        {/* sparkles for thriving / harvest-ready pets */}
        {(status === "thriving" || stageIndex === 5) && (
          <g fill="#ffd93b">
            <rect x={2} y={3} width={0.8} height={0.8} style={{ animation: "px-sparkle 1.6s infinite" }} />
            <rect x={21} y={5} width={0.8} height={0.8} style={{ animation: "px-sparkle 1.6s .5s infinite" }} />
            <rect x={19.5} y={1.5} width={0.6} height={0.6} style={{ animation: "px-sparkle 1.6s 1s infinite" }} />
          </g>
        )}
      </svg>
    </div>
  );
}
