"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function CatalogHeader({
  total,
  categoryName,
  categoryNotFound,
}: {
  total: number;
  categoryName?: string;
  categoryNotFound?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("products")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {categoryNotFound
          ? t("noMatchingProducts")
          : `${total} ${t("resultsCount")}${categoryName ? ` — ${categoryName}` : ""}`}
      </p>
    </div>
  );
}

export function CatalogEmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">
        {hasFilters ? t("noMatchingProducts") : t("noProductsYet")}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters ? t("tryAnotherFilter") : ""}
      </p>
      {hasFilters && (
        <Link
          href="/products"
          className="mt-4 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t("clearFilters")}
        </Link>
      )}
    </div>
  );
}
