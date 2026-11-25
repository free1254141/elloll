import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAdminProducts } from "@/features/admin/lib/products/products";
import { getFeaturedCategories } from "@/features/catalog/lib/catalog";
import { ProductsManager } from "@/features/admin/components/products-manager";

export const metadata: Metadata = {
  title: "المنتجات — إدارة elloll",
  description: "إدارة منتجات المتجر: إضافة، تعديل، رفع الصور، وإدارة الظهور والـ SEO.",
};

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [rawProducts, categories, seoRows] = await Promise.all([
    listAdminProducts(supabase),
    getFeaturedCategories(supabase),
    supabase.from("products").select("id, seo_title, seo_description, seo_keywords"),
  ]);

  const seoMap = new Map(
    ((seoRows.data ?? []) as Array<{
      id: string;
      seo_title: string | null;
      seo_description: string | null;
      seo_keywords: string | null;
    }>).map((r) => [r.id, r]),
  );

  const products = rawProducts.map((p) => {
    const seo = seoMap.get(p.id);
    return seo
      ? {
          ...p,
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          seo_keywords: seo.seo_keywords,
        }
      : p;
  });

  return <ProductsManager initialProducts={products} categories={categories} />;
}
