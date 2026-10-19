"use client";

import { createContext, useContext } from "react";
import type { Lang } from "./dict";

const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Composants client : const l = useL(); l("Texte FR", "Nederlandse tekst") */
export function useL() {
  const lang = useLang();
  return (fr: string, nl: string) => (lang === "nl" ? nl : fr);
}
