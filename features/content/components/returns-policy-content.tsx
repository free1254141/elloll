"use client";

import Link from "next/link";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export function ReturnsPolicyContent() {
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
          {isAr ? "الاستبدال والاسترجاع" : "Returns Policy"}
        </span>
      </nav>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{isAr ? "ضمان 14 يوماً" : "14-Day Guarantee"}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr ? "سياسة الاستبدال والاسترجاع في elloll" : "Returns & Exchanges Policy"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "نحرص في متجر elloll على رضاك التام عن كل قطعة تشتريها، لذلك نوفر لك حق الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ الاستلام وفق ضوابط واضحة ومتوافقة مع قانون حماية المستهلك المصري."
            : "Your satisfaction matters. You may request an exchange or return within 14 days of delivery under clear conditions aligned with Egyptian Consumer Protection regulations."}
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2>
              {isAr ? "شروط قبول الاستبدال أو الاسترجاع" : "Eligibility Requirements"}
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li>
              •{" "}
              {isAr
                ? "تقديم الطلب خلال مدة أقصاها 14 يوماً من تاريخ استلام الشحنة."
                : "Submit the request within 14 calendar days from the delivery date."}
            </li>
            <li>
              •{" "}
              {isAr
                ? "أن يكون المنتج في حالته الأصلية تماماً، غير مستخدم أو مغسول، وبكامل بطاقاته وتغليفه."
                : "Item must remain unused, unwashed, and in its original packaging with all tags attached."}
            </li>
            <li>
              •{" "}
              {isAr
                ? "توافر رقم الطلب (ORD-...) أو البريد الإلكتروني المسجل به الطلب."
                : "Provide your order number (ORD-...) or the checkout email address."}
            </li>
            <li>
              •{" "}
              {isAr
                ? "يحق للعميل المعاينة الظاهرية للطرد عند الاستلام والتأكد من مطابقة اللون والقطعة."
                : "Customers may visually inspect the package upon courier arrival."}
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2>{isAr ? "رسوم الشحن في حالة الاسترجاع" : "Return Shipping Fees"}</h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li>
              •{" "}
              <strong className="text-foreground">
                {isAr
                  ? "في حال وجود عيب صناعة أو خطأ في الطلب:"
                  : "Defective or incorrect items:"}
              </strong>{" "}
              {isAr
                ? "يتحمل متجر elloll تكاليف الاستبدال أو الشحن بالكامل دون أي رسوم إضافية على العميل."
                : "elloll covers 100% of exchange or return courier fees with zero extra cost."}
            </li>
            <li>
              •{" "}
              <strong className="text-foreground">
                {isAr
                  ? "في حال رغبة العميل في الاستبدال لمقاس آخر أو الاسترجاع دون عيب:"
                  : "Size swap or change-of-mind returns:"}
              </strong>{" "}
              {isAr
                ? "يتحمل العميل مصاريف الشحن ذهاباً وإياباً وفق تعريفة المحافظة."
                : "Round-trip courier shipping applies according to your governorate rate."}
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-bold">
            {isAr ? "خطوات طلب الاستبدال أو الاسترجاع" : "How to Request a Return"}
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              {isAr ? "توجّه إلى صفحة " : "Open our "}
              <Link href="/support" className="font-semibold text-amber-500 underline">
                {isAr ? "دعم العملاء" : "Customer Support"}
              </Link>
              {isAr
                ? " وافتح تذكرة جديدة برقم الطلب."
                : " page and submit a ticket with your order number."}
            </li>
            <li>
              {isAr
                ? "أوضح سبب الاستبدال أو الاسترجاع والمقاس أو القطعة المطلوبة بدلاً منها."
                : "Describe the reason and the replacement size or item if exchanging."}
            </li>
            <li>
              {isAr
                ? "سيقوم فريقنا بالتنسيق معك لإرسال المندوب واستلام القطعة وإتمام الاستبدال أو رد المبلغ."
                : "Our team will schedule courier pickup and process your exchange or refund."}
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/support">
                {isAr ? "طلب استبدال أو استرجاع" : "Request Return / Exchange"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/size-guide">
                {isAr ? "راجع دليل المقاسات" : "Check Size Guide"}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
