import type { ReactNode } from "react";
import { currentLang, locale } from "../i18n/lang";
import type { Observation } from "../domain/types";
import { indicator, rangePosition, type IndicatorDef } from "../domain/indicators";

// Permanent badges from the specification (section 7): origin always visible.
export function OriginTag({ o }: { o?: Observation }) {
  const en = currentLang() === "en";
  if (!o) return <span className="tag tag--missing">{en ? "Not collected" : "Não coletado"}</span>;
  if (o.value === null) return <span className="tag tag--missing">{en ? "Missing" : "Ausente"}</span>;
  if (o.isSynthetic) return <span className="tag tag--simulated">{en ? "Simulated" : "Simulado"}</span>;
  if (o.origin === "authorized_external") return <span className="tag tag--ext">{en ? "External" : "Externo"}</span>;
  return <span className="tag tag--manual">Manual</span>; /* same in both languages */
}

export function KindTag({ kind }: { kind: "fact" | "hypothesis" | "simulated" | "interpretation" }) {
  const label = (currentLang() === "en"
    ? { fact: "Source fact", hypothesis: "Astra hypothesis", simulated: "Simulated data", interpretation: "System interpretation" }
    : { fact: "Fato da fonte", hypothesis: "Hipótese Astra", simulated: "Dado simulado", interpretation: "Interpretação do sistema" })[kind];
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

// Where the value sits in the general reference range. Neutral colors: this is not a risk traffic light.
export function RangeHint({ value, def }: { value: number | null; def: IndicatorDef }) {
  const pos = rangePosition(value, def.code);
  if (pos === "no_range") return def.range ? null : <span className="hint">{currentLang() === "en" ? "no general range" : "sem faixa geral"}</span>;
  const en = currentLang() === "en";
  const goal = def.range!.kind !== "general_reference";
  const text = en
    ? { within: goal ? "goal reached" : "within reference range", below: goal ? "below goal" : "below reference range", above: goal ? "above goal" : "above reference range" }[pos]
    : { within: goal ? "na meta" : "na faixa de referência", below: goal ? "abaixo da meta" : "abaixo da faixa de referência", above: goal ? "acima da meta" : "acima da faixa de referência" }[pos];
  return <span className={`hint hint--${pos}`}>{text}</span>;
}

export function relTime(iso: string) {
  const en = currentLang() === "en";
  const diff = Date.now() - Date.parse(iso);
  const m = Math.round(diff / 60_000);
  if (m < 1) return en ? "now" : "agora";
  if (m < 60) return en ? `${m} min ago` : `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return en ? `${h} h ago` : `há ${h} h`;
  return en ? `${Math.round(h / 24)} d ago` : `há ${Math.round(h / 24)} d`;
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(locale(), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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
