import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeft, HelpCircle, RefreshCw, Ruler, ShieldCheck, Truck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { Hero } from "@/features/catalog/components/hero";
import {
  FeaturedCatalog,
  FeaturedCatalogSkeleton,
} from "@/features/catalog/components/featured-catalog";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedFeaturedProducts,
} from "@/features/catalog/lib/catalog-cache";
import { buildPageMetadata, getCollectionSeo, getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title: "elloll — أزياء وملابس عصرية في مصر",
  description:
    "متجر elloll للملابس والأزياء العصرية في مصر — هوديز، سويت شيرتات، تيشيرتات، أطقم رياضية وأحذية مع دفع عند الاستلام وشحن سريع لجميع المحافظات.",
  keywords: [
    "elloll",
    "متجر ملابس مصر",
    "أزياء أونلاين مصر",
    "هوديز وسويت شيرتات",
    "أحذية وسنيكرز",
    "شحن لجميع المحافظات",
  ],
});

async function HomeSeoSection() {
  if (!hasEnvVars) return null;

  const [categories, products] = await Promise.all([
    getCachedFeaturedCategories(),
    getCachedFeaturedProducts(24),
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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 px-5 pb-14 pt-4">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {categories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              تصفح حسب القسم
            </h2>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:underline sm:text-sm"
            >
              <span>كل الأقسام</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => {
              const matching = products.filter((p) => p.category_id === cat.id);
              const cover =
                matching.length > 0
                  ? getProductImages(matching[0])[0] ?? null
                  : null;
              const seo = getCollectionSeo(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-amber-500/50"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        elloll
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold group-hover:text-amber-500">
                      {cat.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {seo.intro}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-muted/25 p-5 sm:p-6">
        <h2 className="text-base font-bold sm:text-lg">
          معلومات مهمة قبل الطلب من elloll
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/shipping-delivery"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <Truck className="h-4 w-4 shrink-0 text-amber-500" />
            <span>أسعار الشحن لكل مصر</span>
          </Link>
          <Link
            href="/size-guide"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <Ruler className="h-4 w-4 shrink-0 text-amber-500" />
            <span>دليل المقاسات بالسنتيمتر</span>
          </Link>
          <Link
            href="/returns-policy"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-500" />
            <span>الاستبدال خلال 14 يوماً</span>
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>الأسئلة الشائعة</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" />
            <span>عن متجر elloll</span>
          </Link>
        </div>
      </div>
    </section>
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
