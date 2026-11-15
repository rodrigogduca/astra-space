import "./Gratitude.css";
import { useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { go } from "../components/Shell";
import { Catro } from "../components/Catro";
import { Icon } from "../components/Icon";
import { planetName, Planet } from "../components/Planet";
import { GRATITUDE_OPTIONS, mission } from "../domain/gamification";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";

// REQ-3.1 and 5.6: pick exactly 3 of 10 gratitudes, no free text.
const PICK = 3;

const T = {
  pt: {
    intro: "Escolha três coisas que valeram o seu dia. Fica só com você.",
    back: "Voltar à jornada",
    savedTitle: "Gratidões de hoje guardadas.",
    askTitle: "O que valeu o seu dia?",
    savedNote: (xp: number) => `+${xp} XP. Volte amanhã para escolher de novo.`,
    askNote: "Toque em três opções. Dá para trocar antes de salvar.",
    chosenLabel: "Suas gratidões de hoje",
    optionsLabel: "Opções de gratidão",
    count: (n: number, total: number) => `${n} de ${total} escolhidas`,
    save: "Salvar gratidões",
    planet: (name: string) => `Planeta ${name}`,
    visited: "Visitado hoje",
    catro: "Catro, o gato cuidador espacial do Astra",
  },
  en: {
    intro: "Pick three things that made your day. They stay with you.",
    back: "Back to journey",
    savedTitle: "Today's gratitudes are saved.",
    askTitle: "What made your day?",
    savedNote: (xp: number) => `+${xp} XP. Come back tomorrow to pick again.`,
    askNote: "Tap three options. You can swap them before saving.",
    chosenLabel: "Your gratitudes today",
    optionsLabel: "Gratitude options",
    count: (n: number, total: number) => `${n} of ${total} picked`,
    save: "Save gratitudes",
    planet: (name: string) => `Planet ${name}`,
    visited: "Visited today",
    catro: "Catro, Astra's space care cat",
  },
};

export function Gratitude() {
  const { state, dispatch } = useStore();
  const { lang, pick } = useLang();
  const t = pick(T);
  const dt = useDomainText();
  const m = mission("gratitude");
  const mt = dt.mission("gratitude");
  const done = !!state.today.done.gratitude;
  const [chosen, setChosen] = useState<string[]>([]);

  const toggle = (opt: string) =>
    setChosen((cur) => (cur.includes(opt) ? cur.filter((c) => c !== opt) : cur.length < PICK ? [...cur, opt] : cur));

  const save = () => {
    dispatch({ type: "complete", id: "gratitude", gratitude: chosen });
    go("#/");
  };

  return (
    <div className="page gratitude">
      <header className="page__head">
        <div className="gratitude__title">
          <span className="icon-tile icon-tile--spirit" aria-hidden>
            <Icon name={m.icon} size={22} />
          </span>
          <div>
            <h1>{mt.title}</h1>
            <p>{t.intro}</p>
          </div>
        </div>
        <a href="#/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={18} aria-hidden /> {t.back}
        </a>
      </header>

      <div className="gratitude__grid">
        <section className="panel gratitude__panel" aria-labelledby="gratitude-q">
          <div className="gratitude__say">
            <h2 id="gratitude-q">{done ? t.savedTitle : t.askTitle}</h2>
            <p className="muted small">{done ? t.savedNote(m.xp) : t.askNote}</p>
          </div>

          {done ? (
            <ul className="gratitude__chosen" aria-label={t.chosenLabel}>
              {state.today.gratitude.map((g) => (
                <li key={g} className="chip chip--on">
                  <Check size={16} strokeWidth={3} aria-hidden /> {dt.gratitude(g)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="gratitude__options" role="group" aria-label={t.optionsLabel}>
              {GRATITUDE_OPTIONS.map((opt, i) => {
                const on = chosen.includes(opt);
                const full = !on && chosen.length >= PICK;
                return (
                  <button key={opt} type="button" className={`chip gratitude__opt stagger-in ${on ? "chip--on" : ""}`} style={{ "--i": i } as CSSProperties} aria-pressed={on} disabled={full} onClick={() => toggle(opt)}>
                    {on && <Check size={16} strokeWidth={3} aria-hidden />}
                    {dt.gratitude(opt)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="gratitude__footer">
            {done ? (
              <a href="#/" className="btn btn--primary">
                {t.back}
              </a>
            ) : (
              <>
                <div className="gratitude__count" aria-live="polite">
                  <span className="gratitude__dots" aria-hidden>
                    {Array.from({ length: PICK }, (_, i) => (
                      <span key={i} className={i < chosen.length ? "is-on" : ""} />
                    ))}
                  </span>
                  <span className="muted small num">
                    {t.count(chosen.length, PICK)}
                  </span>
                </div>
                <button type="button" className="btn btn--primary" disabled={chosen.length !== PICK} onClick={save}>
                  {t.save}
                </button>
              </>
            )}
          </div>
        </section>

        <figure className="gratitude__planet">
          <div className="gratitude__scene">
            <Planet mission="gratitude" state={done ? "done" : "current"} size={280} />
            <Catro mood={done ? "excited" : "happy"} size={150} className="gratitude__catro catro--float" title={t.catro} />
          </div>
          <figcaption>
            <b>{t.planet(planetName("gratitude", lang))}</b>
            {done ? (
              <span className="muted small">{t.visited}</span>
            ) : (
              <span className="gratitude__xp small num">
                <Sparkles size={14} strokeWidth={2.5} aria-hidden /> +{m.xp} XP
              </span>
            )}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
