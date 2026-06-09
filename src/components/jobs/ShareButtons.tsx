"use client";

import { useState } from "react";
import { Check, Copy, Linkedin } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — Postulez ici : ${url}`)}`;
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
        style={{ background: "#F2EDE7", color: "#0F0E0D" }}
      >
        {copied ? <><Check size={10} /> Copié</> : <><Copy size={10} /> Copier</>}
      </button>
    </div>
  );
}
