import type { Observation, Pillar } from "./types";
import type { IconName } from "./icons";

// Camada de jogo: recompensa hábitos (fazer o check-in, beber água, treinar, pausar),
// nunca o valor de um sinal vital. Ninguém ganha ou perde ponto por ter pressão alta.

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
  goal?: number; // para missões com progresso
  unit?: string;
  step?: number;
}

export const MISSIONS: MissionDef[] = [
  { id: "checkin", title: "Check-in matinal", subtitle: "Sono, energia e humor", icon: "sunrise", pillar: "mente", xp: 20 },
  { id: "vitals", title: "Sinais do dia", subtitle: "Sincronizar pressão, glicose e SpO₂", icon: "stethoscope", pillar: "corpo", xp: 10 },
  { id: "hydration", title: "Hidratação", subtitle: "2 litros no dia", icon: "glass-water", pillar: "corpo", xp: 15, goal: 2000, unit: "mL", step: 250 },
  { id: "exercise", title: "Treino", subtitle: "Esteira, bicicleta e ARED", icon: "dumbbell", pillar: "corpo", xp: 25, goal: 120, unit: "min", step: 30 },
  { id: "breathe", title: "Pausa de respiração", subtitle: "1 minuto guiado pelo Astrido", icon: "wind", pillar: "mente", xp: 15 },
  { id: "earth", title: "Ligar para a Terra", subtitle: "Conversa com família ou amigos", icon: "earth", pillar: "espirito", xp: 15, goal: 15, unit: "min", step: 15 },
  { id: "window", title: "Olhar pela Cúpula", subtitle: "5 min contemplando a Terra", icon: "scan-eye", pillar: "espirito", xp: 10, goal: 5, unit: "min", step: 5 },
  { id: "gratitude", title: "Três gratidões", subtitle: "Escolha o que valeu o dia", icon: "hand-heart", pillar: "espirito", xp: 10 },
  { id: "evening", title: "Check-in noturno", subtitle: "Estresse e propósito", icon: "moon-star", pillar: "espirito", xp: 15 },
];

export const mission = (id: MissionId) => MISSIONS.find((m) => m.id === id)!;

export const DAILY_GOAL_MISSIONS = 4; // missões para manter a ofensiva

export interface TodayState {
  date: string; // AAAA-MM-DD
  done: Partial<Record<MissionId, boolean>>;
  progress: Partial<Record<MissionId, number>>;
  gratitude: string[];
}

export const GRATITUDE_OPTIONS = [
  "Minha família",
  "A vista da Terra",
  "Minha equipe",
  "Um treino bom",
  "Uma refeição gostosa",
  "Um experimento que deu certo",
  "Uma boa noite de sono",
  "Uma mensagem de casa",
  "Música",
  "Aprender algo novo",
];

// Base fictícia de XP e ofensiva para a demo começar no meio da missão.
export const DEMO_BASE = { xp: 2340, streak: 12, weeklyXp: 410 };

export const LEVELS = [
  { name: "Cadete", min: 0 },
  { name: "Especialista", min: 800 },
  { name: "Engenheiro de voo", min: 1800 },
  { name: "Comandante", min: 3000 },
  { name: "Lenda orbital", min: 5000 },
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
  const res = { corpo: 0, mente: 0, espirito: 0 } as Record<Pillar, number>;
  (["corpo", "mente", "espirito"] as Pillar[]).forEach((p) => {
    const ms = MISSIONS.filter((m) => m.pillar === p);
    res[p] = ms.filter((m) => today.done[m.id]).length / ms.length;
  });
  return res;
}

// Liga semanal da tripulação: só XP de hábito. Nenhum dado de saúde aparece aqui (spec, seção 29).
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

// `earned` = ids já conquistados em dias anteriores (persistidos no store): conquista não some na virada do dia.
export function badges(today: TodayState, streak: number, totalXp: number, earned: string[] = []): Badge[] {
  const list: Badge[] = [
    { id: "orbit", title: "Primeira órbita", description: "Fez o primeiro check-in", icon: "orbit", earned: true },
    { id: "week", title: "Semana em órbita", description: "7 dias de ofensiva", icon: "flame", earned: streak >= 7 },
    { id: "fortnight", title: "Quinzena estelar", description: "15 dias de ofensiva", icon: "sparkles", earned: streak >= 15 },
    { id: "water", title: "Hidratado em microgravidade", description: "Bateu 2 L em um dia", icon: "glass-water", earned: !!today.done.hydration },
    { id: "ared", title: "Atleta da ARED", description: "2 h de treino em um dia", icon: "dumbbell", earned: !!today.done.exercise },
    { id: "calm", title: "Mente calma", description: "Concluiu uma pausa de respiração", icon: "wind", earned: !!today.done.breathe },
    { id: "overview", title: "Efeito Overview", description: "Contemplou a Terra pela Cúpula", icon: "earth", earned: !!today.done.window },
    { id: "bridge", title: "Ponte com a Terra", description: "Conversou com quem ama", icon: "satellite-dish", earned: !!today.done.earth },
    { id: "full", title: "Dia completo", description: "Todas as missões de um dia", icon: "trophy", earned: doneCount(today) === MISSIONS.length },
    { id: "commander", title: "Comandante", description: "Chegou a 3.000 XP", icon: "medal", earned: totalXp >= 3000 },
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
  // Os totais de hoje entram pelas missões (today); observações derivadas "today-*" ficam de fora para não contar em dobro.
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
    { id: "sleep", title: "Dormir 7 h ou mais em 5 noites", icon: "moon", current: sleepNights, goal: 5, unit: "noites" },
    { id: "water", title: "Bater a meta de água em 5 dias", icon: "glass-water", current: waterDays, goal: 5, unit: "dias" },
    { id: "pause", title: "Pausa para a mente em 7 dias", icon: "flower", current: pauses, goal: 7, unit: "dias" },
    { id: "crew", title: "Tripulação: 4.000 min de treino juntos", icon: "rocket", current: 2980 + myExercise, goal: 4000, unit: "min", crew: true },
  ];
}
