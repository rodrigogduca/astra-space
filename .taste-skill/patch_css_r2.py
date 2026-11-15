import sys

p = sys.argv[1]
s = open(p, encoding="utf-8").read()
lines = s.split("\n")


def block(start_marker, end_marker):
    a = next(i for i, l in enumerate(lines) if l.startswith(start_marker))
    b = next(i for i, l in enumerate(lines) if l.startswith(end_marker) and i > a)
    return a, b


SKY = """/* ---------- céu (RV-11): três camadas derivando + estrelas cadentes ---------- */
.starfield { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.starfield__layer { position: absolute; top: 0; left: 0; height: 100%; width: 200%; display: flex; will-change: transform; animation: drift linear infinite; }
.starfield__layer svg { width: 50%; height: 100%; flex-shrink: 0; }
.starfield__layer--far { animation-duration: 420s; }
.starfield__layer--mid { animation-duration: 260s; }
.starfield__layer--near { animation-duration: 150s; }
@keyframes drift { to { transform: translateX(-50%); } }
.star { fill: #ffffff; }
.star--twinkle { animation: twinkle 4.5s ease-in-out infinite; }
@keyframes twinkle { 50% { opacity: 0.1; } }
.shooting-star {
  position: absolute; width: 140px; height: 2px; border-radius: 2px; background: #ffffff; opacity: 0;
  transform-origin: right center; animation: shoot linear infinite;
}
.shooting-star--a { top: 14%; right: 8%; animation-duration: 13s; animation-delay: 4s; }
.shooting-star--b { top: 34%; right: 38%; animation-duration: 19s; animation-delay: 11s; }
@keyframes shoot {
  0% { transform: rotate(-24deg) translateX(0) scaleX(0.2); opacity: 0; }
  1.5% { opacity: 0.9; }
  6% { transform: rotate(-24deg) translateX(-620px) scaleX(1); opacity: 0; }
  100% { transform: rotate(-24deg) translateX(-620px) scaleX(1); opacity: 0; }
}
LIGHT .starfield { display: none; }
"""

LAYOUT_HEAD = """/* ---------- layout ---------- */
.app { position: relative; min-height: 100svh; display: flex; flex-direction: column; }
/* Conteúdo acima do céu; itens fixos (barra inferior, toast) mantêm o próprio position. */
.main, .credits { position: relative; z-index: 1; }
.storage-warning { position: relative; z-index: 2; background: var(--surface-2); color: var(--ink); text-align: center; font-weight: 600; font-size: var(--step-small); padding: 6px; }
"""

