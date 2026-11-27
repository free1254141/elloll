"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  getLocalizedCategoryName,
  getLocalizedCollectionIntro,
} from "@/lib/seo";
import type { Category } from "@/features/catalog/lib/catalog";

export type CollectionHubItem = {
  category: Category;
  count: number;
  cover: string | null;
};

export function CollectionsHubView({
  collections,
}: {
  collections: CollectionHubItem[];
}) {
  const { locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {isAr ? "الأقسام" : "Collections"}
        </span>
      </nav>

      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <Layers className="h-3.5 w-3.5" />
          <span>{isAr ? "تشكيلات elloll" : "elloll Collections"}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr ? "أقسام متجر elloll" : "Shop by Collection"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "اختر القسم المناسب لذوقك واستكشف أحدث القطع من الهوديز والسويت شيرتات والبنطلونات والأحذية والأطقم الرياضية مع دفع عند الاستلام وشحن سريع لجميع محافظات مصر."
            : "Choose a collection to explore our latest hoodies, sweatshirts, sweatpants, jeans, tees, tracksuits, and sneakers with cash on delivery across Egypt."}
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد أقسام مضافة حالياً. يمكنك " : "No collections yet. "}
            <Link href="/products" className="font-semibold text-amber-500 underline">
              {isAr ? "تصفح جميع المنتجات" : "Browse all products"}
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {collections.map(({ category, count, cover }) => {
            const title = getLocalizedCategoryName(category, locale);
            const intro = getLocalizedCollectionIntro(category, locale);
            return (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-amber-500/50 hover:shadow-md sm:flex-row"
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-44">
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
                <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-bold group-hover:text-amber-500">
                        {title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {count} {isAr ? "منتج" : count === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {intro}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                    <span>{isAr ? "تصفح القسم" : "Explore collection"}</span>
                    <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <section className="mt-12 rounded-2xl border border-border bg-card/60 p-6">
        <h2 className="text-base font-bold">
          {isAr ? "روابط مفيدة قبل الشراء" : "Helpful Shopping Guides"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-3 text-xs sm:text-sm">
          <Link
            href="/size-guide"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "دليل المقاسات" : "Size Guide"}
          </Link>
          <Link
            href="/shipping-delivery"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "الشحن والتوصيل لكل مصر" : "Shipping & Delivery"}
          </Link>
          <Link
            href="/returns-policy"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "سياسة الاستبدال والاسترجاع" : "Returns Policy"}
          </Link>
          <Link
            href="/faq"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "الأسئلة الشائعة" : "FAQ"}
          </Link>
        </div>
      </section>
    </div>
  );
}
