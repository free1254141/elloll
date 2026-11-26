import Link from "next/link";
import type { Metadata } from "next";
import { ChevronDown, HelpCircle } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbJsonLd, buildPageMetadata, getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/faq",
  title: "الأسئلة الشائعة — الطلب، الشحن، الدفع والمقاسات | elloll",
  description:
    "إجابات شاملة لأكثر الأسئلة شيوعاً حول الشراء من متجر elloll في مصر: طرق الدفع، أسعار الشحن للمحافظات، تتبع الطلبات، المقاسات، والاسترجاع.",
  keywords: [
    "الأسئلة الشائعة elloll",
    "تتبع الطلب elloll",
    "دفع عند الاستلام ملابس مصر",
    "شحن محافظات مصر",
  ],
});

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "ما هي طرق الدفع المتاحة في متجر elloll؟",
    a: "نوفر حالياً خدمة الدفع نقداً عند الاستلام (Cash on Delivery) في جميع محافظات مصر حتى تطمئن لطلبك قبل السداد.",
  },
  {
    q: "هل يتوفر شحن لجميع محافظات مصر وكم تكلفته؟",
    a: "نعم، نوصل لجميع الـ 27 محافظة في مصر. تبدأ رسوم الشحن من 50 ج.م للقاهرة الكبرى، و65 ج.م للإسكندرية والدلتا والقناة، و85 ج.م للصعيد، و110 ج.م للمحافظات الحدودية والبحر الأحمر، ويصبح الشحن مجانياً فوق الحد المعلن في صفحة الشحن.",
  },
  {
    q: "كم تستغرق مدة التوصيل؟",
    a: "يتم تجهيز الطلب خلال يوم عمل واحد، ويصل خلال 1–2 يوم عمل للقاهرة والجيزة والقليوبية، و2–3 أيام للإسكندرية والدلتا والقناة، و3–5 أيام لباقي المحافظات.",
  },
  {
    q: "كيف أتابع حالة طلبي بعد الشراء؟",
    a: "بعد تأكيد الطلب تحصل على رقم طلب يبدأ بـ ORD-، ويمكنك إدخاله مع بريدك الإلكتروني في صفحة تتبع الطلب لمعرفة الحالة أولاً بأول.",
  },
  {
    q: "هل يمكن استبدال المقاس أو إرجاع المنتج بعد الاستلام؟",
    a: "نعم، يمكنك الاستبدال أو الاسترجاع خلال 14 يوماً من الاستلام بشرط بقاء المنتج بحالته الأصلية دون استخدام. تواصل معنا عبر صفحة دعم العملاء برقم الطلب.",
  },
  {
    q: "كيف أختار المقاس المناسب للهوديز والسويت شيرتات والأحذية؟",
    a: "وفرنا جدولاً واضحاً لقياسات الصدر والطول والوزن المقابل لكل مقاس من S حتى 3XL، وجدول مقاسات الأحذية الأوروبية من 40 إلى 46 في صفحة دليل المقاسات.",
  },
  {
    q: "ما هي خامات الملابس في elloll؟",
    a: "نركز على خامات القطن المصري المريحة وعالية التحمل المناسبة لأجواء مصر، مع توضيح تفاصيل كل خامة وتصميم في صفحة المنتج.",
  },
  {
    q: "هل أحتاج إلى إنشاء حساب لإتمام الطلب؟",
    a: "لا، يمكنك إتمام الطلب كزائر بسهولة بإدخال الاسم، البريد الإلكتروني، رقم الهاتف، المحافظة، والعنوان، كما يمكنك تسجيل الدخول لحفظ سجل محادثاتك مع المساعد الذكي.",
  },
  {
    q: "كيف يعمل مساعد التسوق الذكي في الموقع؟",
    a: "يمكنك سؤال المساعد الذكي عن أي نوع ملابس أو ميزانية أو اقتراح تنسيق، وسيعرض لك المنتجات المناسبة من المتجر مباشرة مع زر الإضافة للسلة.",
  },
  {
    q: "كيف أتواصل مع خدمة العملاء إذا واجهت أي مشكلة؟",
    a: "يمكنك فتح تذكرة مباشرة من صفحة دعم العملاء أو الرد داخل محادثة الدعم الخاصة بك، وسيتابع فريقنا معك فوراً.",
  },
];

export default function FaqPage() {
  const baseUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "الأسئلة الشائعة — elloll",
      url: `${baseUrl}/faq`,
      inLanguage: "ar-EG",
    },
    buildBreadcrumbJsonLd([
      { name: "الرئيسية", path: "/" },
      { name: "الأسئلة الشائعة", path: "/faq" },
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
            <span className="font-medium text-foreground">الأسئلة الشائعة</span>
          </nav>

          <header className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>مركز المساعدة</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              الأسئلة الشائعة حول متجر elloll
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              كل ما تحتاج معرفته عن الطلب، الشحن لجميع المحافظات، الدفع عند
              الاستلام، المقاسات، والاستبدال والاسترجاع.
            </p>
          </header>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={item.q}
                open={index < 2}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors open:border-amber-500/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                  <span>{item.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-lg font-bold">هل لديك استفسار آخر؟</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              فريق خدمة عملاء elloll متاح للرد على جميع أسئلتك ومساعدتك في طلباتك.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/support">تواصل مع الدعم</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/shipping-delivery">أسعار الشحن</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/track">تتبع الطلب</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
