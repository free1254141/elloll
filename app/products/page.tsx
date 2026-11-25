import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import {
  CatalogGrid,
  CatalogGridSkeleton,
} from "@/features/catalog/components/catalog-grid";
import type { ProductsSearchParams } from "@/features/catalog/lib/catalog";
import { getCachedFeaturedCategories } from "@/features/catalog/lib/catalog-cache";
import { getSiteUrl } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const baseUrl = getSiteUrl();

  let title = "جميع المنتجات — ملابس وأزياء في مصر | elloll";
  let description =
    "تصفح تشكيلة elloll الكاملة من الملابس والأزياء العصرية في مصر مع فلاتر ذكية حسب القسم والسعر والتوفر.";

  if (sp.category) {
    try {
      const cats = await getCachedFeaturedCategories();
      const matched = cats.find((c) => c.slug === sp.category);
      if (matched) {
        title = `${matched.name} — تسوق أونلاين في مصر | elloll`;
        description = `اكتشف أحدث منتجات قسم ${matched.name} في متجر elloll بأسعار الجنيه المصري وشحن سريع لجميع المحافظات.`;
      }
    } catch {
      // fallback to default
    }
  } else if (sp.q) {
    title = `نتائج البحث: ${sp.q} — elloll`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: sp.category
        ? `${baseUrl}/products?category=${encodeURIComponent(sp.category)}`
        : `${baseUrl}/products`,
    },
    openGraph: {
      title,
      description,
      siteName: "elloll",
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <Suspense fallback={<CatalogGridSkeleton />}>
          <CatalogGrid searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
