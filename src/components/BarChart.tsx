import { useState, type ReactNode } from 'react';

export interface BarSegment {
  value: number;
  className: string; // Tailwind fill-klasse, f.eks. "fill-brand dark:fill-brand-muted"
}

export interface Bar {
  key: string;
  label: string;
  total: number;
  segments: BarSegment[];
  title: string;
  detail: ReactNode;
  highlight?: boolean;
}

export interface LegendItem {
  label: string;
  className: string; // Tailwind bg-klasse
}

interface Props {
  caption: string;
  bars: Bar[];
  hint: string;
  legend?: LegendItem[];
}

// Søylediagram i SVG. Viser detaljer under grafen når man holder over,
// trykker på eller tabber til en søyle.
export default function BarChart({ caption, bars, hint, legend }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = bars.find((b) => b.key === activeKey);

  const dense = bars.length > 20;
  const barW = dense ? 14 : 40;
  const gap = dense ? 5 : 14;
  const top = bars.some((b) => b.highlight) ? 36 : 22;
  const h = 170;
  const bottom = dense ? 8 : 26;
  const width = Math.max(1, bars.length) * (barW + gap) + gap;
  const max = Math.max(1, ...bars.map((b) => b.total));

  return (
    <figure className="mb-5">
      <figcaption className="mb-2 font-semibold text-brand dark:text-slate-100">{caption}</figcaption>
      {legend && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
          {legend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded-sm ${l.className}`} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${top + h + bottom}`} role="img" aria-label={caption} className="block max-h-64 w-full">
        <line x1={0} x2={width} y1={top + h} y2={top + h} className="stroke-slate-300 dark:stroke-slate-700" />
        {bars.map((bar, i) => {
          const x = gap + i * (barW + gap);
          let y = top + h;
          const isActive = bar.key === activeKey;
          const dimmed = activeKey !== null && !isActive;
          const show = () => setActiveKey(bar.key);
          return (
            <g
              key={bar.key}
              tabIndex={0}
              onMouseEnter={show}
              onFocus={show}
              onClick={show}
              className={`cursor-pointer outline-none transition-opacity ${dimmed ? 'opacity-45' : ''}`}
            >
              <title>{bar.title}</title>
              {/* usynlig treffflate så det er lett å trykke på lave søyler */}
              <rect x={x - gap / 2} y={top} width={barW + gap} height={h} className="fill-transparent" />
              {bar.segments.map((seg, si) => {
                if (seg.value <= 0) return null;
                const bh = Math.max(1.5, (seg.value / max) * h);
                y -= bh;
                return <rect key={si} x={x} y={y} width={barW} height={bh} rx={dense ? 2 : 3} className={seg.className} />;
              })}
              {(!dense || isActive || bar.highlight) && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-slate-700 text-[11px] dark:fill-slate-200">
                  {bar.total}
                </text>
              )}
              {bar.highlight && (
                <text x={x + barW / 2} y={y - 19} textAnchor="middle" className="fill-amber-500 text-[13px]">
                  ★
                </text>
              )}
              {!dense && (
                <text x={x + barW / 2} y={top + h + 17} textAnchor="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400">
                  {bar.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p aria-live="polite" className="mt-2 min-h-[1.5em] text-sm text-slate-600 dark:text-slate-300">
        {active ? active.detail : hint}
      </p>
    </figure>
  );
}
