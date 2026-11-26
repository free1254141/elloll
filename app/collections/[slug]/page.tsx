import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/features/catalog/components/product-card";
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
  const siblingCollections = categories.filter((c) => c.id !== category.id);

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

        <div className="mx-auto w-full max-w-5xl px-5 py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              الرئيسية
            </Link>
            <span>/</span>
            <Link
              href="/collections"
              className="transition-colors hover:text-foreground"
            >
              الأقسام
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">{category.name}</span>
          </nav>

          <header className="mb-8 space-y-3">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {seo.intro}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                {products.length} منتج متاح
              </span>
              <Link
                href="/size-guide"
                className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                دليل المقاسات
              </Link>
              <Link
                href="/shipping-delivery"
                className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                أسعار الشحن والتوصيل
              </Link>
            </div>
          </header>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد منتجات في هذا القسم حالياً.{" "}
                <Link href="/products" className="font-semibold text-amber-500 underline">
                  عرض كل المنتجات
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categories={categories}
                />
              ))}
            </div>
          )}

          {siblingCollections.length > 0 && (
            <section className="mt-14 border-t border-border pt-8">
              <h2 className="text-lg font-bold">تصفح أقساماً أخرى في elloll</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {siblingCollections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.slug}`}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-amber-500/50 hover:text-amber-500"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link
                  href="/products"
                  className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  جميع المنتجات
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
