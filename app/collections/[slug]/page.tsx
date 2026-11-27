import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { CollectionDetailView } from "@/features/catalog/components/collection-detail-view";
import {
  getCachedFeaturedCategories,
  getCachedSearchCatalog,
} from "@/features/catalog/lib/catalog-cache";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  getCollectionSeo,
  getSiteUrl,
} from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!hasEnvVars) return [];
  try {
    const categories = await getCachedFeaturedCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const categories = hasEnvVars ? await getCachedFeaturedCategories() : [];
  const category = categories.find((c) => c.slug === decoded);

  if (!category) {
    return buildPageMetadata({
      path: `/collections/${decoded}`,
      title: "القسم غير موجود — elloll",
      description: "عذراً، هذا القسم غير متاح حالياً في متجر elloll.",
      noIndex: true,
    });
  }

  const seo = getCollectionSeo(category);
  return buildPageMetadata({
    path: `/collections/${category.slug}`,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  });
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const categories = hasEnvVars ? await getCachedFeaturedCategories() : [];
  const category = categories.find((c) => c.slug === decoded);

  if (!category) {
    notFound();
  }

  const [{ products }, seo] = await Promise.all([
    getCachedSearchCatalog({ categoryId: category.id, pageSize: 48 }),
    Promise.resolve(getCollectionSeo(category)),
  ]);

  const baseUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.name,
      description: seo.description,
      url: `${baseUrl}/collections/${encodeURIComponent(category.slug)}`,
      inLanguage: "ar-EG",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${baseUrl}/products/${p.id}`,
        name: p.name,
      })),
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الأقسام", path: "/collections" },
      { name: category.name, path: `/collections/${category.slug}` },
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
        <CollectionDetailView
          category={category}
          categories={categories}
          products={products}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
