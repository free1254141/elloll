import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import {
  getFeaturedCategories,
  getFeaturedProducts,
  getProductById,
  getRelatedProducts,
  searchCatalog,
  type CatalogParams,
  type CatalogResult,
  type Category,
  type Product,
} from "./catalog";

export const CATALOG_REVALIDATE_SECONDS = 86400; // 24h fallback; invalidated immediately on admin writes

export type ProductSeoFields = {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
};

export type SitemapCatalogData = {
  products: { id: string; created_at: string | null }[];
  categories: { slug: string; created_at: string | null }[];
};

export function getCachedFeaturedCategories(): Promise<Category[]> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return [];
      return getFeaturedCategories(client);
    },
    ["catalog-featured-categories"],
    {
      tags: ["catalog", "categories"],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedFeaturedProducts(limit = 4): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return [];
      return getFeaturedProducts(client, limit);
    },
    ["catalog-featured-products", String(limit)],
    {
      tags: ["catalog", "products"],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedSearchCatalog(
  params: CatalogParams = {},
): Promise<CatalogResult> {
  const keyParts = [
    params.q ?? "",
    params.categoryId ?? "",
    params.sort ?? "newest",
    params.inStockOnly ? "1" : "0",
    params.priceRange ?? "all",
    String(params.page ?? 1),
    String(params.pageSize ?? 12),
  ];

  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) {
        return {
          products: [],
          total: 0,
          page: Math.max(1, Math.floor(params.page ?? 1)),
          pageSize: Math.max(1, Math.floor(params.pageSize ?? 12)),
          totalPages: 1,
        };
      }
      return searchCatalog(client, params);
    },
    ["catalog-search", ...keyParts],
    {
      tags: ["catalog", "products", "categories"],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedProductById(id: string): Promise<Product | null> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return null;
      return getProductById(client, id);
    },
    ["catalog-product-by-id", id],
    {
      tags: ["catalog", "products", `product-${id}`],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return [];
      return getRelatedProducts(client, categoryId, excludeId, limit);
    },
    ["catalog-related-products", categoryId ?? "none", excludeId, String(limit)],
    {
      tags: ["catalog", "products"],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedProductSeo(
  id: string,
): Promise<ProductSeoFields | null> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return null;
      const { data } = await client
        .from("products")
        .select("seo_title, seo_description, seo_keywords")
        .eq("id", id)
        .maybeSingle();
      return (data as ProductSeoFields | null) ?? null;
    },
    ["catalog-product-seo", id],
    {
      tags: ["catalog", "products", `product-${id}`],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

export function getCachedSitemapData(): Promise<SitemapCatalogData> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return { products: [], categories: [] };
      const [{ data: products }, { data: categories }] = await Promise.all([
        client
          .from("products")
          .select("id, created_at")
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        client.from("categories").select("slug, created_at"),
      ]);
      return {
        products: (products ?? []) as { id: string; created_at: string | null }[],
        categories: (categories ?? []) as { slug: string; created_at: string | null }[],
      };
    },
    ["catalog-sitemap"],
    {
      tags: ["catalog", "products", "categories"],
      revalidate: CATALOG_REVALIDATE_SECONDS,
    },
  )();
}

/**
 * Purges storefront Next.js Data Cache & ISR pages immediately whenever Admin
 * creates/updates/deletes products/categories or when stock changes after orders.
 */
export function revalidateCatalogCache(productId?: string) {
  revalidateTag("catalog", { expire: 0 });
  revalidateTag("products", { expire: 0 });
  revalidateTag("categories", { expire: 0 });
  if (productId) {
    revalidateTag(`product-${productId}`, { expire: 0 });
    revalidatePath(`/products/${productId}`);
  }
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");
}
