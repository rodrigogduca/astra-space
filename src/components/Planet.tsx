import { useId, type ReactNode } from "react";
import type { MissionId } from "../domain/gamification";

// Planets of the orbital route (RV-3). One fictional planet per mission, drawn in flat SVG:
// each has its own vivid palette, designed to shine over the night blue; tones vary through
// layers of translucent solid color (never gradients). Colors are the same in both themes.

export type PlanetState = "done" | "current" | "next";

// Short fictional names, one set per language. None is the name of a real planet.
export const PLANET_NAME: Record<"pt" | "en", Record<MissionId, string>> = {
  pt: {
    checkin: "Aurora",
    vitals: "Pulso",
    hydration: "Oceano",
    exercise: "Forja",
    breathe: "Brisa",
    earth: "Ninho",
    window: "Mirante",
    gratitude: "Lume",
    evening: "Sereno",
  },
  en: {
    checkin: "Aurora",
    vitals: "Pulse",
    hydration: "Ocean",
    exercise: "Forge",
    breathe: "Breeze",
    earth: "Nest",
    window: "Lookout",
    gratitude: "Glow",
    evening: "Serene",
  },
};

/** Planet name in the requested language. */
export const planetName = (id: MissionId, lang: "pt" | "en") => PLANET_NAME[lang][id];

// Palette of each planet: base (disc), hi (light details), lo (dark details) and extra (ring, moon, islands).
export const PLANET_COLOR: Record<MissionId, { base: string; hi: string; lo: string; extra: string }> = {
  checkin: { base: "#FF8A3D", hi: "#FFD166", lo: "#D9480F", extra: "#FFE8A3" }, // Aurora: golden-orange sunrise
  vitals: { base: "#F43F5E", hi: "#FF8FA3", lo: "#9F1239", extra: "#FFC2CF" }, // Pulse: pink-red
  hydration: { base: "#2563EB", hi: "#7DD3FC", lo: "#1E3A8A", extra: "#34D399" }, // Ocean: deep blue, green islands
  exercise: { base: "#EA580C", hi: "#FDBA74", lo: "#7C2D12", extra: "#FDE047" }, // Forge: embers with lava veins
  breathe: { base: "#06B6D4", hi: "#E0FCFF", lo: "#0E7490", extra: "#A5F3FC" }, // Breeze: cyan with clouds
  earth: { base: "#1D7CF2", hi: "#BFDBFE", lo: "#1E40AF", extra: "#22C55E" }, // Nest: blue and green, like Earth
  window: { base: "#14B8A6", hi: "#99F6E4", lo: "#0F766E", extra: "#5EEAD4" }, // Lookout: turquoise with rings
  gratitude: { base: "#FACC15", hi: "#FEF3C7", lo: "#B45309", extra: "#FB923C" }, // Glow: golden
  evening: { base: "#6D28D9", hi: "#C4B5FD", lo: "#2E1065", extra: "#FDE68A" }, // Serene: deep purple, night lights
};
const P = PLANET_COLOR;

// Shadow and light ink for the details: solid colors with opacity, the same in both themes.
const SHADE = "#0A1033";
const LIGHT = "#FFFFFF";

const CX = 80;
const CY = 86;
const R = 50;

type Look = {
  ring?: "wide" | "double";
  moon?: "round" | "crescent";
  details: ReactNode; // drawn on top, clipped to the planet disc
};

