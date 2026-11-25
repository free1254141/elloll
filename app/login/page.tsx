"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CustomerAuthCard } from "@/features/auth/components/customer-auth-modal";
import { useCustomerAuth } from "@/features/auth/components/customer-auth-provider";
import { useLanguage } from "@/lib/i18n";

export default function StorefrontLoginPage() {
  const router = useRouter();
  const { user } = useCustomerAuth();
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          {isAr ? "العودة للمتجر ←" : "← Back to store"}
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <div className="mb-6">
        <BrandLogo size="md" layout="stacked" priority />
      </div>

      <CustomerAuthCard onSuccess={() => router.push("/")} />
    </div>
  );
}
