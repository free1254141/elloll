"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className={`h-9 gap-1.5 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground ${className ?? ""}`}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "ar" ? "EN" : "عربي"}</span>
    </Button>
  );
}
