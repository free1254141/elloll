"use client";

import Link from "next/link";
import { Award, Bot, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

const HIGHLIGHTS = [
  {
    icon: Award,
    titleAr: "خامات مختارة وقطن مصري",
    titleEn: "Curated Fabrics & Egyptian Cotton",
    bodyAr:
      "نختار قطعنا من خامات القطن المصري المريح والقصّات العصرية المناسبة للاستخدام اليومي والخروجات والمواسم المختلفة.",
    bodyEn:
      "We select comfortable Egyptian cotton blends and modern streetwear cuts built for everyday wear across seasons.",
  },
  {
    icon: Truck,
    titleAr: "توصيل سريع لكل المحافظات",
    titleEn: "Fast Nationwide Delivery",
    bodyAr:
      "نغطي الـ 27 محافظة في مصر بتسعير شحن واضح حسب المنطقة، مع شحن مجاني للطلبات التي تتجاوز الحد المحدد.",
    bodyEn:
      "We deliver to all 27 Egyptian governorates with transparent zone pricing and free shipping above the order threshold.",
  },
  {
    icon: ShieldCheck,
    titleAr: "الدفع عند الاستلام بأمان",
    titleEn: "Safe Cash on Delivery",
    bodyAr:
      "تسوق بثقة وادفع كاش عند استلام طلبك مع إمكانية التبديل والاسترجاع خلال 14 يوماً وفق الضوابط المعلنة.",
    bodyEn:
      "Shop confidently and pay cash upon delivery, backed by our 14-day exchange and return policy.",
  },
  {
    icon: Bot,
    titleAr: "مساعد تسوق ذكي ودعم مباشر",
    titleEn: "Smart AI Assistant & Live Support",
    bodyAr:
      "مساعد الذكاء الاصطناعي في elloll يساعدك في اختيار القطع المناسبة وإضافتها للسلة، إلى جانب دعم فني مباشر وتذكرة متابعة.",
    bodyEn:
      "Our AI shopping assistant helps you discover outfits and add items to cart alongside direct ticket-based customer support.",
  },
];

export function AboutPageContent() {
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
          {isAr ? "من نحن" : "About"}
        </span>
      </nav>

      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr
            ? "عن متجر elloll للأزياء العصرية في مصر"
            : "About elloll — Modern Fashion in Egypt"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr ? (
            <>
              متجر <strong className="text-foreground">elloll</strong> هو متجر ملابس
              إلكتروني مصري يركّز على تقديم قطع كاجوال ورياضية عصرية بأسعار عادلة
              وخامات عملية تلائم الذوق الشبابي اليومي، بدايةً من الهوديز والسويت
              شيرتات الأوفرسايز وصولاً إلى البناطيل والتيشيرتات والأحذية.
            </>
          ) : (
            <>
              <strong className="text-foreground">elloll</strong> is an Egyptian
              online fashion store focused on delivering modern streetwear, hoodies,
              sweatpants, denim, shirts, tracksuits, and everyday sneakers at fair
              prices across Egypt.
            </>
          )}
        </p>
      </header>

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.titleEn}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold">
                {isAr ? item.titleAr : item.titleEn}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isAr ? item.bodyAr : item.bodyEn}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
        <h2 className="text-xl font-bold">
          {isAr ? "لماذا يثق العملاء في elloll؟" : "Why Shoppers Trust elloll"}
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          <li>
            •{" "}
            {isAr
              ? "وضوح كامل في الأسعار بالجنيه المصري وتكلفة الشحن قبل تأكيد الطلب."
              : "Transparent EGP pricing and upfront governorate shipping rates before checkout."}
          </li>
          <li>
            •{" "}
            {isAr
              ? "صور واضحة ومتعددة لكل منتج مع إمكانية التكبير لمعاينة التفاصيل قبل الشراء."
              : "Multi-angle high-resolution product galleries with full-screen zoom before ordering."}
          </li>
          <li>
            •{" "}
            {isAr
              ? "تتبع لحظي لحالة الطلب عبر رقم الطلب والبريد الإلكتروني في أي وقت."
              : "Real-time order tracking using your order number and email anytime."}
          </li>
          <li>
            •{" "}
            {isAr
              ? "سياسة استبدال واسترجاع مرنة خلال 14 يوماً ودعم فني سريع."
              : "Flexible 14-day exchanges & returns paired with responsive live customer support."}
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/collections">
              {isAr ? "تصفح الأقسام" : "Browse Collections"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">{isAr ? "كل المنتجات" : "All Products"}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/support">{isAr ? "تواصل معنا" : "Contact Us"}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
