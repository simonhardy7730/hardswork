/**
 * HardieIcon — Logo & mascotte HardSwork
 *
 * Concept : silhouette humaine universelle (bras levé = confiance, disponibilité)
 * Pas de casque ou d'accessoire secteur-spécifique — tous les métiers.
 *
 * Tailles :
 *   ≤ 32px  → icône logomark seule (nav, favicon)
 *   33–64px → tête + corps simplifié (avatar, card)
 *   > 64px  → Hardie corps entier avec expression (empty states, onboarding)
 */

interface HardieIconProps {
  size?: number;
  className?: string;
}

/* ─── Logomark : personne bras levé ──────────────────── */
function PersonMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="HardSwork"
    >
      {/* Tête */}
      <circle cx="12" cy="5.5" r="3.2" fill="white" />
      {/* Corps */}
      <path
        d="M7.5 20V13.5C7.5 11.2 16.5 11.2 16.5 13.5V20"
        fill="white"
      />
      {/* Bras gauche (baissé, détendu) */}
      <line x1="7.5" y1="13.5" x2="4.5" y2="17.5"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      {/* Bras droit levé (dynamique, "disponible !") */}
      <line x1="16.5" y1="13.5" x2="20.5" y2="8"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      {/* Petite étoile au bout du bras levé */}
      <circle cx="21" cy="7.2" r="1.4" fill="white" opacity="0.85" />
    </svg>
  );
}

/* ─── Hardie tête seule ───────────────────────────────── */
function HardieHead({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-label="HardSwork"
    >
      {/* Corps simplifié */}
      <path
        d="M14 52V41C14 33 42 33 42 41V52"
        fill="#1C1A18"
      />
      {/* Bras droit levé */}
      <line x1="42" y1="41" x2="50" y2="30"
        stroke="#1C1A18" strokeWidth="5" strokeLinecap="round" />
      {/* Étoile */}
      <circle cx="51" cy="27" r="4" fill="#D93B12" />
      {/* Tête */}
      <circle cx="28" cy="25" r="15" fill="#FDDFC4" />
      {/* Yeux */}
      <circle cx="22" cy="23" r="2.5" fill="#1C1A18" />
      <circle cx="34" cy="23" r="2.5" fill="#1C1A18" />
      {/* Reflets */}
      <circle cx="23.5" cy="21.5" r="1" fill="white" />
      <circle cx="35.5" cy="21.5" r="1" fill="white" />
      {/* Sourire */}
      <path d="M21 30 Q28 36 35 30"
        stroke="#1C1A18" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ─── Hardie corps entier ─────────────────────────────── */
function HardieFullBody({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 80 100"
      fill="none"
      aria-label="Hardie — mascotte HardSwork"
    >
      {/* Jambes */}
      <rect x="24" y="72" width="12" height="22" rx="6" fill="#1C1A18" />
      <rect x="44" y="72" width="12" height="22" rx="6" fill="#1C1A18" />
      {/* Corps */}
      <rect x="18" y="52" width="44" height="24" rx="8" fill="#1C1A18" />
      {/* Badge étoile sur le corps */}
      <circle cx="40" cy="63" r="7" fill="#D93B12" />
      <path
        d="M40 57.5 L41.5 61.5 L46 61.5 L42.5 64 L44 68 L40 65.5 L36 68 L37.5 64 L34 61.5 L38.5 61.5 Z"
        fill="white"
      />
      {/* Bras gauche (baissé) */}
      <rect x="6" y="52" width="12" height="6" rx="3" fill="#1C1A18"
        transform="rotate(20 12 55)" />
      {/* Bras droit levé ! */}
      <rect x="62" y="40" width="12" height="6" rx="3" fill="#1C1A18"
        transform="rotate(-50 68 43)" />
      {/* Main levée (poing fermé ou doigt pointé) */}
      <circle cx="74" cy="36" r="5" fill="#FDDFC4" />
      {/* Cou */}
      <rect x="35" y="46" width="10" height="8" rx="4" fill="#FDDFC4" />
      {/* Tête */}
      <circle cx="40" cy="34" r="18" fill="#FDDFC4" />
      {/* Oreilles */}
      <circle cx="22" cy="34" r="5" fill="#FDDFC4" />
      <circle cx="58" cy="34" r="5" fill="#FDDFC4" />
      {/* Yeux */}
      <circle cx="33" cy="31" r="3.5" fill="#1C1A18" />
      <circle cx="47" cy="31" r="3.5" fill="#1C1A18" />
      {/* Reflets yeux */}
      <circle cx="34.5" cy="29.5" r="1.3" fill="white" />
      <circle cx="48.5" cy="29.5" r="1.3" fill="white" />
      {/* Sourcils expressifs */}
      <path d="M29 25 Q33 22 37 25"
        stroke="#1C1A18" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M43 25 Q47 22 51 25"
        stroke="#1C1A18" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Sourire large */}
      <path d="M30 39 Q40 47 50 39"
        stroke="#1C1A18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Petites joues roses */}
      <circle cx="28" cy="38" r="4" fill="#FFAAAA" opacity="0.4" />
      <circle cx="52" cy="38" r="4" fill="#FFAAAA" opacity="0.4" />
    </svg>
  );
}

/* ─── Composant principal ─────────────────────────────── */
export function HardieIcon({ size = 28, className }: HardieIconProps) {
  if (size <= 32) return <PersonMark size={size} />;
  if (size <= 64) return <HardieHead size={size} />;
  return <HardieFullBody size={size} />;
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
      {/* Fond rouge arrondi + personne SVG */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          background: "#D93B12",
          borderRadius: iconSize * 0.3,
        }}
      >
        <PersonMark size={Math.round(iconSize * 0.78)} />
      </div>

      {/* Wordmark : Hard·S·work — le S en rouge */}
      <span
        className={`font-display font-black leading-none tracking-tight ${textClass} ${
          dark ? "text-white" : "text-[#0F0E0D]"
        }`}
      >
        Hard<span className="text-brand">S</span>work
      </span>
    </div>
  );
}
