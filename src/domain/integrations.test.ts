import { describe, expect, it } from "vitest";
import { ingest, connectorFor, type RawReading } from "./integrations";

const NOW = Date.parse("2026-11-14T12:00:00.000Z");
const PAST = "2026-11-14T11:00:00.000Z";

const raw = (over: Partial<RawReading> = {}): RawReading => ({
  connectorId: "bio-monitor",
  indicatorCode: "heart_rate",
  value: 70,
  unit: "bpm",
  observedAt: PAST,
  synthetic: true,
  ...over,
});

describe("ingest", () => {
  it("accepts a valid reading", () => {
    const o = ingest(raw(), "obs-1", "DEMO-01", NOW);
    expect(o.qualityState).toBe("valid");
    expect(o.observationId).toBe("obs-1");
    expect(o.profileId).toBe("DEMO-01");
    expect(o.value).toBe(70);
  });

  it("rejects a wrong unit", () => {
    expect(ingest(raw({ unit: "mmHg" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejects a future timestamp", () => {
    expect(ingest(raw({ observedAt: "2026-11-14T13:00:00.000Z" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejects a timestamp that is not a date", () => {
    expect(ingest(raw({ observedAt: "yesterday" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejects a value outside the structural bounds", () => {
    expect(ingest(raw({ value: 400 }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
    expect(ingest(raw({ value: 5 }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("a null value becomes missing, never 0", () => {
    const o = ingest(raw({ value: null }), "x", "DEMO-01", NOW);
    expect(o.qualityState).toBe("missing");
    expect(o.value).toBeNull();
  });

  it("sets the right origin", () => {
    expect(ingest(raw(), "a", "DEMO-01", NOW).origin).toBe("synthetic");
    const manual = ingest(raw({ connectorId: "astra-checkin", indicatorCode: "sleep_duration", value: 7, unit: "h", synthetic: false }), "b", "DEMO-01", NOW);
    expect(manual.origin).toBe("manual");
    expect(manual.isSynthetic).toBe(false);
    expect(ingest(raw({ synthetic: false }), "c", "DEMO-01", NOW).origin).toBe("authorized_external");
  });

  it("sourceRef is the connector id", () => {
    expect(ingest(raw({ connectorId: "cgm", indicatorCode: "glucose", value: 100, unit: "mg/dL" }), "g", "DEMO-01", NOW).sourceRef).toBe("cgm");
  });
});

describe("connectorFor", () => {
  it("points each indicator to the right connector", () => {
    expect(connectorFor("glucose")?.id).toBe("cgm");
    expect(connectorFor("heart_rate")?.id).toBe("bio-monitor");
    expect(connectorFor("radiation_dose")?.id).toBe("dosimeter");
    expect(connectorFor("sleep_duration")?.id).toBe("demo-scenario");
    expect(connectorFor("exercise")?.id).toBe("ared");
  });
});
