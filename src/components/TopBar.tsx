import { useEffect, useRef } from "react";
import { Languages, Moon, MoreHorizontal, Sun, Wifi, WifiOff } from "lucide-react";
import { useStore } from "../store";
import { levelFor } from "../domain/gamification";
import type { IconName } from "../domain/icons";
import { AstraSymbol, AstraWordmark } from "./Logo";
import { Icon } from "./Icon";
import { Bar } from "./ui";
import { useTheme } from "./theme";
import { useLang } from "../i18n/lang";
import { useDomainText } from "../i18n/domainText";
import { locale } from "../i18n/lang";

type NavItem = { to: string; key: string; icon: IconName; pt: { label: string; short: string }; en: { label: string; short: string } };

export const NAV: NavItem[] = [
  { to: "#/", key: "", icon: "orbit", pt: { label: "Jornada", short: "Jornada" }, en: { label: "Journey", short: "Journey" } },
  { to: "#/health", key: "health", icon: "clipboard", pt: { label: "Prontuário", short: "Ficha" }, en: { label: "Health", short: "Health" } },
  { to: "#/challenges", key: "challenges", icon: "trophy", pt: { label: "Desafios", short: "Desafios" }, en: { label: "Challenges", short: "Goals" } },
  { to: "#/integrations", key: "integrations", icon: "satellite", pt: { label: "Integrações", short: "Conexões" }, en: { label: "Integrations", short: "Links" } },
  { to: "#/context", key: "context", icon: "book", pt: { label: "NASA/CSA", short: "NASA" }, en: { label: "NASA/CSA", short: "NASA" } },
  { to: "#/queue", key: "queue", icon: "cloud-upload", pt: { label: "Fila", short: "Fila" }, en: { label: "Queue", short: "Queue" } },
];

const T = {
  pt: {
    home: "Astra, início",
    sections: "Seções",
    pill: (s: number, xp: string) => `${s} dias de ofensiva e ${xp} XP. Ver desafios`,
    more: "Mais opções: nível, tema, idioma e enlace com a Terra",
    moreShort: "Mais opções",
    level: "Nível",
    toNext: (n: number, next: string) => `Faltam ${n} XP para ${next}`,
    maxLevel: "Nível máximo",
    light: "Usar tema claro",
    dark: "Usar tema escuro",
    language: "English version",
    languageHint: "Switch the interface to English",
    online: "Enlace com a Terra ativo",
    offline: "Sem enlace com a Terra",
    simulateLoss: "Simular perda de conexão",
    reconnect: "Reconectar (simulado)",
  },
  en: {
    home: "Astra, home",
    sections: "Sections",
    pill: (s: number, xp: string) => `${s}-day streak and ${xp} XP. See challenges`,
    more: "More options: level, theme, language and link to Earth",
    moreShort: "More options",
    level: "Level",
    toNext: (n: number, next: string) => `${n} XP to ${next}`,
    maxLevel: "Top level",
    light: "Use light theme",
    dark: "Use dark theme",
    language: "Versão em português",
    languageHint: "Mudar a interface para português",
    online: "Link to Earth active",
    offline: "No link to Earth",
    simulateLoss: "Simulate connection loss",
    reconnect: "Reconnect (simulated)",
  },
};

// Retractable header (RV-10): hides when scrolling down and comes back when scrolling up.
// CSS does this with scroll-state; the script covers browsers that support scroll-state but not yet
// the "scrolled" query (modern-web-guidance: content-first-noise-reduction). Both together do not conflict.
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
  const { lang, setLang, pick } = useLang();
  const dt = useDomainText();
  const t = pick(T);
  const xpText = xp.toLocaleString(locale());
  const lvl = levelFor(xp);
  const ref = useRef<HTMLElement>(null);
  useRetractFallback(ref);

  return (
    <header className="topbar" ref={ref}>
      <div className="topbar__inner">
        <a href="#/" className="brand" aria-label={t.home}>
          <AstraSymbol size={30} />
          <AstraWordmark height={17} morse={false} />
          <span className="brand__demo">Demo</span>
        </a>

        <nav className="tabs" aria-label={t.sections}>
          {NAV.map((n) => (
            <a key={n.key} href={n.to} className={`tab ${active === n.key ? "tab--on" : ""}`} aria-current={active === n.key ? "page" : undefined}>
              <Icon name={n.icon} size={17} />
              {n[lang].label}
            </a>
          ))}
        </nav>

        <div className="topbar__end">
          <a
            href="#/challenges"
            className={`status-pill ${streakSafeToday ? "" : "is-pending"}`}
            aria-label={t.pill(streak, xpText)}
          >
            <span>
              <Icon name="flame" size={16} />
              {streak}
            </span>
            <span>
              <Icon name="star" size={16} />
              {xpText}
            </span>
          </a>

          <button type="button" className={`icon-btn menu-btn ${state.online ? "" : "is-offline"}`} popoverTarget="astra-menu" aria-label={t.more}>
            <MoreHorizontal size={20} aria-hidden />
            {!state.online && <span className="menu-btn__dot" aria-hidden />}
          </button>

          <div id="astra-menu" popover="auto" className="menu-pop" aria-label={t.moreShort}>
            <div className="menu-pop__level">
              <p>
                <b>
                  {t.level} {lvl.index}
                </b>{" "}
                · {dt.level(lvl.name)}
              </p>
              <Bar value={lvl.progress} color="var(--accent)" height={8} />
              <p className="muted small">{lvl.next ? t.toNext(lvl.toNext, dt.level(lvl.next)) : t.maxLevel}</p>
            </div>
            <button type="button" className="menu-pop__item" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              {theme === "dark" ? t.light : t.dark}
            </button>
            <button type="button" className="menu-pop__item" onClick={() => setLang(lang === "en" ? "pt" : "en")} lang={lang === "en" ? "pt-BR" : "en"}>
              <Languages size={18} aria-hidden />
              <span>
                {t.language}
                <small className="muted">{t.languageHint}</small>
              </span>
            </button>
            <button type="button" className="menu-pop__item" onClick={() => dispatch({ type: "toggleOnline" })} aria-pressed={!state.online}>
              {state.online ? <Wifi size={18} aria-hidden /> : <WifiOff size={18} aria-hidden />}
              <span>
                {state.online ? t.online : t.offline}
                <small className="muted">{state.online ? t.simulateLoss : t.reconnect}</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ active }: { active: string }) {
  const { lang } = useLang();
  return (
    <nav className="bottomnav" aria-label={lang === "en" ? "Sections" : "Seções"}>
      {NAV.map((n) => (
        <a key={n.key} href={n.to} className={active === n.key ? "on" : ""} aria-current={active === n.key ? "page" : undefined}>
          <Icon name={n.icon} size={22} />
          {n[lang].short}
        </a>
      ))}
    </nav>
  );
}
