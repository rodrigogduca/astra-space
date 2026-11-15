import { useId, type ReactNode } from "react";
import type { MissionId } from "../domain/gamification";

// Planetas da rota orbital (RV-3). Um planeta fictício por missão, desenhado em SVG chapado:
// cor-base pela família do pilar, tons variados por camadas de cor sólida translúcida (nunca gradiente).

export type PlanetState = "done" | "current" | "next";

// Nomes fictícios, curtos, em português. Nenhum é nome de planeta real.
export const PLANET_NAME: Record<MissionId, string> = {
  checkin: "Aurora",
  vitals: "Pulso",
  hydration: "Oceano",
  exercise: "Forja",
  breathe: "Brisa",
  earth: "Ninho",
  window: "Mirante",
  gratitude: "Lume",
  evening: "Sereno",
};

const PILLAR_OF: Record<MissionId, "corpo" | "mente" | "espirito"> = {
  checkin: "mente",
  vitals: "corpo",
  hydration: "corpo",
  exercise: "corpo",
  breathe: "mente",
  earth: "espirito",
  window: "espirito",
  gratitude: "espirito",
  evening: "espirito",
};

// Tinta de sombra e de luz para os detalhes: cores sólidas com opacidade, iguais nos dois temas.
const SHADE = "#0A1033";
const LIGHT = "#FFFFFF";

const CX = 80;
const CY = 86;
const R = 50;

type Look = {
  tone?: { color: string; opacity: number }; // desloca o tom da cor-base
  ring?: "wide" | "double";
  moon?: "round" | "crescent";
  details: ReactNode; // desenhados por cima, recortados no disco do planeta
};

