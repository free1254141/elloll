import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { SupportPageContent } from "@/features/support/components/support-page-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/support",
  title: "دعم العملاء والتواصل المباشر — elloll",
  description:
    "تواصل مباشرة مع فريق دعم عملاء elloll لمتابعة طلباتك واستفساراتك وطلبات الاستبدال والاسترجاع.",
});

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <SupportPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
