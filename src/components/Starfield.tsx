import { useMemo } from "react";

// Background sky (RV-2, RV-11): the brand's violet glows breathing slowly, three star layers drifting at different speeds
// (parallax), some twinkling, and shooting stars now and then.
// Only transform/opacity; with prefers-reduced-motion the CSS stops everything and the sky stays still.

function rand(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

type Layer = { id: string; count: number; size: [number, number]; opacity: [number, number]; twinkleEvery: number; seed: number };

const LAYERS: Layer[] = [
  { id: "far", count: 220, size: [0.5, 0.9], opacity: [0.25, 0.55], twinkleEvery: 0, seed: 11 },
  { id: "mid", count: 90, size: [0.8, 1.4], opacity: [0.45, 0.8], twinkleEvery: 9, seed: 23 },
  { id: "near", count: 28, size: [1.4, 2.2], opacity: [0.7, 1], twinkleEvery: 3, seed: 46 },
];

// Each layer is a strip with the same sky repeated twice side by side; sliding
// half the width closes the loop seamlessly.
function LayerSvg({ layer }: { layer: Layer }) {
  const stars = useMemo(() => {
    const r = rand(layer.seed);
    return Array.from({ length: layer.count }, (_, i) => ({
      x: r() * 1000,
      y: r() * 1000,
      s: layer.size[0] + r() * (layer.size[1] - layer.size[0]),
      o: layer.opacity[0] + r() * (layer.opacity[1] - layer.opacity[0]),
      twinkle: layer.twinkleEvery > 0 && i % layer.twinkleEvery === 0,
      delay: (r() * 7).toFixed(2),
    }));
  }, [layer]);
  return (
    <div className={`starfield__layer starfield__layer--${layer.id}`}>
      {[0, 1].map((copy) => (
        <svg key={copy} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          {stars.map((st, i) => (
            <circle
              key={i}
              cx={st.x}
              cy={st.y}
              r={st.s}
              opacity={st.o}
              className={st.twinkle ? "star star--twinkle" : "star"}
              style={st.twinkle ? { animationDelay: `${st.delay}s` } : undefined}
            />
          ))}
        </svg>
      ))}
    </div>
  );
}

export function Starfield() {
  return (
    <div className="starfield" aria-hidden>
      <span className="sky-glow sky-glow--a" />
      <span className="sky-glow sky-glow--b" />
      {LAYERS.map((l) => (
        <LayerSvg key={l.id} layer={l} />
      ))}
      <span className="shooting-star shooting-star--a" />
      <span className="shooting-star shooting-star--b" />
    </div>
  );
}
