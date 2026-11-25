"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import {
  DEFAULT_SHIPPING_SETTINGS,
  EGYPT_GOVERNORATES,
  SHIPPING_ZONES,
  type ShippingSettings,
  type ShippingZoneId,
} from "@/features/shipping/lib/shipping";

export function ShippingManager({
  initialSettings,
}: {
  initialSettings: ShippingSettings;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [settings, setSettings] = useState<ShippingSettings>(initialSettings);
  const [flatRate, setFlatRate] = useState("60");
  const [expandedZone, setExpandedZone] = useState<ShippingZoneId | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  function applyZoneRate(zoneId: ShippingZoneId, rate: number) {
    const clean = Math.max(0, Number.isFinite(rate) ? rate : 0);
    setSettings((prev) => {
      const nextGovRates = { ...prev.governorate_rates };
      for (const gov of EGYPT_GOVERNORATES) {
        if (gov.zone === zoneId) {
          nextGovRates[gov.code] = clean;
        }
      }
      return {
        ...prev,
        zone_rates: {
          ...prev.zone_rates,
          [zoneId]: clean,
        },
        governorate_rates: nextGovRates,
      };
    });
  }

  function applyFlatRateToAll() {
    const clean = Math.max(0, Number(flatRate) || 0);
    const nextZones = { ...settings.zone_rates };
    for (const z of SHIPPING_ZONES) {
      nextZones[z.id] = clean;
    }
    const nextGovs: Record<string, number> = {};
    for (const g of EGYPT_GOVERNORATES) {
      nextGovs[g.code] = clean;
    }
    setSettings((prev) => ({
      ...prev,
      zone_rates: nextZones,
      governorate_rates: nextGovs,
    }));
    setStatusMsg(
      isAr
        ? `تم تطبيق ${clean} ج.م على جميع المحافظات (27 محافظة) — اضغط حفظ التغييرات للتأكيد.`
        : `Applied ${clean} EGP to all 27 governorates — click Save to confirm.`,
    );
  }

  function resetDefaults() {
    setSettings(DEFAULT_SHIPPING_SETTINGS);
    setStatusMsg(
      isAr
        ? "تمت استعادة الأسعار الافتراضية للمناطق — اضغط حفظ التغييرات للتأكيد."
        : "Restored default zone pricing — click Save to confirm.",
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/admin/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        settings?: ShippingSettings;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Failed to save shipping settings");
      }
      if (data.settings) setSettings(data.settings);
      setStatusMsg(
        isAr
          ? "تم حفظ أسعار الشحن وتحديث صفحة الشيك أوت فوراً."
          : "Shipping pricing saved and checkout updated.",
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <Truck className="h-7 w-7 text-amber-500" />
            {isAr ? "تسعير الشحن الذكي للمحافظات" : "Smart Governorate Shipping Pricing"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "حدد سعر الشحن بالمناطق الذكية بضغطة واحدة، أو خصص أي محافظة بشكل مستقل."
              : "Set shipping rates by smart zones in one click, or customize individual governorates."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={resetDefaults} disabled={saving}>
            {isAr ? "استعادة الافتراضي" : "Reset defaults"}
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isAr ? "حفظ الأسعار" : "Save pricing"}
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Top Smart Controls: Free Shipping Threshold + 1-Click Flat Rate */}
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="free-threshold">
            {isAr
              ? "حد الشحن المجاني (ج.م) — اكتب 0 لإلغاء الشحن المجاني"
              : "Free shipping threshold (EGP) — 0 to disable"}
          </Label>
          <Input
            id="free-threshold"
            type="number"
            min={0}
            step="1"
            value={settings.free_shipping_threshold}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                free_shipping_threshold: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "أي طلب يصل إجمالي منتجاته إلى هذا المبلغ يحصل على شحن مجاني تلقائياً."
              : "Orders reaching this product subtotal get free shipping automatically."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="flat-rate-all" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {isAr ? "تطبيق سعر شحن موحد على الـ 27 محافظة" : "Apply one flat rate to all 27 governorates"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="flat-rate-all"
              type="number"
              min={0}
              step="1"
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={applyFlatRateToAll}>
              {isAr ? "تطبيق على الكل" : "Apply to all"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "بديل سريع إذا أردت توحيد تكلفة الدليفرى لكل أنحاء الجمهورية بضغطة واحدة."
              : "Quick shortcut to unify shipping cost nationwide in one click."}
          </p>
        </div>
      </div>

      {/* 4 Smart Shipping Zones */}
      <div className="grid gap-4 md:grid-cols-2">
        {SHIPPING_ZONES.map((zone) => {
          const zoneGovs = EGYPT_GOVERNORATES.filter((g) => g.zone === zone.id);
          const isOpen = expandedZone === zone.id;
          const zoneRate = settings.zone_rates[zone.id] ?? zone.defaultRate;

          return (
            <div
              key={zone.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">
                    {isAr ? zone.nameAr : zone.nameEn}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {zoneGovs.map((g) => (isAr ? g.nameAr : g.nameEn)).join("، ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                  {zoneGovs.length} {isAr ? "محافظات" : "govs"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={zoneRate}
                  onChange={(e) =>
                    applyZoneRate(zone.id, Math.max(0, Number(e.target.value) || 0))
                  }
                  aria-label={isAr ? zone.nameAr : zone.nameEn}
                />
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {isAr ? "ج.م للمنطقة" : "EGP / zone"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedZone(isOpen ? null : zone.id)}
                  className="gap-1 text-xs"
                >
                  {isAr ? "تخصيص" : "Customize"}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {isOpen && (
                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">
                  {zoneGovs.map((gov) => (
                    <div
                      key={gov.code}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
                    >
                      <span className="text-xs font-medium">
                        {isAr ? gov.nameAr : gov.nameEn}
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={settings.governorate_rates[gov.code] ?? zoneRate}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setSettings((prev) => ({
                              ...prev,
                              governorate_rates: {
                                ...prev.governorate_rates,
                                [gov.code]: val,
                              },
                            }));
                          }}
                          className="h-7 w-20 text-xs tabular-nums"
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {isAr ? "ج.م" : "EGP"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
}
