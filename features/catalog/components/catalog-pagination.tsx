"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isValidSort, type ProductsSearchParams } from "@/features/catalog/lib/catalog";
import { useLanguage } from "@/lib/i18n";

export function CatalogPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: ProductsSearchParams;
}) {
  const { t, dir } = useLanguage();
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  function href(target: number) {
    const urlParams = new URLSearchParams();
    if (searchParams.q) urlParams.set("q", searchParams.q);
    if (searchParams.category) urlParams.set("category", searchParams.category);
    if (isValidSort(searchParams.sort)) urlParams.set("sort", searchParams.sort);
    if (searchParams.price) urlParams.set("price", searchParams.price);
    if (searchParams.stock === "1") urlParams.set("stock", "1");
    if (target > 1) urlParams.set("page", String(target));
    const qs = urlParams.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  const prev = page > 1 ? href(page - 1) : null;
  const next = page < totalPages ? href(page + 1) : null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1"
    >
      {prev ? (
        <Link
          href={prev}
          className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PrevIcon className="h-4 w-4" />
          {t("previous")}
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground/40">
          <PrevIcon className="h-4 w-4" />
          {t("previous")}
        </span>
      )}

      {pages.map((target) => {
        const active = target === page;
        return (
          <Link
            key={target}
            href={href(target)}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                : "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            }
          >
            {target}
          </Link>
        );
      })}

      {next ? (
        <Link
          href={next}
          className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {t("next")}
          <NextIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground/40">
          {t("next")}
          <NextIcon className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
