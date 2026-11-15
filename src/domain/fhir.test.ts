import { describe, expect, it } from "vitest";
import type { IndicatorCode, Observation } from "./types";
import { indicator } from "./indicators";
import { toFhirBundle, LOINC, ASTRA_INDICATOR_SYSTEM } from "./fhir";

const AT = "2026-11-14T10:00:00.000Z";

function obs(code: IndicatorCode, value: number | null, extra: Partial<Observation> = {}): Observation {
  return {
    observationId: `t-${code}-${value}`,
    profileId: "DEMO-01",
    indicatorCode: code,
    value,
    unit: indicator(code).unit,
    observedAt: AT,
    origin: "synthetic",
    sourceRef: "bio-monitor",
    qualityState: value === null ? "missing" : "valid",
    syncState: "synced",
    isSynthetic: true,
    ...extra,
  };
}

const opts = { profileId: "DEMO-01", generatedAt: AT };

describe("toFhirBundle", () => {
  it("builds a valid FHIR R4 collection Bundle", () => {
    const b = toFhirBundle([obs("heart_rate", 70), obs("glucose", 100, { sourceRef: "cgm" })], opts);
    expect(b.resourceType).toBe("Bundle");
    expect(b.type).toBe("collection");
    expect(b.timestamp).toBe(AT);
    expect(b.entry).toHaveLength(2);
    const e = b.entry[0];
    expect(e.fullUrl).toMatch(/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(e.resource.id).toMatch(/^[A-Za-z0-9-.]{1,64}$/);
    expect(e.resource.resourceType).toBe("Observation");
    expect(e.resource.status).toBe("final");
    expect(e.resource.subject.reference).toBe("Patient/DEMO-01");
    expect(e.resource.effectiveDateTime).toBe(AT);
    expect(e.resource.category[0].coding[0].code).toBe("vital-signs");
    expect(e.resource.valueQuantity).toEqual({ value: 70, unit: "bpm", system: "http://unitsofmeasure.org", code: "/min" });
    expect(e.resource.device?.display).toMatch(/Bio-Monitor/);
    expect(b.entry[1].resource.device?.display).toMatch(/glucose/i);
  });

  it("uses the confirmed LOINC codes", () => {
    const cases: [IndicatorCode, string][] = [
      ["heart_rate", "8867-4"],
      ["bp_systolic", "8480-6"],
      ["bp_diastolic", "8462-4"],
      ["resp_rate", "9279-1"],
      ["body_temp", "8310-5"],
      ["spo2", "59408-5"],
    ];
    const b = toFhirBundle(cases.map(([c]) => obs(c, 50)), opts);
    cases.forEach(([, loinc], i) => {
      expect(b.entry[i].resource.code.coding[0]).toMatchObject({ system: LOINC, code: loinc });
    });
  });

  it("indicators without a confirmed LOINC use the local system and the name in text", () => {
    const b = toFhirBundle([obs("hrv", 40), obs("radiation_dose", 0.5, { sourceRef: "dosimeter" })], opts);
    for (const e of b.entry) {
      expect(e.resource.code.coding[0].system).toBe(ASTRA_INDICATOR_SYSTEM);
      expect(e.resource.code.coding.some((c) => c.system === LOINC)).toBe(false);
      expect(e.resource.code.text).toBe(indicator(e.resource.code.coding[0].code as IndicatorCode).name);
    }
    expect(b.entry[1].resource.valueQuantity?.code).toBe("mSv");
    expect(b.entry[1].resource.code.text).toBe("Daily radiation dose");
    expect(b.entry[1].resource.device?.display).toBe("Active personal dosimeter");
  });

  it("a 0–10 scale becomes valueInteger, without UCUM, in the survey category", () => {
    const b = toFhirBundle([obs("energy_self_report", 7, { origin: "manual", isSynthetic: false, sourceRef: "astra-checkin" })], opts);
    const r = b.entry[0].resource;
    expect(r.valueInteger).toBe(7);
    expect(r.valueQuantity).toBeUndefined();
    expect(r.category[0].coding[0].code).toBe("survey");
    expect(r.meta.tag).toEqual([{ system: "urn:astra:provenance", code: "MANUAL", display: "MANUAL" }]);
  });

  it("a null value becomes dataAbsentReason, with no value", () => {
    const r = toFhirBundle([obs("spo2", null)], opts).entry[0].resource;
    expect(r.status).toBe("cancelled");
    expect(r.dataAbsentReason?.coding[0].code).toBe("unknown");
    expect(r.dataAbsentReason?.text).toBe("No value recorded");
    expect(r.valueQuantity).toBeUndefined();
    expect(r.valueInteger).toBeUndefined();
  });

  it("every synthetic resource carries the SIMULATED tag", () => {
    const b = toFhirBundle([obs("heart_rate", 70), obs("cabin_co2", 3, { sourceRef: "eclss" })], opts);
    for (const e of b.entry) {
      expect(e.resource.meta.tag).toContainEqual({ system: "urn:astra:provenance", code: "SIMULATED", display: "SIMULATED" });
    }
  });

  it("excludes invalid observations", () => {
    const b = toFhirBundle([obs("heart_rate", 70), obs("heart_rate", 999, { qualityState: "invalid" })], opts);
    expect(b.entry).toHaveLength(1);
    expect(b.entry[0].resource.id).toBe("t-heart-rate-70");
  });
});
