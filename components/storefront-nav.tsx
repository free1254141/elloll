"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/lib/i18n";

export function StorefrontNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isHome = pathname === "/";
  const isProducts = pathname.startsWith("/products");
  const isTrack = pathname === "/track";

  return (
    <>
      <Link
        href="/"
        aria-label="elloll home"
        className={`flex shrink-0 items-center transition-opacity ${isHome ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
      >
        <BrandLogo size="sm" priority />
      </Link>

      <nav className="hidden items-center gap-6 md:ml-4 md:flex" aria-label="Store">
        <Link
          href="/"
          className={`relative text-sm font-medium transition-colors ${isHome ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("home")}
        </Link>
        <Link
          href="/products"
          className={`relative text-sm font-medium transition-colors ${isProducts ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("products")}
        </Link>
        <Link
          href="/track"
          className={`relative text-sm font-medium transition-colors ${isTrack ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("trackOrder")}
        </Link>
      </nav>
    </>
  );
}
