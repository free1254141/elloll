import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import {
  ProductDetail,
  ProductDetailSkeleton,
} from "@/features/catalog/components/product-detail";
import { getProductImages } from "@/features/catalog/lib/catalog";
import {
  getCachedFeaturedCategories,
  getCachedProductById,
  getCachedProductSeo,
} from "@/features/catalog/lib/catalog-cache";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [product, categories, seoRow] = await Promise.all([
    getCachedProductById(id),
    getCachedFeaturedCategories(),
    getCachedProductSeo(id),
  ]);

  if (!product) {
    return {
      title: "المنتج غير موجود — elloll",
      robots: { index: false, follow: false },
    };
  }

  const images = getProductImages(product);

  const category = categories.find((c) => c.id === product.category_id);
  const baseUrl = getSiteUrl();
  const url = `${baseUrl}/products/${product.id}`;
  const title =
    seoRow?.seo_title?.trim() ||
    `${product.name} — اشتري أونلاين في مصر | elloll`;
  const description =
    seoRow?.seo_description?.trim() ||
    product.description?.trim() ||
    `تسوق ${product.name}${category ? ` من قسم ${category.name}` : ""} بسعر ${product.price} ج.م في متجر elloll مع شحن سريع لجميع محافظات مصر.`;
  const customKeywords = seoRow?.seo_keywords
    ? seoRow.seo_keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return {
    title,
    description,
    keywords: [
      ...customKeywords,
      product.name,
      ...(category ? [category.name] : []),
      "elloll",
      "ملابس في مصر",
      "تسوق أونلاين مصر",
      "أزياء عصرية",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "elloll",
      locale: "ar_EG",
      type: "website",
      images:
        images.length > 0
          ? images.map((url) => ({ url, alt: product.name }))
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? [images[0]] : undefined,
    },
  };
}

async function ProductJsonLd({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCachedProductById(id);
  if (!product) return null;

  const images = getProductImages(product);
  const baseUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description || `تسوق ${product.name} من متجر elloll في مصر.`,
    image: images.length > 0 ? images : undefined,
    brand: {
      "@type": "Brand",
      name: "elloll",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.id}`,
      priceCurrency: "EGP",
      price: Number(product.price).toFixed(2),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <Suspense fallback={null}>
          <ProductJsonLd params={params} />
        </Suspense>
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetail params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
