import { describe, expect, it } from "vitest";
import { generateSynthetic } from "./simulator";
import { indicator } from "./indicators";
import { connector } from "./integrations";
import { describeTrend } from "./trend";
import type { IndicatorCode, Observation } from "./types";

const ANCHOR = Date.parse("2026-11-14T08:00:00.000Z");

const lastN = (obs: Observation[], code: IndicatorCode, n: number) =>
  obs
    .filter((o) => o.indicatorCode === code)
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
    .slice(-n);

describe("generateSynthetic", () => {
  const data = generateSynthetic(ANCHOR);

  it("is deterministic: two calls with the same anchor give the same result", () => {
    expect(generateSynthetic(ANCHOR)).toEqual(data);
  });

  it("generates data", () => {
    expect(data.length).toBeGreaterThan(0);
  });

  it("every item is synthetic, valid, with the catalog unit and an existing connector", () => {
    for (const o of data) {
      expect(o.isSynthetic).toBe(true);
      expect(o.origin).toBe("synthetic");
      expect(o.qualityState).toBe("valid");
      expect(o.unit).toBe(indicator(o.indicatorCode).unit);
      expect(o.sourceRef, `${o.observationId} has no sourceRef`).toBeTruthy();
      expect(connector(o.sourceRef!), `${o.observationId}: connector ${o.sourceRef} does not exist`).toBeDefined();
    }
  });

  it("observation ids are unique", () => {
    const ids = data.map((o) => o.observationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("72 h scenario (base §17): sleep 7.5 → 6 → 5, energy 8 → 6 → 4, mood 8 → 6 → 4", () => {
    expect(lastN(data, "sleep_duration", 3).map((o) => o.value)).toEqual([7.5, 6, 5]);
    expect(lastN(data, "energy_self_report", 3).map((o) => o.value)).toEqual([8, 6, 4]);
    expect(lastN(data, "mood_self_report", 3).map((o) => o.value)).toEqual([8, 6, 4]);
  });

  it("the last three check-ins fit in the 72 h window (offsets −70, −36, −2 h)", () => {
    const t = lastN(data, "sleep_duration", 3).map((o) => Date.parse(o.observedAt));
    expect(t[0]).toBe(ANCHOR - 70 * 3600_000);
    expect(t[1]).toBe(ANCHOR - 36 * 3600_000);
    expect(t[2]).toBe(ANCHOR - 2 * 3600_000);
  });

  it("describeTrend over the last 3 sleep records: down, delta −2.5", () => {
    const r = describeTrend(lastN(data, "sleep_duration", 3));
    expect(r).toMatchObject({ state: "descriptive_only", direction: "down", isSynthetic: true, points: 3 });
    if (r.state === "descriptive_only") expect(r.delta).toBeCloseTo(-2.5);
  });

  it("energy and mood drop by 4 in the scenario", () => {
    for (const code of ["energy_self_report", "mood_self_report"] as const) {
      const r = describeTrend(lastN(data, code, 3));
      expect(r).toMatchObject({ state: "descriptive_only", direction: "down", delta: -4 });
    }
  });
});
