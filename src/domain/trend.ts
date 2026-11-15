import type { Observation } from "./types";

// Descriptive rule from the specification (section 14). Deterministic: it states the direction between
// the first and the last valid point. It never labels anything as normal, dangerous or clinical decline.

export type Trend =
  | { state: "insufficient_data" }
  | { state: "mixed_origins_blocked" }
  | {
      state: "descriptive_only";
      direction: "down" | "up" | "unchanged";
      delta: number;
      unit: string | null;
      start: string;
      end: string;
      inputIds: string[];
      points: number;
      isSynthetic: boolean;
    };

export const TREND_RULE_VERSION = "trend-v1";

export function describeTrend(points: Observation[]): Trend {
  // Duplicates of the same observationId count once (base §34: duplication).
  const unique = new Map<string, Observation>();
  for (const p of points) if (p.qualityState === "valid" && typeof p.value === "number") unique.set(p.observationId, p);
  const valid = [...unique.values()].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  if (valid.length < 2) return { state: "insufficient_data" };
  if (valid.some((p) => p.isSynthetic) && !valid.every((p) => p.isSynthetic)) {
    return { state: "mixed_origins_blocked" };
  }
  const first = valid[0];
  const last = valid[valid.length - 1];
  const delta = Number(last.value) - Number(first.value);
  return {
    state: "descriptive_only",
    direction: delta < 0 ? "down" : delta > 0 ? "up" : "unchanged",
    delta,
    unit: first.unit,
    start: first.observedAt,
    end: last.observedAt,
    inputIds: [first.observationId, last.observationId],
    points: valid.length,
    isSynthetic: valid.every((p) => p.isSynthetic),
  };
}

export function withinWindow(points: Observation[], hours: number, now: number): Observation[] {
  const from = now - hours * 3600_000;
  return points.filter((p) => {
    const t = Date.parse(p.observedAt);
    return t >= from && t <= now;
  });
}

// No-mixing rule in practice: compares only points from the same origin as the latest record
// and reports how many were left out, instead of mixing real and simulated data.
export function trendForLatestOrigin(points: Observation[]): { trend: Trend; excluded: number; synthetic: boolean | null } {
  const valid = points.filter((p) => p.qualityState === "valid" && typeof p.value === "number");
  if (valid.length === 0) return { trend: { state: "insufficient_data" }, excluded: 0, synthetic: null };
  const last = valid.reduce((a, b) => (Date.parse(b.observedAt) >= Date.parse(a.observedAt) ? b : a));
  const same = valid.filter((p) => p.isSynthetic === last.isSynthetic);
  return { trend: describeTrend(same), excluded: valid.length - same.length, synthetic: last.isSynthetic };
}
