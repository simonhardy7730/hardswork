import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";

/**
 * Image de partage d'une offre (aperçu Facebook / WhatsApp / LinkedIn) : photo du secteur, titre, ville, contrat, logo Wolko.
 * Aucun nom d'entreprise : l'annonce peut être confidentielle.
 */
export const runtime = "nodejs";
export const alt = "Offre d'emploi sur Wolko";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PHOTOS: Record<string, string> = {
  industrie: "photo-1504328345606-18bbc8c9d7d1", construction: "photo-1504307651254-35680f356dfd", transport: "photo-1601584115197-04ecc0da31d7",
  logistique: "photo-1586528116311-ad8dd3c8310d", medical: "photo-1576091160550-2173dba999ef", securite: "photo-1582139329536-e7284fece509",
  nettoyage: "photo-1563453392212-326f5e854473", commerce: "photo-1441986300917-64674bd600d8", horeca: "photo-1414235077428-338989a2e8c0",
  administratif: "photo-1497366216548-37526070297c", default: "photo-1521737604893-d14cc237f11d",
};
const CONTRACTS: Record<string, string> = { interim: "Intérim", interim_cdi: "Intérim / CDI", cdi: "CDI", cdd: "CDD", apprentissage: "Apprentissage", etudiant: "Job étudiant", flexi: "Flexi-job", stage: "Stage" };

async function dataUri(url: string, mime: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return `data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch { return null; }
}

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.from("job_offers").select("title, city, sector, contract_type").eq("id", id).eq("status", "active").maybeSingle();
  const title = (data?.title ?? "Offre d'emploi").slice(0, 80);
  const city = data?.city ?? "";
  const contract = data?.contract_type ? CONTRACTS[data.contract_type] ?? "" : "";
  const photoId = PHOTOS[data?.sector ?? ""] ?? PHOTOS.default;
  const [photo, logoBuf] = await Promise.all([
    dataUri(`https://images.unsplash.com/${photoId}?w=1200&h=630&auto=format&fit=crop&q=70`, "image/jpeg"),
    readFile(path.join(process.cwd(), "public/images/email/wolf-head.png")).catch(() => null),
  ]);
  const logo = logoBuf ? `data:image/png;base64,${logoBuf.toString("base64")}` : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#101F43", fontFamily: "sans-serif" }}>
        {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(11,22,48,0.94) 0%, rgba(11,22,48,0.82) 55%, rgba(11,22,48,0.35) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: "100%", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt="" width={72} height={68} style={{ marginRight: 18 }} />}
            <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#FFB900", letterSpacing: -1 }}>Wolko</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#FFB900", marginBottom: 16 }}>On recrute</div>
            <div style={{ display: "flex", fontSize: title.length > 40 ? 62 : 76, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05, maxWidth: 900 }}>{title}</div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: "#FFFBF2" }}>{[city, contract].filter(Boolean).join("  ·  ")}</div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: "#FFB900", color: "#101F43", fontSize: 32, fontWeight: 800, padding: "16px 32px", borderRadius: 16 }}>Postule en 1 minute, sans compte</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
