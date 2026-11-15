import "./Breathe.css";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "../store";
import { go } from "../components/Shell";
import { Catro } from "../components/Catro";
import { Icon } from "../components/Icon";
import { PHOTO } from "../components/Credits";
import { mission } from "../domain/gamification";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";

// REQ-3.1: 60 s guided breathing break (in 4 s, out 6 s, 6 cycles), over Earth seen from the Cupola.
const INHALE = 4;
const EXHALE = 6;
const CYCLE = INHALE + EXHALE;
const CYCLES = 6;
const TOTAL = CYCLE * CYCLES;

const T = {
  pt: {
    inhale: "Inspire",
    exhale: "Solte",
    finished: "Muito bem! Mente mais leve.",
    ready: "Pronto para respirar comigo?",
    announce: (phase: string, c: number, total: number) => `${phase}, ciclo ${c} de ${total}`,
    intro: "Um minuto: inspire por 4 segundos, solte por 6. Seis ciclos, sem pressa.",
    back: "Voltar à jornada",
    stage: "Respiração guiada",
    photoAlt: "A Terra vista pelas janelas da Cúpula da Estação Espacial Internacional",
    credit: "Foto: NASA",
    doneToday: (xp: number) => `Pausa de hoje concluída (+${xp} XP). Pode respirar de novo quando quiser.`,
    catro: "Catro, guia da respiração",
    seconds: (n: number) => `${n} segundos`,
    meta: (left: number, c: number, total: number) => `${left} s · ciclo ${c} de ${total}`,
    metaDone: (xp: number) => `Seis ciclos feitos. +${xp} XP ao concluir.`,
    metaReady: "Toque em Começar e acompanhe o círculo.",
    start: "Começar",
    complete: "Concluir",
    restart: "Recomeçar",
    skip: "Pular (demo)",
  },
  en: {
    inhale: "Breathe in",
    exhale: "Breathe out",
    finished: "Nice work! A lighter mind.",
    ready: "Ready to breathe with me?",
    announce: (phase: string, c: number, total: number) => `${phase}, cycle ${c} of ${total}`,
    intro: "One minute: breathe in for 4 seconds, out for 6. Six cycles, no rush.",
    back: "Back to journey",
    stage: "Guided breathing",
    photoAlt: "Earth seen through the Cupola windows of the International Space Station",
    credit: "Photo: NASA",
    doneToday: (xp: number) => `Today's break is done (+${xp} XP). Breathe again whenever you like.`,
    catro: "Catro, your breathing guide",
    seconds: (n: number) => `${n} seconds`,
    meta: (left: number, c: number, total: number) => `${left} s · cycle ${c} of ${total}`,
    metaDone: (xp: number) => `Six cycles done. +${xp} XP when you finish.`,
    metaReady: "Tap Start and follow the circle.",
    start: "Start",
    complete: "Finish",
    restart: "Restart",
    skip: "Skip (demo)",
  },
};

export function Breathe() {
  const { state, dispatch } = useStore();
  const t = useLang().pick(T);
  const dt = useDomainText();
  const alreadyDone = !!state.today.done.breathe;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(TOTAL, s));
      if (s >= TOTAL) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, [startedAt]);

  const running = startedAt !== null && elapsed < TOTAL;
  const finished = elapsed >= TOTAL;
  const inCycle = elapsed % CYCLE;
  const inhaling = running && inCycle < INHALE;
  const phaseLeft = Math.ceil(inhaling ? INHALE - inCycle : CYCLE - inCycle);
  const remaining = Math.ceil(TOTAL - elapsed);
  const cycle = Math.min(CYCLES, Math.floor(elapsed / CYCLE) + 1);

  // Only the phase change goes to the screen reader; the seconds countdown stays out of the live region.
  const phase = running ? (inhaling ? t.inhale : t.exhale) : finished ? t.finished : t.ready;
  const announce = running ? t.announce(phase, cycle, CYCLES) : finished ? phase : "";

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
    <div className="page breathe">
      <header className="page__head">
        <div className="breathe__title">
          <span className="icon-tile icon-tile--mind" aria-hidden>
            <Icon name={m.icon} size={22} />
          </span>
          <div>
            <h1>{dt.mission("breathe").title}</h1>
            <p>{t.intro}</p>
          </div>
        </div>
        <a href="#/" className="btn btn--ghost btn--sm">
          <ArrowLeft size={18} aria-hidden /> {t.back}
        </a>
      </header>

      <section className="breathe__stage" aria-label={t.stage}>
        <img
          className="breathe__photo"
          src={PHOTO.cupolaEarth}
          alt={t.photoAlt}
          decoding="async"
        />
        <span className="photo-band__credit">{t.credit}</span>

        <div className="breathe__body">
          {alreadyDone && !running && !finished && (
            <p className="breathe__done">
              <Check size={18} strokeWidth={3} aria-hidden /> {t.doneToday(m.xp)}
            </p>
          )}

          {/* Catro guides the breathing: the circle grows and shrinks around him. */}
          <div className="breathe__orb">
            <div className={`breathe__circle ${running ? (inhaling ? "is-in" : "is-out") : ""}`} aria-hidden />
            <Catro mood="calm" size={240} className="breathe__catro" title={t.catro} />
          </div>

          <div className="breathe__panel">
            <p className="breathe__timer display num">
              <span aria-hidden>
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </span>
              <span className="visually-hidden">{running ? "" : t.seconds(remaining)}</span>
            </p>

            <div className="speech__bubble breathe__bubble" aria-hidden>
              <p className="breathe__phase">
                {running ? <b>{phase}</b> : phase}
              </p>
              <p className="breathe__meta num">
                {running ? t.meta(phaseLeft, cycle, CYCLES) : finished ? t.metaDone(m.xp) : t.metaReady}
              </p>
            </div>
            <p className="visually-hidden" aria-live="polite">
              {announce}
            </p>

            <div className="row breathe__actions">
              {startedAt === null && (
                <button type="button" className="btn btn--primary" onClick={start}>
                  {t.start}
                </button>
              )}
              {finished && (
                <>
                  <button type="button" className="btn btn--primary" onClick={complete}>
                    {t.complete}
                  </button>
                  <button type="button" className="btn" onClick={start}>
                    {t.restart}
                  </button>
                </>
              )}
              {running && (
                <button type="button" className="btn" disabled>
                  {t.complete}
                </button>
              )}
              {!finished && (
                <button type="button" className="btn btn--ghost" onClick={complete}>
                  {t.skip}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
