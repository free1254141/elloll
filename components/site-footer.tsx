"use client";

import Link from "next/link";
import { Download, Headset, Smartphone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export function SiteFooter() {
  const { t, locale } = useLanguage();
  const isAr = locale === "ar";

  return (
    <footer className="w-full border-t border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Direct CTA */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              aria-label="elloll home"
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <BrandLogo size="sm" />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              {t("footerTagline")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/support">
                  <Headset className="h-4 w-4 text-primary" />
                  {t("contactSupportBtn")}
                </Link>
              </Button>
              <a
                href="/elloll.apk"
                download="elloll.apk"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>{isAr ? "تطبيق الأندرويد APK" : "Android App APK"}</span>
                <Download className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Collections */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? "الأقسام" : "Collections"}
            </h3>
            <nav className="flex flex-col gap-1.5" aria-label="Footer collections links">
              <Link
                href="/collections"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "كل الأقسام" : "All Collections"}
              </Link>
              <Link
                href="/collections/hoodies-sweatshirts"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "هوديز وسويت شيرتات" : "Hoodies & Sweatshirts"}
              </Link>
              <Link
                href="/collections/pants-jeans"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "بنطلونات وسويت بانتس" : "Pants & Sweatpants"}
              </Link>
              <Link
                href="/collections/shoes-sneakers"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "أحذية وسنيكرز" : "Shoes & Sneakers"}
              </Link>
              <Link
                href="/collections/tshirts-tops"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "تيشيرتات وقمصان" : "T-Shirts & Shirts"}
              </Link>
              <Link
                href="/collections/tracksuits"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "أطقم رياضية" : "Tracksuits"}
              </Link>
            </nav>
          </div>

          {/* Shop & Services */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footerShopHeading")}
            </h3>
            <nav className="flex flex-col gap-1.5" aria-label="Footer shop links">
              <Link
                href="/products"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("allProducts")}
              </Link>
              <Link
                href="/size-guide"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "دليل المقاسات" : "Size Guide"}
              </Link>
              <Link
                href="/track"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("trackOrder")}
              </Link>
              <Link
                href="/cart"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("cart")}
              </Link>
              <Link
                href="/support"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("support")}
              </Link>
            </nav>
          </div>

          {/* Policies & Info */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? "معلومات وسياسات" : "Info & Policies"}
            </h3>
            <nav className="flex flex-col gap-1.5" aria-label="Footer policy links">
              <Link
                href="/about"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "عن متجر elloll" : "About elloll"}
              </Link>
              <Link
                href="/shipping-delivery"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "الشحن والتوصيل" : "Shipping & Delivery"}
              </Link>
              <Link
                href="/returns-policy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "الاستبدال والاسترجاع" : "Returns Policy"}
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "الأسئلة الشائعة" : "FAQ"}
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
