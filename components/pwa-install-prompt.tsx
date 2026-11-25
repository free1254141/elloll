"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Smartphone, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    try {
      const dismissedAt = localStorage.getItem("elloll_pwa_dismissed");
      if (
        dismissedAt &&
        Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000
      ) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("elloll_pwa_dismissed", String(Date.now()));
    } catch {
      // ignore storage errors
    }
  };

  if (
    isStandalone ||
    isDismissed ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 start-4 z-40 hidden items-center gap-2.5 rounded-xl border border-amber-500/30 bg-background/95 px-3 py-2 text-foreground shadow-2xl backdrop-blur-md transition-all duration-300 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-start">
          <span className="text-xs font-bold leading-tight">
            {isAr ? "تطبيق elloll" : "elloll App"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "تثبيت سريع للأندرويد (APK)" : "Install on Android (APK)"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="ms-1 flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-black shadow-sm transition-colors hover:bg-amber-400"
        >
          <Download className="h-3.5 w-3.5" />
          {isAr ? "تثبيت" : "Install"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={isAr ? "إغلاق" : "Dismiss"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 text-start text-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold">
                {isAr
                  ? "تثبيت تطبيق elloll للأندرويد"
                  : "Install elloll Android App"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label={isAr ? "إغلاق" : "Close"}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 py-4 text-xs text-muted-foreground">
              <p className="font-medium text-amber-500">
                {isAr
                  ? "لتثبيت التطبيق على هاتفك مباشرة:"
                  : "To install the app directly on your phone:"}
              </p>
              <ol className="list-inside list-decimal space-y-1.5">
                <li>
                  {isAr
                    ? "اضغط على زر القائمة ⋮ أعلى متصفح Chrome."
                    : "Tap the ⋮ menu button in Chrome."}
                </li>
                <li>
                  {isAr
                    ? 'اختر "تثبيت التطبيق" أو "الإضافة إلى الشاشة الرئيسية".'
                    : 'Choose "Install app" or "Add to Home screen".'}
                </li>
                <li>
                  {isAr
                    ? "سيتم تثبيت التطبيق فوراً والعمل كتطبيق أصلي سريع."
                    : "The app launches cleanly as a standalone store app."}
                </li>
              </ol>

              <div className="border-t border-border pt-3">
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {isAr
                    ? "أو تحميل ملف الأندرويد المباشر (APK):"
                    : "Or download the direct Android APK package:"}
                </p>
                <a
                  href="/elloll.apk"
                  download="elloll.apk"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 py-2.5 text-xs font-bold text-amber-500 transition-colors hover:bg-amber-500/25"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isAr
                    ? "تحميل ملف elloll.apk مباشرة"
                    : "Download elloll.apk directly"}
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full rounded-xl bg-muted py-2 text-xs font-semibold hover:bg-muted/80"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
