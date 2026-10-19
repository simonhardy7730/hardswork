import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/candidat/", "/api/", "/onboarding", "/auth/", "/invite/"] }],
    sitemap: "https://wolko.be/sitemap.xml",
  };
}
