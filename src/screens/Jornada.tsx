import "./Jornada.css";
import { useState, type CSSProperties } from "react";
import { Check, Flame } from "lucide-react";
import { useStore } from "../store";
import { go, useShell } from "../components/Shell";
import { Astrido, type AstridoMood } from "../components/Astrido";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { Planet } from "../components/Planet";
import { Bar, Ring } from "../components/ui";
import { MISSION } from "../domain/simulator";
import { astridoSays, type AstridoAction } from "../domain/astrido";
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

// REQ-3.1, 3.2, 3.4, 3.5, 4, 6.3, RV-13 e RV-14: o dia em três partes.
// O check-in matinal abre o dia, as 7 missões livres giram em volta do Astrido (sistema solar, qualquer ordem)
// e o check-in noturno fecha o dia.

const ROUTES: Partial<Record<MissionId, string>> = {
  checkin: "#/checkin",
  evening: "#/noturno",
  breathe: "#/respirar",
  gratitude: "#/gratidao",
};

const PILLARS: { id: Pillar; label: string; color: string; icon: IconName }[] = [
  { id: "corpo", label: "Corpo", color: "var(--corpo)", icon: "heart-pulse" },
  { id: "mente", label: "Mente", color: "var(--mente)", icon: "brain" },
  { id: "espirito", label: "Espírito", color: "var(--espirito)", icon: "sparkles" },
];

// Duas órbitas: a de dentro é do corpo; a de fora, de mente e espírito. Ângulo inicial de cada planeta, em graus.
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

const fmt = (n: number) => n.toLocaleString("pt-BR");

function progressOf(m: MissionDef, today: TodayState) {
  if (!m.goal) return null;
  const v = today.done[m.id] ? m.goal : Math.min(today.progress[m.id] ?? 0, m.goal);
  return { value: v, ratio: v / m.goal, text: `${fmt(v)} de ${fmt(m.goal)} ${m.unit}` };
}

function statusText(m: MissionDef, today: TodayState) {
  if (today.done[m.id]) return "feita";
  const p = progressOf(m, today);
  return p && p.value > 0 ? p.text : "a fazer";
}

function actionLabel(m: MissionDef, done: boolean) {
  if (done) return ROUTES[m.id] ? "Ver de novo" : null;
  if (m.id === "vitals") return "Sincronizar";
  if (m.goal) return `Somar ${m.step} ${m.unit}`;
  return "Começar";
}

