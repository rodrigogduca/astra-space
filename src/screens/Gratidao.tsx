import "./Gratidao.css";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "../store";
import { go } from "../components/Shell";
import { Astrido } from "../components/Astrido";
import { Icon } from "../components/Icon";
import { PLANET_NAME, Planet } from "../components/Planet";
import { GRATITUDE_OPTIONS, mission } from "../domain/gamification";

// REQ-3.1 e 5.6: escolher exatamente 3 de 10 gratidões, sem texto livre.
const PICK = 3;

export function Gratidao() {
  const { state, dispatch } = useStore();
  const m = mission("gratitude");
  const done = !!state.today.done.gratitude;
  const [chosen, setChosen] = useState<string[]>([]);

  const toggle = (opt: string) =>
    setChosen((cur) => (cur.includes(opt) ? cur.filter((c) => c !== opt) : cur.length < PICK ? [...cur, opt] : cur));

  const save = () => {
    dispatch({ type: "complete", id: "gratitude", gratitude: chosen });
    go("#/");
  };

  return (
    <div className="page gratidao">
      <header className="page__head">
        <div className="gratidao__title">
          <span className="icon-tile icon-tile--espirito" aria-hidden>
            <Icon name={m.icon} size={22} />
          </span>
          <div>
            <h1>{m.title}</h1>
            <p>Escolha três coisas que valeram o seu dia. Fica só com você.</p>
          </div>
        </div>
        <a href="#/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={18} aria-hidden /> Voltar à jornada
        </a>
      </header>

      <div className="gratidao__grid">
        <section className="panel gratidao__panel" aria-labelledby="gratidao-q">
          <div className="gratidao__say">
            <Astrido mood={done ? "excited" : "happy"} size={72} />
            <div>
              <h2 id="gratidao-q">{done ? "Gratidões de hoje guardadas." : "O que valeu o seu dia?"}</h2>
              <p className="muted small">{done ? `+${m.xp} XP. Volte amanhã para escolher de novo.` : "Toque em três opções. Dá para trocar antes de salvar."}</p>
            </div>
          </div>

          {done ? (
            <ul className="gratidao__chosen" aria-label="Suas gratidões de hoje">
              {state.today.gratitude.map((g) => (
                <li key={g} className="chip chip--on">
                  <Check size={16} strokeWidth={3} aria-hidden /> {g}
                </li>
              ))}
            </ul>
          ) : (
            <div className="gratidao__options" role="group" aria-label="Opções de gratidão">
              {GRATITUDE_OPTIONS.map((opt) => {
                const on = chosen.includes(opt);
                const full = !on && chosen.length >= PICK;
                return (
                  <button key={opt} type="button" className={`chip ${on ? "chip--on" : ""}`} aria-pressed={on} disabled={full} onClick={() => toggle(opt)}>
                    {on && <Check size={16} strokeWidth={3} aria-hidden />}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          <div className="gratidao__footer">
            {done ? (
              <a href="#/" className="btn btn--primary">
                Voltar à jornada
              </a>
            ) : (
              <>
                <div className="gratidao__count" aria-live="polite">
                  <span className="gratidao__dots" aria-hidden>
                    {Array.from({ length: PICK }, (_, i) => (
                      <span key={i} className={i < chosen.length ? "is-on" : ""} />
                    ))}
                  </span>
                  <span className="muted small num">
                    {chosen.length} de {PICK} escolhidas
                  </span>
                </div>
                <button type="button" className="btn btn--primary" disabled={chosen.length !== PICK} onClick={save}>
                  Salvar gratidões
                </button>
              </>
            )}
          </div>
        </section>

        <figure className="gratidao__planet">
          <Planet mission="gratitude" state={done ? "done" : "current"} size={280} />
          <figcaption>
            <b>Planeta {PLANET_NAME.gratitude}</b>
            <span className="muted small">
              {done ? "Visitado hoje" : `+${m.xp} XP`}
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
