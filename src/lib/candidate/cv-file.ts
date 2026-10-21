/** Vérifie un fichier CV par son contenu (pas seulement l'extension). Renvoie le type MIME ou null. */
export const CV_TYPES: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};

export async function checkCvFile(f: File, maxBytes: number): Promise<string | null> {
  if (!f || f.size === 0 || f.size > maxBytes) return null;
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  const h = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  // Photo ou PDF reconnus par leur contenu, quel que soit le nom (les photos de téléphone n'ont pas toujours la bonne extension).
  if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return CV_TYPES.pdf;
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return CV_TYPES.jpg;
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47) return CV_TYPES.png;
  if (h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50) return CV_TYPES.webp;
  const ok = (ext === "pdf" && h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46)
    || (ext === "docx" && h[0] === 0x50 && h[1] === 0x4b)
    || (ext === "doc" && h[0] === 0xd0 && h[1] === 0xcf)
    || ((ext === "jpg" || ext === "jpeg") && h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff)
    || (ext === "png" && h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47)
    || (ext === "webp" && h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50);
  return ok ? CV_TYPES[ext] : null;
}
