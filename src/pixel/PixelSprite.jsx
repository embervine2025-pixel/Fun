// Crisp SVG pixel-sprite renderer for the composed pepper plants.
// - run-length merged <rect> spans (few DOM nodes, fast paints)
// - shape-rendering="crispEdges" + image-rendering: pixelated
// - status is conveyed botanically: healthy glow, pale desaturation,
//   wilted droop-and-sway — no cartoon faces.
import { useMemo } from "react";
import { GRID, STAGE_SPRITES, STATUS_FX, rowSpans } from "./sprites.js";

export default function PixelSprite({
  stageIndex = 0,
  status = "stable",
  size = 240,
  animate = true,
  className = "",
}) {
  const grid = STAGE_SPRITES[Math.min(stageIndex, STAGE_SPRITES.length - 1)];
  const fx = STATUS_FX[status] || STATUS_FX.stable;

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
        <g transform={fx.plantTransform || undefined}>
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.color} />
          ))}
        </g>
        {/* subtle sparkle when the plant is thriving or harvest-ready */}
        {(status === "thriving" || stageIndex === 5) && (
          <g fill="#ffd93b">
            <rect x={3} y={4} width={0.9} height={0.9} style={{ animation: "px-sparkle 1.6s infinite" }} />
            <rect x={27} y={7} width={0.9} height={0.9} style={{ animation: "px-sparkle 1.6s .5s infinite" }} />
            <rect x={25} y={2} width={0.7} height={0.7} style={{ animation: "px-sparkle 1.6s 1s infinite" }} />
          </g>
        )}
      </svg>
    </div>
  );
}
