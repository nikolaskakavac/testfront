"use client";

type RatingSliderProps = {
  title?: string;
  value: number;
  onChange?: (value: number) => void;
  onClose?: () => void;
  onConfirm?: (value: number) => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
};

export default function RatingSlider({
  title,
  value,
  onChange,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  confirmDisabled = false,
}: RatingSliderProps) {
  const tone =
    value >= 80 ? "Legendary" : value >= 60 ? "Strong" : value >= 40 ? "Mid" : value >= 20 ? "Rough" : "Skip";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200/70">Rate this post</p>
          {title ? (
            <p className="mt-1 truncate text-[13px] font-semibold text-[color:var(--text-strong)]">{title}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-orange-300/20 bg-black/40 px-2.5 py-1 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200/65">{tone}</p>
            <span key={`rating-${value}`} className="motion-score-pop text-lg font-black leading-none text-[color:var(--text-strong)]">
              {value}
            </span>
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close rating slider"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative rounded-full bg-black/40 p-1.5 transition-transform duration-300 hover:scale-[1.01]">
        <div className="rating-gradient h-3.5 w-full rounded-full opacity-95 shadow-[0_8px_24px_rgba(255,11,122,0.18)]" />
        <div
          className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 rounded-full bg-white/25 blur-sm transition-all duration-200"
          style={{ width: `calc(${value}% - 6px)` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="absolute left-0 top-0 h-6 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Rate from 0 to 100"
          style={{ background: "transparent" }}
        />
        <div
          key={`knob-${value}`}
          className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-orange-400 bg-white shadow-[0_10px_22px_rgba(255,97,38,0.34)] transition-all duration-150 motion-score-pop"
          style={{ left: `calc(${value}% - 12px)` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onConfirm?.(value)}
          disabled={confirmDisabled}
          className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff0b5_0%,#ffbf61_52%,#ff2a16_100%)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
