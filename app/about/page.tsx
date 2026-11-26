import Link from "next/link";
import type { Metadata } from "next";
import { Award, Bot, ShieldCheck, Truck } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "عن متجر elloll — ملابس عصرية وخامات مصرية أونلاين | elloll",
  description:
    "تعرّف على قصة متجر elloll للملابس والأزياء العصرية في مصر: خامات قطن مصري مختارة، دفع عند الاستلام، شحن لكل المحافظات، ومساعد تسوق ذكي.",
  keywords: [
    "عن elloll",
    "متجر elloll مصر",
    "ملابس قطن مصري",
    "أزياء رجالية أونلاين مصر",
  ],
});

const HIGHLIGHTS = [
  {
    icon: Award,
    title: "خامات مختارة وقطن مصري",
    body: "نختار قطعنا من خامات القطن المصري المريح والقصّات العصرية المناسبة للاستخدام اليومي والخروجات والمواسم المختلفة.",
  },
  {
    icon: Truck,
    title: "توصيل سريع لكل المحافظات",
    body: "نغطي الـ 27 محافظة في مصر بتسعير شحن واضح حسب المنطقة، مع شحن مجاني للطلبات التي تتجاوز الحد المحدد.",
  },
  {
    icon: ShieldCheck,
    title: "الدفع عند الاستلام بأمان",
    body: "تسوق بثقة وادفع كاش عند استلام طلبك مع إمكانية التبديل والاسترجاع خلال 14 يوماً وفق الضوابط المعلنة.",
  },
  {
    icon: Bot,
    title: "مساعد تسوق ذكي ودعم مباشر",
    body: "مساعد الذكاء الاصطناعي في elloll يساعدك في اختيار القطع المناسبة وإضافتها للسلة، إلى جانب دعم فني مباشر وتذكرة متابعة.",
  },
];

export default function AboutPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "عن متجر elloll",
      url: `${baseUrl}/about`,
      inLanguage: "ar-EG",
      mainEntity: {
        "@type": "ClothingStore",
        name: "elloll",
        url: baseUrl,
        areaServed: "EG",
      },
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "من نحن", path: "/about" },
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
            <span className="font-medium text-foreground">من نحن</span>
          </nav>

          <header className="space-y-4">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              عن متجر elloll للأزياء العصرية في مصر
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              متجر <strong className="text-foreground">elloll</strong> هو متجر ملابس
              إلكتروني مصري يركّز على تقديم قطع كاجوال ورياضية عصرية بأسعار عادلة
              وخامات عملية تلائم الذوق الشبابي اليومي، بدايةً من الهوديز والسويت
              شيرتات الأوفرسايز وصولاً إلى التيشيرتات والأطقم الرياضية والأحذية.
            </p>
          </header>

          <section className="mt-10 grid gap-5 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
            <h2 className="text-xl font-bold">لماذا يثق العملاء في elloll؟</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>• وضوح كامل في الأسعار بالجنيه المصري وتكلفة الشحن قبل تأكيد الطلب.</li>
              <li>• صور واضحة ومتعددة لكل منتج توضح الخامة والتفاصيل قبل الشراء.</li>
              <li>• تتبع لحظي لحالة الطلب عبر رقم الطلب والبريد الإلكتروني في أي وقت.</li>
              <li>• سياسة استبدال واسترجاع مرنة خلال 14 يوماً ودعم فني سريع.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/collections">تصفح الأقسام</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products">كل المنتجات</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/support">تواصل معنا</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
