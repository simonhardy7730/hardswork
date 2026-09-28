// Construit une page HTML autonome de démonstration (sans serveur) : node scripts/build-demo.mjs <sortie.html>
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const out = resolve(process.argv[2] ?? "demo-dist/sosilook-demo.html");
const tmp = mkdtempSync(join(tmpdir(), "sosilook-demo-"));

const js = await build({
  entryPoints: ["scripts/demo/entry.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  logLevel: "error",
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
  alias: {
    "next/server": "./scripts/demo/next-server-shim.ts",
    "@anthropic-ai/sdk/helpers/zod": "./scripts/demo/anthropic-stub.ts",
    "@anthropic-ai/sdk": "./scripts/demo/anthropic-stub.ts",
  },
});

execFileSync("npx", ["tailwindcss", "-c", "tailwind.config.ts", "-i", "app/globals.css", "-o", join(tmp, "app.css"), "--minify"], {
  stdio: "ignore",
});
const css = readFileSync(join(tmp, "app.css"), "utf8");

// Échappe la fin de script éventuelle dans le code embarqué
const code = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<title>Sosilook</title>
<meta name="description" content="Sosilook : le sosie de ton look. Version démo.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root{--font-sans:"Archivo",system-ui,-apple-system,"Segoe UI",sans-serif;--font-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;color-scheme:light}
${css}
.demo-ruban{background:#131A2B;color:#F6DDBF;font:500 11px/1.4 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;padding:8px 16px;text-align:center}
.demo-ruban b{color:#D9822B;font-weight:600}
</style>
<script>try{if(sessionStorage.getItem("sosilook.intro")==="vue")document.documentElement.dataset.intro="skip"}catch(e){}document.documentElement.lang="fr";</script>
<div class="demo-ruban"><b>Version démo</b> · résultats d'exemple quelle que soit ta photo : photo verticale = tenue complète, sinon une pièce seule</div>
<div id="sosilook-root" class="min-h-screen font-sans text-encre antialiased"></div>
<script>${code}</script>
`;
writeFileSync(out, html);
console.log(`Démo écrite : ${out} (${Math.round(html.length / 1024)} Ko)`);
