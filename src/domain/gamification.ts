import type { Observation, Pillar } from "./types";
import type { IconName } from "./icons";

// Game layer: rewards habits (checking in, drinking water, working out, pausing),
// never the value of a vital sign. Nobody gains or loses points for having high blood pressure.

export type MissionId =
  | "checkin"
  | "vitals"
  | "hydration"
  | "exercise"
  | "breathe"
  | "earth"
  | "window"
  | "gratitude"
  | "evening";

export interface MissionDef {
  id: MissionId;
  title: string;
  subtitle: string;
  icon: IconName;
  pillar: Pillar;
  xp: number;
  goal?: number; // for missions with progress
  unit?: string;
  step?: number;
}

export const MISSIONS: MissionDef[] = [
  { id: "checkin", title: "Morning check-in", subtitle: "Sleep, energy and mood", icon: "sunrise", pillar: "mind", xp: 20 },
  { id: "vitals", title: "Today's vitals", subtitle: "Sync blood pressure, glucose and SpO₂", icon: "stethoscope", pillar: "body", xp: 10 },
  { id: "hydration", title: "Hydration", subtitle: "2 liters today", icon: "glass-water", pillar: "body", xp: 15, goal: 2000, unit: "mL", step: 250 },
  { id: "exercise", title: "Workout", subtitle: "Treadmill, bike and ARED", icon: "dumbbell", pillar: "body", xp: 25, goal: 120, unit: "min", step: 30 },
  { id: "breathe", title: "Breathing break", subtitle: "1 minute guided by Catro", icon: "wind", pillar: "mind", xp: 15 },
  { id: "earth", title: "Call Earth", subtitle: "Talk with family or friends", icon: "earth", pillar: "spirit", xp: 15, goal: 15, unit: "min", step: 15 },
  { id: "window", title: "Look out the Cupola", subtitle: "5 min contemplating Earth", icon: "scan-eye", pillar: "spirit", xp: 10, goal: 5, unit: "min", step: 5 },
  { id: "gratitude", title: "Three gratitudes", subtitle: "Pick what made the day worth it", icon: "hand-heart", pillar: "spirit", xp: 10 },
  { id: "evening", title: "Evening check-in", subtitle: "Stress and purpose", icon: "moon-star", pillar: "spirit", xp: 15 },
];

export const mission = (id: MissionId) => MISSIONS.find((m) => m.id === id)!;

export const DAILY_GOAL_MISSIONS = 4; // missions needed to keep the streak

export interface TodayState {
  date: string; // YYYY-MM-DD
  done: Partial<Record<MissionId, boolean>>;
  progress: Partial<Record<MissionId, number>>;
  gratitude: string[];
}

export const GRATITUDE_OPTIONS = [
  "My family",
  "The view of Earth",
  "My crew",
  "A good workout",
  "A tasty meal",
  "An experiment that worked",
  "A good night's sleep",
  "A message from home",
  "Music",
  "Learning something new",
];

// Fictional XP and streak baseline so the demo starts mid-mission.
export const DEMO_BASE = { xp: 2340, streak: 12, weeklyXp: 410 };

export const LEVELS = [
  { name: "Cadet", min: 0 },
  { name: "Specialist", min: 800 },
  { name: "Flight engineer", min: 1800 },
  { name: "Commander", min: 3000 },
  { name: "Orbital legend", min: 5000 },
];

export function levelFor(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (xp - cur.min) / (next.min - cur.min) : 1;
  return { index: idx + 1, name: cur.name, next: next?.name, toNext: next ? next.min - xp : 0, progress };
}

export function todayXp(today: TodayState) {
  return MISSIONS.filter((m) => today.done[m.id]).reduce((s, m) => s + m.xp, 0);
}

export function doneCount(today: TodayState) {
  return MISSIONS.filter((m) => today.done[m.id]).length;
}

export function pillarProgress(today: TodayState): Record<Pillar, number> {
  const res = { body: 0, mind: 0, spirit: 0 } as Record<Pillar, number>;
  (["body", "mind", "spirit"] as Pillar[]).forEach((p) => {
    const ms = MISSIONS.filter((m) => m.pillar === p);
    res[p] = ms.filter((m) => today.done[m.id]).length / ms.length;
  });
  return res;
}

