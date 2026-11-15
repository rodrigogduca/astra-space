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
  it("0 XP → level 1 Cadet", () => {
    expect(levelFor(0)).toMatchObject({ index: 1, name: "Cadet", next: "Specialist", toNext: 800, progress: 0 });
  });
  it("799 XP → still Cadet, 1 to go", () => {
    const l = levelFor(799);
    expect(l).toMatchObject({ index: 1, name: "Cadet", toNext: 1 });
    expect(l.progress).toBeCloseTo(799 / 800);
  });
  it("800 XP → Specialist", () => {
    expect(levelFor(800)).toMatchObject({ index: 2, name: "Specialist", next: "Flight engineer", toNext: 1000, progress: 0 });
  });
  it("3000 XP → Commander", () => {
    expect(levelFor(3000)).toMatchObject({ index: 4, name: "Commander", next: "Orbital legend", toNext: 2000, progress: 0 });
  });
  it("5000+ XP → Orbital legend, last level, progress 1", () => {
    for (const xp of [5000, 9999]) {
      const l = levelFor(xp);
      expect(l).toMatchObject({ index: LEVELS.length, name: "Orbital legend", toNext: 0, progress: 1 });
      expect(l.next).toBeUndefined();
    }
  });
});

describe("todayXp / doneCount / pillarProgress", () => {
  it("empty day → 0", () => {
    expect(todayXp(today())).toBe(0);
    expect(doneCount(today())).toBe(0);
    expect(pillarProgress(today())).toEqual({ body: 0, mind: 0, spirit: 0 });
  });

  it("adds up the XP of the missions done", () => {
    const t = today(["checkin", "hydration", "exercise"]);
    expect(todayXp(t)).toBe(20 + 15 + 25);
    expect(doneCount(t)).toBe(3);
  });

  it("done:false does not count", () => {
    const t: TodayState = { ...today(), done: { checkin: false, breathe: true } };
    expect(todayXp(t)).toBe(15);
    expect(doneCount(t)).toBe(1);
  });

  it("a full day adds up every mission and the pillars reach 1", () => {
    const t = today(MISSIONS.map((m) => m.id));
    expect(todayXp(t)).toBe(MISSIONS.reduce((s, m) => s + m.xp, 0));
    expect(doneCount(t)).toBe(MISSIONS.length);
    expect(pillarProgress(t)).toEqual({ body: 1, mind: 1, spirit: 1 });
  });

  it("pillarProgress is the share of missions done in each pillar", () => {
    const body = MISSIONS.filter((m) => m.pillar === "body").length;
    const mind = MISSIONS.filter((m) => m.pillar === "mind").length;
    const p = pillarProgress(today(["hydration", "checkin"]));
    expect(p.body).toBeCloseTo(1 / body);
    expect(p.mind).toBeCloseTo(1 / mind);
    expect(p.spirit).toBe(0);
  });
});

