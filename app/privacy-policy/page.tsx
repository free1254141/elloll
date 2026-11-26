import Link from "next/link";
import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/privacy-policy",
  title: "سياسة الخصوصية وشروط الاستخدام | elloll",
  description:
    "تعرّف على سياسة الخصوصية وحماية بيانات العملاء وشروط استخدام متجر elloll الإلكتروني في مصر.",
  keywords: ["سياسة الخصوصية elloll", "شروط الاستخدام", "حماية بيانات العملاء"],
});

export default function PrivacyPolicyPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة الخصوصية وشروط الاستخدام — elloll",
      url: `${baseUrl}/privacy-policy`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "سياسة الخصوصية", path: "/privacy-policy" },
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
            <span className="font-medium text-foreground">سياسة الخصوصية</span>
          </nav>

          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              <Shield className="h-3.5 w-3.5" />
              <span>حماية البيانات والخصوصية</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              سياسة الخصوصية وشروط الاستخدام
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              نحترم خصوصيتك في متجر elloll ونلتزم بحماية جميع البيانات التي تشاركها
              معنا أثناء التصفح أو إتمام الطلبات.
            </p>
          </header>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-foreground">
                1. البيانات التي نجمعها
              </h2>
              <p className="mt-2">
                عند إتمام طلب أو فتح تذكرة دعم أو تسجيل الدخول، نجمع البيانات الأساسية
                اللازمة لتنفيذ خدمتك فقط، مثل: الاسم، البريد الإلكتروني، رقم الهاتف،
                المحافظة، وعنوان التوصيل.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-foreground">
                2. كيف نستخدم بياناتك
              </h2>
              <ul className="mt-2 space-y-1.5">
                <li>• تأكيد الطلبات، تنسيق الشحن، وإرسال تحديثات حالة الطلب.</li>
                <li>• الرد على استفسارات خدمة العملاء وطلبات الاستبدال والاسترجاع.</li>
                <li>• حفظ سلة التسوق أو تفضيل اللغة وسجل محادثات المساعد الذكي.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-foreground">
                3. عدم مشاركة البيانات وحفظ السرية
              </h2>
              <p className="mt-2">
                لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث. تتم مشاركة بيانات عنوان
                التوصيل والهاتف فقط مع شركة الشحن المختصة لتسليم طلبك بنجاح.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-foreground">
                4. شروط الاستخدام وحقوق العملاء
              </h2>
              <p className="mt-2">
                تُعرض جميع الأسعار بالجنيه المصري، وتخضع الطلبات لتوافر الصنف وتأكيد
                بيانات التوصيل. يمكنك التواصل معنا في أي وقت عبر{" "}
                <Link href="/support" className="font-semibold text-amber-500 underline">
                  صفحة دعم العملاء
                </Link>{" "}
                لطلب تعديل أو حذف بيانات حسابك أو محادثاتك.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
