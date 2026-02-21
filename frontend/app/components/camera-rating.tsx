"use client";

import { useState, type MouseEvent } from "react";

type CameraRatingProps = {
  value?: number;
  onChange: (rating: number) => void;
};

function CameraIcon({ fill, clipId }: { fill: number; clipId: string }) {
  const clipWidth = fill >= 1 ? 24 : fill >= 0.5 ? 12 : 0;

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={clipWidth} height="24" />
        </clipPath>
      </defs>

      <g fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.35">
        <circle cx="8" cy="7" r="3" />
        <circle cx="13" cy="6.2" r="2.4" />
        <rect x="4" y="10" width="11" height="8" rx="1.5" />
        <polygon points="15,12 20,10.2 20,17.8 15,16" />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="1.8" clipPath={`url(#${clipId})`}>
        <circle cx="8" cy="7" r="3" />
        <circle cx="13" cy="6.2" r="2.4" />
        <rect x="4" y="10" width="11" height="8" rx="1.5" />
        <polygon points="15,12 20,10.2 20,17.8 15,16" />
      </g>
    </svg>
  );
}

export default function CameraRating({ value, onChange }: CameraRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value ?? 0;

  function getRatingForEvent(index: number, event: MouseEvent<HTMLButtonElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - left;
    const isHalf = x < width / 2;
    const raw = isHalf ? index - 0.5 : index;
    return Math.max(0, Math.min(10, Math.round(raw * 2) / 2));
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: 10 }, (_, idx) => {
          const index = idx + 1;
          const fill = displayValue >= index ? 1 : displayValue >= index - 0.5 ? 0.5 : 0;
          const clipId = `camera-half-${index}`;

          return (
            <button
              key={index}
              type="button"
              aria-label={`Rate ${index} out of 10`}
              className="flex h-7 w-7 items-center justify-center p-0 text-amber-400 transition hover:text-amber-300"
              onMouseMove={(event) => setHoverValue(getRatingForEvent(index, event))}
              onClick={(event) => onChange(getRatingForEvent(index, event))}
            >
              <CameraIcon fill={fill} clipId={clipId} />
            </button>
          );
        })}
      </div>
      <span className="text-sm text-foreground/70">{displayValue.toFixed(1)}/10</span>
    </div>
  );
}