describe("badges", () => {
  const find = (list: ReturnType<typeof badges>, id: string) => list.find((b) => b.id === id)!;

  it("empty day, streak 0, XP 0: only 'First orbit' is earned", () => {
    const list = badges(today(), 0, 0);
    expect(list.filter((b) => b.earned).map((b) => b.id)).toEqual(["orbit"]);
  });

  it("streak and XP unlock week, fortnight and commander at the boundaries", () => {
    expect(find(badges(today(), 6, 2999), "week").earned).toBe(false);
    expect(find(badges(today(), 7, 2999), "week").earned).toBe(true);
    expect(find(badges(today(), 14, 0), "fortnight").earned).toBe(false);
    expect(find(badges(today(), 15, 0), "fortnight").earned).toBe(true);
    expect(find(badges(today(), 0, 2999), "commander").earned).toBe(false);
    expect(find(badges(today(), 0, 3000), "commander").earned).toBe(true);
  });

  it("today's missions unlock the matching badges", () => {
    const list = badges(today(["hydration", "exercise", "breathe", "window", "earth"]), 0, 0);
    for (const id of ["water", "ared", "calm", "overview", "bridge"]) expect(find(list, id).earned).toBe(true);
    expect(find(list, "full").earned).toBe(false);
  });

  it("'Full day' only with every mission", () => {
    expect(find(badges(today(MISSIONS.map((m) => m.id)), 0, 0), "full").earned).toBe(true);
  });

  it("unique badge ids", () => {
    const ids = badges(today(), 0, 0).map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("weeklyChallenges", () => {
  const sleepOf = (list: ReturnType<typeof weeklyChallenges>) => list.find((c) => c.id === "sleep")!;

  it("counts nights with sleep ≥ 7 h in the last week", () => {
    const obs = [
      o("sleep_duration", 7, 10), // counts (boundary)
      o("sleep_duration", 8.2, 34), // counts
      o("sleep_duration", 6.9, 58), // does not count
      o("sleep_duration", null, 80), // null does not count
      o("sleep_duration", 9, 8 * 24), // outside the week
      o("hydration", 9, 20), // another indicator
    ];
    const c = sleepOf(weeklyChallenges(obs, today(), NOW));
    expect(c.current).toBe(2);
    expect(c.goal).toBe(5);
  });

  it("water and pauses add today; crew workout adds minutes", () => {
    const obs = [o("hydration", 2.1, 30), o("hydration", 1.5, 50), o("contemplation", 10, 30), o("exercise", 60, 30)];
    const list = weeklyChallenges(obs, today(["hydration", "breathe"], { exercise: 30 }), NOW);
    expect(list.find((c) => c.id === "water")!.current).toBe(2);
    expect(list.find((c) => c.id === "pause")!.current).toBe(2);
    expect(list.find((c) => c.id === "crew")!.current).toBe(2980 + 60 + 30);
  });

  // Locks the qualityState filter in weeklyChallenges: an "invalid" 9 h reading
  // must not count as a good night.
  it("ignores sleep observations with an invalid qualityState", () => {
    const obs = [o("sleep_duration", 9, 10, { qualityState: "invalid" })];
    expect(sleepOf(weeklyChallenges(obs, today(), NOW)).current).toBe(0);
  });
});

describe("REQ-3.6: XP depends only on the action, never on a signal value", () => {
  it("changing signal values does not change XP, level or XP badges", () => {
    const t = today(["checkin", "vitals", "hydration"]);
    const goodSignals = [o("bp_systolic", 115, 2), o("glucose", 95, 2), o("sleep_duration", 8, 10)];
    const badSignals = [o("bp_systolic", 190, 2), o("glucose", 320, 2), o("sleep_duration", 2, 10)];

    // The XP functions take no observations: the signature already proves the independence.
    const xp = todayXp(t);
    expect(xp).toBe(20 + 10 + 15);
    expect(todayXp({ ...t })).toBe(xp);
    expect(levelFor(2340 + xp)).toEqual(levelFor(2340 + todayXp(t)));

    // Even where observations come in (challenges), today's XP is the same with good or bad signals.
    weeklyChallenges(goodSignals, t, NOW);
    weeklyChallenges(badSignals, t, NOW);
    expect(todayXp(t)).toBe(xp);

    // And mission badges depend only on today.done.
    const b1 = badges(t, 3, 2340 + xp).map((b) => b.earned);
    const b2 = badges(t, 3, 2340 + xp).map((b) => b.earned);
    expect(b1).toEqual(b2);
  });

  it("XP changes when today.done changes (and only then)", () => {
    expect(todayXp(today(["checkin"]))).toBe(20);
    expect(todayXp(today(["checkin", "gratitude"]))).toBe(30);
  });

  it("every mission has a fixed positive XP", () => {
    for (const m of MISSIONS) expect(m.xp).toBeGreaterThan(0);
  });
});
