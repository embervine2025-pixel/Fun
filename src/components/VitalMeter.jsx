// Segmented LCD-style vital meter (10 chunky cells), CSS-animated.
export default function VitalMeter({ icon: Icon, label, value, color }) {
  const cells = Array.from({ length: 10 }, (_, i) => i < Math.round(value / 10));
  const danger = value <= 20;
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color }} className="shrink-0" aria-hidden />
      <div className="flex-1">
        <div className="flex justify-between font-pixel text-[8px] mb-1 tracking-wider">
          <span className="text-bone/80">{label.toUpperCase()}</span>
          <span style={{ color: danger ? "var(--color-habanero)" : color }}>
            {Math.round(value)}%
          </span>
        </div>
        <div className="flex gap-[3px] bg-lcd p-[3px] border-2 border-bark-deep">
          {cells.map((lit, i) => (
            <div
              key={i}
              className="h-2.5 flex-1 transition-all duration-500"
              style={{
                backgroundColor: lit ? color : "var(--color-lcd-lit)",
                opacity: lit ? 1 : 0.45,
                boxShadow: lit ? `0 0 4px ${color}55` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
