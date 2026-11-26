import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { TrackPageContent } from "@/features/tracking/components/track-page-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/track",
  title: "تتبع الطلب لحظة بلحظة — elloll",
  description:
    "تابع حالة طلبك في متجر elloll لحظة بلحظة برقم الطلب والبريد الإلكتروني حتى وصوله لباب منزلك.",
});

export default function TrackOrderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <TrackPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
