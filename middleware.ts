import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MAINTENANCE, maintenanceAllows } from "@/lib/maintenance";

export async function middleware(request: NextRequest) {
  if (MAINTENANCE) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/api/postuler")) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (!maintenanceAllows(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
