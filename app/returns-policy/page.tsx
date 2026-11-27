import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { ReturnsPolicyContent } from "@/features/content/components/returns-policy-content";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/returns-policy",
  title: "سياسة الاستبدال والاسترجاع — 14 يوماً | elloll",
  description:
    "تعرّف على شروط الاستبدال والاسترجاع في متجر elloll خلال 14 يوماً في مصر، وكيفية تقديم طلب الاستبدال أو استرداد المبلغ بسهولة.",
  keywords: [
    "سياسة الاسترجاع elloll",
    "استبدال الملابس أونلاين مصر",
    "ضمان 14 يوم",
  ],
});

export default function ReturnsPolicyPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة الاستبدال والاسترجاع — elloll",
      url: `${baseUrl}/returns-policy`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الاستبدال والاسترجاع", path: "/returns-policy" },
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
        <ReturnsPolicyContent />
      </main>
      <SiteFooter />
    </div>
  );
}