const LOOKS: Record<MissionId, Look> = {
  // Aurora: the sun rising at the top of the disc, golden bands over orange.
  checkin: {
    details: (
      <>
        <path d="M30 30 L130 30 L130 58 Q80 72 30 58 Z" fill={P.checkin.hi} opacity={0.95} />
        <path d="M30 58 Q80 72 130 58" stroke={P.checkin.extra} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M36 82 Q80 92 124 80" stroke={P.checkin.hi} strokeWidth="5" fill="none" opacity={0.55} strokeLinecap="round" />
        <path d="M38 102 Q80 112 122 100" stroke={P.checkin.lo} strokeWidth="6" fill="none" opacity={0.45} strokeLinecap="round" />
        <path d="M46 120 Q80 128 114 118" stroke={P.checkin.lo} strokeWidth="5" fill="none" opacity={0.4} strokeLinecap="round" />
      </>
    ),
  },
  // Pulse: rocky surface with light-rimmed craters.
  vitals: {
    details: (
      <>
        <path d="M30 104 Q60 96 90 108 T130 100 L130 140 L30 140Z" fill={P.vitals.lo} opacity={0.35} />
        {[
          [64, 70, 9],
          [98, 98, 12],
          [72, 108, 6],
          [104, 66, 5],
          [52, 92, 4.5],
          [88, 122, 5],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x + r * 0.2} cy={y + r * 0.2} r={r} fill={P.vitals.hi} opacity={0.8} />
            <circle cx={x} cy={y} r={r} fill={P.vitals.lo} opacity={0.75} />
          </g>
        ))}
      </>
    ),
  },
  // Ocean: blue sea with light waves and two green islands.
  hydration: {
    details: (
      <>
        <path d="M38 74 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke={P.hydration.hi} strokeWidth="3.5" fill="none" opacity={0.8} strokeLinecap="round" />
        <path d="M34 92 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke={P.hydration.hi} strokeWidth="3.5" fill="none" opacity={0.6} strokeLinecap="round" />
        <path d="M42 110 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" stroke={P.hydration.hi} strokeWidth="3.5" fill="none" opacity={0.45} strokeLinecap="round" />
        <path d="M58 54 q10 -8 22 -2 q8 6 -2 12 q-12 4 -20 -10z" fill={P.hydration.extra} />
        <path d="M96 100 q12 -6 18 4 q2 10 -10 10 q-12 -2 -8 -14z" fill={P.hydration.extra} />
      </>
    ),
  },
  // Forge: embers with lava veins and a wide tilted ring.
  exercise: {
    ring: "wide",
    details: (
      <>
        <path d="M30 96 Q80 84 130 96 L130 140 L30 140Z" fill={P.exercise.lo} opacity={0.55} />
        <path d="M44 72 L62 80 L58 92 L76 100" stroke={P.exercise.extra} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M96 64 L104 78 L118 82" stroke={P.exercise.extra} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M88 112 L100 118 L112 112" stroke={P.exercise.extra} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        <circle cx="66" cy="114" r="5" fill={P.exercise.hi} opacity={0.7} />
      </>
    ),
  },
  // Breeze: light clouds spiraling over cyan.
  breathe: {
    details: (
      <>
        <path d="M34 72 Q60 60 84 70 T130 66" stroke={P.breathe.hi} strokeWidth="8" fill="none" opacity={0.85} strokeLinecap="round" />
        <path d="M44 94 Q70 84 92 94 T128 92" stroke={P.breathe.hi} strokeWidth="6" fill="none" opacity={0.65} strokeLinecap="round" />
        <path d="M40 114 Q62 106 84 114" stroke={P.breathe.lo} strokeWidth="5" fill="none" opacity={0.5} strokeLinecap="round" />
        <circle cx="104" cy="112" r="8" fill="none" stroke={P.breathe.hi} strokeWidth="3.5" opacity={0.8} />
      </>
    ),
  },
  // Nest: blue ocean, green continents, a polar cap and a small moon keeping it company.
  earth: {
    moon: "round",
    details: (
      <>
        <path d="M44 70 q14 -14 30 -6 q10 6 4 16 q-8 10 -22 6 q-14 -4 -12 -16z" fill={P.earth.extra} />
        <path d="M86 96 q16 -8 26 4 q6 10 -6 16 q-14 6 -22 -4 q-4 -10 2 -16z" fill={P.earth.extra} />
        <path d="M60 108 q6 -4 10 2 q-2 6 -10 -2z" fill={P.earth.extra} />
        <path d="M40 90 Q70 84 100 92" stroke={P.earth.hi} strokeWidth="4" fill="none" opacity={0.7} strokeLinecap="round" />
        <path d="M30 30 L130 30 L130 44 Q80 52 30 44Z" fill={LIGHT} opacity={0.9} />
      </>
    ),
  },
  // Lookout: turquoise bands and two thin rings, made to be contemplated.
  window: {
    ring: "double",
    details: (
      <>
        <rect x="30" y="62" width="100" height="9" fill={P.window.lo} opacity={0.5} />
        <rect x="30" y="82" width="100" height="14" fill={P.window.hi} opacity={0.55} />
        <rect x="30" y="104" width="100" height="6" fill={P.window.lo} opacity={0.5} />
      </>
    ),
  },
  // Glow: golden giant with bands and a bright spot.
  gratitude: {
    details: (
      <>
        <path d="M30 60 Q80 66 130 58 L130 66 Q80 74 30 68Z" fill={P.gratitude.hi} opacity={0.85} />
        <path d="M30 78 Q80 84 130 76 L130 88 Q80 96 30 90Z" fill={P.gratitude.lo} opacity={0.35} />
        <path d="M30 102 Q80 108 130 100 L130 106 Q80 114 30 108Z" fill={P.gratitude.hi} opacity={0.7} />
        <ellipse cx="96" cy="94" rx="11" ry="6.5" fill={P.gratitude.extra} />
        <ellipse cx="96" cy="94" rx="5" ry="2.8" fill={P.gratitude.hi} />
      </>
    ),
  },
  // Serene: the night planet, deep purple with small lights and a crescent moon.
  evening: {
    moon: "crescent",
    details: (
      <>
        <path d="M30 78 Q80 86 130 76" stroke={P.evening.hi} strokeWidth="5" fill="none" opacity={0.4} />
        <path d="M30 98 Q80 90 130 100 L130 140 L30 140Z" fill={P.evening.lo} opacity={0.5} />
        {[
          [62, 96],
          [70, 104],
          [84, 100],
          [96, 112],
          [56, 112],
          [108, 92],
          [76, 118],
          [90, 124],
          [64, 122],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill={P.evening.extra} />
        ))}
      </>
    ),
  },
};

