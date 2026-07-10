// Crisp SVG pixel-sprite renderer for the composed pepper plants.
// The pod shape and color come from the plant's variety name, so a
// habanero grows orange lanterns and a reaper grows gnarly pods.
import { useMemo } from "react";
import { GRID, getPodStyle, getStageSprites, rowSpans } from "./sprites.js";

export default function PixelSprite({
  stageIndex = 0,
  variety = "",
  size = 240,
  animate = true,
  className = "",
}) {
  const rects = useMemo(() => {
    const grids = getStageSprites(getPodStyle(variety));
    const grid = grids[Math.min(stageIndex, grids.length - 1)];
    const out = [];
    grid.forEach((row, y) => {
      for (const [x, w, color] of rowSpans(row)) {
        out.push({ x, y, w, color });
      }
    });
    return out;
  }, [stageIndex, variety]);

  return (
    <div
      className={`pixelated ${animate ? "anim-float" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${GRID} ${GRID}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className="pixelated"
        aria-hidden="true"
      >
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.color} />
        ))}
        {/* a little sparkle once the plant is harvest ready */}
        {stageIndex === 5 && (
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
