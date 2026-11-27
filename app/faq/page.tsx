import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { FAQ_ITEMS } from "@/features/content/components/faq-data";
import { FaqPageContent } from "@/features/content/components/faq-page-content";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/faq",
  title: "الأسئلة الشائعة — الطلب، الشحن، الدفع والمقاسات | elloll",
  description:
    "إجابات شاملة لأكثر الأسئلة شيوعاً حول الشراء من متجر elloll في مصر: طرق الدفع، أسعار الشحن للمحافظات، تتبع الطلبات، المقاسات، والاسترجاع.",
  keywords: [
    "الأسئلة الشائعة elloll",
    "تتبع الطلب elloll",
    "دفع عند الاستلام ملابس مصر",
    "شحن محافظات مصر",
  ],
});

export default function FaqPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.qAr,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.aAr,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "الأسئلة الشائعة — elloll",
      url: `${baseUrl}/faq`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الأسئلة الشائعة", path: "/faq" },
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
        <FaqPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
