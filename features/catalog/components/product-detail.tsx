import { notFound } from "next/navigation";
import { hasEnvVars } from "@/lib/utils";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedProductById,
  getCachedRelatedProducts,
} from "@/features/catalog/lib/catalog-cache";
import { ProductDetailView } from "@/features/catalog/components/product-detail-view";

export async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasEnvVars) {
    return <SetupHint />;
  }

  const { id } = await params;
  const product = await getCachedProductById(id);

  if (!product) {
    notFound();
  }

  const [related, categories] = await Promise.all([
    getCachedRelatedProducts(product.category_id, product.id),
    getCachedFeaturedCategories(),
  ]);
  const category =
    categories.find((c) => c.id === product.category_id) ?? null;
  const images = getProductImages(product);

  return (
    <ProductDetailView
      product={product}
      images={images}
      category={category}
      categories={categories}
      related={related}
    />
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="h-8 w-28 animate-shimmer rounded-md" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-shimmer rounded-2xl" />
        <div className="flex flex-col gap-5">
          <div className="h-4 w-24 animate-shimmer rounded-md" />
          <div className="h-9 w-2/3 animate-shimmer rounded-md" />
          <div className="h-8 w-40 animate-shimmer rounded-md" />
          <div className="h-24 w-full animate-shimmer rounded-md" />
          <div className="h-12 w-full animate-shimmer rounded-md" />
        </div>
      </div>
      <div className="mt-16">
        <div className="h-6 w-40 animate-shimmer rounded-md" />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-square animate-shimmer rounded-xl" />
          ))}
        </div>
      </div>
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
