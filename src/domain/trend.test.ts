import { describe, expect, it } from "vitest";
import { describeTrend, trendForLatestOrigin, withinWindow } from "./trend";
import type { Observation } from "./types";

// Tests for the trend rule (base §14 and §34, REQ-2.2, 2.3, 10.5).

let seq = 0;
function pt(value: number | null, observedAt: string, extra: Partial<Observation> = {}): Observation {
  seq++;
  return {
    observationId: `obs-${seq}`,
    profileId: "DEMO-01",
    indicatorCode: "sleep_duration",
    value,
    unit: "h",
    observedAt,
    origin: "synthetic",
    qualityState: "valid",
    syncState: "synced",
    isSynthetic: true,
    ...extra,
  };
}

const T1 = "2026-11-10T08:00:00.000Z";
const T2 = "2026-11-11T08:00:00.000Z";
const T3 = "2026-11-12T08:00:00.000Z";
const T4 = "2026-11-13T08:00:00.000Z";

describe("describeTrend", () => {
  it("rise: direction up and positive delta", () => {
    const r = describeTrend([pt(5, T1), pt(6, T2), pt(7.5, T3)]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.direction).toBe("up");
    expect(r.delta).toBeCloseTo(2.5);
    expect(r.unit).toBe("h");
    expect(r.points).toBe(3);
  });

  it("decline: direction down and negative delta", () => {
    const r = describeTrend([pt(7.5, T1), pt(6, T2), pt(5, T3)]);
    expect(r).toMatchObject({ state: "descriptive_only", direction: "down" });
    if (r.state === "descriptive_only") expect(r.delta).toBeCloseTo(-2.5);
  });

  it("equality: direction unchanged and delta 0 (first vs last only)", () => {
    const r = describeTrend([pt(7, T1), pt(3, T2), pt(7, T3)]);
    expect(r).toMatchObject({ state: "descriptive_only", direction: "unchanged", delta: 0 });
  });

  it("fewer than 2 points: insufficient_data", () => {
    expect(describeTrend([])).toEqual({ state: "insufficient_data" });
    expect(describeTrend([pt(7, T1)])).toEqual({ state: "insufficient_data" });
  });

  it.each(["invalid", "missing", "unverified"] as const)("ignores points with qualityState %s", (q) => {
    const a = pt(7, T1);
    const bad = pt(1, T2, { qualityState: q });
    const b = pt(8, T3);
    const r = describeTrend([a, bad, b]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.points).toBe(2);
    expect(r.delta).toBe(1);
    expect(r.inputIds).not.toContain(bad.observationId);
    // only one valid + one bad → insufficient
    expect(describeTrend([a, pt(1, T2, { qualityState: q })])).toEqual({ state: "insufficient_data" });
  });

  it("a null value is ignored and never becomes 0", () => {
    const nullPoint = pt(null, T1); // would be the first point; if it became 0, the delta would be 6
    const r = describeTrend([nullPoint, pt(7, T2), pt(6, T3)]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.delta).toBe(-1);
    expect(r.direction).toBe("down");
    expect(r.points).toBe(2);
    expect(r.inputIds).not.toContain(nullPoint.observationId);
    expect(describeTrend([pt(null, T1), pt(5, T2)])).toEqual({ state: "insufficient_data" });
  });

  it("sorts by timestamp when the input is out of order", () => {
    const first = pt(7.5, T1);
    const mid = pt(6, T2);
    const last = pt(5, T3);
    const r = describeTrend([last, first, mid]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.direction).toBe("down");
    expect(r.start).toBe(T1);
    expect(r.end).toBe(T3);
    expect(r.inputIds).toEqual([first.observationId, last.observationId]);
  });

  it("synthetic + manual mix: mixed_origins_blocked", () => {
    const r = describeTrend([pt(7, T1), pt(6, T2, { isSynthetic: false, origin: "manual" })]);
    expect(r).toEqual({ state: "mixed_origins_blocked" });
  });

  it("a mix with an invalid non-synthetic point does not block (invalid is ignored first)", () => {
    const r = describeTrend([pt(7, T1), pt(6, T2), pt(1, T3, { isSynthetic: false, qualityState: "invalid" })]);
    expect(r.state).toBe("descriptive_only");
  });

  it("inputIds are the first and last valid points; isSynthetic reflects the origin", () => {
    const a = pt(7, T1);
    const b = pt(6, T2);
    const c = pt(5, T3);
    const r = describeTrend([a, b, c]);
    expect(r).toMatchObject({ inputIds: [a.observationId, c.observationId], isSynthetic: true });
    const m = describeTrend([pt(7, T1, { isSynthetic: false }), pt(8, T2, { isSynthetic: false })]);
    expect(m).toMatchObject({ state: "descriptive_only", isSynthetic: false });
  });

  // Base §34 mentions "duplication". Without deduplication by observationId,
  // the same record repeated would count as 2 points and produce an "unchanged" trend
  // instead of insufficient_data. This test locks the deduplication in describeTrend.
  it("duplication: the same observationId repeated counts only once", () => {
    const a = pt(7, T1);
    expect(describeTrend([a, { ...a }])).toEqual({ state: "insufficient_data" });
  });
});

