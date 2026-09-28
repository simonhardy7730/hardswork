import type { TrustTier } from "@/lib/types";
import { TRUST_STYLE, TRUST_TEXT } from "./ui";

export function NotrePromesse() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Notre promesse</p>
        <h1 className="display mt-1 text-4xl uppercase text-denim sm:text-[56px]">
          Des sosies.
          <br />
          <span className="text-fil">Jamais des faux.</span>
        </h1>
        <div className="mt-6 max-w-[60ch] space-y-4 text-[17px] leading-relaxed text-encre/80">
          <p>
            Beaucoup de « bons plans » vendus en ligne sont des contrefaçons. En France, en acheter ou en détenir
            est un délit, et la qualité n&apos;y est presque jamais.
          </p>
          <p>
            Quand tu veux <strong className="text-encre">la pièce exacte</strong>, on met en avant le site de la
            marque, les revendeurs reconnus et la seconde main authentifiée. Les vendeurs douteux sont signalés.
          </p>
          <p>
            Quand tu veux <strong className="text-encre">son sosie</strong>, on cherche des pièces qui ont leur
            propre identité : même coupe, même matière, même allure, sans logo copié.
          </p>
          <p>Et la commission qu&apos;un vendeur pourrait nous verser ne change jamais le classement.</p>
        </div>
      </div>

      <div>
        <h2 className="etendu text-lg font-bold">Comment on classe les vendeurs</h2>
        <ul className="mt-5 space-y-4">
          {(Object.keys(TRUST_STYLE) as TrustTier[]).map((t) => (
            <li key={t} className="grid grid-cols-[1fr] gap-1.5 border-b border-dashed border-encre/15 pb-4 sm:grid-cols-[190px_1fr] sm:gap-4">
              <span>
                <span className={`puce ${TRUST_STYLE[t]}`}>{TRUST_TEXT[t].label}</span>
              </span>
              <span className="text-sm text-encre/75">{TRUST_TEXT[t].desc}</span>
            </li>
          ))}
        </ul>

        <h2 className="etendu mt-10 text-lg font-bold">La lettre impact, de A à E</h2>
        <p className="mt-2 text-sm text-encre/75">
          D&apos;où vient la pièce, en quoi elle est faite, combien de temps elle durera. Pour l&apos;instant, c&apos;est
          une <strong className="text-encre">estimation</strong>, et le détail est toujours affiché sous l&apos;offre.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-encre/75">
          {[
            ["+", "Seconde main : c'est ce qui a le moins d'impact"],
            ["+", "Matière recyclée, bio, lin ou chanvre ; fabrication européenne ; pièce durable"],
            ["−", "Fibres synthétiques (microplastiques), plastique ou simili-cuir"],
            ["−", "Ultra fast fashion, pièce de qualité faible"],
          ].map(([sign, text]) => (
            <li key={text} className="grid grid-cols-[16px_1fr] gap-2">
              <span className={`font-mono font-bold ${sign === "+" ? "text-ok" : "text-alerte"}`}>{sign}</span>
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-craie">
          Bientôt : les pays de tissage, teinture et confection publiés par les marques (loi AGEC) et le coût
          environnemental officiel quand il existe.
        </p>

        <h2 className="etendu mt-10 text-lg font-bold">Comment on note une offre</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ["Qualité", "Matière et composition, fabrication, mouvement d'une montre, métal d'un bijou, verres des lunettes, avis clients."],
            ["Prix", "Comparé aux autres offres trouvées, et au prix habituel en boutique."],
            ["Fiabilité", "Qui vend : la marque, un revendeur reconnu, une plateforme qui authentifie, ou un inconnu."],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[90px_1fr] gap-3">
              <dt className="font-mono text-xs uppercase tracking-wider text-fil-fonce">{k}</dt>
              <dd className="text-encre/75">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
