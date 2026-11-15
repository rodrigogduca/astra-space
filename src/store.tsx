import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { get, set, del } from "idb-keyval";
import type { IndicatorCode, Observation, SyncEvent, SyncEventType } from "./domain/types";
import { generateSynthetic, simulateConnectorReading, PROFILE_ID } from "./domain/simulator";
import { DEMO_BASE, DAILY_GOAL_MISSIONS, badges, doneCount, mission, type MissionId, type TodayState } from "./domain/gamification";
import { indicator } from "./domain/indicators";
import { ingest } from "./domain/integrations";

// Local-first state: everything is saved to the browser's IndexedDB before any "send".
// Sync with Earth is SIMULATED (specification section 26).

// v2: the domain keys were renamed to English, so data saved under v1 is not reused.
const STORAGE_KEY = "astra-state-v2";

export interface AppState {
  anchor: number;
  manual: Observation[];
  live: Observation[];
  today: TodayState;
  outbox: SyncEvent[];
  online: boolean;
  failNext: boolean;
  lastSync: Record<string, string>; // connector → ISO time of the last live reading
  obsEvent: Record<string, string>; // manual observation → queue event that sends it
  xpEarned: number; // XP earned in the app (added to the demo baseline)
  streak: number;
  lastStreakDay: string | null; // last day the mission goal was reached
  earnedBadges: string[];
  seq: number;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyToday = (): TodayState => ({ date: dayKey(Date.now()), done: {}, progress: {}, gratitude: [] });
const yesterdayKey = (t: number) => dayKey(t - 24 * 3600_000);

export function freshState(): AppState {
  const anchor = Math.floor(Date.now() / 60_000) * 60_000;
  return {
    anchor,
    manual: [],
    live: [],
    today: emptyToday(),
    outbox: [],
    online: true,
    failNext: false,
    lastSync: {},
    obsEvent: {},
    xpEarned: 0,
    // The demo's fictional streak "comes from yesterday"; it only continues if the goal is reached each day.
    streak: DEMO_BASE.streak,
    lastStreakDay: yesterdayKey(Date.now()),
    earnedBadges: [],
    seq: 0,
  };
}

export interface CheckInInput {
  values: Partial<Record<IndicatorCode, number | null>>;
  label: string;
  missionId: MissionId;
}

export type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "checkIn"; input: CheckInInput }
  | { type: "progress"; id: MissionId }
  | { type: "complete"; id: MissionId; gratitude?: string[] }
  | { type: "syncSensors" }
  | { type: "syncConnector"; id: string }
  | { type: "toggleOnline" }
  | { type: "toggleFailNext" }
  | { type: "advanceSync" }
  | { type: "retry"; eventId: string }
  | { type: "requestSupport" }
  | { type: "rollover" }
  | { type: "reset" };

function newEvent(state: AppState, type: SyncEventType, label: string, missionId?: MissionId): SyncEvent {
  const id = `evt-${Date.now().toString(36)}-${state.seq}`;
  return { eventId: id, idempotencyKey: `${PROFILE_ID}:${id}`, type, label, createdAt: new Date().toISOString(), state: "pending", attempts: 0, missionId };
}

function finishMission(state: AppState, id: MissionId): AppState {
  if (state.today.done[id]) return state;
  const m = mission(id);
  const today = { ...state.today, done: { ...state.today.done, [id]: true } };
  const streakUp = doneCount(today) >= DAILY_GOAL_MISSIONS && state.lastStreakDay !== today.date;
  const streak = streakUp ? state.streak + 1 : state.streak;
  const xpEarned = state.xpEarned + m.xp;
  const won = badges(today, streak, DEMO_BASE.xp + xpEarned).filter((b) => b.earned).map((b) => b.id);
  return {
    ...state,
    seq: state.seq + 1,
    today,
    xpEarned,
    streak,
    lastStreakDay: streakUp ? today.date : state.lastStreakDay,
    earnedBadges: [...new Set([...state.earnedBadges, ...won])],
    outbox: [...state.outbox, newEvent(state, "mission_done", `Mission completed: ${m.title} (+${m.xp} XP)`, id)],
  };
}