TOP = """/* ---------- topo (RV-10): uma barra, retrátil no desktop ---------- */
html { container-type: scroll-state; }
.topbar {
  position: sticky; top: 0; z-index: 20; background: var(--bg);
  transition: transform .28s cubic-bezier(.2, .8, .2, 1);
}
DARK .topbar { background: rgba(10, 16, 51, 0.9); }
@media (min-width: 861px) {
  @container scroll-state((scrolled: bottom) and (scrollable: top)) {
    .topbar { transform: translateY(-100%); }
  }
  .topbar.is-hidden { transform: translateY(-100%); }
}
.topbar:focus-within, .topbar.is-hidden:focus-within { transform: none; }
.topbar__inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; gap: 24px; padding: 12px var(--gutter); }
.brand { display: flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.05em; }
.brand__demo { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0; color: var(--accent-ink); background: var(--accent); border-radius: 999px; padding: 1px 8px; }
.tabs { display: flex; gap: 2px; flex: 1; min-width: 0; justify-content: center; }
.tab {
  text-decoration: none; color: var(--ink-2); font-weight: 600; padding: 8px 14px; border-radius: 999px; white-space: nowrap;
  transition: background-color .15s, color .15s;
}
.tab:hover { color: var(--ink); background: var(--surface); }
.tab--on { color: var(--ink); background: var(--surface-2); }
.topbar__end { display: flex; align-items: center; gap: 8px; }
.status-pill {
  display: inline-flex; align-items: center; gap: 12px; text-decoration: none; font-weight: 800; font-variant-numeric: tabular-nums;
  background: var(--surface); border-radius: 999px; padding: 8px 14px; min-height: 40px; transition: background-color .15s;
}
.status-pill:hover { background: var(--surface-2); }
.status-pill > span { display: inline-flex; align-items: center; gap: 5px; }
.status-pill .icon { color: var(--accent-text); }
.status-pill.is-pending > span:first-child .icon { color: var(--ink-2); }
.icon-btn {
  position: relative; display: inline-grid; place-items: center; border: 0; background: var(--surface); color: var(--ink);
  border-radius: 999px; width: 40px; height: 40px; cursor: pointer; transition: background-color .15s;
}
.icon-btn:hover { background: var(--surface-2); }
.menu-btn__dot { position: absolute; top: 6px; right: 6px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
/* menu em popover nativo, preso ao canto do topo (funciona sem anchor positioning) */
.menu-pop {
  margin: 0; inset: 64px var(--gutter) auto auto; width: min(320px, calc(100vw - 32px));
  background: var(--surface); color: var(--ink); border: 0; border-radius: var(--radius); padding: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, .45); /* taste-skill-ignore: menu flutua de verdade */
}
.menu-pop:popover-open { display: flex; flex-direction: column; gap: 4px; }
.menu-pop__level { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px 14px; }
.menu-pop__item {
  display: flex; align-items: center; gap: 12px; text-align: left; border: 0; background: transparent; color: var(--ink);
  border-radius: var(--radius-sm); padding: 12px; font-weight: 600; cursor: pointer;
}
.menu-pop__item:hover { background: var(--surface-2); }
.menu-pop__item span { display: flex; flex-direction: column; }
.menu-pop__item small { font-size: var(--step-small); font-weight: 400; }

/* selo permanente de demonstração (REQ-10.1) */
.demo-pill {
  position: fixed; left: 16px; bottom: 16px; z-index: 15; margin: 0; font-size: 0.8125rem; font-weight: 600;
  background: var(--surface); color: var(--ink-2); border-radius: 999px; padding: 6px 12px; pointer-events: none;
}

.bottomnav { display: none; }
@media (max-width: 1080px) { .tab { padding: 8px 10px; } .topbar__inner { gap: 14px; } }
@media (max-width: 860px) {
  .tabs { display: none; }
  .topbar__inner { padding: 10px 16px; gap: 8px; }
  .brand { flex: 1; font-size: 1.3rem; }
  .status-pill { gap: 8px; padding: 6px 12px; }
  .menu-pop { inset: 60px 12px auto auto; }
  .main { padding: 20px 16px 120px; }
  .demo-pill { display: none; }
  .bottomnav {
    display: grid; grid-template-columns: repeat(6, 1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
    background: var(--surface); padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
  }
  .bottomnav a {
    text-decoration: none; color: var(--ink-2); display: flex; flex-direction: column; align-items: center;
    font-size: 0.8125rem; font-weight: 600; gap: 3px; padding: 6px 2px; border-radius: 14px; min-height: 52px;
  }
  .bottomnav a.on { color: var(--accent-ink); background: var(--accent); }
}
"""

L = ':root:has(> head > meta[name="color-scheme"][content="light"])'
D = ':root:not(:has(> head > meta[name="color-scheme"][content="light"]))'

a, b = block("/* ---------- céu", "/* ---------- layout")
lines[a:b] = SKY.replace("LIGHT", L).split("\n")
a, b = block("/* ---------- layout", ".main {")
lines[a:b] = LAYOUT_HEAD.split("\n")
a, b = block("/* ---------- topo", "/* ---------- painéis")
lines[a:b] = TOP.replace("DARK", D).split("\n")
s = "\n".join(lines)
s = s.replace("@media (min-width: 861px) { .credits { padding-bottom: 40px; } }", "@media (min-width: 861px) { .credits { padding-bottom: 64px; } }")
open(p, "w", encoding="utf-8").write(s)
print("ok")
