"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Eye, Images, ShoppingCart } from "lucide-react";
import { useRef, useState } from "react";
import { getProductImages, type Category, type Product } from "@/features/catalog/lib/catalog";
import { useCartStore } from "@/features/cart/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedCategoryName } from "@/lib/seo";

const priceFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

export function ProductCard({
  product,
  categories,
}: {
  product: Product;
  categories?: Category[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { t, locale } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const images = getProductImages(product);
  const primaryImage = images[0] || product.image_url;
  const secondaryImage = images.length > 1 ? images[1] : null;
  const matchedCat = categories?.find((c) => c.id === product.category_id) ?? null;
  const categoryName = matchedCat
    ? getLocalizedCategoryName(matchedCat, locale)
    : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1600);
  }

  function handleViewDetails(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}`;
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-all duration-300 ${
            secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
          }`}
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
          />
        )}
        {images.length > 1 && (
          <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            <Images className="h-3 w-3 text-amber-500" />
            {images.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {categoryName && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {categoryName}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {product.name}
        </h3>
        <p className="mt-auto pt-1 font-display text-base font-bold tabular-nums">
          {priceFormatter.format(product.price)}
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleViewDetails}
            aria-label={`View details for ${product.name}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("viewDetails")}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              justAdded
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("added")}
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("addToCart")}
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
