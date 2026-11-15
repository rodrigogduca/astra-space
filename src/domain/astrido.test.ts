import { describe, expect, it } from "vitest";
import { astridoSays } from "./astrido";
import { MISSIONS, type MissionId, type TodayState } from "./gamification";
import type { Observation } from "./types";

const PROIBIDAS = ["risco", "piora", "perigo", "anormal", "diagnóstico de"];

function today(done: MissionId[] = []): TodayState {
  return { date: "2026-11-14", done: Object.fromEntries(done.map((d) => [d, true])), progress: {}, gratitude: [] };
}

let seq = 0;
function sleep(values: number[], extra: Partial<Observation> = {}): Observation[] {
  return values.map((v, i) => ({
    observationId: `s-${seq++}`,
    profileId: "DEMO-01",
    indicatorCode: "sleep_duration",
    value: v,
    unit: "h",
    observedAt: new Date(Date.parse("2026-11-11T08:00:00.000Z") + i * 36 * 3600_000).toISOString(),
    origin: "synthetic",
    qualityState: "valid",
    syncState: "synced",
    isSynthetic: true,
    ...extra,
  }));
}

const QUEDA = sleep([7.5, 6, 5]);
const SUBIDA = sleep([5, 6, 7.5]);

describe("astridoSays", () => {
  const estados: Array<[string, Parameters<typeof astridoSays>[0]]> = [];
  for (const online of [true, false])
    for (const support of ["pending", "failed", undefined] as const)
      for (const s of [QUEDA, SUBIDA, []])
        for (const done of [[], ["checkin"], MISSIONS.map((m) => m.id)] as MissionId[][])
          for (const hour of [7, 15, 23])
            estados.push([
              `online=${online} apoio=${support} sono=${s.length} done=${done.length} h=${hour}`,
              { today: today(done), sleep: s, online, support, hour },
            ]);

  it.each(estados)("nunca usa linguagem clínica proibida (%s)", (_, input) => {
    const line = astridoSays(input);
    const texto = (line.text + " " + line.actions.map((a) => a.label).join(" ")).toLowerCase();
    for (const p of PROIBIDAS) expect(texto).not.toContain(p);
  });

  it("sono em queda e check-in não feito → thinking, série descrita e ação de apoio", () => {
    const line = astridoSays({ today: today(), sleep: QUEDA, online: true, support: undefined, hour: 9 });
    expect(line.mood).toBe("thinking");
    expect(line.text).toContain("7,5 h → 6,0 h → 5,0 h");
    expect(line.actions.some((a) => a.support === true)).toBe(true);
    expect(line.actions.some((a) => a.to === "#/checkin")).toBe(true);
  });

  it("sono em queda mas check-in já feito → não entra no ramo thinking", () => {
    const line = astridoSays({ today: today(["checkin"]), sleep: QUEDA, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });

  it("sono subindo → não entra no ramo thinking", () => {
    const line = astridoSays({ today: today(), sleep: SUBIDA, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });

  it("offline sem outras condições → menciona a fila", () => {
    const line = astridoSays({ today: today(["checkin"]), sleep: [], online: false, support: undefined, hour: 9 });
    expect(line.text.toLowerCase()).toContain("fila");
    expect(line.mood).toBe("calm");
  });

  it("pedido de apoio offline → fica na fila", () => {
    const line = astridoSays({ today: today(), sleep: QUEDA, online: false, support: "pending", hour: 9 });
    expect(line.text.toLowerCase()).toContain("fila");
  });

  it("dia completo → excited", () => {
    const line = astridoSays({ today: today(MISSIONS.map((m) => m.id)), sleep: QUEDA, online: true, support: undefined, hour: 20 });
    expect(line.mood).toBe("excited");
  });

  it("mistura sintético + manual: compara só a origem do último registro", () => {
    // Último registro é manual e único da sua origem → sem tendência → sem ramo thinking.
    const mix = [...sleep([7.5, 6]), ...sleep([5], { isSynthetic: false, origin: "manual" }).map((o) => ({ ...o, observedAt: "2026-11-14T07:00:00.000Z" }))];
    const line = astridoSays({ today: today(), sleep: mix, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });
});
