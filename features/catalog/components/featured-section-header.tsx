"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function FeaturedSectionHeader() {
  const { t, dir } = useLanguage();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2
        id="featured-products"
        className="font-display text-2xl font-semibold tracking-tight"
      >
        {t("featuredProducts")}
      </h2>
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{t("viewAll")}</span>
        <Arrow className="h-4 w-4" />
      </Link>
    </div>
  );
}