// Day rollover: resets the missions and breaks the streak if yesterday's goal was not reached.
function rollover(state: AppState, now: number): AppState {
  if (state.today.date === dayKey(now)) return state;
  const kept = state.lastStreakDay === yesterdayKey(now);
  return { ...state, today: emptyToday(), streak: kept ? state.streak : 0 };
}

function syncConnectors(state: AppState, ids: string[]): AppState {
  const now = Date.now();
  const at = new Date(now).toISOString();
  // Every connector reading goes through the ingestion layer (REQ-11.6).
  const live = ids
    .flatMap((id, i) => simulateConnectorReading(id, now, state.seq * 10 + i))
    .map((o) =>
      ingest(
        { connectorId: o.sourceRef!, indicatorCode: o.indicatorCode, value: o.value, unit: o.unit, observedAt: o.observedAt, synthetic: true },
        o.observationId,
        PROFILE_ID,
        now,
      ),
    )
    .map((o) => ({ ...o, syncState: "synced" as const }));
  const lastSync = { ...state.lastSync };
  ids.forEach((id) => (lastSync[id] = at));
  return { ...state, live: [...state.live, ...live], lastSync, seq: state.seq + 1 };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "checkIn": {
      const now = Date.now();
      const event = newEvent(state, "check_in", action.input.label, action.input.missionId);
      const obs = Object.entries(action.input.values).map(([code, value], i) =>
        ingest(
          {
            connectorId: "astra-checkin",
            indicatorCode: code as IndicatorCode,
            value: value ?? null,
            unit: indicator(code as IndicatorCode).unit,
            observedAt: new Date(now).toISOString(),
            synthetic: false,
          },
          `man-${now.toString(36)}-${state.seq}-${i}`,
          PROFILE_ID,
          now,
        ),
      );
      const obsEvent = { ...state.obsEvent };
      obs.forEach((o) => (obsEvent[o.observationId] = event.eventId));
      const withObs = { ...state, manual: [...state.manual, ...obs], obsEvent, outbox: [...state.outbox, event], seq: state.seq + 1 };
      return finishMission(withObs, action.input.missionId);
    }
    case "progress": {
      const m = mission(action.id);
      const cur = (state.today.progress[action.id] ?? 0) + (m.step ?? 1);
      const next = { ...state, today: { ...state.today, progress: { ...state.today.progress, [action.id]: cur } } };
      return m.goal && cur >= m.goal ? finishMission(next, action.id) : next;
    }
    case "complete": {
      const next = action.gratitude ? { ...state, today: { ...state.today, gratitude: action.gratitude } } : state;
      return finishMission(next, action.id);
    }
    case "syncConnector":
      return syncConnectors(state, [action.id]);
    case "syncSensors":
      return finishMission(syncConnectors(state, ["bio-monitor", "cgm"]), "vitals");
    case "toggleOnline":
      return { ...state, online: !state.online };
    case "toggleFailNext":
      return { ...state, failNext: !state.failNext };
    case "advanceSync": {
      if (!state.online) return state;
      let failUsed = false;
      const outbox = state.outbox.map((e): SyncEvent => {
        if (e.state === "pending") return { ...e, state: "ready" };
        if (e.state === "ready") {
          if (state.failNext && !failUsed) {
            failUsed = true;
            return { ...e, state: "failed", attempts: e.attempts + 1 };
          }
          return { ...e, state: "synced", attempts: e.attempts + 1 };
        }
        return e;
      });
      return { ...state, outbox, failNext: failUsed ? false : state.failNext };
    }
    case "retry":
      return { ...state, outbox: state.outbox.map((e) => (e.eventId === action.eventId ? { ...e, state: "pending" } : e)) };
    case "requestSupport":
      return {
        ...state,
        seq: state.seq + 1,
        outbox: [...state.outbox, newEvent(state, "support_request", "Support request to the flight surgeon")],
      };
    case "rollover":
      return rollover(state, Date.now());
    case "reset":
      return freshState();
  }
}

