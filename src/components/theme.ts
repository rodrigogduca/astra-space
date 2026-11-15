import { useEffect, useState } from "react";

// Theme (RV-1): dark by default, at the team's request. Source of truth = <meta name="color-scheme">,
// and the CSS reads that meta (modern-web-guidance: dark-mode-toggle). Only the exception ("light") is stored.
export type Theme = "dark" | "light";
const KEY = "astra-theme";

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

export function readTheme(): Theme {
  return meta()?.content === "light" ? "light" : "dark";
}

function apply(t: Theme) {
  const m = meta();
  if (m) m.content = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#070742" : "#FFFBED");
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);

  // Another tab changed the theme: follow it.
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const t: Theme = e.newValue === "light" ? "light" : "dark";
      apply(t);
      setTheme(t);
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      if (next === "dark") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* no storage: the theme applies to this session only */
    }
    setTheme(next);
  };
  return [theme, toggle];
}
