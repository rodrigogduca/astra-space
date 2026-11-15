import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setNumberLocale } from "../domain/indicators";

// UI language: English by default (NASA Space Apps is judged in English), Portuguese as an option.
// The choice is kept in the browser when storage is available.

export type Lang = "en" | "pt";
const KEY = "astra-lang";

let current: Lang = readLang();

function readLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "pt" ? "pt" : "en";
  } catch {
    return "en";
  }
}

/** Current language outside React (number and date formatting). */
export const currentLang = () => current;
export const locale = () => (current === "pt" ? "pt-BR" : "en-US");

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Picks the local dictionary entry for the current language. */
  pick: <T>(dict: { en: T; pt: T }) => T;
};

const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, pick: (d) => d.en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  current = lang;
  setNumberLocale(lang === "pt" ? "pt-BR" : "en-US");

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    document.title = lang === "pt" ? "Astra · saúde do tripulante" : "Astra · crew health";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* no storage: applies to this session only */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangState(l);
  }, []);
  const value = useMemo<Ctx>(() => ({ lang, setLang, pick: (d) => d[lang] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
