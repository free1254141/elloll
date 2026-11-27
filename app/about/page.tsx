import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { AboutPageContent } from "@/features/content/components/about-page-content";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "عن متجر elloll — ملابس عصرية وخامات مصرية أونلاين | elloll",
  description:
    "تعرّف على قصة متجر elloll للملابس والأزياء العصرية في مصر: خامات قطن مصري مختارة، دفع عند الاستلام، شحن لكل المحافظات، ومساعد تسوق ذكي.",
  keywords: [
    "عن elloll",
    "متجر elloll مصر",
    "ملابس قطن مصري",
    "أزياء رجالية أونلاين مصر",
  ],
});

export default function AboutPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "عن متجر elloll",
      url: `${baseUrl}/about`,
      inLanguage: "ar-EG",
      mainEntity: {
        "@type": "ClothingStore",
        name: "elloll",
        url: baseUrl,
        areaServed: "EG",
      },
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "من نحن", path: "/about" },
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
        <AboutPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
