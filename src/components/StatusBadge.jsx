import { STATUS } from "../game/constants.js";

const TONE_STYLES = {
  danger: "bg-habanero text-bone",
  warn: "bg-sun text-bark",
  great: "bg-foliage text-bark",
  ok: "bg-lcd-lit text-bone",
};

export default function StatusBadge({ status, className = "" }) {
  const spec = STATUS[status] || STATUS.stable;
  return (
    <span
      className={`inline-block font-pixel text-[8px] px-2 py-1.5 border-2 border-bark-deep tracking-wider ${TONE_STYLES[spec.tone]} ${className}`}
    >
      {spec.label}
    </span>
  );
}
