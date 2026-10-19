import { SiteNavClient } from "./SiteNavClient";
import { getDict } from "@/lib/i18n/server";

/** Header commun : lit la langue (cookie) côté serveur et la passe au composant client. */
export function SiteNav() {
  const { lang, t } = getDict();
  return <SiteNavClient lang={lang} t={t.nav} />;
}
