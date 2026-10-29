import type { MetadataRoute } from "next";
import { MAINTENANCE } from "@/lib/maintenance";

export default function robots(): MetadataRoute.Robots {
  if (MAINTENANCE) return { rules: [{ userAgent: "*", allow: "/$", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/candidat/", "/api/", "/onboarding", "/auth/", "/invite/"] }],
    sitemap: "https://wolko.be/sitemap.xml",
  };
}
