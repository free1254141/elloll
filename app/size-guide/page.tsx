import Link from "next/link";
import type { Metadata } from "next";
import { Ruler } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/size-guide",
  title: "دليل المقاسات — الهوديز، السويت شيرتات، والأحذية | elloll",
  description:
    "جدول مقاسات الملابس الرجالي (من S إلى 3XL) ومقاسات الأحذية والسنيكرز (من 40 إلى 46) بالسنتيمتر والوزن لاختيار مقاسك الدقيق من elloll.",
  keywords: [
    "دليل المقاسات elloll",
    "جدول مقاسات هوديز رجالي",
    "مقاسات سويت شيرت أوفرسايز",
    "جدول مقاسات الأحذية بالسنتيمتر",
  ],
});

const TOP_SIZES = [
  { size: "S", chest: "52 سم", length: "67 سم", weight: "55 – 65 كجم" },
  { size: "M", chest: "55 سم", length: "69 سم", weight: "65 – 75 كجم" },
  { size: "L", chest: "58 سم", length: "72 سم", weight: "75 – 85 كجم" },
  { size: "XL", chest: "61 سم", length: "74 سم", weight: "85 – 95 كجم" },
  { size: "2XL", chest: "64 سم", length: "76 سم", weight: "95 – 108 كجم" },
  { size: "3XL", chest: "67 سم", length: "78 سم", weight: "108 – 120 كجم" },
];

const SHOE_SIZES = [
  { eu: "40", cm: "25.0 سم" },
  { eu: "41", cm: "25.5 سم" },
  { eu: "42", cm: "26.5 سم" },
  { eu: "43", cm: "27.0 سم" },
  { eu: "44", cm: "28.0 سم" },
  { eu: "45", cm: "28.5 سم" },
  { eu: "46", cm: "29.5 سم" },
];

export default function SizeGuidePage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "دليل المقاسات — elloll",
      url: `${baseUrl}/size-guide`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "دليل المقاسات", path: "/size-guide" },
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

        <div className="mx-auto w-full max-w-4xl px-5 py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">دليل المقاسات</span>
          </nav>

          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              <Ruler className="h-3.5 w-3.5" />
              <span>قياسات دقيقة</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              دليل المقاسات في متجر elloll
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              استخدم الجداول التالية لاختيار المقاس الأنسب لك في الهوديز، السويت
              شيرتات، التيشيرتات، والأحذية الكاجوال.
            </p>
          </header>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                جدول مقاسات الهوديز والسويت شيرتات والتيشيرتات
              </h2>
              <Link
                href="/collections/hoodies-sweatshirts"
                className="text-xs font-semibold text-amber-500 underline"
              >
                تصفح الهوديز والسويت شيرتات ←
              </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">المقاس</th>
                    <th className="px-4 py-3 font-semibold">عرض الصدر (نصف الدوران)</th>
                    <th className="px-4 py-3 font-semibold">الطول الكلي</th>
                    <th className="px-4 py-3 font-semibold">الوزن التقريبي المناسب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {TOP_SIZES.map((row) => (
                    <tr key={row.size} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-display font-bold text-amber-500">
                        {row.size}
                      </td>
                      <td className="px-4 py-2.5">{row.chest}</td>
                      <td className="px-4 py-2.5">{row.length}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              ملاحظة: في القطع ذات القصّة الأوفرسايز (Oversize)، يكون عرض الصدر
              أوسع بمقدار 2–3 سم لإطلالة مريحة وعصرية.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">جدول مقاسات الأحذية والسنيكرز (EU)</h2>
              <Link
                href="/collections/shoes-sneakers"
                className="text-xs font-semibold text-amber-500 underline"
              >
                تصفح الأحذية والسنيكرز ←
              </Link>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">المقاس الأوروبي (EU)</th>
                    <th className="px-4 py-3 font-semibold">طول القدم الداخلي (سم)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {SHOE_SIZES.map((row) => (
                    <tr key={row.eu} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-display font-bold text-amber-500">
                        {row.eu}
                      </td>
                      <td className="px-4 py-2.5">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-lg font-bold">نصيحة سريعة لأخذ المقاس</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• افرد تيشيرت أو سويت شيرت مفضل لديك وقِس المسافة من الإبط للإبط لحساب عرض الصدر بدقة.</li>
              <li>• عند الشك بين مقاسين، نوصي باختيار المقاس الأكبر لراحة أكبر بعد الغسيل.</li>
              <li>• إذا احتجت تبديل المقاس بعد الاستلام، يمكنك دائماً مراجعة{" "}
                <Link href="/returns-policy" className="font-semibold text-amber-500 underline">
                  سياسة الاستبدال خلال 14 يوماً
                </Link>
                .
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