// Daily totals (water, workout...) become a derived manual observation for the health record.
const TODAY_TOTALS: Partial<Record<MissionId, { code: IndicatorCode; factor: number }>> = {
  hydration: { code: "hydration", factor: 1 / 1000 },
  exercise: { code: "exercise", factor: 1 },
  earth: { code: "earth_contact", factor: 1 },
  window: { code: "contemplation", factor: 1 },
};

export function allObservations(state: AppState, synthetic: Observation[]): Observation[] {
  const totals: Observation[] = [];
  for (const [id, cfg] of Object.entries(TODAY_TOTALS)) {
    const v = state.today.progress[id as MissionId];
    if (!v || !cfg) continue;
    totals.push({
      observationId: `today-${cfg.code}`,
      profileId: PROFILE_ID,
      indicatorCode: cfg.code,
      value: Math.round(v * cfg.factor * 10) / 10,
      unit: indicator(cfg.code).unit,
      observedAt: new Date().toISOString(),
      origin: "manual",
      sourceRef: "astra-checkin",
      qualityState: "valid",
      syncState: "local_only",
      isSynthetic: false,
    });
  }
  // Sync state of a manual record = state of the queue event that sends it.
  const eventState = new Map(state.outbox.map((e) => [e.eventId, e.state]));
  const manual = state.manual.map((o) => {
    const ev = state.obsEvent[o.observationId];
    return { ...o, syncState: (ev && eventState.get(ev)) || o.syncState };
  });
  return [...synthetic, ...state.live, ...manual, ...totals];
}

interface Store {
  state: AppState;
  dispatch: (a: Action) => void;
  observations: Observation[];
  byCode: (code: IndicatorCode) => Observation[];
  latest: (code: IndicatorCode) => Observation | undefined;
  xp: number;
  streak: number;
  streakSafeToday: boolean;
  supportEvent: SyncEvent | undefined; // today's support request, if any
  storageOk: boolean;
  ready: boolean; // saved state has already been loaded from IndexedDB
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const loaded = useRef(false);
  const [storageOk, setStorageOk] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    get<AppState>(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          // Refreshes the simulated scenario anchor so the demo does not show "stale" data.
          const fresh = freshState();
          const anchor = Date.now() - saved.anchor > 3600_000 ? fresh.anchor : saved.anchor;
          dispatch({ type: "hydrate", state: rollover({ ...fresh, ...saved, anchor }, Date.now()) });
        }
      })
      .catch(() => setStorageOk(false))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  // A tab left open past midnight also switches to the new day.
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "rollover" }), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    set(STORAGE_KEY, state).catch(() => setStorageOk(false));
  }, [state]);

  // Simulated link with Earth: PENDING → READY → SYNCED (or FAILED).
  useEffect(() => {
    if (!state.online || !state.outbox.some((e) => e.state === "pending" || e.state === "ready")) return;
    const t = setTimeout(() => dispatch({ type: "advanceSync" }), 900);
    return () => clearTimeout(t);
  }, [state.online, state.outbox]);

  const synthetic = useMemo(() => generateSynthetic(state.anchor), [state.anchor]);
  const observations = useMemo(() => allObservations(state, synthetic), [state, synthetic]);

  const store = useMemo<Store>(() => {
    const index = new Map<IndicatorCode, Observation[]>();
    for (const o of observations) {
      const list = index.get(o.indicatorCode) ?? [];
      list.push(o);
      index.set(o.indicatorCode, list);
    }
    for (const list of index.values()) list.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
    const streakSafeToday = state.lastStreakDay === state.today.date;
    const supportEvent = [...state.outbox]
      .reverse()
      .find((e) => e.type === "support_request" && dayKey(Date.parse(e.createdAt)) === state.today.date);
    return {
      state,
      dispatch,
      observations,
      byCode: (c) => index.get(c) ?? [],
      latest: (c) => {
        const list = (index.get(c) ?? []).filter((o) => o.value !== null);
        return list[list.length - 1];
      },
      xp: DEMO_BASE.xp + state.xpEarned,
      streak: state.streak,
      streakSafeToday,
      supportEvent,
      storageOk,
      ready,
    };
  }, [state, observations, storageOk, ready]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore used outside StoreProvider");
  return s;
}

export async function clearLocalData() {
  await del(STORAGE_KEY);
}
