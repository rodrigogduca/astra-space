import type { CSSProperties } from "react";
import { ArrowUp, CircleCheck, Crown, Hourglass, Lock, Medal, ShieldCheck, Sparkles, Star, Target, Trophy, Users } from "lucide-react";
import { useStore } from "../store";
import { Catro } from "../components/Catro";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { Bar } from "../components/ui";
import { CREW, DEMO_BASE, badges, levelFor, todayXp, weeklyChallenges, LEVELS } from "../domain/gamification";
import { MISSION } from "../domain/simulator";
import { locale, useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import "./Challenges.css";

// REQ-6: level, weekly challenges, badges and league. Everything rewards habits, never signal values.

const PROMOTION_SPOTS = 3;

const T = {
  pt: {
    title: "Desafios",
    lead: "Hábitos da semana, conquistas e a liga da tripulação.",
    photoAlt: "Aurora austral vista da Estação Espacial Internacional",
    catro: "Catro, o gato cuidador espacial do Astra",
    photo: "Foto: NASA",
    level: (i: number, n: number) => `Nível ${i} de ${n}`,
    streak: (s: number) => `${s} dias de ofensiva`,
    toNext: (n: string, next: string) => `Faltam ${n} XP para ${next}`,
    maxLevel: "Nível máximo alcançado!",
    week: "Desafios da semana",
    daysLeft: (n: number) => `${n} ${n === 1 ? "dia restante" : "dias restantes"}`,
    team: "Em equipe",
    of: (goal: string, unit: string) => `de ${goal} ${unit}`,
    badges: "Conquistas",
    unlocked: (e: number, n: number) => `${e} de ${n} desbloqueadas`,
    earned: "Conquistada",
    locked: "Bloqueada",
    league: "Liga Órbita Baixa",
    youAre: "Você está em ",
    place: (p: number) => `${p}º lugar`,
    you: "você",
    promo: (n: number) => `Os ${n} primeiros (em destaque) sobem de liga no fim da semana.`,
    privacy: "Só XP de hábitos aparece aqui. Nenhum dado de saúde é compartilhado.",
  },
  en: {
    title: "Challenges",
    lead: "This week's habits, badges and the crew league.",
    photoAlt: "Aurora australis seen from the International Space Station",
    catro: "Catro, Astra's space caretaker cat",
    photo: "Photo: NASA",
    level: (i: number, n: number) => `Level ${i} of ${n}`,
    streak: (s: number) => `${s}-day streak`,
    toNext: (n: string, next: string) => `${n} XP to ${next}`,
    maxLevel: "Top level reached!",
    week: "This week's challenges",
    daysLeft: (n: number) => `${n} ${n === 1 ? "day left" : "days left"}`,
    team: "Team",
    of: (goal: string, unit: string) => `of ${goal} ${unit}`,
    badges: "Badges",
    unlocked: (e: number, n: number) => `${e} of ${n} unlocked`,
    earned: "Earned",
    locked: "Locked",
    league: "Low Orbit League",
    youAre: "You are in ",
    place: (p: number) => `${ordinal(p)} place`,
    you: "you",
    promo: (n: number) => `The top ${n} (highlighted) move up a league at the end of the week.`,
    privacy: "Only habit XP shows here. No health data is shared.",
  },
};

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

// Vivid identity colors (icons, bars and medals). Habit reward, never a signal reading.
const CHALLENGE_TINT: Record<string, string> = { sleep: "#818CF8", water: "#38BDF8", pause: "#2DD4BF", crew: "#FB923C" };
const BADGE_TINT: Record<string, string> = {
  orbit: "#A78BFA",
  week: "#FB923C",
  fortnight: "#FACC15",
  water: "#38BDF8",
  ared: "#F97316",
  calm: "#22D3EE",
  overview: "#34D399",
  bridge: "#F472B6",
  full: "#FACC15",
  commander: "#FB7185",
};
const tint = (c: string, i = 0) => ({ "--tint": c, "--i": i }) as CSSProperties;
const num = (v: number) => v.toLocaleString(locale());

function XpPill({ value }: { value: number }) {
  return (
    <span className="challenges-xp num">
      <Star size={14} strokeWidth={2.5} aria-hidden /> {num(value)} XP
    </span>
  );
}

function daysLeftInWeek() {
  const d = new Date().getDay(); // 0 = Sunday
  return d === 0 ? 1 : 8 - d;
}

function RankMark({ pos }: { pos: number }) {
  if (pos === 1) return <Crown size={20} aria-hidden className="challenges-rank__crown" />;
  if (pos <= 3) return <Medal size={20} aria-hidden className={`challenges-rank__medal challenges-rank__medal--${pos}`} />;
  return <span aria-hidden>{pos}</span>;
}

export function Challenges() {
  const { state, observations, xp, streak } = useStore();
  const t = useLang().pick(T);
  const dt = useDomainText();
  const lvl = levelFor(xp);
  const challenges = weeklyChallenges(observations, state.today, Date.now());
  const allBadges = badges(state.today, streak, xp, state.earnedBadges);
  const earned = allBadges.filter((b) => b.earned).length;

  const me = { callSign: MISSION.callSign, weeklyXp: DEMO_BASE.weeklyXp + todayXp(state.today), me: true };
  const league = [...CREW.map((c) => ({ ...c, me: false })), me].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const myPos = league.findIndex((p) => p.me) + 1;
  const left = daysLeftInWeek();

  return (
    <div className="page challenges">
      <div className="page__head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.lead}</p>
        </div>
      </div>

      <section className="photo-band challenges-level" aria-labelledby="challenges-level-title">
        <img src={PHOTO.aurora} alt={t.photoAlt} />
        <span className="photo-band__credit">{t.photo}</span>
        <div className="photo-band__body challenges-level__body">
          <Catro mood={lvl.progress > 0.7 ? "excited" : "happy"} size={210} className="challenges-level__catro catro--float" title={t.catro} />
          <div className="challenges-level__info">
            <h2 id="challenges-level-title">{dt.level(lvl.name)}</h2>
            <p className="challenges-level__xp num">
              <span className="challenges-level__total">
                <Sparkles size={26} aria-hidden className="challenges-level__spark" />
                <b className="display">{num(xp)}</b> XP
              </span>
              <span>{t.level(lvl.index, LEVELS.length)}</span>
              <span className="challenges-level__streak">
                <Icon name="flame" size={18} /> {t.streak(streak)}
              </span>
            </p>
            <div className="challenges-level__bar">
              <Bar value={lvl.progress} color="#FACC15" height={12} />
              <p className="small num">{lvl.next ? t.toNext(num(lvl.toNext), dt.level(lvl.next)) : t.maxLevel}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <div className="stack challenges-main">
          <section className="panel" aria-labelledby="challenges-week">
            <div className="panel__head">
              <h2 id="challenges-week" className="challenges-h2">
                <span className="challenges-h2__icon" aria-hidden>
                  <Target size={18} strokeWidth={2.5} />
                </span>
                {t.week}
              </h2>
              <span className="challenges-days-left small">
                <Hourglass size={16} aria-hidden /> {t.daysLeft(left)}
              </span>
            </div>
            <ul className="challenges-list">
              {challenges.map((c, i) => {
                const done = c.current >= c.goal;
                const color = CHALLENGE_TINT[c.id] ?? "#A78BFA";
                const text = dt.challenge(c.id, { title: c.title, unit: c.unit });
                return (
                  <li key={c.id} className={`challenges-item stagger-in ${done ? "is-done" : ""}`} style={tint(color, i)}>
                    <span className="challenges-item__tile" aria-hidden>
                      {done ? <CircleCheck size={20} /> : <Icon name={c.icon} size={20} />}
                    </span>
                    <div className="challenges-item__body">
                      <div className="challenges-item__title">
                        <b>{text.title}</b>
                        {c.crew && (
                          <span className="challenges-crew small">
                            <Users size={14} aria-hidden /> {t.team}
                          </span>
                        )}
                      </div>
                      <Bar value={c.current / c.goal} color={done ? "var(--ok)" : color} height={10} />
                    </div>
                    <span className="challenges-item__count small num">
                      <b>{num(Math.min(c.current, c.goal))}</b>
                      <span className="muted"> {t.of(num(c.goal), text.unit)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel" aria-labelledby="challenges-badges">
            <div className="panel__head">
              <h2 id="challenges-badges" className="challenges-h2">
                <span className="challenges-h2__icon" aria-hidden>
                  <Trophy size={18} strokeWidth={2.5} />
                </span>
                {t.badges}
              </h2>
              <span className="muted small num">{t.unlocked(earned, allBadges.length)}</span>
            </div>
            <ul className="challenges-badges">
              {allBadges.map((b, i) => {
                const text = dt.badge(b.id, { title: b.title, description: b.description });
                return (
                  <li key={b.id} className={`challenges-badge stagger-in ${b.earned ? "is-earned" : "is-locked"}`} style={tint(BADGE_TINT[b.id] ?? "#A78BFA", i)}>
                    <span className="challenges-badge__medal" aria-hidden>
                      <Icon name={b.icon} size={26} />
                      {!b.earned && (
                        <span className="challenges-badge__lock">
                          <Lock size={13} strokeWidth={2.5} />
                        </span>
                      )}
                    </span>
                    <b>{text.title}</b>
                    <span className="small">{text.description}</span>
                    <span className="visually-hidden">{b.earned ? t.earned : t.locked}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="panel challenges-league" aria-labelledby="challenges-league">
          <div className="challenges-league__head">
            <span className="icon-tile icon-tile--mind" aria-hidden>
              <Icon name="satellite" size={20} />
            </span>
            <div>
              <h2 id="challenges-league">{t.league}</h2>
              <p className="muted small">
                {t.youAre}
                <b>{t.place(myPos)}</b>
              </p>
            </div>
          </div>

          <ol className="challenges-rank">
            {league.map((p, i) => (
              <li
                key={p.callSign}
                style={{ "--i": i } as CSSProperties}
                className={`challenges-rank__row stagger-in ${p.me ? "is-me" : ""} ${i < PROMOTION_SPOTS ? "is-promo" : ""} ${
                  i === PROMOTION_SPOTS - 1 ? "is-promo-last" : ""
                }`}
              >
                <span className="challenges-rank__pos num" aria-label={t.place(i + 1)}>
                  <RankMark pos={i + 1} />
                </span>
                <span className="challenges-rank__avatar" aria-hidden>
                  {p.callSign.charAt(0)}
                </span>
                <span className="challenges-rank__name">
                  {p.callSign}
                  {p.me && <span className="challenges-you">{t.you}</span>}
                </span>
                <span className="challenges-rank__xp">
                  <XpPill value={p.weeklyXp} />
                </span>
              </li>
            ))}
          </ol>

          <p className="challenges-promo-note small">
            <ArrowUp size={16} aria-hidden />
            <span>{t.promo(PROMOTION_SPOTS)}</span>
          </p>
          <p className="challenges-privacy small">
            <ShieldCheck size={18} aria-hidden />
            <span>{t.privacy}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
