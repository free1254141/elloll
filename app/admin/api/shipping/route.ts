import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SHIPPING_SETTINGS,
  EGYPT_GOVERNORATES,
  SHIPPING_ZONES,
  type ShippingSettings,
  type ShippingZoneId,
} from "@/features/shipping/lib/shipping";
import { revalidateShippingCache } from "@/features/shipping/lib/shipping-cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }
  return supabase;
}

export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("shipping_settings")
    .select("free_shipping_threshold, zone_rates, governorate_rates")
    .eq("id", "default")
    .maybeSingle();

  const row = (data as Partial<ShippingSettings> | null) ?? {};
  return NextResponse.json({
    settings: {
      free_shipping_threshold: Number(
        row.free_shipping_threshold ??
          DEFAULT_SHIPPING_SETTINGS.free_shipping_threshold,
      ),
      zone_rates: {
        ...DEFAULT_SHIPPING_SETTINGS.zone_rates,
        ...(row.zone_rates ?? {}),
      },
      governorate_rates: {
        ...DEFAULT_SHIPPING_SETTINGS.governorate_rates,
        ...(row.governorate_rates ?? {}),
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<ShippingSettings>;
  const threshold = Math.max(0, Number(body.free_shipping_threshold ?? 0));
  if (!Number.isFinite(threshold)) {
    return NextResponse.json(
      { error: "Invalid free shipping threshold" },
      { status: 400 },
    );
  }

  const zoneRates = { ...DEFAULT_SHIPPING_SETTINGS.zone_rates };
  for (const z of SHIPPING_ZONES) {
    const val = Number(body.zone_rates?.[z.id] ?? z.defaultRate);
    zoneRates[z.id as ShippingZoneId] = Number.isFinite(val) && val >= 0 ? val : z.defaultRate;
  }

  const govRates: Record<string, number> = {};
  for (const g of EGYPT_GOVERNORATES) {
    const val = Number(body.governorate_rates?.[g.code] ?? zoneRates[g.zone]);
    govRates[g.code] = Number.isFinite(val) && val >= 0 ? val : zoneRates[g.zone];
  }

  const { error } = await supabase.from("shipping_settings").upsert(
    {
      id: "default",
      free_shipping_threshold: threshold,
      zone_rates: zoneRates,
      governorate_rates: govRates,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateShippingCache();

  return NextResponse.json({
    ok: true,
    settings: {
      free_shipping_threshold: threshold,
      zone_rates: zoneRates,
      governorate_rates: govRates,
    },
  });
}
