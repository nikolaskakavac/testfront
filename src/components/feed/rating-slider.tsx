"use client";

import { useState } from "react";

type RatingSliderProps = {
  title?: string;
  initialValue?: number;
  onChange?: (value: number) => void;
};

export default function RatingSlider({
  title,
  initialValue = 50,
  onChange,
}: RatingSliderProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="w-full">
      {title ? (
        <p className="mb-1 truncate text-[13px] font-semibold text-[color:var(--text-strong)]">{title}</p>
      ) : null}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-[color:var(--muted)]">Your rating</span>
        <span key={`rating-${value}`} className="motion-score-pop text-lg font-bold text-[color:var(--text-strong)]">{value}</span>
      </div>

      <div className="relative rounded-full p-1 transition-transform duration-300 hover:scale-[1.01]">
        <div className="rating-gradient h-3 w-full rounded-full opacity-95 shadow-[0_8px_24px_rgba(255,11,122,0.15)]" />
        <div
          className="pointer-events-none absolute left-1 top-1 h-3 rounded-full bg-white/35 blur-sm transition-all duration-200"
          style={{ width: `calc(${value}% - 2px)` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value);
            setValue(next);
            onChange?.(next);
          }}
          className="absolute left-0 top-0 h-5 w-full cursor-pointer appearance-none bg-transparent"
          style={{
            background: "transparent",
          }}
        />
        <div
          key={`knob-${value}`}
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-orange-500 bg-white shadow-[0_8px_20px_rgba(255,97,38,0.24)] transition-all duration-150 motion-score-pop"
          style={{ left: `calc(${value}% - 10px)` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-[color:var(--muted)]">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}