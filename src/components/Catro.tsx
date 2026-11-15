import { useId } from "react";
import { currentLang } from "../i18n/lang";

// Catro, the space "care cat" from Astra's visual identity (Astra brand manual, IDVS by Carlos).
// The image is the one from the brand manual with the visor turned off; the face is drawn on top in SVG, like a screen
// that lights up, and changes with the mood. Coordinates are in the original image space (609 × 868).

export type CatroMood = "happy" | "wink" | "excited" | "calm" | "thinking" | "sleepy";

const GLOW = "#E4E0FF";

function Face({ mood }: { mood: CatroMood }) {
  const eye = (cx: number, ry = 34) => <ellipse cx={cx} cy="298" rx="22" ry={ry} />;
  const smile = <path d="M266 350 q32 24 64 -2" fill="none" strokeWidth="10" strokeLinecap="round" />;
  switch (mood) {
    case "happy":
      return (
        <>
          {eye(222)}
          {eye(364)}
          {smile}
        </>
      );
    case "wink":
      return (
        <>
          {eye(222)}
          <path d="M342 282 l40 16 l-40 16" fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          {smile}
        </>
      );
    case "excited":
      return (
        <>
          {eye(222, 38)}
          {eye(364, 38)}
          <path d="M262 342 q36 4 72 0 q-4 34 -36 34 q-32 0 -36 -34z" />
        </>
      );
    case "calm":
      return (
        <>
          <path d="M198 306 q24 -26 48 0" fill="none" strokeWidth="10" strokeLinecap="round" />
          <path d="M340 306 q24 -26 48 0" fill="none" strokeWidth="10" strokeLinecap="round" />
          <path d="M276 352 q22 14 44 0" fill="none" strokeWidth="9" strokeLinecap="round" />
        </>
      );
    case "thinking":
      return (
        <>
          {eye(222)}
          <path d="M342 300 h44" fill="none" strokeWidth="10" strokeLinecap="round" />
          <circle cx="306" cy="356" r="10" fill="none" strokeWidth="8" />
        </>
      );
    case "sleepy":
      return (
        <>
          <path d="M198 304 q24 10 48 0" fill="none" strokeWidth="10" strokeLinecap="round" />
          <path d="M340 304 q24 10 48 0" fill="none" strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="298" cy="356" rx="10" ry="8" />
        </>
      );
  }
}

export function Catro({ mood = "happy", size = 140, className = "", title }: { mood?: CatroMood; size?: number; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span
      className={`catro catro--${mood} ${className}`}
      style={{ height: size, width: Math.round(size * 0.7) }}
      role="img"
      aria-label={title ?? (currentLang() === "en" ? "Catro, Astra's space care cat" : "Catro, o gato cuidador espacial do Astra")}
    >
      <img src="/brand/catro-blank.webp" width={609} height={868} alt="" draggable={false} />
      <svg viewBox="0 0 609 868" className="catro__face" aria-hidden>
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="catro__screen" fill={GLOW} stroke={GLOW} filter={`url(#glow-${id})`}>
          <Face mood={mood} />
        </g>
        {mood === "sleepy" && (
          <g className="catro__z" fill="none" stroke="#B9A9FF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M486 120 h40 l-40 44 h40" />
            <path d="M540 70 h24 l-24 26 h24" strokeWidth="7" />
          </g>
        )}
        {mood === "excited" && (
          <g className="catro__sparkles" fill="#FFFBED">
            <path d="M70 120 l9 22 22 9 -22 9 -9 22 -9 -22 -22 -9 22 -9z" />
            <path d="M540 200 l6 15 15 6 -15 6 -6 15 -6 -15 -15 -6 15 -6z" />
          </g>
        )}
        {mood === "thinking" && (
          <g fill="#B9A9FF">
            <circle cx="520" cy="130" r="12" />
            <circle cx="556" cy="88" r="18" />
          </g>
        )}
      </svg>
    </span>
  );
}

export function SpeechBubble({ children, mood = "happy", size = 110 }: { children: React.ReactNode; mood?: CatroMood; size?: number }) {
  return (
    <div className="speech">
      <Catro mood={mood} size={size} />
      <div className="speech__bubble">{children}</div>
    </div>
  );
}
