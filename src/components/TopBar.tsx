import { useEffect, useRef } from "react";
import { Moon, MoreHorizontal, Sun, Wifi, WifiOff } from "lucide-react";
import { useStore } from "../store";
import { levelFor } from "../domain/gamification";
import type { IconName } from "../domain/icons";
import { Astrido } from "./Astrido";
import { Icon } from "./Icon";
import { Bar } from "./ui";
import { useTheme } from "./theme";

export const NAV: { to: string; key: string; label: string; short: string; icon: IconName }[] = [
  { to: "#/", key: "", label: "Jornada", short: "Jornada", icon: "orbit" },
  { to: "#/prontuario", key: "prontuario", label: "Prontuário", short: "Ficha", icon: "clipboard" },
  { to: "#/desafios", key: "desafios", label: "Desafios", short: "Desafios", icon: "trophy" },
  { to: "#/integracoes", key: "integracoes", label: "Integrações", short: "Conexões", icon: "satellite" },
  { to: "#/contexto", key: "contexto", label: "NASA/CSA", short: "NASA", icon: "book" },
  { to: "#/linha-do-tempo", key: "linha-do-tempo", label: "Fila", short: "Fila", icon: "cloud-upload" },
];

// Cabeçalho retrátil (RV-10): some ao rolar para baixo e volta ao rolar para cima.
// CSS faz isso com scroll-state; o script cobre navegadores que aceitam scroll-state mas ainda não
// a consulta "scrolled" (modern-web-guidance: content-first-noise-reduction). Os dois juntos não brigam.
function useRetractFallback(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let lastY = scrollY;
    const on = () => {
      const bar = ref.current;
      const y = Math.max(0, Math.min(scrollY, document.documentElement.scrollHeight - innerHeight));
      if (y === lastY || !bar) return;
      bar.classList.toggle("is-hidden", y > lastY && y > bar.offsetHeight);
      lastY = y;
    };
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [ref]);
}

export function TopBar({ active }: { active: string }) {
  const { state, dispatch, xp, streak, streakSafeToday } = useStore();
  const [theme, toggleTheme] = useTheme();
  const lvl = levelFor(xp);
  const ref = useRef<HTMLElement>(null);
  useRetractFallback(ref);

  return (
    <header className="topbar" ref={ref}>
      <div className="topbar__inner">
        <a href="#/" className="brand" aria-label="Astra, início">
          <Astrido size={34} />
          <span>Astra</span>
          <span className="brand__demo">Demo</span>
        </a>

        <nav className="tabs" aria-label="Seções">
          {NAV.map((n) => (
            <a key={n.key} href={n.to} className={`tab ${active === n.key ? "tab--on" : ""}`} aria-current={active === n.key ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="topbar__end">
          <a
            href="#/desafios"
            className={`status-pill ${streakSafeToday ? "" : "is-pending"}`}
            aria-label={`${streak} dias de ofensiva e ${xp.toLocaleString("pt-BR")} XP. Ver desafios`}
          >
            <span>
              <Icon name="flame" size={16} />
              {streak}
            </span>
            <span>
              <Icon name="star" size={16} />
              {xp.toLocaleString("pt-BR")}
            </span>
          </a>

          <button type="button" className={`icon-btn menu-btn ${state.online ? "" : "is-offline"}`} popoverTarget="astra-menu" aria-label="Mais opções: nível, tema e enlace com a Terra">
            <MoreHorizontal size={20} aria-hidden />
            {!state.online && <span className="menu-btn__dot" aria-hidden />}
          </button>

          <div id="astra-menu" popover="auto" className="menu-pop" aria-label="Mais opções">
            <div className="menu-pop__level">
              <p>
                <b>Nível {lvl.index}</b> · {lvl.name}
              </p>
              <Bar value={lvl.progress} color="var(--accent)" height={8} />
              <p className="muted small">{lvl.next ? `Faltam ${lvl.toNext} XP para ${lvl.next}` : "Nível máximo"}</p>
            </div>
            <button type="button" className="menu-pop__item" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              {theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            </button>
            <button type="button" className="menu-pop__item" onClick={() => dispatch({ type: "toggleOnline" })} aria-pressed={!state.online}>
              {state.online ? <Wifi size={18} aria-hidden /> : <WifiOff size={18} aria-hidden />}
              <span>
                {state.online ? "Enlace com a Terra ativo" : "Sem enlace com a Terra"}
                <small className="muted">{state.online ? "Simular perda de conexão" : "Reconectar (simulado)"}</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottomnav" aria-label="Seções">
      {NAV.map((n) => (
        <a key={n.key} href={n.to} className={active === n.key ? "on" : ""} aria-current={active === n.key ? "page" : undefined}>
          <Icon name={n.icon} size={22} />
          {n.short}
        </a>
      ))}
    </nav>
  );
}
