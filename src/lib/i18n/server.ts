import { cookies } from "next/headers";
import { DICTS, type Dict, type Lang } from "./dict";

export function getLang(): Lang {
  const v = cookies().get("lang")?.value;
  return v === "nl" ? "nl" : "fr";
}

export function getDict(): { lang: Lang; t: Dict } {
  const lang = getLang();
  return { lang, t: DICTS[lang] };
}
