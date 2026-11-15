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
  it("aceita leitura válida", () => {
    const o = ingest(raw(), "obs-1", "DEMO-01", NOW);
    expect(o.qualityState).toBe("valid");
    expect(o.observationId).toBe("obs-1");
    expect(o.profileId).toBe("DEMO-01");
    expect(o.value).toBe(70);
  });

  it("rejeita unidade errada", () => {
    expect(ingest(raw({ unit: "mmHg" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejeita horário futuro", () => {
    expect(ingest(raw({ observedAt: "2026-11-14T13:00:00.000Z" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejeita horário que não é data", () => {
    expect(ingest(raw({ observedAt: "ontem" }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("rejeita valor fora do limite estrutural", () => {
    expect(ingest(raw({ value: 400 }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
    expect(ingest(raw({ value: 5 }), "x", "DEMO-01", NOW).qualityState).toBe("invalid");
  });

  it("valor null vira missing, nunca 0", () => {
    const o = ingest(raw({ value: null }), "x", "DEMO-01", NOW);
    expect(o.qualityState).toBe("missing");
    expect(o.value).toBeNull();
  });

  it("define a origem correta", () => {
    expect(ingest(raw(), "a", "DEMO-01", NOW).origin).toBe("synthetic");
    const manual = ingest(raw({ connectorId: "astra-checkin", indicatorCode: "sleep_duration", value: 7, unit: "h", synthetic: false }), "b", "DEMO-01", NOW);
    expect(manual.origin).toBe("manual");
    expect(manual.isSynthetic).toBe(false);
    expect(ingest(raw({ synthetic: false }), "c", "DEMO-01", NOW).origin).toBe("authorized_external");
  });

  it("sourceRef é o id do conector", () => {
    expect(ingest(raw({ connectorId: "cgm", indicatorCode: "glucose", value: 100, unit: "mg/dL" }), "g", "DEMO-01", NOW).sourceRef).toBe("cgm");
  });
});

describe("connectorFor", () => {
  it("aponta cada indicador para o conector certo", () => {
    expect(connectorFor("glucose")?.id).toBe("cgm");
    expect(connectorFor("heart_rate")?.id).toBe("bio-monitor");
    expect(connectorFor("radiation_dose")?.id).toBe("dosimetro");
    expect(connectorFor("sleep_duration")?.id).toBe("cenario-demo");
    expect(connectorFor("exercise")?.id).toBe("ared");
  });
});
