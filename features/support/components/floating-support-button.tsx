"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function FloatingSupportButton() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (
    pathname.startsWith("/support") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <Link
      href="/support"
      aria-label={t("support")}
      className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/95"
    >
      <Headset className="h-4 w-4" />
      <span className="hidden sm:inline">{t("support")}</span>
    </Link>
  );
}
