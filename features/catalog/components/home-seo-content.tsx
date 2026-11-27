"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  getLocalizedCategoryName,
  getLocalizedCollectionIntro,
} from "@/lib/seo";
import type { Category } from "@/features/catalog/lib/catalog";

export type HomeCollectionCard = {
  category: Category;
  cover: string | null;
};

export function HomeSeoContent({
  collections,
}: {
  collections: HomeCollectionCard[];
}) {
  const { locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 px-5 pb-14 pt-4">
      {collections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {isAr ? "تصفح حسب القسم" : "Shop by Collection"}
            </h2>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:underline sm:text-sm"
            >
              <span>{isAr ? "كل الأقسام" : "All Collections"}</span>
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {collections.map(({ category, cover }) => {
              const title = getLocalizedCategoryName(category, locale);
              const intro = getLocalizedCollectionIntro(category, locale);
              return (
                <Link
                  key={category.id}
                  href={`/collections/${category.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-amber-500/50"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={title}
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
                      {title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {intro}
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
          {isAr ? "معلومات مهمة قبل الطلب من elloll" : "Helpful Guides Before You Order"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/shipping-delivery"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <Truck className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{isAr ? "أسعار الشحن لكل مصر" : "Egypt Shipping Rates"}</span>
          </Link>
          <Link
            href="/size-guide"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <Ruler className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{isAr ? "دليل المقاسات بالسنتيمتر" : "Size Guide (cm)"}</span>
          </Link>
          <Link
            href="/returns-policy"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{isAr ? "الاستبدال خلال 14 يوماً" : "14-Day Returns"}</span>
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{isAr ? "الأسئلة الشائعة" : "FAQ"}</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium transition-colors hover:border-amber-500/40"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{isAr ? "عن متجر elloll" : "About elloll"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
