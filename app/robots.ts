import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  if (process.env.NEXT_PUBLIC_APP_MODE === "admin") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/products/", "/support", "/track"],
        disallow: ["/admin", "/admin/", "/auth", "/auth/", "/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