const LOOKS: Record<MissionId, Look> = {
  // Aurora: calota polar clara e faixas finas, um planeta frio de manhã cedo.
  checkin: {
    tone: { color: LIGHT, opacity: 0.12 },
    details: (
      <>
        <path d="M30 56 Q80 70 130 56 L130 30 L30 30 Z" fill={LIGHT} opacity={0.88} />
        <path d="M36 62 Q58 70 74 66 Q88 63 100 68 Q112 72 124 66" stroke={LIGHT} strokeWidth="4" fill="none" opacity={0.55} strokeLinecap="round" />
        <path d="M40 96 Q80 104 122 94" stroke={SHADE} strokeWidth="5" fill="none" opacity={0.14} strokeLinecap="round" />
        <path d="M44 112 Q80 120 116 110" stroke={SHADE} strokeWidth="4" fill="none" opacity={0.12} strokeLinecap="round" />
      </>
    ),
  },
  // Pulso: superfície rochosa com crateras de bordas claras.
  vitals: {
    tone: { color: SHADE, opacity: 0.08 },
    details: (
      <>
        {[
          [64, 70, 9],
          [98, 98, 12],
          [72, 108, 6],
          [104, 66, 5],
          [52, 92, 4.5],
          [88, 122, 5],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x + r * 0.18} cy={y + r * 0.18} r={r} fill={LIGHT} opacity={0.28} />
            <circle cx={x} cy={y} r={r} fill={SHADE} opacity={0.24} />
          </g>
        ))}
      </>
    ),
  },
  // Oceano: mar com ondas claras e duas ilhas.
  hydration: {
    tone: { color: "var(--mente)", opacity: 0.38 },
    details: (
      <>
        <path d="M38 74 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke={LIGHT} strokeWidth="3.5" fill="none" opacity={0.45} strokeLinecap="round" />
        <path d="M34 92 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke={LIGHT} strokeWidth="3.5" fill="none" opacity={0.35} strokeLinecap="round" />
        <path d="M42 110 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" stroke={LIGHT} strokeWidth="3.5" fill="none" opacity={0.28} strokeLinecap="round" />
        <path d="M58 54 q10 -8 22 -2 q8 6 -2 12 q-12 4 -20 -10z" fill="var(--corpo)" />
        <path d="M96 100 q12 -6 18 4 q2 10 -10 10 q-12 -2 -8 -14z" fill="var(--corpo)" />
      </>
    ),
  },
  // Forja: planeta denso, mais escuro, com um anel largo inclinado.
  exercise: {
    tone: { color: SHADE, opacity: 0.22 },
    ring: "wide",
    details: (
      <>
        <path d="M36 70 L124 70" stroke={LIGHT} strokeWidth="6" opacity={0.16} />
        <path d="M36 100 L124 100" stroke={LIGHT} strokeWidth="9" opacity={0.12} />
        <circle cx="66" cy="84" r="7" fill={SHADE} opacity={0.22} />
        <circle cx="104" cy="114" r="5" fill={SHADE} opacity={0.2} />
      </>
    ),
  },
  // Brisa: nuvens em espiral passando pelo disco.
  breathe: {
    tone: { color: LIGHT, opacity: 0.2 },
    details: (
      <>
        <path d="M34 72 Q60 60 84 70 T130 66" stroke={LIGHT} strokeWidth="8" fill="none" opacity={0.6} strokeLinecap="round" />
        <path d="M44 94 Q70 84 92 94 T128 92" stroke={LIGHT} strokeWidth="6" fill="none" opacity={0.45} strokeLinecap="round" />
        <path d="M40 114 Q62 106 84 114" stroke={LIGHT} strokeWidth="5" fill="none" opacity={0.4} strokeLinecap="round" />
        <circle cx="104" cy="112" r="8" fill="none" stroke={LIGHT} strokeWidth="3.5" opacity={0.5} />
      </>
    ),
  },
  // Ninho: continentes suaves e uma lua pequena que faz companhia.
  earth: {
    moon: "round",
    details: (
      <>
        <path d="M44 70 q14 -14 30 -6 q10 6 4 16 q-8 10 -22 6 q-14 -4 -12 -16z" fill={SHADE} opacity={0.18} />
        <path d="M86 96 q16 -8 26 4 q6 10 -6 16 q-14 6 -22 -4 q-4 -10 2 -16z" fill={SHADE} opacity={0.18} />
        <path d="M60 108 q6 -4 10 2 q-2 6 -10 -2z" fill={SHADE} opacity={0.16} />
        <circle cx="98" cy="62" r="4" fill={LIGHT} opacity={0.45} />
      </>
    ),
  },
  // Mirante: faixas largas e dois anéis finos, feito para ser contemplado.
  window: {
    tone: { color: LIGHT, opacity: 0.1 },
    ring: "double",
    details: (
      <>
        <rect x="30" y="62" width="100" height="9" fill={SHADE} opacity={0.14} />
        <rect x="30" y="82" width="100" height="14" fill={LIGHT} opacity={0.22} />
        <rect x="30" y="104" width="100" height="6" fill={SHADE} opacity={0.14} />
      </>
    ),
  },
  // Lume: gigante gasoso com faixas e uma mancha luminosa.
  gratitude: {
    tone: { color: "var(--accent)", opacity: 0.18 },
    details: (
      <>
        <path d="M30 60 Q80 66 130 58 L130 66 Q80 74 30 68Z" fill={LIGHT} opacity={0.3} />
        <path d="M30 78 Q80 84 130 76 L130 88 Q80 96 30 90Z" fill={SHADE} opacity={0.14} />
        <path d="M30 102 Q80 108 130 100 L130 106 Q80 114 30 108Z" fill={LIGHT} opacity={0.26} />
        <ellipse cx="96" cy="94" rx="11" ry="6.5" fill="var(--accent)" />
        <ellipse cx="96" cy="94" rx="5" ry="2.8" fill={LIGHT} opacity={0.55} />
      </>
    ),
  },
  // Sereno: planeta da noite, lado escuro com luzes pequenas e lua crescente.
  evening: {
    tone: { color: SHADE, opacity: 0.34 },
    moon: "crescent",
    details: (
      <>
        <path d="M30 78 Q80 86 130 76" stroke={LIGHT} strokeWidth="5" fill="none" opacity={0.12} />
        {[
          [62, 96],
          [70, 104],
          [84, 100],
          [96, 112],
          [56, 112],
          [108, 92],
          [76, 118],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.8} fill="var(--accent)" />
        ))}
      </>
    ),
  },
};

