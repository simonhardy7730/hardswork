"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

/**
 * Jeton Turnstile + remise à zéro. Un jeton ne sert qu'UNE fois : après chaque tentative (réussie ou non),
 * appeler `reset()` pour obtenir un nouveau jeton.
 */
export function useCaptcha() {
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const reset = useCallback(() => { setToken(""); setResetKey((k) => k + 1); }, []);
  return { token, setToken, resetKey, reset };
}

/** Widget anti-bot Cloudflare. N'affiche rien si NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas défini. */
export default function Turnstile({ onToken, resetKey = 0 }: { onToken: (t: string) => void; resetKey?: number }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const mount = () => {
      if (!ref.current || !window.turnstile || widgetRef.current) return;
      widgetRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    if (window.turnstile) mount();
    else {
      let s = document.getElementById("cf-turnstile") as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.id = "cf-turnstile";
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", mount);
    }
    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = undefined;
    };
  }, [siteKey, onToken]);

  // Nouveau jeton demandé par le formulaire (après une tentative).
  useEffect(() => {
    if (resetKey > 0 && widgetRef.current && window.turnstile) window.turnstile.reset(widgetRef.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="flex justify-center" />;
}
