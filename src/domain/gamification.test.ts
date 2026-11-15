import { describe, expect, it } from "vitest";
import {
  LEVELS,
  MISSIONS,
  badges,
  doneCount,
  levelFor,
  pillarProgress,
  todayXp,
  weeklyChallenges,
  type MissionId,
  type TodayState,
} from "./gamification";
import type { IndicatorCode, Observation } from "./types";

const HOUR = 3600_000;
const NOW = Date.parse("2026-11-14T12:00:00.000Z");

function today(done: MissionId[] = [], progress: TodayState["progress"] = {}): TodayState {
  return { date: "2026-11-14", done: Object.fromEntries(done.map((d) => [d, true])), progress, gratitude: [] };
}

let seq = 0;
function o(code: IndicatorCode, value: number | null, hoursAgo: number, extra: Partial<Observation> = {}): Observation {
  return {
    observationId: `g-${seq++}`,
    profileId: "DEMO-01",
    indicatorCode: code,
    value,
    unit: null,
    observedAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
    origin: "manual",
    qualityState: "valid",
    syncState: "synced",
    isSynthetic: false,
    ...extra,
  };
}

describe("levelFor", () => {
  it("0 XP → nível 1 Cadete", () => {
    expect(levelFor(0)).toMatchObject({ index: 1, name: "Cadete", next: "Especialista", toNext: 800, progress: 0 });
  });
  it("799 XP → ainda Cadete, falta 1", () => {
    const l = levelFor(799);
    expect(l).toMatchObject({ index: 1, name: "Cadete", toNext: 1 });
    expect(l.progress).toBeCloseTo(799 / 800);
  });
  it("800 XP → Especialista", () => {
    expect(levelFor(800)).toMatchObject({ index: 2, name: "Especialista", next: "Engenheiro de voo", toNext: 1000, progress: 0 });
  });
  it("3000 XP → Comandante", () => {
    expect(levelFor(3000)).toMatchObject({ index: 4, name: "Comandante", next: "Lenda orbital", toNext: 2000, progress: 0 });
  });
  it("5000+ XP → Lenda orbital, último nível, progresso 1", () => {
    for (const xp of [5000, 9999]) {
      const l = levelFor(xp);
      expect(l).toMatchObject({ index: LEVELS.length, name: "Lenda orbital", toNext: 0, progress: 1 });
      expect(l.next).toBeUndefined();
    }
  });
});

describe("todayXp / doneCount / pillarProgress", () => {
  it("dia vazio → 0", () => {
    expect(todayXp(today())).toBe(0);
    expect(doneCount(today())).toBe(0);
    expect(pillarProgress(today())).toEqual({ corpo: 0, mente: 0, espirito: 0 });
  });

  it("soma o XP das missões feitas", () => {
    const t = today(["checkin", "hydration", "exercise"]);
    expect(todayXp(t)).toBe(20 + 15 + 25);
    expect(doneCount(t)).toBe(3);
  });

  it("done:false não conta", () => {
    const t: TodayState = { ...today(), done: { checkin: false, breathe: true } };
    expect(todayXp(t)).toBe(15);
    expect(doneCount(t)).toBe(1);
  });

  it("dia completo soma todas as missões e pilares chegam a 1", () => {
    const t = today(MISSIONS.map((m) => m.id));
    expect(todayXp(t)).toBe(MISSIONS.reduce((s, m) => s + m.xp, 0));
    expect(doneCount(t)).toBe(MISSIONS.length);
    expect(pillarProgress(t)).toEqual({ corpo: 1, mente: 1, espirito: 1 });
  });

  it("pillarProgress é a fração de missões feitas em cada pilar", () => {
    const corpo = MISSIONS.filter((m) => m.pillar === "corpo").length;
    const mente = MISSIONS.filter((m) => m.pillar === "mente").length;
    const p = pillarProgress(today(["hydration", "checkin"]));
    expect(p.corpo).toBeCloseTo(1 / corpo);
    expect(p.mente).toBeCloseTo(1 / mente);
    expect(p.espirito).toBe(0);
  });
});

