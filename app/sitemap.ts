import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  if (!hasEnvVars) {
    return staticRoutes;
  }

  try {
    const supabase = await createClient();
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase
        .from("products")
        .select("id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("slug, created_at"),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
      url: `${baseUrl}/products?category=${encodeURIComponent(c.slug)}`,
      lastModified: new Date(c.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: new Date(p.created_at || Date.now()),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
