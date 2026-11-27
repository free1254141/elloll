import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { ShippingDeliveryContent } from "@/features/content/components/shipping-delivery-content";
import { DEFAULT_SHIPPING_SETTINGS } from "@/features/shipping/lib/shipping";
import { getCachedShippingSettings } from "@/features/shipping/lib/shipping-cache";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  path: "/shipping-delivery",
  title: "الشحن والتوصيل لجميع محافظات مصر — الأسعار والمدد | elloll",
  description:
    "تعرّف على أسعار ومواعيد الشحن والتوصيل من متجر elloll لجميع الـ 27 محافظة في مصر، والشحن المجاني والدفع عند الاستلام.",
  keywords: [
    "أسعار الشحن في مصر",
    "شحن لجميع المحافظات",
    "توصيل ملابس القاهرة والجيزة",
    "شحن الصعيد والدلتا",
    "دفع عند الاستلام elloll",
  ],
});

export default async function ShippingDeliveryPage() {
  const settings = hasEnvVars
    ? await getCachedShippingSettings()
    : DEFAULT_SHIPPING_SETTINGS;

  const baseUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة وأسعار الشحن والتوصيل — elloll",
      url: `${baseUrl}/shipping-delivery`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الشحن والتوصيل", path: "/shipping-delivery" },
    ]),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ShippingDeliveryContent settings={settings} />
      </main>
      <SiteFooter />
    </div>
  );
}