function Ring({ kind, half, clipId }: { kind: "wide" | "double"; half: "back" | "front"; clipId: string }) {
  const tilt = kind === "wide" ? -18 : 14;
  const strokes =
    kind === "wide"
      ? [{ rx: 66, ry: 15, w: 7, o: 1, color: "currentColor" }]
      : [
          { rx: 62, ry: 13, w: 3, o: 1, color: "currentColor" },
          { rx: 72, ry: 16, w: 2.2, o: 0.7, color: "currentColor" },
        ];
  return (
    <g transform={`rotate(${tilt} ${CX} ${CY})`} clipPath={half === "front" ? `url(#${clipId})` : undefined} className="planet__ring">
      {strokes.map((s, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={s.rx} ry={s.ry} fill="none" stroke={s.color} strokeWidth={s.w} opacity={s.o} />
      ))}
    </g>
  );
}

export function Planet({ mission, size = 120, state, className = "" }: { mission: MissionId; size?: number; state: PlanetState; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const look = LOOKS[mission];
  const pillar = PILLAR_OF[mission];
  const disc = `pd-${uid}`;
  const lit = `pl-${uid}`;
  const front = `pf-${uid}`;

  return (
    <svg
      className={`planet planet--${state} planet--${pillar} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={disc}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        {/* sombra do terminador: o disco menos um círculo deslocado para a luz */}
        <mask id={lit}>
          <rect width="160" height="160" fill="#fff" />
          <circle cx={CX - 13} cy={CY - 14} r={R + 6} fill="#000" />
        </mask>
        {/* metade da frente do anel (passa por cima do planeta) */}
        <clipPath id={front}>
          <rect x="0" y={CY} width="160" height="80" />
        </clipPath>
      </defs>

      {/* órbita marcada ao redor do planeta atual */}
      {state === "current" && <circle className="planet__halo" cx={CX} cy={CY} r={R + 12} fill="none" />}

      <g className="planet__body" style={{ color: `var(--${pillar})` }}>
        {look.ring && <Ring kind={look.ring} half="back" clipId={front} />}

        <circle cx={CX} cy={CY} r={R} fill="currentColor" />
        <g clipPath={`url(#${disc})`}>
          {look.tone && <circle cx={CX} cy={CY} r={R} fill={look.tone.color} opacity={look.tone.opacity} />}
          {look.details}
          <circle cx={CX} cy={CY} r={R} fill={SHADE} opacity={0.26} mask={`url(#${lit})`} />
        </g>
        {/* brilho chapado */}
        <ellipse cx={CX - 20} cy={CY - 22} rx="9" ry="5" fill={LIGHT} opacity={0.4} transform={`rotate(-38 ${CX - 20} ${CY - 22})`} />

        {look.ring && <Ring kind={look.ring} half="front" clipId={front} />}

        {look.moon === "round" && (
          <g>
            <circle cx="134" cy="44" r="10" fill="currentColor" />
            <circle cx="134" cy="44" r="10" fill={LIGHT} opacity={0.45} />
            <circle cx="131" cy="42" r="2.4" fill={SHADE} opacity={0.18} />
          </g>
        )}
        {look.moon === "crescent" && <path d="M138 34 a13 13 0 1 0 6 22 a10 10 0 1 1 -6 -22z" fill="var(--accent)" />}
      </g>

      {/* planeta visitado: bandeirinha amarela com estrela, fincada no topo */}
      {state === "done" && (
        <g className="planet__flag">
          <path d={`M${CX + 8} ${CY - R + 1} L${CX + 12} ${CY - R - 34}`} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${CX + 12} ${CY - R - 34} L${CX + 40} ${CY - R - 30} L${CX + 33} ${CY - R - 22} L${CX + 38} ${CY - R - 13} L${CX + 10} ${CY - R - 17} Z`} fill="var(--accent)" />
          <path
            d="M0 -5 L1.5 -1.6 L5 -1.5 L2.3 0.8 L3.1 4.4 L0 2.4 L-3.1 4.4 L-2.3 0.8 L-5 -1.5 L-1.5 -1.6 Z"
            fill="var(--accent-ink)"
            transform={`translate(${CX + 22} ${CY - R - 24}) rotate(6)`}
          />
        </g>
      )}
    </svg>
  );
}
