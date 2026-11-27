"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function PrivacyPolicyContent() {
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
          {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
        </span>
      </nav>

      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
          <Shield className="h-3.5 w-3.5" />
          <span>{isAr ? "حماية البيانات والخصوصية" : "Data Protection & Privacy"}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr
            ? "سياسة الخصوصية وشروط الاستخدام"
            : "Privacy Policy & Terms of Use"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isAr
            ? "نحترم خصوصيتك في متجر elloll ونلتزم بحماية جميع البيانات التي تشاركها معنا أثناء التصفح أو إتمام الطلبات."
            : "At elloll, we respect your privacy and safeguard all personal data you share when browsing or placing orders."}
        </p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground">
            {isAr ? "1. البيانات التي نجمعها" : "1. Information We Collect"}
          </h2>
          <p className="mt-2">
            {isAr
              ? "عند إتمام طلب أو فتح تذكرة دعم أو تسجيل الدخول، نجمع البيانات الأساسية اللازمة لتنفيذ خدمتك فقط، مثل: الاسم، البريد الإلكتروني، رقم الهاتف، المحافظة، وعنوان التوصيل."
              : "When you place an order, submit a support ticket, or sign in, we collect only the details needed to fulfill your request: name, email, phone number, governorate, and delivery address."}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground">
            {isAr ? "2. كيف نستخدم بياناتك" : "2. How We Use Your Information"}
          </h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              •{" "}
              {isAr
                ? "تأكيد الطلبات، تنسيق الشحن، وإرسال تحديثات حالة الطلب."
                : "Confirming orders, coordinating courier shipping, and providing status updates."}
            </li>
            <li>
              •{" "}
              {isAr
                ? "الرد على استفسارات خدمة العملاء وطلبات الاستبدال والاسترجاع."
                : "Responding to customer support inquiries and exchange/return requests."}
            </li>
            <li>
              •{" "}
              {isAr
                ? "حفظ سلة التسوق أو تفضيل اللغة وسجل محادثات المساعد الذكي."
                : "Remembering your cart items, language preference, and AI assistant chat history."}
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground">
            {isAr ? "3. عدم مشاركة البيانات وحفظ السرية" : "3. Confidentiality & Sharing"}
          </h2>
          <p className="mt-2">
            {isAr
              ? "لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث. تتم مشاركة بيانات عنوان التوصيل والهاتف فقط مع شركة الشحن المختصة لتسليم طلبك بنجاح."
              : "We never sell or rent your personal data. Delivery address and contact details are shared strictly with our courier partners to fulfill your delivery."}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground">
            {isAr ? "4. شروط الاستخدام وحقوق العملاء" : "4. Terms & Customer Rights"}
          </h2>
          <p className="mt-2">
            {isAr
              ? "تُعرض جميع الأسعار بالجنيه المصري، وتخضع الطلبات لتوافر الصنف وتأكيد بيانات التوصيل. يمكنك التواصل معنا في أي وقت عبر "
              : "All prices are listed in Egyptian Pounds (EGP). You can reach us anytime via "}
            <Link href="/support" className="font-semibold text-amber-500 underline">
              {isAr ? "صفحة دعم العملاء" : "Customer Support"}
            </Link>
            {isAr
              ? " لطلب تعديل أو حذف بيانات حسابك أو محادثاتك."
              : " to request updates or deletion of your account or chat data."}
          </p>
        </section>
      </div>
    </div>
  );
}
