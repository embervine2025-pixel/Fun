// A tiny pollinator that visits flowering plants and fresh crosses.
// Pure rects, animated with GPU-friendly CSS keyframes.
export default function PixelBee({ className = "" }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ animation: "px-bee 7s ease-in-out infinite" }}
      aria-hidden="true"
    >
      <div style={{ animation: "px-bee-bob 0.4s ease-in-out infinite" }}>
        <svg width="22" height="18" viewBox="0 0 11 9" shapeRendering="crispEdges" className="pixelated">
          {/* wings */}
          <rect x="3" y="0" width="2" height="2" fill="#f7f9ef" opacity="0.85" />
          <rect x="6" y="0" width="2" height="2" fill="#f7f9ef" opacity="0.85" />
          {/* body */}
          <rect x="2" y="2" width="7" height="4" fill="#ffd93b" />
          <rect x="4" y="2" width="1" height="4" fill="#12140f" />
          <rect x="6" y="2" width="1" height="4" fill="#12140f" />
          {/* head + stinger */}
          <rect x="1" y="3" width="1" height="2" fill="#12140f" />
          <rect x="9" y="3" width="1" height="1" fill="#12140f" />
          {/* eye glint */}
          <rect x="2" y="3" width="1" height="1" fill="#f7f9ef" />
        </svg>
      </div>
    </div>
  );
}
