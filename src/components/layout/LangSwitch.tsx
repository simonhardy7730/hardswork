"use client";

import { LangSwitcher } from "./LangSwitcher";
import { useLang } from "@/lib/i18n/context";

/** Sélecteur de langue autonome pour les pages qui ont leur propre en-tête. */
export function LangSwitch({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const lang = useLang();
  return <LangSwitcher lang={lang} label={lang === "nl" ? "Taal" : "Langue"} tone={tone} />;
}
