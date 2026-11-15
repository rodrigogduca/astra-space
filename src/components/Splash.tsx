import { useEffect, useState } from "react";
import { AstraSymbol, AstraWordmark, MorseRule } from "./Logo";
import { useLang } from "../i18n/lang";

// Loading screen: the symbol assembles (arrows reach the center), the wordmark appears,
// the Morse blinks in sequence and a motivational line goes along. It disappears on its own.

const PHRASES = {
  pt: [
    "Cuidar de você também é parte da missão.",
    "Cada hábito é um passo em órbita.",
    "Longe da Terra, perto de si.",
    "Um dia de cada vez, uma órbita de cada vez.",
    "Corpo, mente e espírito: todos tripulantes.",
  ],
  en: [
    "Taking care of yourself is part of the mission.",
    "Every habit is a step in orbit.",
    "Far from Earth, close to yourself.",
    "One day at a time, one orbit at a time.",
    "Body, mind and spirit: all crew members.",
  ],
};

export function Splash({ ready }: { ready: boolean }) {
  const { pick, lang } = useLang();
  const [pickIndex] = useState(() => Math.floor(Math.random() * PHRASES.pt.length));
  const phrase = pick(PHRASES)[pickIndex];
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = ready && minDone;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMinDone(true), reduced ? 300 : 1900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, [leaving]);

  if (gone) return null;
  return (
    <div className={`splash ${leaving ? "is-leaving" : ""}`} role="status" aria-live="polite" aria-label={lang === "en" ? "Loading Astra" : "Carregando o Astra"}>
      <div className="splash__glow" aria-hidden />
      <div className="splash__center">
        <AstraSymbol size={112} className="splash__symbol" />
        <AstraWordmark height={34} morse={false} className="splash__word" />
        <MorseRule className="splash__morse" />
        <p className="splash__tag">{lang === "en" ? "Crew health, in orbit." : "Saúde do tripulante, em órbita."}</p>
        <p className="splash__phrase">{phrase}</p>
      </div>
    </div>
  );
}
