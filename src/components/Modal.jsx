import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-bark-deep/80 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="anim-pop w-full max-w-md bg-bark-card pixel-frame m-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-[11px] text-foliage-neon tracking-wide">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-bone/60 hover:text-bone">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="block font-pixel text-[8px] text-bone/70 mb-1.5 tracking-wider">
      {label.toUpperCase()}
    </span>
    {children}
  </label>
);

export const inputCls =
  "w-full bg-lcd border-2 border-bark-deep px-3 py-2 font-lcd text-lg text-bone " +
  "placeholder:text-bone/30 focus:outline-none focus:border-foliage";

export const PixelButton = ({ children, onClick, variant = "primary", type = "button", className = "" }) => {
  const tones = {
    primary: "bg-foliage text-bark",
    danger: "bg-habanero text-bone",
    ghost: "bg-lcd text-bone",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`font-pixel text-[9px] px-4 py-3 border-2 border-bark-deep tracking-wider
        shadow-[inset_-3px_-3px_0_0_rgba(0,0,0,0.25)] active:translate-y-[2px]
        active:shadow-[inset_3px_3px_0_0_rgba(0,0,0,0.25)] ${tones[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
