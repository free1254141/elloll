import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { CheckoutView } from "@/features/checkout/components/checkout-view";
import { getCachedShippingSettings } from "@/features/shipping/lib/shipping-cache";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/checkout",
  title: "إتمام الطلب — elloll",
  description: "أكمل بيانات التوصيل والمحافظة لتأكيد طلبك والدفع عند الاستلام.",
  noIndex: true,
});

export default async function CheckoutPage() {
  const shippingSettings = await getCachedShippingSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <CheckoutView initialShippingSettings={shippingSettings} />
      </main>
      <SiteFooter />
    </div>
  );
}
