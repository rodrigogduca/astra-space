import { describe, expect, it } from "vitest";
import { allObservations, freshState, reducer, type Action, type AppState } from "./store";
import { DEMO_BASE } from "./domain/gamification";

// Reducer tests (findings from review F1: XP/streak/badges across days, syncState, ingestion).

const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state);

describe("reducer", () => {
  it("adds up XP and does not complete the same mission twice", () => {
    const s = run(freshState(), { type: "complete", id: "breathe" }, { type: "complete", id: "breathe" });
    expect(s.xpEarned).toBe(15);
    expect(s.outbox.filter((e) => e.type === "mission_done")).toHaveLength(1);
  });

  it("streak goes up once after 4 missions and badges are saved", () => {
    const s = run(
      freshState(),
      { type: "complete", id: "breathe" },
      { type: "complete", id: "gratitude", gratitude: ["Music", "My crew", "Music"] },
      { type: "syncSensors" },
      { type: "complete", id: "evening" },
      { type: "complete", id: "checkin" },
    );
    expect(s.streak).toBe(DEMO_BASE.streak + 1);
    expect(s.lastStreakDay).toBe(s.today.date);
    expect(s.earnedBadges).toContain("calm");
  });

  it("day rollover keeps XP and badges, resets missions and breaks the streak if yesterday's goal was missed", () => {
    const s = run(freshState(), { type: "complete", id: "breathe" });
    const yesterday = { ...s, today: { ...s.today, date: "2000-01-01" }, lastStreakDay: "1999-12-30" };
    const next = reducer(yesterday, { type: "rollover" });
    expect(next.today.done).toEqual({});
    expect(next.xpEarned).toBe(15);
    expect(next.earnedBadges).toContain("calm");
    expect(next.streak).toBe(0);
  });

  it("check-in goes through ingestion: a skipped field becomes missing with null, never 0", () => {
    const s = run(freshState(), {
      type: "checkIn",
      input: { values: { sleep_duration: 6.5, mood_self_report: null }, label: "test", missionId: "checkin" },
    });
    const mood = s.manual.find((o) => o.indicatorCode === "mood_self_report")!;
    expect(mood.value).toBeNull();
    expect(mood.qualityState).toBe("missing");
    expect(s.manual.find((o) => o.indicatorCode === "sleep_duration")!.origin).toBe("manual");
  });

  it("syncState of a manual record follows its queue event", () => {
    let s = run({ ...freshState(), online: false }, {
      type: "checkIn",
      input: { values: { sleep_duration: 7 }, label: "test", missionId: "checkin" },
    });
    const sync = () => allObservations(s, []).find((o) => o.indicatorCode === "sleep_duration")!.syncState;
    expect(sync()).toBe("pending");
    s = run(s, { type: "toggleOnline" }, { type: "advanceSync" }, { type: "advanceSync" });
    expect(sync()).toBe("synced");
  });

  it("labels of store events are in English", () => {
    const s = run(freshState(), { type: "complete", id: "breathe" }, { type: "requestSupport" });
    expect(s.outbox[0].label).toBe("Mission completed: Breathing break (+15 XP)");
    expect(s.outbox[1].label).toBe("Support request to the flight surgeon");
  });

  it("a simulated failure marks FAILED and retry goes back to PENDING", () => {
    let s = run({ ...freshState(), failNext: true }, { type: "requestSupport" }, { type: "advanceSync" }, { type: "advanceSync" });
    expect(s.outbox[0].state).toBe("failed");
    s = reducer(s, { type: "retry", eventId: s.outbox[0].eventId });
    expect(s.outbox[0].state).toBe("pending");
  });
});
