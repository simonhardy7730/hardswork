// Outil de mesure du score : on compare la note calculée à la note qu'un recruteur donne lui-même (A→E).
// Fichiers CSV séparés par « ; » (s'ouvrent directement dans Excel en français).
export const GRADES = ["A", "B", "C", "D", "E"] as const;

export function toCsv(rows: string[][]): string {
  const q = (x: string) => `"${String(x ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  return "﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n") + "\r\n";
}

export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const sep = (t.split(/\r?\n/, 1)[0].match(/;/g)?.length ?? 0) >= (t.split(/\r?\n/, 1)[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

export type Pair = { id: string; calc: string | null; human: string };
export type BenchReport = {
  n: number; exact: number; withinOne: number; tooHigh: number; tooLow: number; unscored: number;
  confusion: Record<string, Record<string, number>>; // confusion[humain][calculé]
  worst: Pair[];                                      // les plus gros écarts, pour comprendre où ça se trompe
};

const idx = (g: string | null) => (g ? (GRADES as readonly string[]).indexOf(g) : -1);

export function compare(pairs: Pair[]): BenchReport {
  const confusion: BenchReport["confusion"] = {};
  for (const h of GRADES) confusion[h] = { A: 0, B: 0, C: 0, D: 0, E: 0, "-": 0 };
  let n = 0, exact = 0, withinOne = 0, tooHigh = 0, tooLow = 0, unscored = 0;
  const scored: (Pair & { gap: number })[] = [];
  for (const p of pairs) {
    const h = p.human.trim().toUpperCase();
    if (idx(h) < 0) continue; // ligne non notée par le recruteur : ignorée
    n++;
    const c = idx(p.calc?.trim().toUpperCase() ?? null) >= 0 ? p.calc!.trim().toUpperCase() : null;
    confusion[h][c ?? "-"]++;
    if (!c) { unscored++; continue; }
    const gap = idx(c) - idx(h); // > 0 : le code est plus sévère que toi ; < 0 : plus généreux
    if (gap === 0) exact++;
    if (Math.abs(gap) <= 1) withinOne++;
    if (gap < 0) tooHigh++;
    if (gap > 0) tooLow++;
    scored.push({ ...p, human: h, calc: c, gap });
  }
  scored.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  return { n, exact, withinOne, tooHigh, tooLow, unscored, confusion, worst: scored.filter((x) => Math.abs(x.gap) >= 2).slice(0, 10) };
}

export function formatReport(r: BenchReport): string {
  const scored = r.n - r.unscored;
  const pct = (x: number, d: number) => (d ? `${Math.round((x / d) * 100)} %` : "–");
  const lines = [
    `Candidatures notées par toi : ${r.n} (dont ${r.unscored} sans note du code, faute d'informations)`,
    `Même note que toi : ${r.exact}/${scored} (${pct(r.exact, scored)})`,
    `À une lettre près : ${r.withinOne}/${scored} (${pct(r.withinOne, scored)})`,
    `Code trop généreux : ${r.tooHigh} · trop sévère : ${r.tooLow}`,
    "",
    "Ta note (lignes) contre la note du code (colonnes) :",
    "      " + ["A", "B", "C", "D", "E", "-"].map((x) => x.padStart(4)).join(""),
    ...GRADES.map((h) => `   ${h}  ` + ["A", "B", "C", "D", "E", "-"].map((c) => String(r.confusion[h][c]).padStart(4)).join("")),
  ];
  if (r.worst.length) lines.push("", "Plus gros écarts (2 lettres ou plus) :", ...r.worst.map((w) => `  ${w.id} : toi ${w.human}, code ${w.calc}`));
  return lines.join("\n");
}
