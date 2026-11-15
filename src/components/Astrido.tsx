import { useId } from "react";

// Astrido, o mascote estrela do Astra (RV-6, RV-12). SVG puro e chapado (sem gradiente):
// o volume vem de facetas de sombra recortadas pelo corpo, brilhos e contorno.
// O humor muda sobrancelhas, olhos, boca e os detalhes em volta.

export type AstridoMood = "happy" | "excited" | "calm" | "thinking" | "sleepy";

// Estrela com cantos arredondados: cada vértice vira uma curva quadrática.
function roundedStar(cx: number, cy: number, outer: number, inner: number, round: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  let d = "";
  pts.forEach((p, i) => {
    const prev = pts[(i + 9) % 10];
    const next = pts[(i + 1) % 10];
    const t = i % 2 === 0 ? round : round * 0.7;
    const a = lerp(p, prev, t);
    const b = lerp(p, next, t);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} `;
  });
  return d + "Z";
}

const BODY = roundedStar(100, 108, 84, 46, 0.24);

const C = {
  body: "#FFC83D",
  shade: "#F4A51C",
  deep: "#DD8A0E",
  rim: "#B8700A",
  light: "#FFE7A0",
  ink: "#1B1F3B",
  iris: "#3B4A9E",
  blush: "#FF8FA3",
  tongue: "#FF6B81",
};

function Eyes({ mood }: { mood: AstridoMood }) {
  if (mood === "sleepy" || mood === "calm") {
    const d = mood === "sleepy" ? "q10 7 20 0" : "q10 -10 20 0";
    return (
      <g stroke={C.ink} strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d={`M66 106 ${d}`} />
        <path d={`M114 106 ${d}`} />
        {mood === "sleepy" && (
          <>
            <path d="M68 111 l-3 4" strokeWidth="3" />
            <path d="M132 111 l3 4" strokeWidth="3" />
          </>
        )}
      </g>
    );
  }
  const look = mood === "thinking" ? 3 : 0;
  const ry = mood === "excited" ? 15 : 13.5;
  const eye = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy="104" rx="11" ry={ry} fill={C.ink} />
      <ellipse cx={cx + look} cy={106} rx="7" ry={ry - 5} fill={C.iris} />
      <ellipse cx={cx + look} cy={108} rx="4.2" ry={ry - 8} fill={C.ink} />
      <circle cx={cx + 3.5 + look} cy="98" r="4.4" fill="#fff" />
      <circle cx={cx - 3.5 + look} cy="111" r="2" fill="#fff" opacity=".85" />
      {mood === "excited" && <path d={`M${cx + 6} 92 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z`} fill="#fff" />}
    </g>
  );
  return <g className="astrido__eyes">{[77, 123].map(eye)}</g>;
}

function Brows({ mood }: { mood: AstridoMood }) {
  const p = {
    happy: ["M66 86 q10 -6 20 -1", "M114 85 q10 -5 20 1"],
    excited: ["M65 82 q11 -8 22 -2", "M113 80 q11 -6 22 2"],
    calm: ["M67 90 q9 -3 18 0", "M115 90 q9 -3 18 0"],
    thinking: ["M66 88 q10 -2 20 -6", "M114 82 q10 -2 20 4"],
    sleepy: ["M67 93 q9 -2 18 0", "M115 93 q9 -2 18 0"],
  }[mood];
  return (
    <g stroke={C.rim} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".9">
      <path d={p[0]} />
      <path d={p[1]} />
    </g>
  );
}

function Mouth({ mood }: { mood: AstridoMood }) {
  switch (mood) {
    case "happy":
      return (
        <g>
          <path d="M85 125 q15 17 30 0 q-15 4 -30 0z" fill={C.ink} />
          <path d="M93 132 q7 6 14 0 q-7 -2.5 -14 0z" fill={C.tongue} />
        </g>
      );
    case "excited":
      return (
        <g>
          <path d="M85 124 q15 24 30 0 q-15 5 -30 0z" fill={C.ink} />
          <path d="M92 133 q8 7 16 0 q-8 -3 -16 0z" fill={C.tongue} />
          <path d="M88 125.5 q12 3 24 0 v3 q-12 2 -24 0z" fill="#fff" opacity=".9" />
        </g>
      );
    case "calm":
      return <path d="M91 127 q9 7 18 0" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" fill="none" />;
    case "thinking":
      return <ellipse cx="104" cy="129" rx="5.5" ry="6" fill={C.ink} />;
    case "sleepy":
      return <ellipse cx="100" cy="129" rx="5" ry="4.2" fill={C.ink} />;
  }
}

export function Astrido({ mood = "happy", size = 120, className = "", title }: { mood?: AstridoMood; size?: number; className?: string; title?: string }) {
  const clip = useId().replace(/:/g, "");
  return (
    <svg
      className={`astrido astrido--${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? "Astrido, a estrela mascote do Astra"}
    >
      <defs>
        <clipPath id={`astrido-${clip}`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <g className="astrido__body">
        {/* contorno: a mesma forma um pouco maior por trás */}
        <path d={BODY} fill={C.rim} stroke={C.rim} strokeWidth="9" strokeLinejoin="round" />
        <path d={BODY} fill={C.body} />

        {/* volume: facetas chapadas recortadas pelo corpo */}
        <g clipPath={`url(#astrido-${clip})`}>
          <path d="M100 108 L200 40 L200 200 L100 200 Z" fill={C.shade} />
          <path d="M100 108 L200 150 L200 200 L140 200 Z" fill={C.deep} opacity=".75" />
          <path d="M100 108 L0 150 L0 200 L60 200 Z" fill={C.shade} opacity=".6" />
          <ellipse cx="100" cy="112" rx="50" ry="44" fill={C.body} />
        </g>

        {/* brilhos */}
        <path d="M74 56 Q86 38 98 30" stroke={C.light} strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="110" cy="31" r="4" fill={C.light} />
        <path d="M34 84 Q46 79 58 80" stroke={C.light} strokeWidth="6" strokeLinecap="round" fill="none" opacity=".9" />
        <path d="M156 66 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" fill="#fff" opacity=".9" />

        <Brows mood={mood} />
        <Eyes mood={mood} />

        {/* bochechas com três pontinhos de brilho */}
        <ellipse cx="58" cy="124" rx="10" ry="6" fill={C.blush} opacity=".8" />
        <ellipse cx="142" cy="124" rx="10" ry="6" fill={C.blush} opacity=".8" />
        <g fill="#fff" opacity=".7">
          <circle cx="54" cy="122" r="1.3" />
          <circle cx="58" cy="125" r="1.3" />
          <circle cx="138" cy="122" r="1.3" />
          <circle cx="142" cy="125" r="1.3" />
        </g>

        <Mouth mood={mood} />
      </g>

      {mood === "excited" && (
        <g fill={C.light} className="astrido__sparkles">
          <path d="M22 44 l3.5 8.5 8.5 3.5 -8.5 3.5 -3.5 8.5 -3.5 -8.5 -8.5 -3.5 8.5 -3.5z" />
          <path d="M178 150 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
          <circle cx="168" cy="30" r="3.5" />
        </g>
      )}
      {mood === "thinking" && (
        <g fill={C.light}>
          <circle cx="166" cy="46" r="4.5" />
          <circle cx="178" cy="30" r="7" />
        </g>
      )}
      {mood === "sleepy" && (
        <g className="astrido__z" stroke="#AEB7DA" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M152 36 h14 l-14 16 h14" />
          <path d="M172 18 h9 l-9 10 h9" strokeWidth="3.5" />
        </g>
      )}
    </svg>
  );
}

export function SpeechBubble({ children, mood = "happy", size = 88 }: { children: React.ReactNode; mood?: AstridoMood; size?: number }) {
  return (
    <div className="speech">
      <Astrido mood={mood} size={size} />
      <div className="speech__bubble">{children}</div>
    </div>
  );
}
