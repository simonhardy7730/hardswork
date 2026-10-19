/**
 * HardieIcon — Logo & mascotte Wolko
 *
 * La mascotte est le loup (voir WolfMascot). Plus de bonhomme.
 *   ≤ 64px  → tête de loup
 *   > 64px  → loup entier avec sa pancarte « JE RECRUTE »
 */

import { WolfHead, WolfMascot } from "./WolfMascot";
import { BRAND } from "@/lib/brand";

interface HardieIconProps {
  size?: number;
  className?: string;
}

/* ─── Composant principal : le loup remplace l'ancien bonhomme ─── */
export function HardieIcon({ size = 28, className }: HardieIconProps) {
  if (size <= 64) {
    return (
      <WolfHead
        width={Math.round(size * 1.2)}
        height={Math.round(size * 1.2 * (138 / 144))}
        className={className}
      />
    );
  }
  return <WolfMascot width={size} height={Math.round(size * (290 / 260))} className={className} />;
}

/* ─── Logo complet (icône + wordmark) ────────────────── */
interface LogoProps {
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export function HardSworkLogo({ size = "md", dark = true }: LogoProps) {
  const iconSize = size === "sm" ? 22 : size === "md" ? 28 : 40;
  const textClass =
    size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-2xl";

  return (
    <div className="flex items-center gap-2.5">
      {/* Logo : tête du loup */}
      <WolfHead
        width={Math.round(iconSize * 1.35)}
        height={Math.round(iconSize * 1.35 * (138 / 144))}
        className="shrink-0"
      />

      {/* Wordmark : Hard·S·work — le S en rouge */}
      <span
        className={`font-display font-black leading-none tracking-tight ${textClass} ${
          dark ? "text-white" : "text-[#101F43]"
        }`}
      >
        {BRAND.wordmark[0]}<span className="text-brand">{BRAND.wordmark[1]}</span>{BRAND.wordmark[2]}
      </span>
    </div>
  );
}
