"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/components/product-card";
import { SortDropdown } from "@/features/catalog/components/sort-dropdown";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedCategoryName } from "@/lib/seo";
import type {
  CatalogSort,
  Category,
  PriceRangeKey,
  Product,
} from "@/features/catalog/lib/catalog";

export function HomeSmartCatalog({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const { t, locale, dir } = useLanguage();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<PriceRangeKey>("all");
  const [sort, setSort] = useState<CatalogSort>("newest");

  const hasActiveFilters =
    q.trim() !== "" ||
    categoryId !== "all" ||
    priceRange !== "all" ||
    sort !== "newest";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryId !== "all" && p.category_id !== categoryId) return false;
      if (priceRange === "under-500" && p.price >= 500) return false;
      if (priceRange === "500-1500" && (p.price < 500 || p.price > 1500))
        return false;
      if (priceRange === "over-1500" && p.price <= 1500) return false;
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !(p.description?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });

    if (sort === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, q, categoryId, priceRange, sort]);

  function resetFilters() {
    setQ("");
    setCategoryId("all");
    setPriceRange("all");
    setSort("newest");
  }

  const priceChips: { value: PriceRangeKey; label: string }[] = [
    { value: "all", label: t("priceAll") },
    { value: "under-500", label: t("priceUnder500") },
    { value: "500-1500", label: t("price500to1500") },
    { value: "over-1500", label: t("priceOver1500") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      {/* Section Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t("smartFilterTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {t("resultsCount")}
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          <span>{t("viewAll")}</span>
          <Arrow className="h-4 w-4" />
        </Link>
      </div>

      {/* Smart Filter Bar */}
      <div className="mb-8 space-y-3.5 rounded-2xl border border-border bg-card/70 p-3.5 shadow-sm backdrop-blur sm:space-y-4 sm:p-4">
        {/* Top Row: Search + Sort + In-Stock Toggle */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full ps-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <SortDropdown value={sort} onChange={setSort} />

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="col-span-2 h-9 w-full justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:col-span-1 sm:w-auto"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </div>

        {/* Category Pills — single horizontal scroll row on mobile, wrapped on desktop */}
        {categories.length > 0 && (
          <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                categoryId === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t("allFilter")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  categoryId === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {getLocalizedCategoryName(cat, locale)}
              </button>
            ))}
          </div>
        )}

        {/* Smart Price Range Chips — 2x2 grid on mobile, inline row on desktop */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:flex sm:flex-wrap sm:items-center">
          {priceChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setPriceRange(chip.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-colors sm:py-1 ${
                priceRange === chip.value
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-500"
                  : "border border-transparent bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-semibold">{t("noMatchingProducts")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("tryAnotherFilter")}
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("clearFilters")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
