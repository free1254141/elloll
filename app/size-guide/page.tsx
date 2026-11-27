import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { SizeGuideContent } from "@/features/content/components/size-guide-content";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/size-guide",
  title: "دليل المقاسات — الهوديز، السويت شيرتات، والأحذية | elloll",
  description:
    "جدول مقاسات الملابس الرجالي (من S إلى 3XL) ومقاسات الأحذية والسنيكرز (من 40 إلى 46) بالسنتيمتر والوزن لاختيار مقاسك الدقيق من elloll.",
  keywords: [
    "دليل المقاسات elloll",
    "جدول مقاسات هوديز رجالي",
    "مقاسات سويت شيرت أوفرسايز",
    "جدول مقاسات الأحذية بالسنتيمتر",
  ],
});

export default function SizeGuidePage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "دليل المقاسات — elloll",
      url: `${baseUrl}/size-guide`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "دليل المقاسات", path: "/size-guide" },
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
        <SizeGuideContent />
      </main>
      <SiteFooter />
    </div>
  );
}
