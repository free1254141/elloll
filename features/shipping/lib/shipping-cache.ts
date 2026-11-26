import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import {
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
} from "./shipping";

export function getCachedShippingSettings(): Promise<ShippingSettings> {
  return unstable_cache(
    async () => {
      const client = createPublicSupabaseClient();
      if (!client) return DEFAULT_SHIPPING_SETTINGS;
      const { data } = await client
        .from("shipping_settings")
        .select("free_shipping_threshold, zone_rates, governorate_rates")
        .eq("id", "default")
        .maybeSingle();
      if (!data) return DEFAULT_SHIPPING_SETTINGS;
      const row = data as Partial<ShippingSettings>;
      return {
        free_shipping_threshold: Number(
          row.free_shipping_threshold ?? DEFAULT_SHIPPING_SETTINGS.free_shipping_threshold,
        ),
        zone_rates: {
          ...DEFAULT_SHIPPING_SETTINGS.zone_rates,
          ...(row.zone_rates ?? {}),
        },
        governorate_rates: {
          ...DEFAULT_SHIPPING_SETTINGS.governorate_rates,
          ...(row.governorate_rates ?? {}),
        },
      };
    },
    ["shipping-settings"],
    {
      tags: ["shipping"],
      revalidate: 86400,
    },
  )();
}

export function revalidateShippingCache() {
  revalidateTag("shipping", { expire: 0 });
  revalidatePath("/checkout");
  revalidatePath("/shipping-delivery");
  revalidatePath("/admin/shipping");
}
