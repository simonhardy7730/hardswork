"use client";
import { useEffect } from "react";

/** Ouvre la question de FAQ ciblée par l'ancre (#faq-ats) et fait défiler jusqu'à elle. */
export default function FaqOpenOnHash() {
  useEffect(() => {
    function open() {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id.startsWith("faq-")) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
