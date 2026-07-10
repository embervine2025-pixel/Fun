// Chunky retro action button with pressed-down feedback.
export default function ActionButton({
  icon: Icon,
  label,
  onClick,
  color = "var(--color-foliage)",
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-1.5 disabled:opacity-40"
    >
      <span
        className="grid place-items-center w-14 h-14 border-2 border-bark-deep bg-bark-card
                   shadow-[inset_-3px_-3px_0_0_rgba(0,0,0,0.35),inset_3px_3px_0_0_rgba(255,255,255,0.06)]
                   transition-transform duration-75 group-active:translate-y-[3px]
                   group-active:shadow-[inset_3px_3px_0_0_rgba(0,0,0,0.35)]"
        style={{ color }}
      >
        <Icon size={22} strokeWidth={2.25} aria-hidden />
      </span>
      <span className="font-pixel text-[8px] text-bone/70 tracking-wide">
        {label.toUpperCase()}
      </span>
    </button>
  );
}
