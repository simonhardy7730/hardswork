"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { rememberSource } from "@/lib/source";

const INTERNAL = /^\/(admin|dashboard|login|onboarding)(\/|$)/;
const FLAG = "wolko_internal";

/**
 * Mesure d'audience Cloudflare (sans cookie) + mémorisation de la provenance.
 * Les visites de l'équipe et des recruteurs (admin, tableau de bord, connexion) ne sont pas comptées :
 * dès qu'un navigateur passe par ces pages, il est marqué « interne » et n'est plus compté nulle part.
 */
export default function Analytics({ token }: { token: string }) {
  const path = usePathname() ?? "/";
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let internal = false;
    try {
      if (INTERNAL.test(path) || new URLSearchParams(window.location.search).has("nostats")) localStorage.setItem(FLAG, "1");
      internal = localStorage.getItem(FLAG) === "1";
    } catch { internal = INTERNAL.test(path); }
    if (!internal) rememberSource();
    setOk(!internal);
  }, [path]);
  if (!ok) return null;
  return <Script src="https://static.cloudflareinsights.com/beacon.min.js" strategy="afterInteractive" data-cf-beacon={JSON.stringify({ token })} />;
}
