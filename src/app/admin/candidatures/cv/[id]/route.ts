import { NextResponse } from "next/server";
import { adminClient } from "@/lib/billing/lifecycle";
import { getPlatformAdmin } from "@/lib/admin/platform";
import { findPoolCvs, signedCvUrl } from "@/lib/candidate/pool-cv";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lien de 2 minutes vers le CV d'une candidature — réservé aux administrateurs de la plateforme. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getPlatformAdmin())) return new NextResponse("Not found", { status: 404 });
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const { data: app } = await adminClient().from("applications").select("candidate_id").eq("id", id).maybeSingle();
  if (!app?.candidate_id) return new NextResponse("Pas de CV", { status: 404 });
  const cv = (await findPoolCvs([app.candidate_id])).get(app.candidate_id);
  if (!cv || cv.kind !== "file") return new NextResponse("Pas de CV", { status: 404 });
  const url = await signedCvUrl(cv.path);
  return url ? NextResponse.redirect(url) : new NextResponse("Pas de CV", { status: 404 });
}
