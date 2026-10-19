"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useL } from "@/lib/i18n/context";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const l = useL();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — ${l("Postulez ici", "Solliciteer hier")} : ${url}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex gap-2">
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-[10px] font-black rounded-lg py-2 uppercase tracking-wide text-center transition hover:opacity-80"
        style={{ background: "#0A66C2", color: "white" }}
      >
        LinkedIn
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-[10px] font-black rounded-lg py-2 uppercase tracking-wide text-center transition hover:opacity-80"
        style={{ background: "#25D366", color: "white" }}
      >
        WhatsApp
      </a>
      <button
        onClick={copyLink}
        className="flex-1 text-[10px] font-black rounded-lg py-2 uppercase tracking-wide transition hover:opacity-80 flex items-center justify-center gap-1"
        style={{ background: "#FBF1D8", color: "#101F43" }}
      >
        {copied ? <><Check size={10} /> {l("Copié", "Gekopieerd")}</> : <><Copy size={10} /> {l("Copier", "Kopiëren")}</>}
      </button>
    </div>
  );
}
