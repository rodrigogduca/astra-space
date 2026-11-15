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

  it("é determinístico: duas chamadas com a mesma âncora dão o mesmo resultado", () => {
    expect(generateSynthetic(ANCHOR)).toEqual(data);
  });

  it("gera dados", () => {
    expect(data.length).toBeGreaterThan(0);
  });

  it("todo item é sintético, válido, com unidade do catálogo e conector existente", () => {
    for (const o of data) {
      expect(o.isSynthetic).toBe(true);
      expect(o.origin).toBe("synthetic");
      expect(o.qualityState).toBe("valid");
      expect(o.unit).toBe(indicator(o.indicatorCode).unit);
      expect(o.sourceRef, `${o.observationId} sem sourceRef`).toBeTruthy();
      expect(connector(o.sourceRef!), `${o.observationId}: conector ${o.sourceRef} não existe`).toBeDefined();
    }
  });

  it("ids de observação são únicos", () => {
    const ids = data.map((o) => o.observationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cenário 72 h (base §17): sono 7,5 → 6 → 5, energia 8 → 6 → 4, humor 8 → 6 → 4", () => {
    expect(lastN(data, "sleep_duration", 3).map((o) => o.value)).toEqual([7.5, 6, 5]);
    expect(lastN(data, "energy_self_report", 3).map((o) => o.value)).toEqual([8, 6, 4]);
    expect(lastN(data, "mood_self_report", 3).map((o) => o.value)).toEqual([8, 6, 4]);
  });

  it("os três últimos check-ins cabem na janela de 72 h (offsets −70, −36, −2 h)", () => {
    const t = lastN(data, "sleep_duration", 3).map((o) => Date.parse(o.observedAt));
    expect(t[0]).toBe(ANCHOR - 70 * 3600_000);
    expect(t[1]).toBe(ANCHOR - 36 * 3600_000);
    expect(t[2]).toBe(ANCHOR - 2 * 3600_000);
  });

  it("describeTrend sobre os 3 últimos registros de sono: down, delta −2,5", () => {
    const r = describeTrend(lastN(data, "sleep_duration", 3));
    expect(r).toMatchObject({ state: "descriptive_only", direction: "down", isSynthetic: true, points: 3 });
    if (r.state === "descriptive_only") expect(r.delta).toBeCloseTo(-2.5);
  });

  it("energia e humor caem 4 no cenário", () => {
    for (const code of ["energy_self_report", "mood_self_report"] as const) {
      const r = describeTrend(lastN(data, code, 3));
      expect(r).toMatchObject({ state: "descriptive_only", direction: "down", delta: -4 });
    }
  });
});
