import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { CollectionsHubView } from "@/features/catalog/components/collections-hub-view";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedFeaturedProducts,
} from "@/features/catalog/lib/catalog-cache";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  getSiteUrl,
} from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  path: "/collections",
  title: "أقسام وتشكيلات الملابس في مصر | elloll",
  description:
    "تصفح جميع أقسام متجر elloll: هوديز وسويت شيرتات، بنطلونات وسويت بانتس، أحذية وسنيكرز شبابي، تيشيرتات وقمصان، وأطقم رياضية مع شحن لجميع محافظات مصر.",
  keywords: [
    "أقسام elloll",
    "هوديز وسويت شيرتات",
    "بنطلونات وجينز وسويت بانتس",
    "أحذية وسنيكرز مصر",
    "أطقم رياضية رجالي",
    "تيشيرتات وقمصان مصر",
  ],
});

export default async function CollectionsPage() {
  const [categories, products] = hasEnvVars
    ? await Promise.all([
        getCachedFeaturedCategories(),
        getCachedFeaturedProducts(100),
      ])
    : [[], []];

  const baseUrl = getSiteUrl();

  const collections = categories.map((category) => {
    const matching = products.filter((p) => p.category_id === category.id);
    const cover =
      matching.length > 0 ? getProductImages(matching[0])[0] ?? null : null;
    return {
      category,
      count: matching.length,
      cover,
    };
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "أقسام متجر elloll",
      url: `${baseUrl}/collections`,
      inLanguage: "ar-EG",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: collections.map((c, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: c.category.name,
        url: `${baseUrl}/collections/${encodeURIComponent(c.category.slug)}`,
      })),
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الأقسام", path: "/collections" },
    ]),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CollectionsHubView collections={collections} />
      </main>
      <SiteFooter />
    </div>
  );
}
