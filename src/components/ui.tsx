import type { ReactNode } from "react";
import type { Observation } from "../domain/types";
import { indicator, rangePosition, type IndicatorDef } from "../domain/indicators";

// Selos permanentes da especificação (seção 7): origem sempre visível.
export function OriginTag({ o }: { o?: Observation }) {
  if (!o) return <span className="tag tag--missing">Não coletado</span>;
  if (o.value === null) return <span className="tag tag--missing">Ausente</span>;
  if (o.isSynthetic) return <span className="tag tag--sim">Simulado</span>;
  if (o.origin === "authorized_external") return <span className="tag tag--ext">Externo</span>;
  return <span className="tag tag--manual">Manual</span>;
}

export function KindTag({ kind }: { kind: "fato" | "hipotese" | "simulado" | "interpretacao" }) {
  const label = { fato: "Fato da fonte", hipotese: "Hipótese Astra", simulado: "Dado simulado", interpretacao: "Interpretação do sistema" }[kind];
  return <span className={`tag tag--${kind}`}>{label}</span>;
}

export function Ring({ value, size = 56, stroke = 7, color = "var(--accent)", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--accent)", height = 12 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="bar" style={{ height }}>
      <div className="bar__fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Sparkline({ points, width = 120, height = 36, color = "var(--accent)" }: { points: Observation[]; width?: number; height?: number; color?: string }) {
  const vals = points.filter((p) => p.value !== null);
  if (vals.length < 2) return <svg width={width} height={height} aria-hidden />;
  const ys = vals.map((p) => p.value as number);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const d = vals
    .map((p, i) => `${i ? "L" : "M"}${((i / (vals.length - 1)) * (width - 4) + 2).toFixed(1)},${(height - 3 - (((p.value as number) - min) / span) * (height - 6)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden className="spark">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Posição do valor na faixa de referência geral. Cores neutras: não é semáforo de risco.
export function RangeHint({ value, def }: { value: number | null; def: IndicatorDef }) {
  const pos = rangePosition(value, def.code);
  if (pos === "sem_faixa") return def.range ? null : <span className="hint">sem faixa geral</span>;
  const text = { dentro: "na faixa de referência", abaixo: "abaixo da faixa de referência", acima: "acima da faixa de referência" }[pos];
  return <span className={`hint hint--${pos}`}>{def.range!.kind === "referencia_geral" ? text : text.replace("faixa de referência", "meta")}</span>;
}

export function relTime(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const m = Math.round(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function unitLabel(code: Observation["indicatorCode"]) {
  return indicator(code).unit;
}

export function Card({ children, className = "", onClick, as = "div" }: { children: ReactNode; className?: string; onClick?: () => void; as?: "div" | "button" }) {
  if (as === "button")
    return (
      <button type="button" className={`card card--button ${className}`} onClick={onClick}>
        {children}
      </button>
    );
  return <div className={`card ${className}`}>{children}</div>;
}
