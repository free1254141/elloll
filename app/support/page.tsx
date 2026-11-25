import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { SupportPageContent } from "@/features/support/components/support-page-content";

export const metadata: Metadata = {
  title: "دعم العملاء — elloll",
  description: "تواصل مباشرة مع فريق دعم عملاء elloll لمتابعة طلباتك واستفساراتك.",
};

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
