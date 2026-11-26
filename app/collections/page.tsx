import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Layers } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedFeaturedProducts,
} from "@/features/catalog/lib/catalog-cache";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  getCollectionSeo,
  getSiteUrl,
} from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  path: "/collections",
  title: "أقسام وتشكيلات الملابس في مصر | elloll",
  description:
    "تصفح جميع أقسام متجر elloll: هوديز وسويت شيرتات قطن مصري، أحذية وسنيكرز شبابي، تيشيرتات وبديهات، وأطقم رياضية مع شحن لجميع محافظات مصر.",
  keywords: [
    "أقسام elloll",
    "هوديز وسويت شيرتات",
    "أحذية وسنيكرز مصر",
    "أطقم رياضية رجالي",
    "تيشيرتات قطن مصر",
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

  const collectionsWithMeta = categories.map((cat) => {
    const matching = products.filter((p) => p.category_id === cat.id);
    const cover =
      matching.length > 0 ? getProductImages(matching[0])[0] ?? null : null;
    const seo = getCollectionSeo(cat);
    return {
      ...cat,
      count: matching.length,
      cover,
      seo,
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
      itemListElement: collectionsWithMeta.map((c, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: c.name,
        url: `${baseUrl}/collections/${encodeURIComponent(c.slug)}`,
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

        <div className="mx-auto w-full max-w-5xl px-5 py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">الأقسام</span>
          </nav>

          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              <Layers className="h-3.5 w-3.5" />
              <span>تشكيلات elloll</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              أقسام متجر elloll
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              اختر القسم المناسب لذوقك واستكشف أحدث القطع من الهوديز والسويت شيرتات
              القطنية والأحذية الكاجوال والأطقم الرياضية مع دفع عند الاستلام وشحن
              سريع لجميع محافظات مصر.
            </p>
          </header>

          {collectionsWithMeta.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد أقسام مضافة حالياً. يمكنك{" "}
                <Link href="/products" className="font-semibold text-amber-500 underline">
                  تصفح جميع المنتجات
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {collectionsWithMeta.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-amber-500/50 hover:shadow-md sm:flex-row"
                >
                  <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-44">
                    {col.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={col.cover}
                        alt={col.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        elloll
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-bold group-hover:text-amber-500">
                          {col.name}
                        </h2>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {col.count} منتج
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {col.seo.intro}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                      <span>تصفح القسم</span>
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="mt-12 rounded-2xl border border-border bg-card/60 p-6">
            <h2 className="text-base font-bold">روابط مفيدة قبل الشراء</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-xs sm:text-sm">
              <Link
                href="/size-guide"
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                دليل المقاسات
              </Link>
              <Link
                href="/shipping-delivery"
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                الشحن والتوصيل لكل مصر
              </Link>
              <Link
                href="/returns-policy"
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                سياسة الاستبدال والاسترجاع
              </Link>
              <Link
                href="/faq"
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                الأسئلة الشائعة
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
