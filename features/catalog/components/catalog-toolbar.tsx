"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SortDropdown } from "@/features/catalog/components/sort-dropdown";
import {
  isValidSort,
  type Category,
  type CatalogSort,
  type PriceRangeKey,
} from "@/features/catalog/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { getLocalizedCategoryName } from "@/lib/seo";

export function CatalogToolbar({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const rawSort = searchParams.get("sort");
  const sort: CatalogSort | "" = isValidSort(rawSort) ? rawSort : "";
  const priceRange = (searchParams.get("price") ?? "all") as PriceRangeKey;

  const [draft, setDraft] = useState(q);
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestParamsRef = useRef(searchParams);
  latestParamsRef.current = searchParams;

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      setDraft(q);
    }
  }, [q]);

  function updateParams(
    changes: {
      q?: string;
      category?: string;
      sort?: string;
      price?: string;
      stock?: string;
    },
    base: URLSearchParams,
  ) {
    const params = new URLSearchParams(base);
    for (const [key, value] of Object.entries(changes)) {
      if (value && value !== "" && value !== "all") params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      updateParams({ q: draft }, latestParamsRef.current);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const hasActiveFilters =
    q !== "" ||
    category !== "" ||
    sort !== "" ||
    priceRange !== "all";

  const priceChips: { value: PriceRangeKey; label: string }[] = [
    { value: "all", label: t("priceAll") },
    { value: "under-500", label: t("priceUnder500") },
    { value: "500-1500", label: t("price500to1500") },
    { value: "over-1500", label: t("priceOver1500") },
  ];

  return (
    <div className="space-y-3.5 rounded-2xl border border-border bg-card/70 p-3.5 shadow-sm sm:space-y-4 sm:p-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full ps-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:w-auto">
          <SortDropdown
            value={sort}
            onChange={(next) =>
              updateParams(
                { sort: next === "newest" ? "" : next },
                searchParams,
              )
            }
          />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft("");
                router.replace("/products");
              }}
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
            onClick={() => updateParams({ category: "" }, searchParams)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              category === ""
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t("allFilter")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => updateParams({ category: c.slug }, searchParams)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === c.slug
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {getLocalizedCategoryName(c, locale)}
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
            onClick={() =>
              updateParams(
                { price: chip.value === "all" ? "" : chip.value },
                searchParams,
              )
            }
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
  );
}
