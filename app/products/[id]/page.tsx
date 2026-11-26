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
  getCachedSitemapData,
} from "@/features/catalog/lib/catalog-cache";
import { getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!hasEnvVars) return [];
  try {
    const { products } = await getCachedSitemapData();
    return products.map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

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
  const [product, categories] = await Promise.all([
    getCachedProductById(id),
    getCachedFeaturedCategories(),
  ]);
  if (!product) return null;

  const category = categories.find((c) => c.id === product.category_id);
  const images = getProductImages(product);
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: product.id.slice(0, 8).toUpperCase(),
      ...(category ? { category: category.name } : {}),
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
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: "elloll",
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "50",
            currency: "EGP",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "EG",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 1,
              maxValue: 4,
              unitCode: "DAY",
            },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "EG",
          returnPolicyCategory:
            "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 14,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnShippingFees",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: baseUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "المنتجات",
          item: `${baseUrl}/products`,
        },
        ...(category
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: category.name,
                item: `${baseUrl}/collections/${encodeURIComponent(category.slug)}`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name: product.name,
                item: `${baseUrl}/products/${product.id}`,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `${baseUrl}/products/${product.id}`,
              },
            ]),
      ],
    },
  ];

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