function Ring({ kind, half, clipId, color }: { kind: "wide" | "double"; half: "back" | "front"; clipId: string; color: string }) {
  const tilt = kind === "wide" ? -18 : 14;
  const strokes =
    kind === "wide"
      ? [{ rx: 66, ry: 15, w: 7, o: 1 }]
      : [
          { rx: 62, ry: 13, w: 3, o: 1 },
          { rx: 72, ry: 16, w: 2.2, o: 0.7 },
        ];
  return (
    <g transform={`rotate(${tilt} ${CX} ${CY})`} clipPath={half === "front" ? `url(#${clipId})` : undefined} className="planet__ring">
      {strokes.map((s, i) => (
        <ellipse key={i} cx={CX} cy={CY} rx={s.rx} ry={s.ry} fill="none" stroke={color} strokeWidth={s.w} opacity={s.o} />
      ))}
    </g>
  );
}

export function Planet({ mission, size = 120, state, className = "" }: { mission: MissionId; size?: number; state: PlanetState; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const look = LOOKS[mission];
  const pal = P[mission];
  const disc = `pd-${uid}`;
  const lit = `pl-${uid}`;
  const front = `pf-${uid}`;
  const ringColor = mission === "exercise" ? pal.hi : pal.extra;

  return (
    <svg
      className={`planet planet--${state} planet--${mission} ${className}`}
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
        {/* terminator shadow: the disc minus a circle shifted toward the light */}
        <mask id={lit}>
          <rect width="160" height="160" fill="#fff" />
          <circle cx={CX - 13} cy={CY - 14} r={R + 6} fill="#000" />
        </mask>
        {/* front half of the ring (passes over the planet) */}
        <clipPath id={front}>
          <rect x="0" y={CY} width="160" height="80" />
        </clipPath>
      </defs>

      {/* atmosphere: flat translucent rim in the planet color (the glow pulses in CSS) */}
      <circle className="planet__glow" cx={CX} cy={CY} r={R + 7} fill={pal.base} opacity={0.24} />

      {/* orbit drawn around the current planet */}
      {state === "current" && <circle className="planet__halo" cx={CX} cy={CY} r={R + 12} fill="none" />}

      <g className="planet__body">
        {look.ring && <Ring kind={look.ring} half="back" clipId={front} color={ringColor} />}

        <circle cx={CX} cy={CY} r={R} fill={pal.base} />
        <g clipPath={`url(#${disc})`}>
          {look.details}
          <circle cx={CX} cy={CY} r={R} fill={SHADE} opacity={0.3} mask={`url(#${lit})`} />
        </g>
        {/* flat highlight */}
        <ellipse cx={CX - 20} cy={CY - 22} rx="9" ry="5" fill={LIGHT} opacity={0.55} transform={`rotate(-38 ${CX - 20} ${CY - 22})`} />

        {look.ring && <Ring kind={look.ring} half="front" clipId={front} color={ringColor} />}

        {look.moon === "round" && (
          <g>
            <circle cx="134" cy="44" r="10" fill="#E2E8F0" />
            <circle cx="131" cy="42" r="2.4" fill={SHADE} opacity={0.25} />
            <circle cx="137" cy="48" r="1.8" fill={SHADE} opacity={0.2} />
          </g>
        )}
        {look.moon === "crescent" && <path d="M138 34 a13 13 0 1 0 6 22 a10 10 0 1 1 -6 -22z" fill={pal.extra} />}
      </g>

      {/* visited planet: small cream flag with a violet star, planted on top */}
      {state === "done" && (
        <g className="planet__flag">
          <path d={`M${CX + 8} ${CY - R + 1} L${CX + 12} ${CY - R - 34}`} stroke="#FFFBED" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${CX + 12} ${CY - R - 34} L${CX + 40} ${CY - R - 30} L${CX + 33} ${CY - R - 22} L${CX + 38} ${CY - R - 13} L${CX + 10} ${CY - R - 17} Z`} fill="#FFFBED" />
          <path
            d="M0 -5 L1.5 -1.6 L5 -1.5 L2.3 0.8 L3.1 4.4 L0 2.4 L-3.1 4.4 L-2.3 0.8 L-5 -1.5 L-1.5 -1.6 Z"
            fill="#4624C1"
            transform={`translate(${CX + 22} ${CY - R - 24}) rotate(6)`}
          />
        </g>
      )}
    </svg>
  );
}
