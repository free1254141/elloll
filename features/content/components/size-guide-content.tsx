"use client";

import Link from "next/link";
import { Ruler } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const TOP_SIZES = [
  { size: "S", chestAr: "52 سم", chestEn: "52 cm", lengthAr: "67 سم", lengthEn: "67 cm", weightAr: "55 – 65 كجم", weightEn: "55 – 65 kg" },
  { size: "M", chestAr: "55 سم", chestEn: "55 cm", lengthAr: "69 سم", lengthEn: "69 cm", weightAr: "65 – 75 كجم", weightEn: "65 – 75 kg" },
  { size: "L", chestAr: "58 سم", chestEn: "58 cm", lengthAr: "72 سم", lengthEn: "72 cm", weightAr: "75 – 85 كجم", weightEn: "75 – 85 kg" },
  { size: "XL", chestAr: "61 سم", chestEn: "61 cm", lengthAr: "74 سم", lengthEn: "74 cm", weightAr: "85 – 95 كجم", weightEn: "85 – 95 kg" },
  { size: "2XL", chestAr: "64 سم", chestEn: "64 cm", lengthAr: "76 سم", lengthEn: "76 cm", weightAr: "95 – 108 كجم", weightEn: "95 – 108 kg" },
  { size: "3XL", chestAr: "67 سم", chestEn: "67 cm", lengthAr: "78 سم", lengthEn: "78 cm", weightAr: "108 – 120 كجم", weightEn: "108 – 120 kg" },
];

const SHOE_SIZES = [
  { eu: "40", cmAr: "25.0 سم", cmEn: "25.0 cm" },
  { eu: "41", cmAr: "25.5 سم", cmEn: "25.5 cm" },
  { eu: "42", cmAr: "26.5 سم", cmEn: "26.5 cm" },
  { eu: "43", cmAr: "27.0 سم", cmEn: "27.0 cm" },
  { eu: "44", cmAr: "28.0 سم", cmEn: "28.0 cm" },
  { eu: "45", cmAr: "28.5 سم", cmEn: "28.5 cm" },
  { eu: "46", cmAr: "29.5 سم", cmEn: "29.5 cm" },
];

export function SizeGuideContent() {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {isAr ? "دليل المقاسات" : "Size Guide"}
        </span>
      </nav>

      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <Ruler className="h-3.5 w-3.5" />
          <span>{isAr ? "قياسات دقيقة" : "Accurate Fit Charts"}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr ? "دليل المقاسات في متجر elloll" : "elloll Size Guide"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "استخدم الجداول التالية لاختيار المقاس الأنسب لك في الهوديز، السويت شيرتات، التيشيرتات، والأحذية الكاجوال."
            : "Use these charts to pick the right fit across our hoodies, sweatshirts, tops, and casual sneakers."}
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            {isAr
              ? "جدول مقاسات الهوديز والسويت شيرتات والتيشيرتات"
              : "Hoodies, Sweatshirts & Tops Size Chart"}
          </h2>
          <Link
            href="/collections/hoodies-sweatshirts"
            className="text-xs font-semibold text-amber-500 underline"
          >
            {isAr
              ? "تصفح الهوديز والسويت شيرتات ←"
              : "Browse Hoodies & Sweatshirts →"}
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className={`w-full text-sm ${isAr ? "text-right" : "text-left"}`}>
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">{isAr ? "المقاس" : "Size"}</th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "عرض الصدر (نصف الدوران)" : "Chest Width"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "الطول الكلي" : "Total Length"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "الوزن التقريبي المناسب" : "Suggested Weight"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TOP_SIZES.map((row) => (
                <tr key={row.size} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-display font-bold text-amber-500">
                    {row.size}
                  </td>
                  <td className="px-4 py-2.5">{isAr ? row.chestAr : row.chestEn}</td>
                  <td className="px-4 py-2.5">{isAr ? row.lengthAr : row.lengthEn}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {isAr ? row.weightAr : row.weightEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isAr
            ? "ملاحظة: في القطع ذات القصّة الأوفرسايز (Oversize)، يكون عرض الصدر أوسع بمقدار 2–3 سم لإطلالة مريحة وعصرية."
            : "Note: Oversized cuts run 2–3 cm wider across the chest for a relaxed streetwear drape."}
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            {isAr ? "جدول مقاسات الأحذية والسنيكرز (EU)" : "Shoes & Sneakers Size Chart (EU)"}
          </h2>
          <Link
            href="/collections/shoes-sneakers"
            className="text-xs font-semibold text-amber-500 underline"
          >
            {isAr ? "تصفح الأحذية والسنيكرز ←" : "Browse Shoes & Sneakers →"}
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className={`w-full text-sm ${isAr ? "text-right" : "text-left"}`}>
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "المقاس الأوروبي (EU)" : "EU Size"}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {isAr ? "طول القدم الداخلي (سم)" : "Insole Length (cm)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SHOE_SIZES.map((row) => (
                <tr key={row.eu} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-display font-bold text-amber-500">
                    {row.eu}
                  </td>
                  <td className="px-4 py-2.5">{isAr ? row.cmAr : row.cmEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-bold">
          {isAr ? "نصيحة سريعة لأخذ المقاس" : "Quick Measuring Tips"}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            •{" "}
            {isAr
              ? "افرد تيشيرت أو سويت شيرت مفضل لديك وقِس المسافة من الإبط للإبط لحساب عرض الصدر بدقة."
              : "Lay your favorite sweatshirt flat and measure pit-to-pit to match the chest width."}
          </li>
          <li>
            •{" "}
            {isAr
              ? "عند الشك بين مقاسين، نوصي باختيار المقاس الأكبر لراحة أكبر بعد الغسيل."
              : "Between two sizes? Size up for extra comfort and an easier streetwear fit."}
          </li>
          <li>
            •{" "}
            {isAr ? "إذا احتجت تبديل المقاس بعد الاستلام، يمكنك دائماً مراجعة " : "Need a different size after delivery? Check our "}
            <Link
              href="/returns-policy"
              className="font-semibold text-amber-500 underline"
            >
              {isAr ? "سياسة الاستبدال خلال 14 يوماً" : "14-day exchange policy"}
            </Link>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
