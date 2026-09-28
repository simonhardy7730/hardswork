"use client";

import { useMemo, useRef, useState } from "react";
import type { FindResponse, Mode, ScoredOffer, TrustTier } from "@/lib/types";

const UNIVERSES = ["Vêtements", "Chaussures", "Sacs & sacoches", "Montres", "Bijoux", "Lunettes de soleil"];

const UNIVERSE_LABEL: Record<string, string> = {
  vetement: "Vêtement",
  chaussures: "Chaussures",
  sac: "Sac",
  montre: "Montre",
  bijou: "Bijou",
  lunettes: "Lunettes",
  accessoire: "Accessoire",
};

const TRUST_STYLE: Record<TrustTier, string> = {
  officiel: "bg-marine text-creme",
  agree: "bg-sauge/15 text-sauge",
  seconde_main_verifiee: "bg-or/15 text-[#7d6235]",
  occasion: "bg-encre/5 text-encre/70",
  a_verifier: "bg-bordeaux/10 text-bordeaux",
};

type SortKey = "overall" | "price" | "quality";

/** Réduit la photo côté navigateur (max 1280 px) pour un envoi rapide. */
async function toResizedDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image illisible"));
      i.src = url;
    });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const euros = (n: number | null) =>
  n == null ? "Prix non affiché" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("style");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FindResponse | null>(null);
  const [sort, setSort] = useState<SortKey>("overall");
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisis une image (photo ou capture d'écran).");
      return;
    }
    setError(null);
    setResult(null);
    try {
      setImage(await toResizedDataUrl(file));
    } catch {
      setError("Impossible de lire cette image.");
    }
  }

  async function search() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mode, hint: hint.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur inattendue.");
      setResult(json as FindResponse);
      setSort("overall");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(() => {
    if (!result) return [];
    const list = [...result.offers];
    if (sort === "price") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "quality") list.sort((a, b) => b.quality - a.quality);
    return list;
  }, [result, sort]);

  return (
    <main>
      {/* En-tête */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="font-serif text-2xl font-semibold tracking-tight">
          Sosi<span className="text-bordeaux">look</span>
        </div>
        <nav className="hidden gap-6 text-sm text-encre/70 sm:flex">
          <a href="#comment" className="hover:text-encre">Comment ça marche</a>
          <a href="#confiance" className="hover:text-encre">Notre promesse</a>
        </nav>
      </header>

      {/* Hero + formulaire */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-12">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-or">Le sosie de ton look</p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Vu sur TikTok ?<br />
            Trouve-le. <span className="italic text-bordeaux">Moins cher.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-encre/75">
            Prends en photo un vêtement, une montre, un sac ou des lunettes. Sosilook trouve la pièce exacte au
            meilleur prix chez des vendeurs fiables, ou des pièces au style identique pour une fraction du prix.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {UNIVERSES.map((u) => (
              <span key={u} className="chip border border-encre/15 bg-white/60 text-encre/80">
                {u}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
              dragOver ? "border-bordeaux bg-bordeaux/5" : "border-encre/15 bg-lin/50 hover:border-encre/30"
            }`}
          >
            {image ? (
              <img src={image} alt="Photo à analyser" className="h-full w-full object-contain" />
            ) : (
              <div className="px-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </div>
                <p className="font-medium">Prends ou dépose une photo</p>
                <p className="mt-1 text-sm text-encre/60">Photo, capture d&apos;écran TikTok ou Instagram</p>
              </div>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-lin/70 p-1">
            {(
              [
                ["exact", "La pièce exacte", "Au meilleur prix, 100 % authentique"],
                ["style", "Le même style", "Des sosies moins chers"],
              ] as const
            ).map(([value, label, sub]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-lg px-3 py-2.5 text-left transition ${
                  mode === value ? "bg-white shadow-sm" : "text-encre/60 hover:text-encre"
                }`}
              >
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-encre/60">{sub}</div>
              </button>
            ))}
          </div>

          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Précision (facultatif) : « la montre, pas le pull », « taille M »…"
            className="mt-3 w-full rounded-xl border border-encre/10 bg-white px-4 py-3 text-sm outline-none focus:border-encre/30"
          />

          <button
            type="button"
            disabled={!image || loading}
            onClick={search}
            className="mt-4 w-full rounded-xl bg-encre px-4 py-3.5 font-medium text-creme transition hover:bg-marine disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyse en cours…" : mode === "exact" ? "Trouver le meilleur prix" : "Trouver son sosie"}
          </button>
          {error && <p className="mt-3 text-sm text-bordeaux">{error}</p>}
        </div>
      </section>

      {/* Résultats */}
      <div ref={resultsRef} className="scroll-mt-4">
        {loading && <LoadingState />}
        {result && (
          <Results result={result} image={image} sorted={sorted} sort={sort} setSort={setSort} />
        )}
      </div>

      {/* Comment ça marche */}
      <section id="comment" className="border-t border-encre/10 bg-lin/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Comment ça marche</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["1", "Une photo suffit", "Une photo dans la rue, une capture de TikTok ou d'Instagram : l'IA reconnaît la pièce, la marque, la matière et la coupe."],
              ["2", "Deux façons de chercher", "La pièce exacte, classée du moins cher au plus cher chez des vendeurs fiables. Ou des pièces au même style, pour beaucoup moins cher."],
              ["3", "Une note pour chaque offre", "Prix, qualité (matière, finitions, avis) et fiabilité du vendeur : tu sais pourquoi une offre est bien classée."],
            ].map(([n, t, d]) => (
              <div key={n} className="card p-6">
                <div className="font-serif text-4xl text-or">{n}</div>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-encre/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="confiance" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Des sosies, jamais des faux.</h2>
            <p className="mt-4 text-encre/75">
              Les « dupes » vendus sur certaines plateformes sont souvent de la contrefaçon, ce qui est illégal en
              France. Sosilook fait l&apos;inverse : en mode « pièce exacte », on met en avant le site officiel, les
              revendeurs reconnus et la seconde main authentifiée. En mode « même style », on cherche des pièces sans
              logo copié, de marques qui ont leur propre identité.
            </p>
          </div>
          <ul className="space-y-3">
            {(Object.keys(TRUST_STYLE) as TrustTier[]).map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className={`chip ${TRUST_STYLE[t]}`}>{TRUST_TEXT[t].label}</span>
                <span className="text-sm text-encre/70">{TRUST_TEXT[t].desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-encre/10 py-8 text-center text-xs text-encre/50">
        Sosilook — prototype. Certains liens pourront être affiliés : cela ne change jamais le classement.
      </footer>
    </main>
  );
}

const TRUST_TEXT: Record<TrustTier, { label: string; desc: string }> = {
  officiel: { label: "Site officiel", desc: "Vendu directement par la marque." },
  agree: { label: "Revendeur reconnu", desc: "Grand magasin ou e-shop établi." },
  seconde_main_verifiee: { label: "Seconde main authentifiée", desc: "Pièce contrôlée par des experts avant envoi." },
  occasion: { label: "Occasion entre particuliers", desc: "Bon plan possible : demande étiquette et facture." },
  a_verifier: { label: "Vendeur à vérifier", desc: "Inconnu ou plateforme à risque de contrefaçon." },
};

function LoadingState() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="card flex items-center gap-4 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-encre/15 border-t-bordeaux" />
        <div>
          <p className="font-medium">On analyse ta pièce…</p>
          <p className="text-sm text-encre/60">Marque, matière, coupe, puis recherche chez les vendeurs.</p>
        </div>
      </div>
    </section>
  );
}

