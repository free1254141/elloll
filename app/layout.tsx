import type { Metadata, Viewport } from "next";
import { Cairo, Geist, Space_Grotesk } from "next/font/google";
import { RouteAwareThemeProvider } from "@/components/route-aware-theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { StorefrontAiShell } from "@/features/ai/components/storefront-ai-shell";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { CustomerAuthProvider } from "@/features/auth/components/customer-auth-provider";
import { CustomerAuthModal } from "@/features/auth/components/customer-auth-modal";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const defaultUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "elloll",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "elloll — أزياء وملابس عصرية في مصر",
    template: "%s",
  },
  description:
    "متجر elloll للملابس والأزياء العصرية في مصر — خامات مختارة بعناية، توصيل سريع لجميع المحافظات، ودعم عملاء مباشر.",
  keywords: [
    "elloll",
    "متجر ملابس مصر",
    "أزياء أونلاين مصر",
    "ملابس كاجوال",
    "تسوق ملابس في مصر",
    "شحن لجميع المحافظات",
  ],
  alternates: {
    canonical: defaultUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "elloll — أزياء وملابس عصرية في مصر",
    description:
      "وجهتك الأولى لأحدث الملابس والأزياء العصرية في مصر — خامات مختارة بعناية وشحن سريع لجميع المحافظات.",
    url: defaultUrl,
    siteName: "elloll",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "elloll — أزياء وملابس عصرية في مصر",
    description:
      "متجر elloll للملابس والأزياء العصرية في مصر — توصيل سريع لجميع المحافظات.",
  },
};

const cairo = Cairo({
  variable: "--font-cairo",
  display: "swap",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ClothingStore",
      name: "elloll",
      url: defaultUrl,
      logo: `${defaultUrl}/icon-512.png`,
      image: `${defaultUrl}/opengraph-image.png`,
      description:
        "متجر elloll للملابس والأزياء العصرية في مصر — شحن لجميع المحافظات.",
      priceRange: "EGP",
      areaServed: "EG",
      address: {
        "@type": "PostalAddress",
        addressCountry: "EG",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "elloll",
      url: defaultUrl,
      inLanguage: "ar-EG",
      potentialAction: {
        "@type": "SearchAction",
        target: `${defaultUrl}/products?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
        <LanguageProvider>
          <CustomerAuthProvider>
            <RouteAwareThemeProvider>
              {children}
              <CustomerAuthModal />
              <StorefrontAiShell />
              <PwaInstallPrompt />
            </RouteAwareThemeProvider>
          </CustomerAuthProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
