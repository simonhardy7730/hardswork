"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void } }
}

/** Widget anti-bot Cloudflare. N'affiche rien si NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas défini. */
export default function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | undefined;
    const mount = () => {
      if (!ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(""),
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
    return () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="flex justify-center" />;
}