describe("trendForLatestOrigin", () => {
  it("filters by the origin of the latest point and counts excluded", () => {
    const pts = [
      pt(7, T1, { isSynthetic: false, origin: "manual" }), // excluded
      pt(7.5, T2),
      pt(6, T3),
      pt(5, T4),
    ];
    const r = trendForLatestOrigin(pts);
    expect(r.synthetic).toBe(true);
    expect(r.excluded).toBe(1);
    expect(r.trend).toMatchObject({ state: "descriptive_only", direction: "down", points: 3 });
  });

  it("latest point is manual: compares only the manual ones", () => {
    const pts = [
      pt(7, T1),
      pt(6, T2, { isSynthetic: false, origin: "manual" }),
      pt(8, T3),
      pt(7, T4, { isSynthetic: false, origin: "manual" }),
    ];
    const r = trendForLatestOrigin(pts);
    expect(r.synthetic).toBe(false);
    expect(r.excluded).toBe(2);
    expect(r.trend).toMatchObject({ state: "descriptive_only", direction: "up", delta: 1, isSynthetic: false });
  });

  it("finds the latest point even out of order", () => {
    const pts = [pt(5, T4, { isSynthetic: false, origin: "manual" }), pt(7, T1), pt(6, T2)];
    const r = trendForLatestOrigin(pts);
    expect(r.synthetic).toBe(false);
    expect(r.excluded).toBe(2);
    expect(r.trend).toEqual({ state: "insufficient_data" });
  });

  it("ignores invalid and null; no valid points → insufficient_data, excluded 0, synthetic null", () => {
    expect(trendForLatestOrigin([])).toEqual({ trend: { state: "insufficient_data" }, excluded: 0, synthetic: null });
    const r = trendForLatestOrigin([pt(null, T1), pt(5, T2, { qualityState: "invalid" })]);
    expect(r).toEqual({ trend: { state: "insufficient_data" }, excluded: 0, synthetic: null });
  });

  it("an invalid point from another origin does not count as excluded", () => {
    const r = trendForLatestOrigin([pt(7, T1), pt(6, T2), pt(1, T3, { isSynthetic: false, qualityState: "invalid" })]);
    expect(r.excluded).toBe(0);
    expect(r.synthetic).toBe(true);
  });
});

describe("withinWindow", () => {
  const now = Date.parse("2026-11-14T08:00:00.000Z");
  it("keeps only points within [now - hours, now]", () => {
    const inside = pt(7, "2026-11-13T09:00:00.000Z");
    const edge = pt(7, "2026-11-13T08:00:00.000Z"); // exactly 24 h before
    const atNow = pt(7, "2026-11-14T08:00:00.000Z");
    const outside = pt(7, "2026-11-13T07:59:59.000Z");
    const future = pt(7, "2026-11-14T08:00:01.000Z");
    const r = withinWindow([inside, edge, atNow, outside, future], 24, now);
    expect(r.map((p) => p.observationId)).toEqual([inside.observationId, edge.observationId, atNow.observationId]);
  });

  it("empty list → empty", () => {
    expect(withinWindow([], 72, now)).toEqual([]);
  });
});
