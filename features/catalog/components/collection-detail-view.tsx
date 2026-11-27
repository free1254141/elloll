"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import {
  getLocalizedCategoryName,
  getLocalizedCollectionIntro,
} from "@/lib/seo";
import { ProductCard } from "@/features/catalog/components/product-card";
import type { Category, Product } from "@/features/catalog/lib/catalog";

export function CollectionDetailView({
  category,
  categories,
  products,
}: {
  category: Category;
  categories: Category[];
  products: Product[];
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const categoryTitle = getLocalizedCategoryName(category, locale);
  const intro = getLocalizedCollectionIntro(category, locale);
  const siblingCollections = categories.filter((c) => c.id !== category.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span>/</span>
        <Link href="/collections" className="transition-colors hover:text-foreground">
          {isAr ? "الأقسام" : "Collections"}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{categoryTitle}</span>
      </nav>

      <header className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {categoryTitle}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {intro}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
            {products.length}{" "}
            {isAr ? "منتج متاح" : products.length === 1 ? "product" : "products"}
          </span>
          <Link
            href="/size-guide"
            className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "دليل المقاسات" : "Size Guide"}
          </Link>
          <Link
            href="/shipping-delivery"
            className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {isAr ? "أسعار الشحن والتوصيل" : "Shipping & Delivery"}
          </Link>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد منتجات في هذا القسم حالياً. " : "No products in this collection yet. "}
            <Link href="/products" className="font-semibold text-amber-500 underline">
              {isAr ? "عرض كل المنتجات" : "View all products"}
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} categories={categories} />
          ))}
        </div>
      )}

      {siblingCollections.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-lg font-bold">
            {isAr ? "تصفح أقساماً أخرى في elloll" : "Explore Other Collections"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {siblingCollections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-amber-500/50 hover:text-amber-500"
              >
                {getLocalizedCategoryName(c, locale)}
              </Link>
            ))}
            <Link
              href="/products"
              className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {isAr ? "جميع المنتجات" : "All Products"}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