export function Jornada() {
  const { state, dispatch, byCode, streak, streakSafeToday, supportEvent } = useStore();
  const { openSupport } = useShell();
  const { today } = state;
  const [selected, setSelected] = useState<MissionId>(() => FREE.find((id) => !today.done[id]) ?? FREE[0]);

  const line = astridoSays({
    today,
    sleep: byCode("sleep_duration"),
    online: state.online,
    support: supportEvent?.state,
    hour: new Date().getHours(),
  });
  const runAction = (a: AstridoAction) => {
    if (a.support) openSupport();
    else if (a.to) go(a.to);
  };

  const done = doneCount(today);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const act = (m: MissionDef) => {
    const route = ROUTES[m.id];
    if (route) return go(route);
    if (today.done[m.id]) return;
    if (m.id === "vitals") return dispatch({ type: "syncSensors" });
    if (m.goal) dispatch({ type: "progress", id: m.id });
  };

  return (
    <div className="page jornada">
      <section className="photo-band jornada__band" aria-labelledby="jornada-title">
        <img
          src={PHOTO.limb}
          alt="Nascer do sol visto da Estação Espacial: a linha fina e brilhante da atmosfera sobre a curva escura da Terra"
          fetchPriority="high"
          decoding="async"
        />
        <span className="photo-band__credit">Foto: NASA</span>
        <div className="photo-band__body jornada__band-body">
          <h1 id="jornada-title">
            {greet}, {MISSION.callSign}.
          </h1>
          <div className="jornada__status">
            <span className="jornada__count num">
              {done} de {MISSIONS.length} missões hoje
            </span>
            <span className="jornada__band-bar" aria-hidden>
              <Bar value={done / MISSIONS.length} color="var(--accent)" height={6} />
            </span>
            <span className="jornada__day num">Dia {MISSION.day} da missão</span>
          </div>
        </div>
      </section>

      <section className="day" aria-label="Missões de hoje">
        <Edge m={mission("checkin")} today={today} act={act} />

        <div className="day__orbit">
          <SolarSystem today={today} selected={selected} onSelect={setSelected} act={act} mood={line.mood} />

          <div className="day__side">
            <div className="say">
              <p aria-live="polite">{line.text}</p>
              {line.actions.length > 0 && (
                <div className="say__actions">
                  {line.actions.slice(0, 2).map((a) => (
                    <button key={a.label} type="button" className={`btn btn--sm ${a.primary ? "btn--primary" : ""}`} onClick={() => runAction(a)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Focus m={mission(selected)} today={today} act={act} />
          </div>
        </div>

        <Edge m={mission("evening")} today={today} act={act} />

        <details className="day__list">
          <summary>Ver todas as missões em lista</summary>
          <ul>
            {MISSIONS.map((m) => {
              const isDone = !!today.done[m.id];
              const label = actionLabel(m, isDone);
              return (
                <li key={m.id} className={isDone ? "is-done" : ""}>
                  <Icon name={m.icon} size={20} className={`tone--${m.pillar}`} />
                  <span className="day__list-name">
                    {m.title}
                    <span className="muted"> · {statusText(m, today)}</span>
                  </span>
                  {label ? (
                    <button type="button" className="btn btn--sm" onClick={() => act(m)} aria-label={`${label}: ${m.title}`}>
                      {label}
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
        <h2 id="board-title">Painel de bordo</h2>
        <div className="board__grid">
          <Goals today={today} />
          <Streak streak={streak} safe={streakSafeToday} done={done} />
          <League today={today} />
        </div>
      </section>
    </div>
  );
}

// Abertura e fechamento do dia: faixa compacta com o planeta, o título, uma linha e a ação.
function Edge({ m, today, act }: { m: MissionDef; today: TodayState; act: (m: MissionDef) => void }) {
  const isDone = !!today.done[m.id];
  return (
    <div className={`edge edge--${m.id} ${isDone ? "is-done" : ""}`}>
      <Planet mission={m.id} state={isDone ? "done" : "next"} size={72} className="edge__planet" />
      <div className="edge__text">
        <h2>{m.title}</h2>
        <p className="muted">
          {m.subtitle} · <span className="num">+{m.xp} XP</span>
        </p>
      </div>
      {isDone ? (
        <span className="edge__done">
          <Check size={18} strokeWidth={3} aria-hidden /> Feito
        </span>
      ) : (
        <button type="button" className={`btn btn--sm ${m.id === "checkin" ? "btn--primary" : ""}`} onClick={() => act(m)} aria-label={`Começar: ${m.title}`}>
          Começar
        </button>
      )}
    </div>
  );
}

function SolarSystem({
  today,
  selected,
  onSelect,
  act,
  mood,
}: {
  today: TodayState;
  selected: MissionId;
  onSelect: (id: MissionId) => void;
  act: (m: MissionDef) => void;
  mood: AstridoMood;
}) {
  const freeDone = FREE.filter((id) => today.done[id]).length;
  return (
    <div className="solar" role="group" aria-label={`Missões livres, em qualquer ordem: ${freeDone} de ${FREE.length} feitas`}>
      <svg className="solar__rings" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="23" />
        <circle cx="50" cy="50" r="39" />
      </svg>
      <div className="solar__sun" aria-hidden>
        <Astrido mood={freeDone === FREE.length ? "excited" : mood} size={120} />
      </div>
      {ORBITS.map((o) => (
        <div key={o.id} className={`solar__track solar__track--${o.id}`}>
          {o.planets.map(({ id, angle }) => {
            const m = mission(id);
            const isDone = !!today.done[id];
            const p = progressOf(m, today);
            const isSel = selected === id;
            return (
              <div key={id} className="solar__slot" style={{ "--a": `${angle}deg` } as CSSProperties}>
                <button
                  type="button"
                  className={`solar__planet ${isDone ? "is-done" : ""} ${isSel ? "is-selected" : ""}`}
                  aria-label={`${m.title}, ${statusText(m, today)}`}
                  aria-current={isSel ? "true" : undefined}
                  onFocus={() => onSelect(id)}
                  onClick={() => {
                    onSelect(id);
                    act(m);
                  }}
                >
                  <span className="solar__spin">
                    <Planet mission={id} state={isDone ? "done" : "next"} size={96} />
                    <svg className="solar__marks" viewBox="0 0 160 160" aria-hidden>
                      {p && !isDone && (
                        <>
                          <circle cx="80" cy="86" r="61" className="solar__arc-track" />
                          <circle
                            cx="80"
                            cy="86"
                            r="61"
                            className={`solar__arc stroke--${m.pillar}`}
                            pathLength={100}
                            strokeDasharray={`${p.ratio * 100} 100`}
                            transform="rotate(-90 80 86)"
                          />
                        </>
                      )}
                      {isSel && <circle cx="80" cy="86" r="72" className="solar__halo" />}
                    </svg>
                    <span className={`solar__badge icon-tile icon-tile--${m.pillar}`} aria-hidden>
                      {isDone ? <Check size={13} strokeWidth={3.2} /> : <Icon name={m.icon} size={13} />}
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

// Missão selecionada: título, uma linha, XP, progresso e a ação.
function Focus({ m, today, act }: { m: MissionDef; today: TodayState; act: (m: MissionDef) => void }) {
  const isDone = !!today.done[m.id];
  const p = progressOf(m, today);
  const label = actionLabel(m, isDone);
  return (
    <section className="focus" aria-labelledby="focus-title">
      <div className="focus__head">
        <span className={`focus__icon icon-tile icon-tile--${m.pillar}`} aria-hidden>
          <Icon name={m.icon} size={20} />
        </span>
        <h2 id="focus-title">{m.title}</h2>
        <span className="focus__xp num">+{m.xp} XP</span>
      </div>
      <p className="muted">{m.subtitle}</p>
      {p && (
        <div className="focus__progress">
          <Bar value={p.ratio} color={`var(--${m.pillar})`} height={6} />
          <span className="small num muted">{p.text}</span>
        </div>
      )}
      {label ? (
        <button type="button" className={`btn ${isDone ? "" : "btn--primary"}`} onClick={() => act(m)}>
          {label}
        </button>
      ) : (
        <span className="focus__done">
          <Check size={18} strokeWidth={3} aria-hidden /> Feita hoje
        </span>
      )}
    </section>
  );
}

function Goals({ today }: { today: TodayState }) {
  const p = pillarProgress(today);
  return (
    <section className="board__section" aria-labelledby="goals-title">
      <h3 id="goals-title">Metas por pilar</h3>
      <ul className="goals">
        {PILLARS.map((pl) => {
          const total = MISSIONS.filter((m) => m.pillar === pl.id).length;
          const doneHere = MISSIONS.filter((m) => m.pillar === pl.id && today.done[m.id]).length;
          return (
            <li key={pl.id} className="goals__item">
              <Ring value={p[pl.id]} size={64} stroke={7} color={pl.color}>
                <span className="goals__icon" style={{ color: pl.color }}>
                  <Icon name={pl.icon} size={20} />
                </span>
              </Ring>
              <b>{pl.label}</b>
              <span className="muted small num">
                {doneHere} de {total}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Streak({ streak, safe, done }: { streak: number; safe: boolean; done: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);
    const isToday = i === 6;
    return { key: i, label, isToday, lit: isToday ? safe : true };
  });
  const missing = Math.max(0, DAILY_GOAL_MISSIONS - done);
  return (
    <section className="board__section" aria-labelledby="streak-title">
      <h3 id="streak-title" className="num">
        {streak} dias de ofensiva
      </h3>
      <ul className="streak__week" aria-label="Ofensiva nos últimos 7 dias">
        {days.map((d) => (
          <li key={d.key} className={`streak__day ${d.lit ? "is-lit" : ""} ${d.isToday ? "is-today" : ""}`}>
            <span className="streak__dot" aria-hidden>
              {d.lit && <Flame size={14} strokeWidth={2.4} />}
            </span>
            <span className="streak__label">{d.isToday ? "hoje" : d.label}</span>
            <span className="visually-hidden">{d.lit ? "ofensiva feita" : "ainda não"}</span>
          </li>
        ))}
      </ul>
      <p className="muted">{safe ? "Ofensiva de hoje garantida." : `Faltam ${missing} missões para manter.`}</p>
    </section>
  );
}

function League({ today }: { today: TodayState }) {
  const me = { callSign: MISSION.callSign, weeklyXp: DEMO_BASE.weeklyXp + todayXp(today), me: true };
  const all = [...CREW.map((c) => ({ ...c, me: false })), me].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const myPos = all.findIndex((r) => r.me);
  const rows = all.slice(0, 3).map((r, i) => ({ ...r, pos: i + 1 }));
  if (myPos >= 3) rows.push({ ...me, pos: myPos + 1 });
  return (
    <section className="board__section" aria-labelledby="league-title">
      <div className="league__head">
        <h3 id="league-title">Liga da semana</h3>
        <a href="#/desafios" className="btn btn--quiet btn--sm">
          Desafios
        </a>
      </div>
      <ol className="league">
        {rows.map((r) => (
          <li key={r.callSign} className={`league__row ${r.me ? "is-me" : ""}`} value={r.pos}>
            <span className="league__pos num">{r.pos}</span>
            <span className="league__name">
              {r.callSign}
              {r.me && " (você)"}
            </span>
            <b className="league__xp num">{r.weeklyXp} XP</b>
          </li>
        ))}
      </ol>
      <p className="muted">Só XP de hábitos; nenhum dado de saúde é compartilhado.</p>
    </section>
  );
}
