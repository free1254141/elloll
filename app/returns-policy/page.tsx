import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/returns-policy",
  title: "سياسة الاستبدال والاسترجاع — 14 يوماً | elloll",
  description:
    "تعرّف على شروط الاستبدال والاسترجاع في متجر elloll خلال 14 يوماً في مصر، وكيفية تقديم طلب الاستبدال أو استرداد المبلغ بسهولة.",
  keywords: [
    "سياسة الاسترجاع elloll",
    "استبدال الملابس أونلاين مصر",
    "ضمان 14 يوم",
  ],
});

export default function ReturnsPolicyPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة الاستبدال والاسترجاع — elloll",
      url: `${baseUrl}/returns-policy`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الاستبدال والاسترجاع", path: "/returns-policy" },
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
            <span className="font-medium text-foreground">الاستبدال والاسترجاع</span>
          </nav>

          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>ضمان 14 يوماً</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              سياسة الاستبدال والاسترجاع في elloll
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              نحرص في متجر elloll على رضاك التام عن كل قطعة تشتريها، لذلك نوفر لك حق
              الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ الاستلام وفق ضوابط واضحة
              ومتوافقة مع قانون حماية المستهلك المصري.
            </p>
          </header>

          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2>شروط قبول الاستبدال أو الاسترجاع</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                <li>• تقديم الطلب خلال مدة أقصاها 14 يوماً من تاريخ استلام الشحنة.</li>
                <li>• أن يكون المنتج في حالته الأصلية تماماً، غير مستخدم أو مغسول، وبكامل بطاقاته وتغليفه.</li>
                <li>• توافر رقم الطلب (`ORD-...`) أو البريد الإلكتروني المسجل به الطلب.</li>
                <li>• يحق للعميل المعاينة الظاهرية للطرد عند الاستلام والتأكد من مطابقة اللون والقطعة.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h2>رسوم الشحن في حالة الاسترجاع</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                <li>
                  • <strong className="text-foreground">في حال وجود عيب صناعة أو خطأ في الطلب:</strong>{" "}
                  يتحمل متجر elloll تكاليف الاستبدال أو الشحن بالكامل دون أي رسوم إضافية على العميل.
                </li>
                <li>
                  • <strong className="text-foreground">في حال رغبة العميل في الاستبدال لمقاس آخر أو الاسترجاع دون عيب:</strong>{" "}
                  يتحمل العميل مصاريف الشحن ذهاباً وإياباً وفق تعريفة المحافظة.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-muted/30 p-6">
              <h2 className="text-lg font-bold">خطوات طلب الاستبدال أو الاسترجاع</h2>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>توجّه إلى صفحة <Link href="/support" className="font-semibold text-amber-500 underline">دعم العملاء</Link> وافتح تذكرة جديدة برقم الطلب.</li>
                <li>أوضح سبب الاستبدال أو الاسترجاع والمقاس أو القطعة المطلوبة بدلاً منها.</li>
                <li>سيقوم فريقنا بالتنسيق معك لإرسال المندوب واستلام القطعة وإتمام الاستبدال أو رد المبلغ.</li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/support">طلب استبدال أو استرجاع</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/size-guide">راجع دليل المقاسات</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
