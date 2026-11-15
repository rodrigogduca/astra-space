import { useState } from "react";
import type { Observation } from "../domain/types";
import { formatValue, indicator, type ReferenceRange } from "../domain/indicators";
import { fmtDateTime } from "./ui";

// Gráfico de linha em SVG puro (sem dependência, funciona offline).
// A faixa de referência aparece como área neutra, não como zona de perigo.
export function LineChart({ points, range, height = 220 }: { points: Observation[]; range?: ReferenceRange; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = points.filter((p) => p.value !== null);
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 12, t: 14, b: 28 };
  if (vals.length === 0) return <div className="chart-empty">Sem registros neste período.</div>;

  const ys = vals.map((p) => p.value as number);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (range?.min !== undefined) min = Math.min(min, range.min);
  if (range?.max !== undefined) max = Math.max(max, range.max);
  const span = max - min || 1;
  min -= span * 0.12;
  max += span * 0.12;
  const t0 = Date.parse(vals[0].observedAt);
  const t1 = Date.parse(vals[vals.length - 1].observedAt);
  const tspan = t1 - t0 || 1;
  const x = (iso: string) => pad.l + ((Date.parse(iso) - t0) / tspan) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const code = vals[0].indicatorCode;
  const d = vals.map((p, i) => `${i ? "L" : "M"}${x(p.observedAt).toFixed(1)},${y(p.value as number).toFixed(1)}`).join(" ");
  const ticks = [min + (max - min) * 0.1, (min + max) / 2, max - (max - min) * 0.1];
  const bandTop = range?.max !== undefined ? y(range.max) : pad.t;
  const bandBottom = range?.min !== undefined ? y(range.min) : H - pad.b;
  const hp = hover !== null ? vals[hover] : null;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de ${indicator(code).name}`} onMouseLeave={() => setHover(null)}>
        {range && <rect x={pad.l} width={W - pad.l - pad.r} y={bandTop} height={Math.max(0, bandBottom - bandTop)} className="chart__band" />}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="chart__axis">
              {formatValue(t, code)}
            </text>
          </g>
        ))}
        <text x={pad.l} y={H - 8} className="chart__axis">
          {fmtDateTime(vals[0].observedAt)}
        </text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" className="chart__axis">
          {fmtDateTime(vals[vals.length - 1].observedAt)}
        </text>
        <path d={d} className="chart__line" />
        {vals.map((p, i) => (
          <circle
            key={p.observationId}
            cx={x(p.observedAt)}
            cy={y(p.value as number)}
            r={hover === i ? 7 : vals.length > 40 ? 0 : 4.5}
            className={p.isSynthetic ? "chart__dot" : "chart__dot chart__dot--manual"}
          />
        ))}
        {vals.map((p, i) => (
          <rect
            key={`h-${p.observationId}`}
            x={x(p.observedAt) - (W / vals.length) / 2}
            width={W / vals.length}
            y={0}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {hp && <line x1={x(hp.observedAt)} x2={x(hp.observedAt)} y1={pad.t} y2={H - pad.b} className="chart__cursor" />}
      </svg>
      <div className="chart__readout" aria-live="polite">
        {hp ? (
          <>
            <b>
              {formatValue(hp.value, code)} {hp.unit}
            </b>{" "}
            · {fmtDateTime(hp.observedAt)} · {hp.isSynthetic ? "simulado" : "manual"}
          </>
        ) : (
          <span className="muted">Passe o mouse no gráfico para ver cada registro.</span>
        )}
      </div>
    </div>
  );
}
