import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { TrackPageContent } from "@/features/tracking/components/track-page-content";

export const metadata: Metadata = {
  title: "تتبع الطلب — elloll",
  description: "تابع حالة طلبك في elloll لحظة بلحظة برقم الطلب والبريد الإلكتروني.",
};

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
