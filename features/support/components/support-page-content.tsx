"use client";

import { Headset } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { CustomerSupportView } from "@/features/support/components/customer-support-view";

export function SupportPageContent() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Headset className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("supportTitle")}
        </h1>
        <p className="mx-auto mt-1.5 max-w-lg text-sm text-muted-foreground">
          {t("supportSubtitle")}
        </p>
      </div>
      <CustomerSupportView />
    </div>
  );
}
