import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hasEnvVars } from "@/lib/utils";
import {
  isValidSort,
  type Category,
  type ProductsSearchParams,
} from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedSearchCatalog,
} from "@/features/catalog/lib/catalog-cache";
import { ProductCard } from "@/features/catalog/components/product-card";
import { CatalogToolbar } from "@/features/catalog/components/catalog-toolbar";
import {
  CatalogEmptyState,
  CatalogHeader,
} from "@/features/catalog/components/catalog-labels";
import type { PriceRangeKey } from "@/features/catalog/lib/catalog";

const PAGE_SIZE = 12;

/**
 * The `page` query param as a valid 1-based page number: missing, blank,
 * non-numeric, or below-1 values all fall back to 1.
 */
function toPage(raw: string | undefined): number {
  const page = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

export async function CatalogGrid({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  if (!hasEnvVars) {
    return <SetupHint />;
  }

  const params = await searchParams;
  const requestedPage = toPage(params.page);
  const sort = isValidSort(params.sort) ? params.sort : "newest";
  const inStockOnly = params.stock === "1";
  const priceRange: PriceRangeKey =
    params.price === "under-500" ||
    params.price === "500-1500" ||
    params.price === "over-1500"
      ? params.price
      : "all";
  const categorySlugSpecified = Boolean(params.category);

  const categories = await getCachedFeaturedCategories();
  const activeCategory =
    categories.find((c) => c.slug === params.category) ?? null;

  if (categorySlugSpecified && !activeCategory) {
    return (
      <CatalogFrame
        categories={categories}
        total={0}
        categoryNotFound
        toolbar
        empty={<CatalogEmptyState hasFilters />}
      />
    );
  }

  const result = await getCachedSearchCatalog({
    q: params.q,
    categoryId: activeCategory?.id,
    sort,
    inStockOnly,
    priceRange,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });

  const page = Math.min(requestedPage, result.totalPages);
  const clamped = page !== requestedPage;
  const effectiveResult = clamped
    ? await getCachedSearchCatalog({
        q: params.q,
        categoryId: activeCategory?.id,
        sort,
        inStockOnly,
        priceRange,
        page,
        pageSize: PAGE_SIZE,
      })
    : result;
  const { products, total, totalPages } = effectiveResult;
  const hasFilters = Boolean(
    params.q || activeCategory || inStockOnly || priceRange !== "all",
  );

  return (
    <CatalogFrame
      categories={categories}
      total={total}
      categoryName={activeCategory?.name}
      toolbar
      empty={
        products.length === 0 ? (
          <CatalogEmptyState hasFilters={hasFilters} />
        ) : undefined
      }
    >
      {products.length > 0 && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} categories={categories} />
            ))}
          </div>
          {totalPages > 1 && (
            <CatalogPagination
              page={page}
              totalPages={totalPages}
              searchParams={params}
            />
          )}
        </>
      )}
    </CatalogFrame>
  );
}

function CatalogFrame({
  categories,
  total,
  categoryName,
  categoryNotFound,
  toolbar = false,
  empty,
  children,
}: {
  categories: Category[];
  total: number;
  categoryName?: string;
  categoryNotFound?: boolean;
  toolbar?: boolean;
  empty?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <CatalogHeader
        total={total}
        categoryName={categoryName}
        categoryNotFound={categoryNotFound}
      />

      {toolbar && <CatalogToolbar categories={categories} />}

      {empty ? <div className="mt-8">{empty}</div> : children}
    </div>
  );
}

function CatalogPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: ProductsSearchParams;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  function href(target: number) {
    // Rebuild the URL from the current filters, swapping in the target page.
    // Empty params and page 1 are omitted — page 1 is the implicit default.
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
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
          Previous
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
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground/40">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

export function CatalogGridSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-40 animate-shimmer rounded-md" />
        <div className="h-4 w-56 animate-shimmer rounded-md" />
      </div>
      <div className="h-9 w-full animate-shimmer rounded-md" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-square animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyResults({
  hasQuery,
  hasCategory,
  title,
  description,
}: {
  hasQuery: boolean;
  hasCategory: boolean;
  title?: string;
  description?: string;
}) {
  const showClear = hasQuery || hasCategory;
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">
        {title ??
          (showClear
            ? "No products match those filters."
            : "No products yet.")}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description ??
          (showClear
            ? "Try a different search term or category."
            : "Once the catalog has active Products, they will appear here.")}
      </p>
      {showClear && (
        <Link
          href="/products"
          className="mt-4 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function SetupHint() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">The catalog is waiting for Supabase.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Copy `.env.example` to `.env.local`, add your Supabase project keys, and
          apply the migrations in `supabase/migrations/` to load the seed catalog.
        </p>
      </div>
    </div>
  );
}