describe("badges", () => {
  const find = (list: ReturnType<typeof badges>, id: string) => list.find((b) => b.id === id)!;

  it("dia vazio, ofensiva 0, XP 0: só 'Primeira órbita' ganha", () => {
    const list = badges(today(), 0, 0);
    expect(list.filter((b) => b.earned).map((b) => b.id)).toEqual(["orbit"]);
  });

  it("ofensiva e XP liberam semana, quinzena e comandante nas fronteiras", () => {
    expect(find(badges(today(), 6, 2999), "week").earned).toBe(false);
    expect(find(badges(today(), 7, 2999), "week").earned).toBe(true);
    expect(find(badges(today(), 14, 0), "fortnight").earned).toBe(false);
    expect(find(badges(today(), 15, 0), "fortnight").earned).toBe(true);
    expect(find(badges(today(), 0, 2999), "commander").earned).toBe(false);
    expect(find(badges(today(), 0, 3000), "commander").earned).toBe(true);
  });

  it("missões do dia liberam as conquistas correspondentes", () => {
    const list = badges(today(["hydration", "exercise", "breathe", "window", "earth"]), 0, 0);
    for (const id of ["water", "ared", "calm", "overview", "bridge"]) expect(find(list, id).earned).toBe(true);
    expect(find(list, "full").earned).toBe(false);
  });

  it("'Dia completo' só com todas as missões", () => {
    expect(find(badges(today(MISSIONS.map((m) => m.id)), 0, 0), "full").earned).toBe(true);
  });

  it("ids de conquista únicos", () => {
    const ids = badges(today(), 0, 0).map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("weeklyChallenges", () => {
  const sleepOf = (list: ReturnType<typeof weeklyChallenges>) => list.find((c) => c.id === "sleep")!;

  it("conta noites de sono ≥ 7 h na última semana", () => {
    const obs = [
      o("sleep_duration", 7, 10), // conta (fronteira)
      o("sleep_duration", 8.2, 34), // conta
      o("sleep_duration", 6.9, 58), // não conta
      o("sleep_duration", null, 80), // null não conta
      o("sleep_duration", 9, 8 * 24), // fora da semana
      o("hydration", 9, 20), // outro indicador
    ];
    const c = sleepOf(weeklyChallenges(obs, today(), NOW));
    expect(c.current).toBe(2);
    expect(c.goal).toBe(5);
  });

  it("água e pausas somam o dia de hoje; treino da tripulação soma minutos", () => {
    const obs = [o("hydration", 2.1, 30), o("hydration", 1.5, 50), o("contemplation", 10, 30), o("exercise", 60, 30)];
    const list = weeklyChallenges(obs, today(["hydration", "breathe"], { exercise: 30 }), NOW);
    expect(list.find((c) => c.id === "water")!.current).toBe(2);
    expect(list.find((c) => c.id === "pause")!.current).toBe(2);
    expect(list.find((c) => c.id === "crew")!.current).toBe(2980 + 60 + 30);
  });

  // Possível achado: weeklyChallenges não filtra qualityState, então uma leitura
  // "invalid" de 9 h conta como noite boa (gamification.ts:150-151).
  it("ignora observações de sono com qualityState inválido", () => {
    const obs = [o("sleep_duration", 9, 10, { qualityState: "invalid" })];
    expect(sleepOf(weeklyChallenges(obs, today(), NOW)).current).toBe(0);
  });
});

describe("REQ-3.6: XP depende só da ação, nunca do valor de um sinal", () => {
  it("mudar os valores dos sinais não altera XP, nível nem conquistas de XP", () => {
    const t = today(["checkin", "vitals", "hydration"]);
    const sinaisBons = [o("bp_systolic", 115, 2), o("glucose", 95, 2), o("sleep_duration", 8, 10)];
    const sinaisRuins = [o("bp_systolic", 190, 2), o("glucose", 320, 2), o("sleep_duration", 2, 10)];

    // As funções de XP não recebem observações: a assinatura já prova a independência.
    const xp = todayXp(t);
    expect(xp).toBe(20 + 10 + 15);
    expect(todayXp({ ...t })).toBe(xp);
    expect(levelFor(2340 + xp)).toEqual(levelFor(2340 + todayXp(t)));

    // Mesmo onde observações entram (desafios), o XP do dia é o mesmo com sinais bons ou ruins.
    weeklyChallenges(sinaisBons, t, NOW);
    weeklyChallenges(sinaisRuins, t, NOW);
    expect(todayXp(t)).toBe(xp);

    // E as conquistas de missão dependem só de today.done.
    const b1 = badges(t, 3, 2340 + xp).map((b) => b.earned);
    const b2 = badges(t, 3, 2340 + xp).map((b) => b.earned);
    expect(b1).toEqual(b2);
  });

  it("XP muda quando muda today.done (e só aí)", () => {
    expect(todayXp(today(["checkin"]))).toBe(20);
    expect(todayXp(today(["checkin", "gratitude"]))).toBe(30);
  });

  it("toda missão tem XP fixo positivo", () => {
    for (const m of MISSIONS) expect(m.xp).toBeGreaterThan(0);
  });
});
