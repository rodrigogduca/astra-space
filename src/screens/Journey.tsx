import "./Journey.css";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, Flame, MoonStar, Orbit, Pointer, Sparkles, Star, Sunrise, Target, Trophy, X } from "lucide-react";
import { useStore } from "../store";
import { go, useShell } from "../components/Shell";
import { Catro, type CatroMood } from "../components/Catro";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { PLANET_COLOR, planetName, Planet } from "../components/Planet";
import { Bar } from "../components/ui";
import { MISSION } from "../domain/simulator";
import { catroSays, type CatroAction, type CatroLine } from "../domain/catro";
import {
  CREW,
  DAILY_GOAL_MISSIONS,
  DEMO_BASE,
  MISSIONS,
  doneCount,
  mission,
  pillarProgress,
  todayXp,
  type MissionDef,
  type MissionId,
  type TodayState,
} from "../domain/gamification";
import type { IconName } from "../domain/icons";
import type { Pillar } from "../domain/types";
import { locale, useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";

// REQ-3.1, 3.2, 3.4, 3.5, 4, 6.3, RV-13 and RV-14: the day in three stages.
// 1) Only the Aurora planet: the morning check-in opens the day.
// 2) The solar system appears: 7 free missions, in any order. The first tap selects the planet
//    and opens the mission panel; a second tap on the same planet runs the action.
// 3) With all 7 done (or from 6 pm on), the Serene planet brings the evening check-in, which closes the day.

const ROUTES: Partial<Record<MissionId, string>> = {
  checkin: "#/checkin",
  evening: "#/evening",
  breathe: "#/breathe",
  gratitude: "#/gratitude",
};

// Each pillar's name comes from useDomainText().pillar(id).
const PILLARS: { id: Pillar; icon: IconName }[] = [
  { id: "body", icon: "heart-pulse" },
  { id: "mind", icon: "brain" },
  { id: "spirit", icon: "sparkles" },
];
const pillarOf = (id: Pillar) => PILLARS.find((x) => x.id === id)!;

// Two orbits: the inner one is for the body; the outer one, for mind and spirit. Starting angle of each planet, in degrees.
const ORBITS: { id: "inner" | "outer"; planets: { id: MissionId; angle: number }[] }[] = [
  {
    id: "inner",
    planets: [
      { id: "vitals", angle: -60 },
      { id: "hydration", angle: 60 },
      { id: "exercise", angle: 180 },
    ],
  },
  {
    id: "outer",
    planets: [
      { id: "breathe", angle: 15 },
      { id: "earth", angle: 105 },
      { id: "window", angle: 195 },
      { id: "gratitude", angle: 285 },
    ],
  },
];
const FREE: MissionId[] = ORBITS.flatMap((o) => o.planets.map((p) => p.id));
const EVENING_HOUR = 18;

const fmt = (n: number) => n.toLocaleString(locale());

const T = {
  pt: {
    ofGoal: (v: string, goal: string, unit?: string) => `${v} de ${goal} ${unit}`,
    done: "feita",
    todo: "a fazer",
    seeAgain: { label: "Ver de novo", verb: "ver de novo" },
    doIt: { label: "Fazer", verb: "começar" },
    sync: { label: "Sincronizar", verb: "sincronizar" },
    finishStep: (step: string, unit?: string) => ({ label: `Concluir (+${step} ${unit})`, verb: "concluir" }),
    addStep: (step: string, unit?: string) => ({ label: `+${step} ${unit}`, verb: `somar ${step} ${unit}` }),
    finish: { label: "Concluir", verb: "concluir" },
    greet: (hour: number): string => (hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"),
    sayStart: (greet: string) => `${greet}! Vamos começar pelo check-in?`,
    sayFirst: "Check-in feito! Escolha qualquer planeta: um toque mostra a missão, outro toque faz.",
    sayProgress: (n: number, total: number) => `Mandou bem! ${n} de ${total} missões livres. Qual é a próxima?`,
    sayClosed: (call: string) => `Dia fechado. Bom descanso, ${call}.`,
    sayAllFree: "Você visitou os 7 planetas! Falta só o check-in noturno para fechar o dia.",
    sayNight: "Já é noite a bordo. Que tal fechar o dia com o check-in noturno?",
    bandAlt: "Nascer do sol visto da Estação Espacial: a linha fina e brilhante da atmosfera sobre a curva escura da Terra",
    credit: "Foto: NASA",
    missionsCount: (n: number, total: number) => `${n} de ${total} missões`,
    xpToday: (xp: number) => `+${xp} XP hoje`,
    streakDays: (n: number) => `${n} dias`,
    missionDay: (d: number) => `Dia ${d} da missão`,
    todayMissions: "Missões de hoje",
    teaserCount: (n: number) => `${n} missões`,
    teaserRest: " te esperam depois do check-in",
    freeMissions: "Missões livres",
    stillTime: "Ainda dá tempo",
    ofTotal: (n: number, total: number) => `${n} de ${total}`,
    anyOrder: "em qualquer ordem",
    tapHint: "Toque num planeta para ver a missão.",
    listAll: "Ver todas as missões em lista",
    board: "Painel de bordo",
    morning: "Manhã",
    missionsStep: (n: number, total: number) => `Missões ${n}/${total}`,
    night: "Noite",
    dayStages: "Etapas do dia",
    stepDone: ", feita",
    stepNow: ", agora",
    stepLater: ", depois",
    planet: (name: string) => `Planeta ${name}`,
    morningBtn: "Fazer check-in matinal",
    eveningBtn: "Fazer check-in noturno",
    routeDone: "Rota completa",
    eveningDone: "Check-in noturno feito",
    fullDay: "Dia completo",
    dayClosed: "Dia fechado",
    visited: (n: number, total: number, xp: number) => `${n} de ${total} planetas visitados · +${xp} XP`,
    todayPlanets: "Planetas de hoje",
    solarLabel: (n: number, total: number) => `Missões livres, em qualquer ordem: ${n} de ${total} feitas`,
    tapAgainTo: (verb: string) => `Toque de novo para ${verb}.`,
    doneToday: "Feita hoje.",
    tapToSee: "Toque para ver a missão.",
    tapAgain: "Toque de novo",
    closePanel: "Fechar painel da missão",
    doneTodayShort: "Feita hoje",
    orTapAgain: "ou toque de novo no planeta",
    goals: "Metas por pilar",
    streakTitle: (n: number) => `${n} dias de ofensiva`,
    streakWeek: "Ofensiva nos últimos 7 dias",
    today: "hoje",
    streakLit: "ofensiva feita",
    streakNot: "ainda não",
    streakSafe: "Ofensiva de hoje garantida.",
    streakMissing: (n: number) => `Faltam ${n} missões para manter.`,
    league: "Liga da semana",
    challenges: "Desafios",
    you: " (você)",
    leagueNote: "Só XP de hábitos; nenhum dado de saúde é compartilhado.",
    catro: "Catro, o gato cuidador espacial do Astra",
  },
  en: {
    ofGoal: (v: string, goal: string, unit?: string) => `${v} of ${goal} ${unit}`,
    done: "done",
    todo: "to do",
    seeAgain: { label: "See again", verb: "see it again" },
    doIt: { label: "Start", verb: "start" },
    sync: { label: "Sync", verb: "sync" },
    finishStep: (step: string, unit?: string) => ({ label: `Finish (+${step} ${unit})`, verb: "finish" }),
    addStep: (step: string, unit?: string) => ({ label: `+${step} ${unit}`, verb: `add ${step} ${unit}` }),
    finish: { label: "Finish", verb: "finish" },
    greet: (hour: number): string => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"),
    sayStart: (greet: string) => `${greet}! Shall we start with the check-in?`,
    sayFirst: "Check-in done! Pick any planet: one tap shows the mission, a second tap does it.",
    sayProgress: (n: number, total: number) => `Nice one! ${n} of ${total} free missions. What's next?`,
    sayClosed: (call: string) => `Day wrapped up. Rest well, ${call}.`,
    sayAllFree: "You visited all 7 planets! Just the evening check-in left to close the day.",
    sayNight: "It's evening on board. How about closing the day with the evening check-in?",
    bandAlt: "Sunrise seen from the Space Station: the thin, bright line of the atmosphere over Earth's dark curve",
    credit: "Photo: NASA",
    missionsCount: (n: number, total: number) => `${n} of ${total} missions`,
    xpToday: (xp: number) => `+${xp} XP today`,
    streakDays: (n: number) => `${n} days`,
    missionDay: (d: number) => `Mission day ${d}`,
    todayMissions: "Today's missions",
    teaserCount: (n: number) => `${n} missions`,
    teaserRest: " are waiting after the check-in",
    freeMissions: "Free missions",
    stillTime: "There's still time",
    ofTotal: (n: number, total: number) => `${n} of ${total}`,
    anyOrder: "in any order",
    tapHint: "Tap a planet to see its mission.",
    listAll: "See all missions as a list",
    board: "Flight deck",
    morning: "Morning",
    missionsStep: (n: number, total: number) => `Missions ${n}/${total}`,
    night: "Evening",
    dayStages: "Stages of the day",
    stepDone: ", done",
    stepNow: ", now",
    stepLater: ", later",
    planet: (name: string) => `Planet ${name}`,
    morningBtn: "Start morning check-in",
    eveningBtn: "Start evening check-in",
    routeDone: "Route complete",
    eveningDone: "Evening check-in done",
    fullDay: "Full day",
    dayClosed: "Day wrapped up",
    visited: (n: number, total: number, xp: number) => `${n} of ${total} planets visited · +${xp} XP`,
    todayPlanets: "Today's planets",
    solarLabel: (n: number, total: number) => `Free missions, in any order: ${n} of ${total} done`,
    tapAgainTo: (verb: string) => `Tap again to ${verb}.`,
    doneToday: "Done today.",
    tapToSee: "Tap to see the mission.",
    tapAgain: "Tap again",
    closePanel: "Close mission panel",
    doneTodayShort: "Done today",
    orTapAgain: "or tap the planet again",
    goals: "Goals by pillar",
    streakTitle: (n: number) => `${n}-day streak`,
    streakWeek: "Streak over the last 7 days",
    today: "today",
    streakLit: "streak kept",
    streakNot: "not yet",
    streakSafe: "Today's streak is secured.",
    streakMissing: (n: number) => `${n} more missions to keep it.`,
    league: "Weekly league",
    challenges: "Challenges",
    you: " (you)",
    leagueNote: "Habit XP only; no health data is shared.",
    catro: "Catro, Astra's space care cat",
  },
};
type Txt = typeof T.pt;

function progressOf(m: MissionDef, today: TodayState, t: Txt) {
  if (!m.goal) return null;
  const v = today.done[m.id] ? m.goal : Math.min(today.progress[m.id] ?? 0, m.goal);
  return { value: v, ratio: v / m.goal, text: t.ofGoal(fmt(v), fmt(m.goal), m.unit) };
}

function statusText(m: MissionDef, today: TodayState, t: Txt) {
  if (today.done[m.id]) return t.done;
  const p = progressOf(m, today, t);
  return p && p.value > 0 ? p.text : t.todo;
}

// Mission button label and the verb for the "tap again to ..." hint.
function actionOf(m: MissionDef, today: TodayState, t: Txt): { label: string; verb: string } | null {
  if (today.done[m.id]) return ROUTES[m.id] ? t.seeAgain : null;
  if (ROUTES[m.id]) return t.doIt;
  if (m.id === "vitals") return t.sync;
  if (m.goal && m.step) {
    const left = m.goal - (today.progress[m.id] ?? 0);
    if (left <= m.step) return t.finishStep(fmt(m.step), m.unit);
    return t.addStep(fmt(m.step), m.unit);
  }
  return t.finish;
}

type Stage = 1 | 2 | 3;

export function Journey() {
  const { state, dispatch, byCode, streak, streakSafeToday, supportEvent } = useStore();
  const { openSupport } = useShell();
  const { today } = state;
  const [selected, setSelected] = useState<MissionId | null>(null);
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();

  const hour = new Date().getHours();
  const line = catroSays({
    today,
    sleep: byCode("sleep_duration"),
    online: state.online,
    support: supportEvent?.state,
    hour,
    lang,
  });
  const runAction = (a: CatroAction) => {
    if (a.support) openSupport();
    else if (a.to) go(a.to);
  };

  const done = doneCount(today);
  const freeDone = FREE.filter((id) => today.done[id]).length;
  const freeAll = freeDone === FREE.length;
  const greet = t.greet(hour);
  const stage: Stage = !today.done.checkin ? 1 : !today.done.evening && !freeAll && hour < EVENING_HOUR ? 2 : 3;
  const dayClosed = stage === 3 && !!today.done.evening;

  const act = (m: MissionDef) => {
    const route = ROUTES[m.id];
    if (route) return go(route);
    if (today.done[m.id]) return;
    if (m.id === "vitals") return dispatch({ type: "syncSensors" });
    if (m.goal) dispatch({ type: "progress", id: m.id });
  };

  // First tap selects; a second tap on the same planet runs it.
  const tapPlanet = (id: MissionId) => {
    if (selected === id) act(mission(id));
    else setSelected(id);
  };

  // Catro's line: care messages (sleep, support, link, full day) take priority;
  // in the normal flow, one short sentence per stage.
  const special = line.mood === "thinking" || line.mood === "calm" || line.mood === "excited";
  const heroRoute = stage === 1 ? ROUTES.checkin : stage === 3 && !dayClosed ? ROUTES.evening : undefined;
  const speech: CatroLine = special
    ? { ...line, actions: line.actions.filter((a) => a.to !== heroRoute) }
    : {
        mood: line.mood,
        actions: [],
        text:
          stage === 1
            ? t.sayStart(greet)
            : stage === 2
              ? freeDone === 0
                ? t.sayFirst
                : t.sayProgress(freeDone, FREE.length)
              : dayClosed
                ? t.sayClosed(MISSION.callSign)
                : freeAll
                  ? t.sayAllFree
                  : t.sayNight,
      };
  const mood: CatroMood = done === MISSIONS.length ? "excited" : speech.mood;
  const say = <Say line={speech} mood={mood} onAction={runAction} />;

  return (
    <div className="page journey">
      <section className="photo-band journey__band" aria-labelledby="journey-title">
        <img
          src={PHOTO.limb}
          alt={t.bandAlt}
          fetchPriority="high"
          decoding="async"
        />
        <span className="photo-band__credit">{t.credit}</span>
        <div className="photo-band__body journey__band-body">
          <h1 id="journey-title">
            {greet}, {MISSION.callSign}.
          </h1>
          <div className="journey__status">
            <span className="journey__count num">
              <Orbit size={18} strokeWidth={2.4} aria-hidden /> {t.missionsCount(done, MISSIONS.length)}
            </span>
            <span className="journey__band-bar" aria-hidden>
              <Bar value={done / MISSIONS.length} color="#B9A9FF" height={6} />
            </span>
            <span className="journey__chips">
              <span className="journey__chip journey__chip--xp num">
                <Sparkles size={16} strokeWidth={2.4} aria-hidden /> {t.xpToday(todayXp(today))}
              </span>
              <span className="journey__chip journey__chip--streak num">
                <Flame size={16} strokeWidth={2.4} aria-hidden /> {t.streakDays(streak)}
              </span>
              <span className="journey__day num">{t.missionDay(MISSION.day)}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="day" aria-label={t.todayMissions}>
        <DayPath stage={stage} today={today} freeDone={freeDone} />

        {stage === 1 && (
          <>
            <Hero m={mission("checkin")} act={act} say={say} />
            <div className="teaser">
              <span className="teaser__planets" aria-hidden>
                {FREE.map((id) => (
                  <Planet key={id} mission={id} state="next" size={40} />
                ))}
              </span>
              <span className="teaser__text">
                <b className="num">{t.teaserCount(FREE.length)}</b>
                {t.teaserRest}
              </span>
            </div>
          </>
        )}

        {stage === 3 &&
          (dayClosed ? <Closing today={today} say={say} allDone={done === MISSIONS.length} /> : <Hero m={mission("evening")} act={act} say={say} />)}

        {(stage === 2 || (stage === 3 && !freeAll && !dayClosed)) && (
          <section className={`orbit ${stage === 2 ? "orbit--main" : "orbit--late"}`} aria-labelledby="orbit-title">
            <div className="orbit__head">
              <h2 id="orbit-title">{stage === 2 ? t.freeMissions : t.stillTime}</h2>
              <span className="orbit__count num">
                <Orbit size={16} strokeWidth={2.4} aria-hidden /> {t.ofTotal(freeDone, FREE.length)}
              </span>
              <span className="muted small">{t.anyOrder}</span>
            </div>
            <div className="orbit__grid">
              {stage === 2 && <div className="orbit__say">{say}</div>}
              <SolarSystem today={today} selected={selected} onTap={tapPlanet} freeDone={freeDone} />
              <div className="orbit__panel" id="mission-panel">
                {selected ? (
                  <MissionPanel key={selected} m={mission(selected)} today={today} act={act} onClose={() => setSelected(null)} />
                ) : (
                  <p className="orbit__hint">
                    <Pointer size={18} strokeWidth={2.2} aria-hidden /> {t.tapHint}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <details className="day__list">
          <summary>{t.listAll}</summary>
          <ul>
            {MISSIONS.map((m) => {
              const isDone = !!today.done[m.id];
              const a = actionOf(m, today, t);
              const title = dt.mission(m.id).title;
              return (
                <li key={m.id} className={isDone ? "is-done" : ""}>
                  <Planet mission={m.id} state={isDone ? "done" : "next"} size={40} />
                  <span className="day__list-name">
                    {title}
                    <span className="muted"> · {statusText(m, today, t)}</span>
                  </span>
                  {a ? (
                    <button type="button" className="btn btn--sm" onClick={() => act(m)} aria-label={`${a.label}: ${title}`}>
                      {a.label}
                    </button>
                  ) : (
                    <Check size={18} strokeWidth={3} className="day__list-check" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      <section className="panel board" aria-labelledby="board-title">
        <h2 id="board-title">{t.board}</h2>
        <div className="board__grid">
          <Goals today={today} />
          <StreakBox streak={streak} safe={streakSafeToday} done={done} />
          <League today={today} />
        </div>
      </section>
    </div>
  );
}

// Catro with the speech bubble: the bubble's tail points at him (the same block in all three stages).
function Say({ line, mood, onAction }: { line: CatroLine; mood: CatroMood; onAction: (a: CatroAction) => void }) {
  const t = useLang().pick(T);
  return (
    <div className="speech jsay">
      <Catro mood={mood} size={128} className="jsay__catro" title={t.catro} />
      <div className="speech__bubble jsay__bubble">
        <p aria-live="polite">{line.text}</p>
        {line.actions.length > 0 && (
          <div className="jsay__actions">
            {line.actions.slice(0, 3).map((a) => (
              <button key={a.label} type="button" className={`btn btn--sm ${a.primary ? "btn--primary" : "btn--ghost"}`} onClick={() => onAction(a)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Day route: morning, free missions and evening, with the current stage highlighted.
function DayPath({ stage, today, freeDone }: { stage: Stage; today: TodayState; freeDone: number }) {
  const t = useLang().pick(T);
  const steps = [
    { key: "m", label: t.morning, Ico: Sunrise, done: !!today.done.checkin, on: stage === 1 },
    { key: "f", label: t.missionsStep(freeDone, FREE.length), Ico: Orbit, done: freeDone === FREE.length, on: stage === 2 },
    { key: "n", label: t.night, Ico: MoonStar, done: !!today.done.evening, on: stage === 3 && !today.done.evening },
  ];
  return (
    <ol className="daypath" aria-label={t.dayStages}>
      {steps.map(({ key, label, Ico, done, on }) => (
        <li key={key} className={`daypath__step ${done ? "is-done" : ""} ${on ? "is-on" : ""}`} aria-current={on ? "step" : undefined}>
          <span className="daypath__dot" aria-hidden>
            {done ? <Check size={15} strokeWidth={3.2} /> : <Ico size={15} strokeWidth={2.4} />}
          </span>
          <span className="daypath__label num">{label}</span>
          <span className="visually-hidden">{done ? t.stepDone : on ? t.stepNow : t.stepLater}</span>
        </li>
      ))}
    </ol>
  );
}

// Opening (Aurora) and closing (Serene) of the day: a large planet, the mission and Catro speaking.
function Hero({ m, act, say }: { m: MissionDef; act: (m: MissionDef) => void; say: ReactNode }) {
  const morning = m.id === "checkin";
  const { lang, pick } = useLang();
  const t = pick(T);
  const mt = useDomainText().mission(m.id);
  return (
    <section className={`hero hero--${morning ? "morning" : "evening"}`} aria-labelledby="hero-title">
      <div className="hero__planet">
        <Planet mission={m.id} state="next" size={300} />
      </div>
      <div className="hero__main">
        <span className="hero__name">
          {morning ? <Sunrise size={16} strokeWidth={2.4} aria-hidden /> : <MoonStar size={16} strokeWidth={2.4} aria-hidden />}{" "}
          {t.planet(planetName(m.id, lang))}
        </span>
        <h2 id="hero-title">{mt.title}</h2>
        <p className="hero__sub">{mt.subtitle}</p>
        <span className="xp-chip num">
          <Sparkles size={15} strokeWidth={2.4} aria-hidden /> +{m.xp} XP
        </span>
        <button type="button" className="btn btn--primary hero__btn" onClick={() => act(m)}>
          {morning ? t.morningBtn : t.eveningBtn}
        </button>
      </div>
      <div className="hero__say">{say}</div>
    </section>
  );
}

// Day closed: the whole route with little flags and Catro celebrating.
function Closing({ today, say, allDone }: { today: TodayState; say: ReactNode; allDone: boolean }) {
  const t = useLang().pick(T);
  const dt = useDomainText();
  return (
    <section className="hero hero--closed" aria-labelledby="hero-title">
      <div className="hero__main">
        <span className="hero__name">
          <Trophy size={16} strokeWidth={2.4} aria-hidden /> {allDone ? t.routeDone : t.eveningDone}
        </span>
        <h2 id="hero-title">{allDone ? t.fullDay : t.dayClosed}</h2>
        <p className="hero__sub num">
          {t.visited(doneCount(today), MISSIONS.length, todayXp(today))}
        </p>
        <ul className="route" aria-label={t.todayPlanets}>
          {MISSIONS.map((m, i) => (
            <li key={m.id} className={today.done[m.id] ? "" : "is-faded"} style={{ "--i": i } as CSSProperties}>
              <Planet mission={m.id} state={today.done[m.id] ? "done" : "next"} size={56} />
              <span className="visually-hidden">
                {dt.mission(m.id).title}: {today.done[m.id] ? t.done : t.todo}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="hero__say">{say}</div>
    </section>
  );
}

function SolarSystem({
  today,
  selected,
  onTap,
  freeDone,
}: {
  today: TodayState;
  selected: MissionId | null;
  onTap: (id: MissionId) => void;
  freeDone: number;
}) {
  const t = useLang().pick(T);
  const dt = useDomainText();
  let order = 0;
  return (
    <div className="solar" role="group" aria-label={t.solarLabel(freeDone, FREE.length)}>
      <svg className="solar__rings" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="23" />
        <circle cx="50" cy="50" r="39" />
      </svg>
      {/* the system's sun: progress of the free missions */}
      <div className="solar__sun" aria-hidden>
        <span className="solar__sun-glow" />
        <span className="solar__sun-glow solar__sun-glow--2" />
        <svg className="solar__sun-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" className="solar__sun-track" />
          {freeDone > 0 && (
            <circle
              cx="50"
              cy="50"
              r="44"
              className="solar__sun-arc"
              pathLength={100}
              strokeDasharray={`${(freeDone / FREE.length) * 100} 100`}
              transform="rotate(-90 50 50)"
            />
          )}
        </svg>
        <span className="solar__sun-num num">
          {freeDone}
          <small>/{FREE.length}</small>
        </span>
      </div>
      {ORBITS.map((o) => (
        <div key={o.id} className={`solar__track solar__track--${o.id}`}>
          {o.planets.map(({ id, angle }) => {
            const m = mission(id);
            const isDone = !!today.done[id];
            const p = progressOf(m, today, t);
            const isSel = selected === id;
            const a = actionOf(m, today, t);
            const i = order++;
            const title = dt.mission(id).title;
            const label = isSel
              ? `${title}, ${statusText(m, today, t)}. ${a ? t.tapAgainTo(a.verb) : t.doneToday}`
              : `${title}, ${statusText(m, today, t)}. ${t.tapToSee}`;
            return (
              <div key={id} className="solar__slot" style={{ "--a": `${angle}deg` } as CSSProperties}>
                <button
                  type="button"
                  className={`solar__planet ${isDone ? "is-done" : ""} ${isSel ? "is-selected" : ""}`}
                  aria-label={label}
                  aria-expanded={isSel}
                  aria-controls="mission-panel"
                  onClick={() => onTap(id)}
                >
                  <span className="solar__spin">
                    <span className="solar__pop" style={{ "--i": i } as CSSProperties}>
                      <Planet mission={id} state={isDone ? "done" : "next"} size={96} />
                      <svg className="solar__marks" viewBox="0 0 160 160" aria-hidden>
                        {p && !isDone && (
                          <>
                            <circle cx="80" cy="86" r="61" className="solar__arc-track" />
                            <circle
                              cx="80"
                              cy="86"
                              r="61"
                              className="solar__arc"
                              stroke={PLANET_COLOR[id].hi}
                              pathLength={100}
                              strokeDasharray={`${p.ratio * 100} 100`}
                              transform="rotate(-90 80 86)"
                            />
                          </>
                        )}
                        {isSel && <circle cx="80" cy="86" r="70" className="solar__halo" />}
                      </svg>
                      <span className={`solar__badge ${isDone ? "is-done" : ""}`} aria-hidden>
                        {isDone ? <Check size={13} strokeWidth={3.2} /> : <Icon name={m.icon} size={13} />}
                      </span>
                      {isSel && a && (
                        <span className="solar__tip" aria-hidden>
                          {t.tapAgain}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Selected mission panel: slides open next to the solar system.
function MissionPanel({ m, today, act, onClose }: { m: MissionDef; today: TodayState; act: (m: MissionDef) => void; onClose: () => void }) {
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();
  const mt = dt.mission(m.id);
  const isDone = !!today.done[m.id];
  const p = progressOf(m, today, t);
  const a = actionOf(m, today, t);
  const pl = pillarOf(m.pillar);
  return (
    <section className="mpanel" aria-labelledby="mpanel-title" style={{ "--planet": PLANET_COLOR[m.id].base } as CSSProperties}>
      <div className="mpanel__head">
        <Planet mission={m.id} state={isDone ? "done" : "next"} size={68} className="mpanel__planet" />
        <div className="mpanel__title">
          <span className="mpanel__name">{t.planet(planetName(m.id, lang))}</span>
          <h3 id="mpanel-title">{mt.title}</h3>
        </div>
        <button type="button" className="icon-btn mpanel__close" onClick={onClose} aria-label={t.closePanel}>
          <X size={18} strokeWidth={2.4} />
        </button>
      </div>
      <p className="mpanel__sub">{mt.subtitle}</p>
      <div className="mpanel__meta">
        <span className="xp-chip num">
          <Sparkles size={15} strokeWidth={2.4} aria-hidden /> +{m.xp} XP
        </span>
        <span className={`mpanel__pillar tone--${m.pillar}`}>
          <Icon name={pl.icon} size={15} /> {dt.pillar(pl.id)}
        </span>
      </div>
      {p && (
        <div className="mpanel__progress">
          <Bar value={p.ratio} color={PLANET_COLOR[m.id].hi} height={8} />
          <span className="small num muted">{p.text}</span>
        </div>
      )}
      <div className="mpanel__actions">
        {a && (
          <button type="button" className={`btn ${isDone ? "" : "btn--primary"}`} onClick={() => act(m)}>
            {a.label}
          </button>
        )}
        {isDone && (
          <span className="mpanel__done">
            <Check size={18} strokeWidth={3} aria-hidden /> {t.doneTodayShort}
          </span>
        )}
        {a && !isDone && (
          <span className="mpanel__tip small">
            <Pointer size={15} strokeWidth={2.2} aria-hidden /> {t.orTapAgain}
          </span>
        )}
      </div>
    </section>
  );
}

// Goal ring per pillar, built here so the icon sits in the exact center of the circle.
function PillarRing({ value, pillar, icon }: { value: number; pillar: Pillar; icon: IconName }) {
  return (
    <span className={`pring tone--${pillar}`} aria-hidden>
      <svg viewBox="0 0 72 72" className="pring__svg">
        <circle cx="36" cy="36" r="31" className="pring__track" />
        {value > 0 && (
          <circle cx="36" cy="36" r="31" className="pring__arc" pathLength={100} strokeDasharray={`${value * 100} 100`} transform="rotate(-90 36 36)" />
        )}
      </svg>
      <span className="pring__icon">
        <Icon name={icon} size={24} />
      </span>
    </span>
  );
}

function Goals({ today }: { today: TodayState }) {
  const p = pillarProgress(today);
  const t = useLang().pick(T);
  const dt = useDomainText();
  return (
    <section className="board__section" aria-labelledby="goals-title">
      <h3 id="goals-title" className="board__h">
        <Target size={18} strokeWidth={2.4} className="tone--mind" aria-hidden /> {t.goals}
      </h3>
      <ul className="goals">
        {PILLARS.map((pl) => {
          const total = MISSIONS.filter((m) => m.pillar === pl.id).length;
          const doneHere = MISSIONS.filter((m) => m.pillar === pl.id && today.done[m.id]).length;
          return (
            <li key={pl.id} className="goals__item">
              <PillarRing value={p[pl.id]} pillar={pl.id} icon={pl.icon} />
              <b>{dt.pillar(pl.id)}</b>
              <span className="muted small num">
                {t.ofTotal(doneHere, total)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StreakBox({ streak, safe, done }: { streak: number; safe: boolean; done: number }) {
  const t = useLang().pick(T);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "").slice(0, 3);
    const isToday = i === 6;
    return { key: i, label, isToday, lit: isToday ? safe : true };
  });
  const missing = Math.max(0, DAILY_GOAL_MISSIONS - done);
  return (
    <section className="board__section" aria-labelledby="streak-title">
      <h3 id="streak-title" className="board__h num">
        <Flame size={20} strokeWidth={2.4} className="streak-ink" aria-hidden /> {t.streakTitle(streak)}
      </h3>
      <ul className="streak__week" aria-label={t.streakWeek}>
        {days.map((d) => (
          <li key={d.key} className={`streak__day ${d.lit ? "is-lit" : ""} ${d.isToday ? "is-today" : ""}`} style={{ "--i": d.key } as CSSProperties}>
            <span className="streak__dot" aria-hidden>
              {d.lit && <Flame size={15} strokeWidth={2.4} />}
            </span>
            <span className="streak__label">{d.isToday ? t.today : d.label}</span>
            <span className="visually-hidden">{d.lit ? t.streakLit : t.streakNot}</span>
          </li>
        ))}
      </ul>
      <p className="muted">{safe ? t.streakSafe : t.streakMissing(missing)}</p>
    </section>
  );
}

function League({ today }: { today: TodayState }) {
  const t = useLang().pick(T);
  const me = { callSign: MISSION.callSign, weeklyXp: DEMO_BASE.weeklyXp + todayXp(today), me: true };
  const all = [...CREW.map((c) => ({ ...c, me: false })), me].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const myPos = all.findIndex((r) => r.me);
  const rows = all.slice(0, 3).map((r, i) => ({ ...r, pos: i + 1 }));
  if (myPos >= 3) rows.push({ ...me, pos: myPos + 1 });
  return (
    <section className="board__section" aria-labelledby="league-title">
      <div className="league__head">
        <h3 id="league-title" className="board__h">
          <Trophy size={18} strokeWidth={2.4} className="xp-ink" aria-hidden /> {t.league}
        </h3>
        <a href="#/challenges" className="btn btn--quiet btn--sm">
          {t.challenges}
        </a>
      </div>
      <ol className="league">
        {rows.map((r) => (
          <li key={r.callSign} className={`league__row ${r.me ? "is-me" : ""}`} value={r.pos}>
            <span className="league__pos num">{r.pos}</span>
            <span className="league__name">
              {r.callSign}
              {r.me && t.you}
            </span>
            <b className="league__xp num">
              <Star size={14} strokeWidth={2.4} className="xp-ink" aria-hidden /> {r.weeklyXp} XP
            </b>
          </li>
        ))}
      </ol>
      <p className="muted">{t.leagueNote}</p>
    </section>
  );
}
