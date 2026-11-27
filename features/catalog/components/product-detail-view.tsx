"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageCheck, Truck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedCategoryName } from "@/lib/seo";
import type { Category, Product } from "@/features/catalog/lib/catalog";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { AddToCart } from "@/features/catalog/components/add-to-cart";
import { ProductCard } from "@/features/catalog/components/product-card";
import { Button } from "@/components/ui/button";

const priceFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

export function ProductDetailView({
  product,
  images,
  category,
  categories,
  related,
}: {
  product: Product;
  images: string[];
  category: Category | null;
  categories: Category[];
  related: Product[];
}) {
  const { t, locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const MoreArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <Button asChild variant="ghost" size="sm" className="-ms-3 mb-6 text-muted-foreground">
        <Link href="/products">
          <BackArrow className="h-4 w-4" />
          {t("backToProducts")}
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery name={product.name} images={images} />

        <div className="flex flex-col gap-5">
          <div>
            {category && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Link
                  href={`/collections/${category.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {getLocalizedCategoryName(category, locale)}
                </Link>
              </p>
            )}
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold sm:text-3xl">
              {priceFormatter.format(product.price)}
            </span>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <AddToCart product={product} />

          <div className="mt-2 grid gap-3 border-t border-border pt-5 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span>{t("freeShippingOver")}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <PackageCheck className="h-4 w-4 shrink-0" />
              <span>{t("readyToShip")}</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <Link href="/size-guide" className="font-medium text-amber-500 hover:underline">
                {isAr ? "دليل المقاسات" : "Size Guide"}
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/shipping-delivery"
                className="font-medium text-amber-500 hover:underline"
              >
                {isAr ? "أسعار الشحن للمحافظات" : "Egypt Shipping Rates"}
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/returns-policy"
                className="font-medium text-amber-500 hover:underline"
              >
                {isAr ? "الاستبدال والاسترجاع (14 يوماً)" : "14-Day Returns"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-products" className="mt-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="related-products" className="text-2xl font-semibold tracking-tight">
              {t("relatedProducts")}
            </h2>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>{t("viewAll")}</span>
              <MoreArrow className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((rel) => (
              <ProductCard key={rel.id} product={rel} categories={categories} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
