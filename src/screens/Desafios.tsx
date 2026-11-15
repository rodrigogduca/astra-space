import { ArrowUp, CircleCheck, Crown, Hourglass, Lock, Medal, ShieldCheck, Users } from "lucide-react";
import { useStore } from "../store";
import { Astrido } from "../components/Astrido";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { Bar } from "../components/ui";
import { CREW, DEMO_BASE, badges, levelFor, todayXp, weeklyChallenges, LEVELS } from "../domain/gamification";
import { MISSION } from "../domain/simulator";
import "./Desafios.css";

// REQ-6: nível, desafios semanais, conquistas e liga. Tudo recompensa hábito, nunca valor de sinal.

const PROMOTION_SPOTS = 3;

function daysLeftInWeek() {
  const d = new Date().getDay(); // 0 = domingo
  return d === 0 ? 1 : 8 - d;
}

function RankMark({ pos }: { pos: number }) {
  if (pos === 1) return <Crown size={20} aria-hidden className="dsf-rank__crown" />;
  if (pos <= 3) return <Medal size={20} aria-hidden className={`dsf-rank__medal dsf-rank__medal--${pos}`} />;
  return <span aria-hidden>{pos}</span>;
}

export function Desafios() {
  const { state, observations, xp, streak } = useStore();
  const lvl = levelFor(xp);
  const challenges = weeklyChallenges(observations, state.today, Date.now());
  const allBadges = badges(state.today, streak, xp, state.earnedBadges);
  const earned = allBadges.filter((b) => b.earned).length;

  const me = { callSign: MISSION.callSign, weeklyXp: DEMO_BASE.weeklyXp + todayXp(state.today), me: true };
  const league = [...CREW.map((c) => ({ ...c, me: false })), me].sort((a, b) => b.weeklyXp - a.weeklyXp);
  const myPos = league.findIndex((p) => p.me) + 1;
  const left = daysLeftInWeek();

  return (
    <div className="page dsf">
      <div className="page__head">
        <div>
          <h1>Desafios</h1>
          <p>Hábitos da semana, conquistas e a liga da tripulação.</p>
        </div>
      </div>

      <section className="photo-band dsf-level" aria-labelledby="dsf-level-title">
        <img src={PHOTO.aurora} alt="Aurora austral vista da Estação Espacial Internacional" />
        <span className="photo-band__credit">Foto: NASA</span>
        <div className="photo-band__body dsf-level__body">
          <Astrido mood={lvl.progress > 0.7 ? "excited" : "happy"} size={112} />
          <div className="dsf-level__info">
            <h2 id="dsf-level-title">{lvl.name}</h2>
            <p className="dsf-level__xp num">
              <span>
                Nível {lvl.index} de {LEVELS.length} · <b>{xp.toLocaleString("pt-BR")} XP</b>
              </span>
              <span>
                <Icon name="flame" size={18} /> {streak} dias de ofensiva
              </span>
            </p>
            <div className="dsf-level__bar">
              <Bar value={lvl.progress} color="var(--accent)" height={12} />
              <p className="small num">
                {lvl.next ? `Faltam ${lvl.toNext.toLocaleString("pt-BR")} XP para ${lvl.next}` : "Nível máximo alcançado!"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <div className="stack dsf-main">
          <section className="panel" aria-labelledby="dsf-week">
            <div className="panel__head">
              <h2 id="dsf-week">Desafios da semana</h2>
              <span className="dsf-left small">
                <Hourglass size={16} aria-hidden /> {left} {left === 1 ? "dia restante" : "dias restantes"}
              </span>
            </div>
            <ul className="dsf-challenges">
              {challenges.map((c) => {
                const done = c.current >= c.goal;
                return (
                  <li key={c.id} className={`dsf-challenge ${done ? "is-done" : ""}`}>
                    <span className={`icon-tile ${done ? "icon-tile--corpo" : c.crew ? "icon-tile--mente" : ""}`} aria-hidden>
                      {done ? <CircleCheck size={20} /> : <Icon name={c.icon} size={20} />}
                    </span>
                    <div className="dsf-challenge__body">
                      <div className="dsf-challenge__title">
                        <b>{c.title}</b>
                        {c.crew && (
                          <span className="dsf-crew small">
                            <Users size={14} aria-hidden /> Em equipe
                          </span>
                        )}
                      </div>
                      <Bar value={c.current / c.goal} color={done ? "var(--corpo)" : c.crew ? "var(--mente)" : "var(--accent)"} height={10} />
                    </div>
                    <span className="dsf-challenge__count small num">
                      <b>{Math.min(c.current, c.goal).toLocaleString("pt-BR")}</b>
                      <span className="muted">
                        {" "}
                        de {c.goal.toLocaleString("pt-BR")} {c.unit}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel" aria-labelledby="dsf-badges">
            <div className="panel__head">
              <h2 id="dsf-badges">Conquistas</h2>
              <span className="muted small num">
                {earned} de {allBadges.length} desbloqueadas
              </span>
            </div>
            <ul className="dsf-badges">
              {allBadges.map((b) => (
                <li key={b.id} className={`dsf-badge ${b.earned ? "is-earned" : "is-locked"}`}>
                  <span className="dsf-badge__medal" aria-hidden>
                    <Icon name={b.icon} size={26} />
                    {!b.earned && (
                      <span className="dsf-badge__lock">
                        <Lock size={13} strokeWidth={2.5} />
                      </span>
                    )}
                  </span>
                  <b>{b.title}</b>
                  <span className="small">{b.description}</span>
                  <span className="visually-hidden">{b.earned ? "Conquistada" : "Bloqueada"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel dsf-league" aria-labelledby="dsf-league">
          <div className="dsf-league__head">
            <span className="icon-tile icon-tile--mente" aria-hidden>
              <Icon name="satellite" size={20} />
            </span>
            <div>
              <h2 id="dsf-league">Liga Órbita Baixa</h2>
              <p className="muted small">
                Você está em <b>{myPos}º lugar</b>
              </p>
            </div>
          </div>

          <ol className="dsf-rank">
            {league.map((p, i) => (
              <li
                key={p.callSign}
                className={`dsf-rank__row ${p.me ? "is-me" : ""} ${i < PROMOTION_SPOTS ? "is-promo" : ""} ${
                  i === PROMOTION_SPOTS - 1 ? "is-promo-last" : ""
                }`}
              >
                <span className="dsf-rank__pos num" aria-label={`${i + 1}º lugar`}>
                  <RankMark pos={i + 1} />
                </span>
                <span className="dsf-rank__avatar" aria-hidden>
                  {p.callSign.charAt(0)}
                </span>
                <span className="dsf-rank__name">
                  {p.callSign}
                  {p.me && <span className="dsf-you">você</span>}
                </span>
                <span className="dsf-rank__xp num">{p.weeklyXp.toLocaleString("pt-BR")} XP</span>
              </li>
            ))}
          </ol>

          <p className="dsf-promo-note small">
            <ArrowUp size={16} aria-hidden />
            <span>Os {PROMOTION_SPOTS} primeiros (em destaque) sobem de liga no fim da semana.</span>
          </p>
          <p className="dsf-privacy small">
            <ShieldCheck size={18} aria-hidden />
            <span>Só XP de hábitos aparece aqui. Nenhum dado de saúde é compartilhado.</span>
          </p>
        </section>
      </div>
    </div>
  );
}
