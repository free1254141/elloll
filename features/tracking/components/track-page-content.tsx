"use client";

import { useLanguage } from "@/lib/i18n";
import { TrackOrderForm } from "@/features/tracking/components/track-order-form";

export function TrackPageContent() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("trackPageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trackPageSubtitle")}
        </p>
      </div>
      <TrackOrderForm />
    </div>
  );
}
