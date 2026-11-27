import type { Metadata } from "next";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { PrivacyPolicyContent } from "@/features/content/components/privacy-policy-content";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/privacy-policy",
  title: "سياسة الخصوصية وشروط الاستخدام | elloll",
  description:
    "تعرّف على سياسة الخصوصية وحماية بيانات العملاء وشروط استخدام متجر elloll الإلكتروني في مصر.",
  keywords: ["سياسة الخصوصية elloll", "شروط الاستخدام", "حماية بيانات العملاء"],
});

export default function PrivacyPolicyPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة الخصوصية وشروط الاستخدام — elloll",
      url: `${baseUrl}/privacy-policy`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "سياسة الخصوصية", path: "/privacy-policy" },
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
        <PrivacyPolicyContent />
      </main>
      <SiteFooter />
    </div>
  );
}
