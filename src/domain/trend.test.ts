import { describe, expect, it } from "vitest";
import { describeTrend, trendForLatestOrigin, withinWindow } from "./trend";
import type { Observation } from "./types";

// Testes da regra de tendência (base §14 e §34, REQ-2.2, 2.3, 10.5).

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
  it("subida: direction up e delta positivo", () => {
    const r = describeTrend([pt(5, T1), pt(6, T2), pt(7.5, T3)]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.direction).toBe("up");
    expect(r.delta).toBeCloseTo(2.5);
    expect(r.unit).toBe("h");
    expect(r.points).toBe(3);
  });

  it("descida: direction down e delta negativo", () => {
    const r = describeTrend([pt(7.5, T1), pt(6, T2), pt(5, T3)]);
    expect(r).toMatchObject({ state: "descriptive_only", direction: "down" });
    if (r.state === "descriptive_only") expect(r.delta).toBeCloseTo(-2.5);
  });

  it("igualdade: direction unchanged e delta 0 (só primeiro x último)", () => {
    const r = describeTrend([pt(7, T1), pt(3, T2), pt(7, T3)]);
    expect(r).toMatchObject({ state: "descriptive_only", direction: "unchanged", delta: 0 });
  });

  it("menos de 2 pontos: insufficient_data", () => {
    expect(describeTrend([])).toEqual({ state: "insufficient_data" });
    expect(describeTrend([pt(7, T1)])).toEqual({ state: "insufficient_data" });
  });

  it.each(["invalid", "missing", "unverified"] as const)("ignora pontos com qualityState %s", (q) => {
    const a = pt(7, T1);
    const bad = pt(1, T2, { qualityState: q });
    const b = pt(8, T3);
    const r = describeTrend([a, bad, b]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.points).toBe(2);
    expect(r.delta).toBe(1);
    expect(r.inputIds).not.toContain(bad.observationId);
    // só um válido + um ruim → insuficiente
    expect(describeTrend([a, pt(1, T2, { qualityState: q })])).toEqual({ state: "insufficient_data" });
  });

  it("valor null é ignorado e nunca vira 0", () => {
    const nulo = pt(null, T1); // seria o primeiro ponto; se virasse 0, o delta seria 6
    const r = describeTrend([nulo, pt(7, T2), pt(6, T3)]);
    expect(r.state).toBe("descriptive_only");
    if (r.state !== "descriptive_only") return;
    expect(r.delta).toBe(-1);
    expect(r.direction).toBe("down");
    expect(r.points).toBe(2);
    expect(r.inputIds).not.toContain(nulo.observationId);
    expect(describeTrend([pt(null, T1), pt(5, T2)])).toEqual({ state: "insufficient_data" });
  });

  it("ordena por timestamp quando a entrada vem fora de ordem", () => {
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

  it("mistura sintético + manual: mixed_origins_blocked", () => {
    const r = describeTrend([pt(7, T1), pt(6, T2, { isSynthetic: false, origin: "manual" })]);
    expect(r).toEqual({ state: "mixed_origins_blocked" });
  });

  it("mistura com ponto não sintético inválido não bloqueia (inválido é ignorado antes)", () => {
    const r = describeTrend([pt(7, T1), pt(6, T2), pt(1, T3, { isSynthetic: false, qualityState: "invalid" })]);
    expect(r.state).toBe("descriptive_only");
  });

  it("inputIds são o primeiro e o último ponto válidos; isSynthetic reflete a origem", () => {
    const a = pt(7, T1);
    const b = pt(6, T2);
    const c = pt(5, T3);
    const r = describeTrend([a, b, c]);
    expect(r).toMatchObject({ inputIds: [a.observationId, c.observationId], isSynthetic: true });
    const m = describeTrend([pt(7, T1, { isSynthetic: false }), pt(8, T2, { isSynthetic: false })]);
    expect(m).toMatchObject({ state: "descriptive_only", isSynthetic: false });
  });

  // Base §34 cita "duplicidade". A regra atual não deduplica por observationId:
  // o mesmo registro repetido conta como 2 pontos e gera tendência "unchanged"
  // em vez de insufficient_data. Achado para o orquestrador (trend.ts:24-27).
  it("duplicidade: o mesmo observationId repetido conta uma vez só", () => {
    const a = pt(7, T1);
    expect(describeTrend([a, { ...a }])).toEqual({ state: "insufficient_data" });
  });
});

describe("trendForLatestOrigin", () => {
  it("filtra pela origem do último ponto e conta excluded", () => {
    const pts = [
      pt(7, T1, { isSynthetic: false, origin: "manual" }), // excluído
      pt(7.5, T2),
      pt(6, T3),
      pt(5, T4),
    ];
    const r = trendForLatestOrigin(pts);
    expect(r.synthetic).toBe(true);
    expect(r.excluded).toBe(1);
    expect(r.trend).toMatchObject({ state: "descriptive_only", direction: "down", points: 3 });
  });

  it("último ponto manual: compara só os manuais", () => {
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

  it("acha o último ponto mesmo fora de ordem", () => {
    const pts = [pt(5, T4, { isSynthetic: false, origin: "manual" }), pt(7, T1), pt(6, T2)];
    const r = trendForLatestOrigin(pts);
    expect(r.synthetic).toBe(false);
    expect(r.excluded).toBe(2);
    expect(r.trend).toEqual({ state: "insufficient_data" });
  });

  it("ignora inválidos e null; sem válidos → insufficient_data, excluded 0, synthetic null", () => {
    expect(trendForLatestOrigin([])).toEqual({ trend: { state: "insufficient_data" }, excluded: 0, synthetic: null });
    const r = trendForLatestOrigin([pt(null, T1), pt(5, T2, { qualityState: "invalid" })]);
    expect(r).toEqual({ trend: { state: "insufficient_data" }, excluded: 0, synthetic: null });
  });

  it("um ponto inválido de outra origem não conta como excluded", () => {
    const r = trendForLatestOrigin([pt(7, T1), pt(6, T2), pt(1, T3, { isSynthetic: false, qualityState: "invalid" })]);
    expect(r.excluded).toBe(0);
    expect(r.synthetic).toBe(true);
  });
});

describe("withinWindow", () => {
  const now = Date.parse("2026-11-14T08:00:00.000Z");
  it("mantém só pontos dentro de [now - horas, now]", () => {
    const dentro = pt(7, "2026-11-13T09:00:00.000Z");
    const borda = pt(7, "2026-11-13T08:00:00.000Z"); // exatamente 24 h antes
    const agora = pt(7, "2026-11-14T08:00:00.000Z");
    const fora = pt(7, "2026-11-13T07:59:59.000Z");
    const futuro = pt(7, "2026-11-14T08:00:01.000Z");
    const r = withinWindow([dentro, borda, agora, fora, futuro], 24, now);
    expect(r.map((p) => p.observationId)).toEqual([dentro.observationId, borda.observationId, agora.observationId]);
  });

  it("lista vazia → vazia", () => {
    expect(withinWindow([], 72, now)).toEqual([]);
  });
});