// Weekly crew league: habit XP only. No health data shows up here (spec, section 29).
export const CREW = [
  { callSign: "Vega", weeklyXp: 520 },
  { callSign: "Lyra", weeklyXp: 465 },
  { callSign: "Orion", weeklyXp: 380 },
  { callSign: "Altair", weeklyXp: 295 },
];

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  earned: boolean;
}

// `earned` = ids already won on previous days (persisted in the store): a badge does not vanish when the day rolls over.
export function badges(today: TodayState, streak: number, totalXp: number, earned: string[] = []): Badge[] {
  const list: Badge[] = [
    { id: "orbit", title: "First orbit", description: "Did the first check-in", icon: "orbit", earned: true },
    { id: "week", title: "Week in orbit", description: "7-day streak", icon: "flame", earned: streak >= 7 },
    { id: "fortnight", title: "Stellar fortnight", description: "15-day streak", icon: "sparkles", earned: streak >= 15 },
    { id: "water", title: "Hydrated in microgravity", description: "Hit 2 L in a day", icon: "glass-water", earned: !!today.done.hydration },
    { id: "ared", title: "ARED athlete", description: "2 h of workout in a day", icon: "dumbbell", earned: !!today.done.exercise },
    { id: "calm", title: "Calm mind", description: "Finished a breathing break", icon: "wind", earned: !!today.done.breathe },
    { id: "overview", title: "Overview effect", description: "Contemplated Earth from the Cupola", icon: "earth", earned: !!today.done.window },
    { id: "bridge", title: "Bridge to Earth", description: "Talked with loved ones", icon: "satellite-dish", earned: !!today.done.earth },
    { id: "full", title: "Full day", description: "Every mission in a day", icon: "trophy", earned: doneCount(today) === MISSIONS.length },
    { id: "commander", title: "Commander", description: "Reached 3,000 XP", icon: "medal", earned: totalXp >= 3000 },
  ];
  return list.map((b) => ({ ...b, earned: b.earned || earned.includes(b.id) }));
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  icon: IconName;
  current: number;
  goal: number;
  unit: string;
  crew?: boolean;
}

export function weeklyChallenges(observations: Observation[], today: TodayState, now: number): WeeklyChallenge[] {
  const weekAgo = now - 7 * 24 * 3600_000;
  // Today's totals come from the missions (today); derived "today-*" observations are left out so they are not counted twice.
  const inWeek = (o: Observation) =>
    !o.observationId.startsWith("today-") && Date.parse(o.observedAt) >= weekAgo && o.qualityState === "valid" && o.value !== null;
  const days = (list: Observation[]) => new Set(list.map((o) => new Date(o.observedAt).toDateString()));
  const of = (code: Observation["indicatorCode"], ok: (v: number) => boolean) =>
    observations.filter((o) => o.indicatorCode === code && inWeek(o) && ok(o.value as number));
  const todayKey = new Date(now).toDateString();
  const sleepNights = days(of("sleep_duration", (v) => v >= 7)).size;
  const waterSet = days(of("hydration", (v) => v >= 2));
  if (today.done.hydration) waterSet.add(todayKey);
  const pauseSet = days(of("contemplation", (v) => v > 0));
  if (today.done.breathe || today.done.window) pauseSet.add(todayKey);
  const myExercise = of("exercise", () => true).reduce((s, o) => s + (o.value ?? 0), 0) + (today.progress.exercise ?? 0);
  const waterDays = waterSet.size;
  const pauses = pauseSet.size;
  return [
    { id: "sleep", title: "Sleep 7 h or more on 5 nights", icon: "moon", current: sleepNights, goal: 5, unit: "nights" },
    { id: "water", title: "Hit the water goal on 5 days", icon: "glass-water", current: waterDays, goal: 5, unit: "days" },
    { id: "pause", title: "A pause for the mind on 7 days", icon: "flower", current: pauses, goal: 7, unit: "days" },
    { id: "crew", title: "Crew: 4,000 min of workout together", icon: "rocket", current: 2980 + myExercise, goal: 4000, unit: "min", crew: true },
  ];
}