function Results({
  result,
  image,
  sorted,
  sort,
  setSort,
}: {
  result: FindResponse;
  image: string | null;
  sorted: ScoredOffer[];
  sort: SortKey;
  setSort: (s: SortKey) => void;
}) {
  const a = result.analysis;
  // En mode exact, on ne vante jamais un prix venant d'une offre suspecte.
  const cheapest = result.offers
    .filter((o) => result.mode === "style" || (o.trust !== "a_verifier" && o.warnings.length === 0))
    .reduce<number | null>((min, o) => (o.price != null && (min == null || o.price < min) ? o.price : min), null);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      {(result.demo.analysis || result.demo.search) && (
        <div className="mb-6 rounded-xl border border-or/40 bg-or/10 px-4 py-3 text-sm text-[#6b5430]">
          <strong>Mode démo :</strong>{" "}
          {result.demo.analysis ? "l'analyse de la photo est un exemple" : "l'analyse est réelle"}
          {" et "}
          {result.demo.search ? "les offres sont des données d'exemple" : "les offres sont réelles"}. Ajoute les clés
          API pour les résultats réels.
        </div>
      )}
      {result.notes.map((n) => (
        <p key={n} className="mb-4 text-sm text-encre/70">
          {n}
        </p>
      ))}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Fiche d'analyse */}
        <aside className="card h-fit p-5 lg:sticky lg:top-4">
          {image && (
            <img src={image} alt="" className="mb-4 aspect-square w-full rounded-xl bg-lin object-contain" />
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-encre text-creme">{UNIVERSE_LABEL[a.universe] ?? a.universe}</span>
            {a.style_tags.slice(0, 3).map((t) => (
              <span key={t} className="chip bg-lin text-encre/70">
                {t}
              </span>
            ))}
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight">{a.title}</h2>
          <p className="mt-2 text-sm text-encre/70">{a.description}</p>

          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Marque">
              {a.brand.name ?? "Non identifiée"}
              {a.brand.name && <span className="ml-1 text-encre/50">(confiance {a.brand.confidence})</span>}
            </Row>
            {a.model_guess && <Row label="Modèle">{a.model_guess}</Row>}
            <Row label="Matière">{a.material_guess}</Row>
            <Row label="Coupe">{a.fit}</Row>
            {a.estimated_retail_price_eur && <Row label="Prix boutique">≈ {euros(a.estimated_retail_price_eur)}</Row>}
            {cheapest != null && <Row label="Meilleur prix trouvé">{euros(cheapest)}</Row>}
          </dl>

          <div className="mt-5 rounded-xl bg-lin/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-encre/60">Ce qui fait la qualité ici</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {a.quality_checklist.map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="text-sauge">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Offres */}
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-serif text-3xl font-semibold">
                {result.mode === "exact" ? "Où l'acheter au meilleur prix" : "Ses sosies"}
              </h3>
              <p className="text-sm text-encre/60">{result.offers.length} offres analysées et notées</p>
            </div>
            <div className="flex gap-1 rounded-lg bg-lin/70 p-1 text-sm">
              {(
                [
                  ["overall", "Recommandé"],
                  ["price", "Prix"],
                  ["quality", "Qualité"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`rounded-md px-3 py-1.5 ${sort === k ? "bg-white shadow-sm" : "text-encre/60"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="card p-6 text-sm text-encre/70">
              Aucune offre trouvée pour l&apos;instant. Essaie l&apos;autre mode ou ajoute une précision.
            </div>
          ) : (
            <ol className="space-y-3">
              {sorted.map((o, i) => (
                <OfferCard key={o.id} offer={o} rank={i + 1} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-encre/5 pb-2">
      <dt className="text-encre/55">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function OfferCard({ offer: o, rank }: { offer: ScoredOffer; rank: number }) {
  const price = (
    <div>
      <div className="text-lg font-semibold">{euros(o.price)}</div>
      {o.savingsPct != null && o.savingsPct > 0 && (
        <div className="text-xs font-medium text-sauge">−{o.savingsPct} % vs boutique</div>
      )}
    </div>
  );
  const link = (
    <a
      href={o.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="shrink-0 rounded-lg border border-encre/15 px-3 py-1.5 text-sm font-medium hover:bg-encre hover:text-creme"
    >
      Voir l&apos;offre
    </a>
  );

  return (
    <li className="card flex gap-3 p-4 sm:gap-4 sm:p-5">
      <div className="w-5 shrink-0 pt-0.5 font-serif text-xl text-encre/35">{rank}</div>
      {o.thumbnail && (
        <img src={o.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-lin object-cover sm:h-20 sm:w-20" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-sm font-semibold">{o.seller}</span>
          <span className={`chip ${TRUST_STYLE[o.trust]}`}>{o.trustLabel}</span>
          {o.secondHand && <span className="chip bg-lin text-encre/70">Seconde main</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-encre/75">{o.title}</p>

        <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:flex sm:flex-wrap sm:gap-x-5">
          <Meter label="Note globale" value={o.overall} strong />
          <Meter label="Qualité" value={o.quality} />
          <Meter label="Prix" value={o.priceScore} />
        </div>

        <details className="mt-2 text-xs text-encre/60">
          <summary className="cursor-pointer select-none hover:text-encre">Pourquoi cette note ?</summary>
          <ul className="mt-1.5 space-y-0.5 pl-1">
            {o.qualityReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>

        {o.warnings.map((w) => (
          <p key={w} className="mt-2 text-xs font-medium text-bordeaux">
            ⚠ {w}
          </p>
        ))}

        {/* Mobile : prix et lien sous le contenu */}
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-encre/5 pt-3 sm:hidden">
          {price}
          {link}
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end justify-between gap-2 text-right sm:flex">
        {price}
        {link}
      </div>
    </li>
  );
}

function Meter({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-encre/55 sm:w-auto">{label}</span>
      <span className="relative h-1.5 w-20 sm:w-14 overflow-hidden rounded-full bg-encre/10">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${strong ? "bg-bordeaux" : "bg-encre/50"}`}
          style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }}
        />
      </span>
      <span className={strong ? "font-semibold" : ""}>{value.toFixed(1)}</span>
    </div>
  );
}
