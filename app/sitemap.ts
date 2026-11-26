import type { MetadataRoute } from "next";
import { getCachedSitemapData } from "@/features/catalog/lib/catalog-cache";
import { getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shipping-delivery`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/returns-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  if (!hasEnvVars) {
    return staticRoutes;
  }

  try {
    const { products, categories } = await getCachedSitemapData();

    const collectionRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/collections/${encodeURIComponent(c.slug)}`,
      lastModified: new Date(c.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/products/${p.id}`,
      lastModified: new Date(p.created_at || Date.now()),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    return [...staticRoutes, ...collectionRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
