import { Flame } from "lucide-react";

// 1-5 pepper-heat rating. Interactive when onChange is provided.
export default function HeatRating({ value, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = n <= value;
        const flame = (
          <Flame
            size={size}
            strokeWidth={2.5}
            className={lit ? "" : "opacity-25"}
            style={{
              color: lit
                ? n >= 4
                  ? "var(--color-habanero)"
                  : "var(--color-mango)"
                : "var(--color-bone)",
              fill: lit ? "currentColor" : "none",
            }}
            aria-hidden
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Heat ${n} of 5`}
            className="p-0.5"
          >
            {flame}
          </button>
        ) : (
          <span key={n}>{flame}</span>
        );
      })}
    </div>
  );
}
