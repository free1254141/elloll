"use client";

import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { FAQ_ITEMS } from "@/features/content/components/faq-data";

export function FaqPageContent() {
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
          {isAr ? "الأسئلة الشائعة" : "FAQ"}
        </span>
      </nav>

      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{isAr ? "مركز المساعدة" : "Help Center"}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr ? "الأسئلة الشائعة حول متجر elloll" : "Frequently Asked Questions"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "كل ما تحتاج معرفته عن الطلب، الشحن لجميع المحافظات، الدفع عند الاستلام، المقاسات، والاستبدال والاسترجاع."
            : "Everything you need to know about ordering, nationwide delivery, Cash on Delivery, sizing, and 14-day returns."}
        </p>
      </header>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <details
            key={item.qEn}
            open={index < 2}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors open:border-amber-500/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
              <span>{isAr ? item.qAr : item.qEn}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {isAr ? item.aAr : item.aEn}
            </p>
          </details>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-bold">
          {isAr ? "هل لديك استفسار آخر؟" : "Still Have a Question?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr
            ? "فريق خدمة عملاء elloll متاح للرد على جميع أسئلتك ومساعدتك في طلباتك."
            : "Our customer support team is ready to assist you with orders and sizing."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/support">
              {isAr ? "تواصل مع الدعم" : "Contact Support"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shipping-delivery">
              {isAr ? "أسعار الشحن" : "Shipping Rates"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/track">{isAr ? "تتبع الطلب" : "Track Order"}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
