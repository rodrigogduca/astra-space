import { afterEach, describe, expect, it } from "vitest";
import { INDICATORS, formatValue, indicator, rangePosition, setNumberLocale } from "./indicators";

describe("indicator catalog", () => {
  it("unique codes", () => {
    const codes = INDICATORS.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every indicator with a range has a non-empty source and label", () => {
    const withRange = INDICATORS.filter((i) => i.range);
    expect(withRange.length).toBeGreaterThan(0);
    for (const i of withRange) {
      expect(i.range!.source.trim(), `${i.code} has no source`).not.toBe("");
      expect(i.range!.label.trim(), `${i.code} has no label`).not.toBe("");
      expect(i.range!.min !== undefined || i.range!.max !== undefined, `${i.code} range has no bounds`).toBe(true);
    }
  });

  it("every indicator has a unit", () => {
    for (const i of INDICATORS) expect(typeof i.unit).toBe("string");
  });
});

describe("rangePosition", () => {
  // heart_rate: 60–100 bpm
  it("below / within / above the range", () => {
    const r = indicator("heart_rate").range!;
    expect(rangePosition(r.min! - 1, "heart_rate")).toBe("below");
    expect(rangePosition(r.min!, "heart_rate")).toBe("within");
    expect(rangePosition(r.max!, "heart_rate")).toBe("within");
    expect(rangePosition(r.max! + 1, "heart_rate")).toBe("above");
  });

  it("null → no_range (never becomes 0 / below)", () => {
    expect(rangePosition(null, "heart_rate")).toBe("no_range");
  });

  it("indicator without a range → no_range", () => {
    const none = INDICATORS.find((i) => !i.range)!;
    expect(none).toBeDefined();
    expect(rangePosition(42, none.code)).toBe("no_range");
  });
});

describe("formatValue", () => {
  afterEach(() => setNumberLocale("en-US"));

  it("null → em dash", () => {
    expect(formatValue(null, "sleep_duration")).toBe("—");
    expect(formatValue(null, "heart_rate")).toBe("—");
  });

  it("0 stays 0 (not treated as missing)", () => {
    expect(formatValue(0, "heart_rate")).toBe("0");
  });

  it("follows the catalog decimals", () => {
    const d = indicator("sleep_duration").decimals;
    const s = formatValue(7.5, "sleep_duration");
    const decimals = s.includes(".") ? s.split(".")[1].length : 0;
    expect(decimals).toBe(d);
  });

  it("uses the English format by default", () => {
    expect(formatValue(7.5, "sleep_duration")).toBe("7.5");
    expect(formatValue(0.52, "radiation_dose")).toBe("0.52");
    expect(formatValue(1234, "exercise")).toBe("1,234");
  });

  it("uses the Portuguese format after setNumberLocale('pt-BR')", () => {
    setNumberLocale("pt-BR");
    expect(formatValue(7.5, "sleep_duration")).toBe("7,5");
    expect(formatValue(0.52, "radiation_dose")).toBe("0,52");
    expect(formatValue(1234, "exercise")).toBe("1.234");
  });
});
