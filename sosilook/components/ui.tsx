import type { Gender, Impact, ImpactGrade, TrustTier } from "@/lib/types";
import { GENDER_LABEL } from "@/lib/gender";

export const euros = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const UNIVERSE_LABEL: Record<string, string> = {
  vetement: "Vêtement",
  chaussures: "Chaussures",
  sac: "Sac",
  montre: "Montre",
  bijou: "Bijou",
  lunettes: "Lunettes",
  accessoire: "Accessoire",
};

export const TRUST_STYLE: Record<TrustTier, string> = {
  officiel: "bg-denim text-[#F4EFE6]",
  agree: "bg-ok/10 text-ok ring-1 ring-inset ring-ok/30",
  seconde_main_verifiee: "bg-fil-clair text-fil-fonce ring-1 ring-inset ring-fil/40",
  occasion: "bg-patron-carton text-craie ring-1 ring-inset ring-encre/10",
  a_verifier: "bg-alerte/10 text-alerte ring-1 ring-inset ring-alerte/30",
};

export const TRUST_TEXT: Record<TrustTier, { label: string; desc: string }> = {
  officiel: { label: "Site officiel", desc: "Vendu directement par la marque." },
  agree: { label: "Revendeur reconnu", desc: "Grand magasin, e-shop établi, bijoutier ou opticien agréé." },
  seconde_main_verifiee: {
    label: "Seconde main authentifiée",
    desc: "Pièce contrôlée par des experts avant l'envoi (Vestiaire Collective, Chrono24…).",
  },
  occasion: { label: "Occasion entre particuliers", desc: "Bon plan possible : demande l'étiquette et la facture." },
  a_verifier: { label: "Vendeur à vérifier", desc: "Inconnu, ou plateforme où les contrefaçons circulent." },
};

/** Mètre ruban de couturière : graduations en cm, chiffres tous les 5. */
export function MetreRuban({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative h-9 overflow-hidden border-y border-[#C9A23A] bg-[#F2D46B] ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #131A2B 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, #131A2B 0 1.5px, transparent 1.5px 60px)",
        backgroundSize: "12px 9px, 60px 16px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 0, 0 0",
      }}
    >
      <div className="absolute inset-x-0 bottom-1 flex font-mono text-[10px] font-semibold text-encre/80">
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} className="w-[60px] shrink-0 pl-1">
            {i * 5 || ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Ciseaux sur une ligne de découpe. */
export function Ciseaux({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.1 8.1 20 20M8.1 15.9 20 4M13.5 12h0" />
    </svg>
  );
}

export function Cloche({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

/** Jauge fine, comme une graduation de règle. */
export function Jauge({ label, value, fort }: { label: string; value: number; fort?: boolean }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  return (
    <div className="grid grid-cols-[84px_1fr_32px] items-center gap-2 text-xs sm:grid-cols-[76px_64px_28px]">
      <span className="text-craie">{label}</span>
      <span className="relative h-[5px] bg-encre/10">
        <span className={`absolute inset-y-0 left-0 ${fort ? "bg-fil" : "bg-denim/70"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`text-right font-mono tabular-nums ${fort ? "font-semibold text-encre" : "text-craie"}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

const GRADE_STYLE: Record<ImpactGrade, string> = {
  A: "bg-[#1E7A4C] text-white",
  B: "bg-[#78A83A] text-white",
  C: "bg-[#E2B324] text-encre",
  D: "bg-[#E07B2A] text-white",
  E: "bg-[#C23B22] text-white",
};

/** Pastille de la lettre impact : les cinq lettres, celle de l'offre ressortie. */
export function ImpactBadge({ impact, compact }: { impact: Impact; compact?: boolean }) {
  if (compact) {
    return (
      <span
        title={`Impact estimé ${impact.grade}`}
        className={`inline-grid h-5 w-5 place-items-center rounded-[3px] font-mono text-[11px] font-bold ${GRADE_STYLE[impact.grade]}`}
      >
        {impact.grade}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" title="Lettre impact estimée">
      <span className="font-mono text-[10px] uppercase tracking-wider text-craie">Impact</span>
      <span className="inline-flex overflow-hidden rounded-[3px] ring-1 ring-encre/10">
        {(["A", "B", "C", "D", "E"] as const).map((g) => (
          <span
            key={g}
            className={`grid place-items-center font-mono font-bold ${
              g === impact.grade ? `h-6 w-6 text-[12px] ${GRADE_STYLE[g]}` : "h-6 w-4 bg-patron-carton text-[9px] text-craie/60"
            }`}
          >
            {g}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Explique pourquoi l'analyse affichée est un exemple, et propose de décrire la pièce quand c'est possible. */
export function DemoNotice({
  notice,
  what,
  demo = true,
  canDescribe,
  onDescribe,
  busy,
}: {
  notice?: string;
  what: string;
  demo?: boolean;
  canDescribe?: boolean;
  onDescribe?: (text: string) => void;
  busy?: boolean;
}) {
  if (!demo) {
    return notice ? <p className="mb-5 border-l-2 border-fil pl-3 text-sm text-encre/80">{notice}</p> : null;
  }
  if (!notice) {
    return (
      <p className="mb-5 inline-block bg-fil-clair px-3 py-1.5 font-mono text-xs text-fil-fonce">
        Mode démo : {what} (clé Anthropic non configurée).
      </p>
    );
  }
  return (
    <div className="mb-6 border-l-4 border-alerte bg-alerte/10 px-4 py-3 text-sm">
      <p className="font-semibold text-alerte">
        {canDescribe ? "Ta photo n'a pas pu être envoyée à Claude." : "Ta photo n'a pas été analysée : ceci est un exemple."}
      </p>
      <p className="mt-1 text-encre/80">{notice}</p>
      {canDescribe && onDescribe && (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("description") ?? "").trim();
            if (text) onDescribe(text);
          }}
        >
          <label htmlFor="description" className="font-mono text-[11px] uppercase tracking-[0.14em] text-encre/70">
            Décris ce que tu vois sur la photo
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            placeholder="ex. veste en tweed gris à chevrons, pull col roulé taupe, pochette blanche, pantalon gris anthracite, chaussures noires"
            className="mt-1 w-full resize-y border-[1.5px] border-encre/20 bg-white px-3 py-2 text-[15px] outline-none focus:border-fil"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 bg-encre px-4 py-2.5 text-sm font-semibold text-[#F4EFE6] hover:bg-fil disabled:opacity-50"
          >
            {busy ? "Analyse en cours…" : "Analyser ma description"}
          </button>
        </form>
      )}
    </div>
  );
}

/** « C'est pour : Homme / Femme / Mixte ». `value` null = pièces de genres différents (look). */
export function GenderPicker({
  value,
  onChange,
  label = "C'est pour",
  options = ["homme", "femme", "mixte"],
}: {
  value: Gender | null;
  onChange: (g: Gender) => void;
  label?: string;
  options?: Gender[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-craie">{label}</span>
      <div className="flex font-mono text-[11px] uppercase tracking-wider" role="group" aria-label={label}>
        {options.map((g, i) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            aria-pressed={value === g}
            className={`border border-denim px-3 py-1.5 ${i > 0 ? "-ml-px" : ""} ${
              value === g ? "bg-denim text-[#F4EFE6]" : "text-denim hover:bg-denim/10"
            }`}
          >
            {GENDER_LABEL[g]}
          </button>
        ))}
      </div>
    </div>
  );
}
