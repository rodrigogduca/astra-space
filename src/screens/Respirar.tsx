import "./Respirar.css";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "../store";
import { go } from "../components/Shell";
import { Astrido } from "../components/Astrido";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { mission } from "../domain/gamification";

// REQ-3.1: pausa de respiração guiada de 60 s (inspira 4 s, solta 6 s, 6 ciclos), sobre a Terra vista da Cúpula.
const INHALE = 4;
const EXHALE = 6;
const CYCLE = INHALE + EXHALE;
const CYCLES = 6;
const TOTAL = CYCLE * CYCLES;

export function Respirar() {
  const { state, dispatch } = useStore();
  const alreadyDone = !!state.today.done.breathe;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(TOTAL, s));
      if (s >= TOTAL) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, [startedAt]);

  const running = startedAt !== null && elapsed < TOTAL;
  const finished = elapsed >= TOTAL;
  const inCycle = elapsed % CYCLE;
  const inhaling = running && inCycle < INHALE;
  const phaseLeft = Math.ceil(inhaling ? INHALE - inCycle : CYCLE - inCycle);
  const remaining = Math.ceil(TOTAL - elapsed);
  const cycle = Math.min(CYCLES, Math.floor(elapsed / CYCLE) + 1);

  // Só a troca de fase vai para o leitor de tela; a contagem de segundos fica fora da região viva.
  const phase = running ? (inhaling ? "Inspire" : "Solte") : finished ? "Muito bem! Mente mais leve." : "Pronto para respirar comigo?";
  const announce = running ? `${phase}, ciclo ${cycle} de ${CYCLES}` : finished ? phase : "";

  const start = () => {
    setElapsed(0);
    setStartedAt(Date.now());
  };
  const complete = () => {
    dispatch({ type: "complete", id: "breathe" });
    go("#/");
  };

  const m = mission("breathe");

  return (
    <div className="page respirar">
      <header className="page__head">
        <div className="respirar__title">
          <span className="icon-tile icon-tile--mente" aria-hidden>
            <Icon name={m.icon} size={22} />
          </span>
          <div>
            <h1>{m.title}</h1>
            <p>Um minuto: inspire por 4 segundos, solte por 6. Seis ciclos, sem pressa.</p>
          </div>
        </div>
        <a href="#/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={18} aria-hidden /> Voltar à jornada
        </a>
      </header>

      <section className="respirar__stage" aria-label="Respiração guiada">
        <img
          className="respirar__photo"
          src={PHOTO.cupolaEarth}
          alt="A Terra vista pelas janelas da Cúpula da Estação Espacial Internacional"
          decoding="async"
        />
        <span className="photo-band__credit">Foto: NASA</span>

        <div className="respirar__body">
          {alreadyDone && !running && !finished && (
            <p className="respirar__done">
              <Check size={18} strokeWidth={3} aria-hidden /> Pausa de hoje concluída (+{m.xp} XP). Pode respirar de novo quando quiser.
            </p>
          )}

          <div className="respirar__orb">
            <div className={`respirar__circle ${running ? (inhaling ? "is-in" : "is-out") : ""}`} aria-hidden />
            <Astrido mood="calm" size={112} className="respirar__astrido" />
          </div>

          <div className="respirar__text">
            <p className="respirar__phase" aria-hidden>
              {phase}
            </p>
            <p className="respirar__meta num" aria-hidden>
              {running ? `${phaseLeft} s · ciclo ${cycle} de ${CYCLES}` : finished ? `Seis ciclos feitos. +${m.xp} XP ao concluir.` : "Toque em Começar e acompanhe o círculo."}
            </p>
            <p className="visually-hidden" aria-live="polite">
              {announce}
            </p>
          </div>

          <p className="respirar__timer num">
            <span aria-hidden>
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
            </span>
            <span className="visually-hidden">{running ? "" : `${remaining} segundos`}</span>
          </p>

          <div className="row respirar__actions">
            {startedAt === null && (
              <button type="button" className="btn btn--primary" onClick={start}>
                Começar
              </button>
            )}
            {finished && (
              <>
                <button type="button" className="btn btn--primary" onClick={complete}>
                  Concluir
                </button>
                <button type="button" className="btn" onClick={start}>
                  Recomeçar
                </button>
              </>
            )}
            {running && (
              <button type="button" className="btn" disabled>
                Concluir
              </button>
            )}
            {!finished && (
              <button type="button" className="btn btn--ghost" onClick={complete}>
                Pular (demo)
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
