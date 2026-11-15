import { useEffect, useState } from "react";

// Tema (RV-1): escuro por padrão, a pedido da equipe. Fonte de verdade = <meta name="color-scheme">,
// e o CSS lê essa meta (modern-web-guidance: dark-mode-toggle). Guardamos só a exceção ("light").
export type Theme = "dark" | "light";
const KEY = "astra-theme";

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

export function readTheme(): Theme {
  return meta()?.content === "light" ? "light" : "dark";
}

function apply(t: Theme) {
  const m = meta();
  if (m) m.content = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0A1033" : "#F4F6FB");
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);

  // Outra aba mudou o tema: acompanha.
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
      /* sem armazenamento: o tema vale só nesta sessão */
    }
    setTheme(next);
  };
  return [theme, toggle];
}
