import Link from "next/link";
import type { Metadata } from "next";
import { Banknote, Clock, MapPin, PackageCheck, Truck } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import {
  EGYPT_GOVERNORATES,
  SHIPPING_ZONES,
  getGovernorateRate,
  type ShippingZoneId,
} from "@/features/shipping/lib/shipping";
import { getCachedShippingSettings } from "@/features/shipping/lib/shipping-cache";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";
import { hasEnvVars } from "@/lib/utils";
import { DEFAULT_SHIPPING_SETTINGS } from "@/features/shipping/lib/shipping";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  path: "/shipping-delivery",
  title: "الشحن والتوصيل لجميع محافظات مصر — الأسعار والمدد | elloll",
  description:
    "تعرّف على أسعار ومواعيد الشحن والتوصيل من متجر elloll لجميع الـ 27 محافظة في مصر، والشحن المجاني والدفع عند الاستلام.",
  keywords: [
    "أسعار الشحن في مصر",
    "شحن لجميع المحافظات",
    "توصيل ملابس القاهرة والجيزة",
    "شحن الصعيد والدلتا",
    "دفع عند الاستلام elloll",
  ],
});

const ZONE_ETA_AR: Record<ShippingZoneId, string> = {
  cairo_giza: "1 – 2 يوم عمل",
  alex_delta_canal: "2 – 3 أيام عمل",
  upper_egypt: "3 – 4 أيام عمل",
  frontier: "3 – 5 أيام عمل",
};

export default async function ShippingDeliveryPage() {
  const settings = hasEnvVars
    ? await getCachedShippingSettings()
    : DEFAULT_SHIPPING_SETTINGS;

  const freeThreshold = settings.free_shipping_threshold;
  const egp = new Intl.NumberFormat("ar-EG");
  const baseUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة وأسعار الشحن والتوصيل — elloll",
      url: `${baseUrl}/shipping-delivery`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الشحن والتوصيل", path: "/shipping-delivery" },
    ]),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="mx-auto w-full max-w-5xl px-5 py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">الشحن والتوصيل</span>
          </nav>

          <header className="space-y-3">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              الشحن والتوصيل لجميع محافظات مصر
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              نوصل طلباتك إلى باب المنزل في جميع الـ 27 محافظة في مصر بتكلفة شحن
              محددة وواضحة لكل محافظة مع إمكانية الدفع نقداً عند الاستلام.
            </p>
          </header>

          {freeThreshold > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <Truck className="h-5 w-5 shrink-0 text-amber-500" />
              <p className="font-medium text-foreground">
                شحن مجاني بالكامل لأي طلب بقيمة{" "}
                <span className="font-bold text-amber-500">
                  {egp.format(freeThreshold)} ج.م
                </span>{" "}
                أو أكثر على مستوى الجمهورية.
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
                    <MapPin className="h-4 w-4" />
                    <h2 className="text-sm font-bold text-foreground">
                      {zone.nameAr}
                    </h2>
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold">
                    {rate === 0 ? "مجاني" : `${egp.format(rate)} ج.م`}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{ZONE_ETA_AR[zone.id]}</span>
                  </p>
                </div>
              );
            })}
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-bold">
                <Banknote className="h-4 w-4 text-amber-500" />
                <h2>الدفع عند الاستلام (COD)</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                ادفع قيمة طلبك نقداً لمندوب التوصيل عند استلام الشحنة دون الحاجة
                لإدخال بيانات بطاقة بنكية أونلاين.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-bold">
                <PackageCheck className="h-4 w-4 text-amber-500" />
                <h2>تجهيز وتتبع الطلب</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                يتم تجهيز الطلب خلال 24 ساعة عمل، ويمكنك متابعة حالته في أي وقت عبر
                صفحة{" "}
                <Link href="/track" className="font-semibold text-amber-500 underline">
                  تتبع الطلب
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">
              جدول أسعار الشحن التفصيلي حسب المحافظة (27 محافظة)
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">المحافظة</th>
                    <th className="px-4 py-3 font-semibold">النطاق الجغرافي</th>
                    <th className="px-4 py-3 font-semibold">رسوم الشحن</th>
                    <th className="px-4 py-3 font-semibold">المدة المتوقعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {EGYPT_GOVERNORATES.map((gov) => {
                    const zone = SHIPPING_ZONES.find((z) => z.id === gov.zone);
                    const fee = getGovernorateRate(settings, gov.code);
                    return (
                      <tr key={gov.code} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{gov.nameAr}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {zone?.nameAr ?? gov.zone}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-amber-500">
                          {fee === 0 ? "مجاني" : `${egp.format(fee)} ج.م`}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {ZONE_ETA_AR[gov.zone]}
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
              اطلع على سياسة الاستبدال والاسترجاع
            </Link>
            <Link
              href="/products"
              className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition-opacity hover:opacity-90"
            >
              ابدأ التسوق الآن
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
