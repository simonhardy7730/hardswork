import { cookies } from "next/headers";
import { DICTS, type Dict, type Lang } from "./dict";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "nl" ? "nl" : "fr";
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: DICTS[lang] };
}

/** Composants serveur : const l = await getL(); l("Texte FR", "Nederlandse tekst") */
export async function getL() {
  const lang = await getLang();
  return (fr: string, nl: string) => (lang === "nl" ? nl : fr);
}
