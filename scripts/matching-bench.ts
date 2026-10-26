/**
 * Mesure du score A→E sur de vraies candidatures.
 *
 *  1) Export : un CSV (sans noms ni téléphones : initiales + date seulement) avec la note calculée et une colonne vide « ta_note ».
 *       MATCH_ENABLED=1 npx tsx --env-file=.env.local scripts/matching-bench.ts export 100 scoring.csv
 *     (.env.local doit contenir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY ; le fichier reste sur ton ordinateur.)
 *  2) Tu ouvres le CSV dans Excel, tu retrouves chaque candidature dans le tableau de l'offre et tu remplis « ta_note » (A à E).
 *  3) Comparaison : taux d'accord, tableau de confusion, plus gros écarts.
 *       npx tsx scripts/matching-bench.ts compare scoring.csv
 *
 * Ce script ne modifie rien en base. Il ne réactive pas le score sur le site : MATCH_ENABLED=1 ne vaut que pour cette commande.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { toCsv, parseCsv, compare, formatReport, type Pair } from "../src/lib/matching/bench";

const [mode, a, b] = process.argv.slice(2);

async function exportCsv(limit: number, file: string) {
  if (process.env.MATCH_ENABLED !== "1") throw new Error("Lance la commande avec MATCH_ENABLED=1 (uniquement pour cette commande).");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (.env.local).");
  const { matchesFor } = await import("../src/lib/matching/attach");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: apps, error } = await db.from("applications").select("*").order("applied_at", { ascending: false }).limit(limit);
  if (error) throw error;
  const jobIds = Array.from(new Set((apps ?? []).map((x) => x.job_offer_id as string)));
  const { data: jobs } = await db.from("job_offers").select("*").in("id", jobIds);
  const offers = new Map((jobs ?? []).map((j) => [j.id as string, j]));
  const cands = Array.from(new Set((apps ?? []).map((x) => x.candidate_id).filter(Boolean))) as string[];
  const { data: cs } = cands.length ? await db.from("candidates").select("id, city").in("id", cands) : { data: [] as { id: string; city: string | null }[] };
  const city = new Map((cs ?? []).map((c) => [c.id as string, c.city as string | null]));
  const res = await matchesFor((apps ?? []) as never, offers as never);
  const initials = (n: string) => (n || "").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + ".").join("");
  const rows: string[][] = [["id", "offre", "initiales", "date", "ville_candidat", "note", "pourcent", "cv", "points_positifs", "a_verifier", "ta_note"]];
  for (const x of apps ?? []) {
    const m = res.get(x.id as string);
    rows.push([
      x.id, String(offers.get(x.job_offer_id)?.title ?? ""), initials(String(x.applicant_name ?? "")), String(x.applied_at ?? "").slice(0, 10),
      String(city.get(x.candidate_id) ?? ""), m?.grade ?? "-", m?.percent != null ? String(m.percent) : "", m?.cv?.status ?? "",
      (m?.good ?? []).map((g) => g.fr).join(" ; "), (m?.check ?? []).map((g) => g.fr).join(" ; "), "",
    ]);
  }
  writeFileSync(file, toCsv(rows));
  console.log(`${rows.length - 1} candidatures exportées dans ${file}. Remplis la colonne « ta_note » (A à E), puis : npx tsx scripts/matching-bench.ts compare ${file}`);
}

function compareCsv(file: string) {
  const rows = parseCsv(readFileSync(file, "utf8"));
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (n: string) => { const i = head.indexOf(n); if (i < 0) throw new Error(`Colonne « ${n} » introuvable dans ${file}`); return i; };
  const [iId, iNote, iHuman] = [col("id"), col("note"), col("ta_note")];
  const pairs: Pair[] = rows.slice(1).map((r) => ({ id: r[iId] ?? "", calc: (r[iNote] ?? "").trim() === "-" ? null : r[iNote] ?? null, human: r[iHuman] ?? "" }));
  console.log(formatReport(compare(pairs)));
}

(async () => {
  if (mode === "export") await exportCsv(Number(a) > 0 ? Number(a) : 100, b || "scoring.csv");
  else if (mode === "compare" && a) compareCsv(a);
  else console.log("Usage :\n  MATCH_ENABLED=1 npx tsx --env-file=.env.local scripts/matching-bench.ts export [N] [fichier.csv]\n  npx tsx scripts/matching-bench.ts compare fichier.csv");
})().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
