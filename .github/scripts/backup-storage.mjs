// Copie tous les fichiers des buckets Supabase Storage dans un dossier local.
// Usage : SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node .github/scripts/backup-storage.mjs <dossier>
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const out = process.argv[2] ?? "storage-backup";
if (!base || !key) { console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis"); process.exit(1); }

// Les nouvelles clés (sb_secret_...) ne sont pas des JWT : pas d'en-tête Authorization.
const H = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
const j = async (url, init) => {
  const r = await fetch(url, { ...init, headers: { ...H, "Content-Type": "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url.replace(base, "")} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

async function listAll(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const items = await j(`${base}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    for (const it of items) {
      const p = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) files.push(...(await listAll(bucket, p))); // dossier
      else files.push(p);
    }
    if (items.length < 100) break;
  }
  return files;
}

try {
const buckets = await j(`${base}/storage/v1/bucket`);
  let total = 0;
  for (const b of buckets) {
    const files = await listAll(b.name);
    for (const f of files) {
      const r = await fetch(`${base}/storage/v1/object/${b.name}/${f.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (!r.ok) throw new Error(`Téléchargement impossible : ${b.name}/${f} (${r.status})`);
      const dest = path.join(out, b.name, f);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await r.arrayBuffer()));
      total++;
    }
    console.log(`${b.name}: ${files.length} fichier(s)`);
  }
  await mkdir(out, { recursive: true });
  console.log(`Total : ${total} fichier(s)`);
} catch (e) {
  console.error(`::error::Export des fichiers : ${e.message}`);
  process.exit(1);
}
