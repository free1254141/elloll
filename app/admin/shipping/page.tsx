import type { Metadata } from "next";
import { ShippingManager } from "@/features/admin/components/shipping-manager";
import { getCachedShippingSettings } from "@/features/shipping/lib/shipping-cache";

export const metadata: Metadata = {
  title: "أسعار الشحن والمحافظات — إدارة elloll",
};

export default async function AdminShippingPage() {
  const initialSettings = await getCachedShippingSettings();
  return <ShippingManager initialSettings={initialSettings} />;
}
