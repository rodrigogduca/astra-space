import { createContext, useContext, useEffect, useState } from "react";

// Serviços globais da casca do app: rota por hash e abrir o diálogo de apoio.

const readHash = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);

export function useRoute(): string[] {
  const [parts, setParts] = useState(readHash);
  useEffect(() => {
    const on = () => {
      setParts(readHash());
      window.scrollTo({ top: 0 });
      // Leitor de tela percebe a troca de tela: foco vai para o título da página.
      requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>("main h1");
        if (h1) {
          h1.tabIndex = -1;
          h1.focus({ preventScroll: true });
        }
      });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}

export const go = (to: string) => {
  window.location.hash = to.replace(/^#/, "");
};

export const ShellContext = createContext<{ openSupport: () => void }>({ openSupport: () => {} });
export const useShell = () => useContext(ShellContext);
