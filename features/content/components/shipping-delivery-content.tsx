"use client";

import Link from "next/link";
import { Banknote, Clock, MapPin, PackageCheck, Truck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  EGYPT_GOVERNORATES,
  SHIPPING_ZONES,
  getGovernorateRate,
  type ShippingSettings,
  type ShippingZoneId,
} from "@/features/shipping/lib/shipping";

const ZONE_ETA: Record<ShippingZoneId, { ar: string; en: string }> = {
  cairo_giza: { ar: "1 – 2 يوم عمل", en: "1 – 2 business days" },
  alex_delta_canal: { ar: "2 – 3 أيام عمل", en: "2 – 3 business days" },
  upper_egypt: { ar: "3 – 4 أيام عمل", en: "3 – 4 business days" },
  frontier: { ar: "3 – 5 أيام عمل", en: "3 – 5 business days" },
};

export function ShippingDeliveryContent({
  settings,
}: {
  settings: ShippingSettings;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const freeThreshold = settings.free_shipping_threshold;
  const fmt = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG");
  const cur = isAr ? "ج.م" : "EGP";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {isAr ? "الشحن والتوصيل" : "Shipping & Delivery"}
        </span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr
            ? "الشحن والتوصيل لجميع محافظات مصر"
            : "Shipping & Delivery Across Egypt"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "نوصل طلباتك إلى باب المنزل في جميع الـ 27 محافظة في مصر بتكلفة شحن محددة وواضحة لكل محافظة مع إمكانية الدفع نقداً عند الاستلام."
            : "We deliver right to your doorstep across all 27 Egyptian governorates with transparent regional shipping rates and Cash on Delivery."}
        </p>
      </header>

      {freeThreshold > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <Truck className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="font-medium text-foreground">
            {isAr ? (
              <>
                شحن مجاني بالكامل لأي طلب بقيمة{" "}
                <span className="font-bold text-amber-500">
                  {fmt.format(freeThreshold)} {cur}
                </span>{" "}
                أو أكثر على مستوى الجمهورية.
              </>
            ) : (
              <>
                Enjoy completely free nationwide shipping on orders of{" "}
                <span className="font-bold text-amber-500">
                  {fmt.format(freeThreshold)} {cur}
                </span>{" "}
                or more.
              </>
            )}
          </p>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SHIPPING_ZONES.map((zone) => {
          const rate = settings.zone_rates[zone.id] ?? zone.defaultRate;
          return (
            <div
              key={zone.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 text-amber-500">
                <MapPin className="h-4 w-4 shrink-0" />
                <h2 className="text-sm font-bold text-foreground">
                  {isAr ? zone.nameAr : zone.nameEn}
                </h2>
              </div>
              <p className="mt-3 font-display text-2xl font-bold">
                {rate === 0
                  ? isAr
                    ? "مجاني"
                    : "Free"
                  : `${fmt.format(rate)} ${cur}`}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{isAr ? ZONE_ETA[zone.id].ar : ZONE_ETA[zone.id].en}</span>
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-bold">
            <Banknote className="h-4 w-4 text-amber-500" />
            <h2>{isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isAr
              ? "ادفع قيمة طلبك نقداً لمندوب التوصيل عند استلام الشحنة دون الحاجة لإدخال بيانات بطاقة بنكية أونلاين."
              : "Pay cash to the courier only when your package arrives at your door — no online card details required."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-bold">
            <PackageCheck className="h-4 w-4 text-amber-500" />
            <h2>{isAr ? "تجهيز وتتبع الطلب" : "Order Prep & Live Tracking"}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isAr
              ? "يتم تجهيز الطلب خلال 24 ساعة عمل، ويمكنك متابعة حالته في أي وقت عبر صفحة "
              : "Orders are packed within 1 business day and can be followed anytime on our "}
            <Link href="/track" className="font-semibold text-amber-500 underline">
              {isAr ? "تتبع الطلب" : "Track Order"}
            </Link>
            {isAr ? "." : " page."}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">
          {isAr
            ? "جدول أسعار الشحن التفصيلي حسب المحافظة (27 محافظة)"
            : "Detailed Shipping Fee Schedule (All 27 Governorates)"}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className={`w-full text-sm ${isAr ? "text-right" : "text-left"}`}>
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "المحافظة" : "Governorate"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "النطاق الجغرافي" : "Zone"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "رسوم الشحن" : "Shipping Fee"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "المدة المتوقعة" : "Estimated ETA"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {EGYPT_GOVERNORATES.map((gov) => {
                const zone = SHIPPING_ZONES.find((z) => z.id === gov.zone);
                const fee = getGovernorateRate(settings, gov.code);
                return (
                  <tr key={gov.code} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">
                      {isAr ? gov.nameAr : gov.nameEn}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {zone ? (isAr ? zone.nameAr : zone.nameEn) : gov.zone}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-amber-500">
                      {fee === 0
                        ? isAr
                          ? "مجاني"
                          : "Free"
                        : `${fmt.format(fee)} ${cur}`}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {isAr ? ZONE_ETA[gov.zone].ar : ZONE_ETA[gov.zone].en}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/returns-policy"
          className="rounded-lg border border-border px-4 py-2 transition-colors hover:border-amber-500/40"
        >
          {isAr ? "اطلع على سياسة الاستبدال والاسترجاع" : "View Returns Policy"}
        </Link>
        <Link
          href="/products"
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition-opacity hover:opacity-90"
        >
          {isAr ? "ابدأ التسوق الآن" : "Start Shopping"}
        </Link>
      </div>
    </div>
  );
}
