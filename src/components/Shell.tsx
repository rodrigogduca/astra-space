import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

// Global services of the app shell: hash routing (with animated transitions between screens) and the support dialog.

const readHash = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Screen readers notice the screen change: focus moves to the page title.
function focusTitle() {
  const h1 = document.querySelector<HTMLElement>("main h1");
  if (h1) {
    h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  }
}

export function useRoute(): string[] {
  const [parts, setParts] = useState(readHash);
  useEffect(() => {
    const on = () => {
      const next = readHash();
      const swap = () => {
        flushSync(() => setParts(next));
        window.scrollTo({ top: 0 });
      };
      // View Transitions when switching screens (modern-web-guidance: same-document-transitions);
      // without support or with reduced motion, it switches directly.
      if (!document.startViewTransition || reduceMotion()) {
        swap();
        requestAnimationFrame(focusTitle);
        return;
      }
      document.startViewTransition(swap).finished.finally(focusTitle);
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
