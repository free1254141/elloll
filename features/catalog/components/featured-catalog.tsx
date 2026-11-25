import { hasEnvVars } from "@/lib/utils";
import {
  getCachedFeaturedCategories,
  getCachedFeaturedProducts,
} from "@/features/catalog/lib/catalog-cache";
import { HomeSmartCatalog } from "@/features/catalog/components/home-smart-catalog";

export async function FeaturedCatalog() {
  if (!hasEnvVars) {
    return <SetupHint />;
  }

  const [categories, products] = await Promise.all([
    getCachedFeaturedCategories(),
    getCachedFeaturedProducts(24),
  ]);

  if (products.length === 0) {
    return <EmptyCatalog />;
  }

  return <HomeSmartCatalog categories={categories} products={products} />;
}

export function FeaturedCatalogSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      <div className="mb-6 h-24 animate-shimmer rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-square animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function SetupHint() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium">The catalog is waiting for Supabase.</p>
      </div>
    </div>
  );
}

function EmptyCatalog() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium">لا توجد منتجات حالياً.</p>
      </div>
    </div>
  );
}
