import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { Hero } from "@/features/catalog/components/hero";
import {
  FeaturedCatalog,
  FeaturedCatalogSkeleton,
} from "@/features/catalog/components/featured-catalog";
import { HomeSeoContent } from "@/features/catalog/components/home-seo-content";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedFeaturedProducts,
} from "@/features/catalog/lib/catalog-cache";
import { buildPageMetadata, getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title: "elloll — أزياء وملابس عصرية في مصر",
  description:
    "متجر elloll للملابس والأزياء العصرية في مصر — هوديز، سويت شيرتات، بنطلونات، تيشيرتات، أطقم رياضية وأحذية مع دفع عند الاستلام وشحن سريع لجميع المحافظات.",
  keywords: [
    "elloll",
    "متجر ملابس مصر",
    "أزياء أونلاين مصر",
    "هوديز وسويت شيرتات",
    "بنطلونات جينز وسويت بانتس",
    "أحذية وسنيكرز",
    "شحن لجميع المحافظات",
  ],
});

async function HomeSeoSection() {
  if (!hasEnvVars) return null;

  const [categories, products] = await Promise.all([
    getCachedFeaturedCategories(),
    getCachedFeaturedProducts(60),
  ]);

  const baseUrl = getSiteUrl();
  const itemListJsonLd =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أحدث منتجات متجر elloll",
          itemListElement: products.slice(0, 12).map((p, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `${baseUrl}/products/${p.id}`,
            name: p.name,
          })),
        }
      : null;

  const collections = categories.map((category) => {
    const matching = products.filter((p) => p.category_id === category.id);
    const cover =
      matching.length > 0 ? getProductImages(matching[0])[0] ?? null : null;
    return { category, cover };
  });

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <HomeSeoContent collections={collections} />
    </>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <Hero />
        <Suspense fallback={<FeaturedCatalogSkeleton />}>
          <FeaturedCatalog />
        </Suspense>
        <Suspense fallback={null}>
          <HomeSeoSection />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
