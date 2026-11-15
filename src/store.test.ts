import { describe, expect, it } from "vitest";
import { allObservations, freshState, reducer, type Action, type AppState } from "./store";
import { DEMO_BASE } from "./domain/gamification";

// Testes do reducer (achados da revisão F1: XP/ofensiva/conquistas entre dias, syncState, ingestão).

const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state);

describe("reducer", () => {
  it("acumula XP e não conclui a mesma missão duas vezes", () => {
    const s = run(freshState(), { type: "complete", id: "breathe" }, { type: "complete", id: "breathe" });
    expect(s.xpEarned).toBe(15);
    expect(s.outbox.filter((e) => e.type === "mission_done")).toHaveLength(1);
  });

  it("ofensiva sobe uma vez ao bater 4 missões e conquistas ficam salvas", () => {
    const s = run(
      freshState(),
      { type: "complete", id: "breathe" },
      { type: "complete", id: "gratitude", gratitude: ["Música", "Minha equipe", "Música"] },
      { type: "syncSensors" },
      { type: "complete", id: "evening" },
      { type: "complete", id: "checkin" },
    );
    expect(s.streak).toBe(DEMO_BASE.streak + 1);
    expect(s.lastStreakDay).toBe(s.today.date);
    expect(s.earnedBadges).toContain("calm");
  });

  it("virada do dia mantém XP e conquistas, zera missões e quebra ofensiva sem meta ontem", () => {
    const s = run(freshState(), { type: "complete", id: "breathe" });
    const yesterday = { ...s, today: { ...s.today, date: "2000-01-01" }, lastStreakDay: "1999-12-30" };
    const next = reducer(yesterday, { type: "rollover" });
    expect(next.today.done).toEqual({});
    expect(next.xpEarned).toBe(15);
    expect(next.earnedBadges).toContain("calm");
    expect(next.streak).toBe(0);
  });

  it("check-in passa pela ingestão: campo pulado vira missing com null, nunca 0", () => {
    const s = run(freshState(), {
      type: "checkIn",
      input: { values: { sleep_duration: 6.5, mood_self_report: null }, label: "teste", missionId: "checkin" },
    });
    const mood = s.manual.find((o) => o.indicatorCode === "mood_self_report")!;
    expect(mood.value).toBeNull();
    expect(mood.qualityState).toBe("missing");
    expect(s.manual.find((o) => o.indicatorCode === "sleep_duration")!.origin).toBe("manual");
  });

  it("syncState do registro manual acompanha o evento da fila", () => {
    let s = run({ ...freshState(), online: false }, {
      type: "checkIn",
      input: { values: { sleep_duration: 7 }, label: "teste", missionId: "checkin" },
    });
    const sync = () => allObservations(s, []).find((o) => o.indicatorCode === "sleep_duration")!.syncState;
    expect(sync()).toBe("pending");
    s = run(s, { type: "toggleOnline" }, { type: "advanceSync" }, { type: "advanceSync" });
    expect(sync()).toBe("synced");
  });

  it("falha simulada marca FAILED e retry volta para PENDING", () => {
    let s = run({ ...freshState(), failNext: true }, { type: "requestSupport" }, { type: "advanceSync" }, { type: "advanceSync" });
    expect(s.outbox[0].state).toBe("failed");
    s = reducer(s, { type: "retry", eventId: s.outbox[0].eventId });
    expect(s.outbox[0].state).toBe("pending");
  });
});
