import { describe, expect, it } from "vitest";
import { INDICATORS, formatValue, indicator, rangePosition } from "./indicators";

describe("catálogo de indicadores", () => {
  it("códigos únicos", () => {
    const codes = INDICATORS.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("todo indicador com faixa tem fonte e rótulo não vazios", () => {
    const withRange = INDICATORS.filter((i) => i.range);
    expect(withRange.length).toBeGreaterThan(0);
    for (const i of withRange) {
      expect(i.range!.source.trim(), `${i.code} sem fonte`).not.toBe("");
      expect(i.range!.label.trim(), `${i.code} sem rótulo`).not.toBe("");
      expect(i.range!.min !== undefined || i.range!.max !== undefined, `${i.code} faixa sem limites`).toBe(true);
    }
  });

  it("todo indicador tem unidade definida", () => {
    for (const i of INDICATORS) expect(typeof i.unit).toBe("string");
  });
});

describe("rangePosition", () => {
  // heart_rate: 60–100 bpm
  it("abaixo / dentro / acima da faixa", () => {
    const r = indicator("heart_rate").range!;
    expect(rangePosition(r.min! - 1, "heart_rate")).toBe("abaixo");
    expect(rangePosition(r.min!, "heart_rate")).toBe("dentro");
    expect(rangePosition(r.max!, "heart_rate")).toBe("dentro");
    expect(rangePosition(r.max! + 1, "heart_rate")).toBe("acima");
  });

  it("null → sem_faixa (nunca vira 0 / abaixo)", () => {
    expect(rangePosition(null, "heart_rate")).toBe("sem_faixa");
  });

  it("indicador sem faixa → sem_faixa", () => {
    const sem = INDICATORS.find((i) => !i.range)!;
    expect(sem).toBeDefined();
    expect(rangePosition(42, sem.code)).toBe("sem_faixa");
  });
});

describe("formatValue", () => {
  it("null → travessão", () => {
    expect(formatValue(null, "sleep_duration")).toBe("—");
    expect(formatValue(null, "heart_rate")).toBe("—");
  });

  it("0 continua 0 (não é tratado como ausente)", () => {
    expect(formatValue(0, "heart_rate")).toBe("0");
  });

  it("respeita as casas decimais do catálogo", () => {
    const d = indicator("sleep_duration").decimals;
    const s = formatValue(7.5, "sleep_duration");
    const decimals = s.includes(",") ? s.split(",")[1].length : 0;
    expect(decimals).toBe(d);
  });
});
