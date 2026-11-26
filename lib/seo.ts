import type { Metadata } from "next";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://elloll.vercel.app";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export type CollectionSeoEntry = {
  title: string;
  description: string;
  intro: string;
  keywords: string[];
};

export const COLLECTION_SEO_MAP: Record<string, CollectionSeoEntry> = {
  "hoodies-sweatshirts": {
    title: "هوديز وسويت شيرتات رجالي وشبابي في مصر | elloll",
    description:
      "تسوق أحدث هوديز أوفرسايز، سويت شيرتات قطن مصري، وبلوفرات شتوية رجالي بأسعار مناسبة مع الدفع عند الاستلام وشحن سريع لجميع محافظات مصر.",
    intro:
      "مجموعة مختارة من الهوديز الأوفرسايز والسويت شيرتات القطنية والبلوفرات الشتوية المصممة بخامات مريحة وقصّات عصرية تناسب كل يوم.",
    keywords: [
      "هوديز رجالي مصر",
      "سويت شيرت أوفرسايز",
      "بلوفر شتوي رجالي",
      "هودي قطن مصري",
      "ملابس شتوية كاجوال",
      "elloll",
    ],
  },
  "shoes-sneakers": {
    title: "أحذية كاجوال وسنيكرز شبابي مريح في مصر | elloll",
    description:
      "اكتشف تشكيلة سنيكرز رياضي وأحذية كاجوال يومية خفيفة ومريحة للرجال والشباب في مصر، جودة ممتازة ودفع عند الاستلام وتوصيل سريع.",
    intro:
      "أحذية كاجوال وسنيكرز يومي بتصميمات عصرية وخفيفة تمنحك راحة طوال اليوم في المشي والجامعة والخروجات.",
    keywords: [
      "سنيكرز رجالي مصر",
      "أحذية كاجوال شبابي",
      "كوتشي يومي مريح",
      "شوز رياضي كاجوال",
      "elloll",
    ],
  },
  "tshirts-tops": {
    title: "تيشيرتات قطن وبديهات رجالي أونلاين في مصر | elloll",
    description:
      "اشتري تيشيرتات مخططة كم طويل وبديهات قطن ناعم أساسية للخزانة من متجر elloll، خامات مصرية ممتازة وشحن لجميع المحافظات.",
    intro:
      "قطع أساسية وتيشيرتات قطنية مريحة يسهل تنسيقها مع كل الإطلالات اليومية والكاجوال على مدار العام.",
    keywords: [
      "تيشيرتات رجالي مصر",
      "بدي قطن رجالي",
      "تيشيرت مخطط كم طويل",
      "ملابس أساسية رجالي",
      "elloll",
    ],
  },
  tracksuits: {
    title: "أطقم رياضية وترينجات رجالي كاملة في مصر | elloll",
    description:
      "تسوق أطقم رياضية وترينجات رجالي متناسقة من سويت شيرت وبنطلون قطن مريح للنادي والخروجات، توصيل سريع لجميع محافظات مصر من elloll.",
    intro:
      "أطقم رياضية كاملة تجمع بين الراحة العملية والمظهر الرياضي الأنيق للتمارين والنادي والمشاوير اليومية.",
    keywords: [
      "طقم رياضي رجالي مصر",
      "ترينج رجالي أسود",
      "ملابس رياضية رجالي",
      "سويت شيرت وبنطلون",
      "elloll",
    ],
  },
};

export function getCollectionSeo(category: {
  name: string;
  slug: string;
}): CollectionSeoEntry {
  const mapped = COLLECTION_SEO_MAP[category.slug];
  if (mapped) return mapped;
  return {
    title: `${category.name} — تسوق أونلاين في مصر | elloll`,
    description: `اكتشف أحدث منتجات قسم ${category.name} في متجر elloll بأسعار الجنيه المصري مع الدفع عند الاستلام وشحن سريع لجميع محافظات مصر.`,
    intro: `تصفح تشكيلة ${category.name} المختارة بعناية في متجر elloll مع شحن سريع لجميع محافظات مصر.`,
    keywords: [category.name, "elloll", "ملابس في مصر", "تسوق أونلاين مصر"],
  };
}

export function buildPageMetadata({
  path,
  title,
  description,
  keywords,
  noIndex = false,
}: {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const baseUrl = getSiteUrl();
  const normalizedPath = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${baseUrl}${normalizedPath}`;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "elloll",
      locale: "ar_EG",
      type: "website",
      images: [
        {
          url: `${baseUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/opengraph-image.png`],
    },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  const baseUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path === "/" ? `${baseUrl}/` : `${baseUrl}${item.path}`,
    })),
  };
}
