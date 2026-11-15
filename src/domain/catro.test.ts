import { afterEach, describe, expect, it } from "vitest";
import { catroSays } from "./catro";
import { MISSIONS, type MissionId, type TodayState } from "./gamification";
import { setNumberLocale } from "./indicators";
import type { Observation } from "./types";

// Clinical words Catro must never say, in each UI language.
const FORBIDDEN = {
  en: ["risk", "worse", "danger", "abnormal", "diagnosis of"],
  pt: ["risco", "piora", "perigo", "anormal", "diagnóstico de"],
} as const;

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

const DECLINE = sleep([7.5, 6, 5]);
const RISE = sleep([5, 6, 7.5]);

afterEach(() => setNumberLocale("en-US"));

describe("catroSays", () => {
  const states: Array<[string, Parameters<typeof catroSays>[0]]> = [];
  for (const lang of ["en", "pt"] as const)
    for (const online of [true, false])
      for (const support of ["pending", "failed", undefined] as const)
        for (const s of [DECLINE, RISE, []])
          for (const done of [[], ["checkin"], MISSIONS.map((m) => m.id)] as MissionId[][])
            for (const hour of [7, 15, 23])
              states.push([
                `lang=${lang} online=${online} support=${support} sleep=${s.length} done=${done.length} h=${hour}`,
                { today: today(done), sleep: s, online, support, hour, lang },
              ]);

  it.each(states)("never uses forbidden clinical language (%s)", (_, input) => {
    const line = catroSays(input);
    const text = (line.text + " " + line.actions.map((a) => a.label).join(" ")).toLowerCase();
    for (const word of FORBIDDEN[input.lang ?? "en"]) expect(text).not.toContain(word);
  });

  it("speaks English by default", () => {
    const line = catroSays({ today: today(["checkin"]), sleep: [], online: false, support: undefined, hour: 9 });
    expect(line.text.toLowerCase()).toContain("queue");
  });

  it("declining sleep and no check-in → thinking, series described and a support action", () => {
    const line = catroSays({ today: today(), sleep: DECLINE, online: true, support: undefined, hour: 9 });
    expect(line.mood).toBe("thinking");
    expect(line.text).toContain("7.5 h → 6.0 h → 5.0 h");
    expect(line.actions.some((a) => a.support === true)).toBe(true);
    expect(line.actions.some((a) => a.to === "#/checkin")).toBe(true);
  });

  it("declining sleep in Portuguese uses the Portuguese number format", () => {
    setNumberLocale("pt-BR");
    const line = catroSays({ today: today(), sleep: DECLINE, online: true, support: undefined, hour: 9, lang: "pt" });
    expect(line.text).toContain("7,5 h → 6,0 h → 5,0 h");
    expect(line.text).toContain("Seu sono vem diminuindo");
  });

  it("declining sleep but check-in already done → not the thinking branch", () => {
    const line = catroSays({ today: today(["checkin"]), sleep: DECLINE, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });

  it("rising sleep → not the thinking branch", () => {
    const line = catroSays({ today: today(), sleep: RISE, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });

  it("offline with no other condition → mentions the queue", () => {
    const line = catroSays({ today: today(["checkin"]), sleep: [], online: false, support: undefined, hour: 9 });
    expect(line.text.toLowerCase()).toContain("queue");
    expect(line.mood).toBe("calm");
    const pt = catroSays({ today: today(["checkin"]), sleep: [], online: false, support: undefined, hour: 9, lang: "pt" });
    expect(pt.text.toLowerCase()).toContain("fila");
  });

  it("support request while offline → stays in the queue", () => {
    const line = catroSays({ today: today(), sleep: DECLINE, online: false, support: "pending", hour: 9 });
    expect(line.text.toLowerCase()).toContain("queue");
  });

  it("full day → excited", () => {
    const line = catroSays({ today: today(MISSIONS.map((m) => m.id)), sleep: DECLINE, online: true, support: undefined, hour: 20 });
    expect(line.mood).toBe("excited");
  });

  it("next mission title follows the language", () => {
    const en = catroSays({ today: today(["checkin"]), sleep: [], online: true, support: undefined, hour: 9 });
    const pt = catroSays({ today: today(["checkin"]), sleep: [], online: true, support: undefined, hour: 9, lang: "pt" });
    expect(en.text).toContain("Next: today's vitals.");
    expect(pt.text).toContain("Próxima: sinais do dia.");
  });

  it("synthetic + manual mix: compares only the origin of the latest record", () => {
    // The latest record is manual and the only one of its origin → no trend → no thinking branch.
    const mix = [...sleep([7.5, 6]), ...sleep([5], { isSynthetic: false, origin: "manual" }).map((o) => ({ ...o, observedAt: "2026-11-14T07:00:00.000Z" }))];
    const line = catroSays({ today: today(), sleep: mix, online: true, support: undefined, hour: 9 });
    expect(line.mood).not.toBe("thinking");
  });
});
