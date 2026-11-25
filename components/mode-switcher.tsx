"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

const MODE_KEY = "elloll-view-mode";

export function useStorefrontMode() {
  const [mode, setModeState] = useState<"default" | "chat_only">("default");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "chat_only" || saved === "default") {
        setModeState(saved);
      }
    } catch {
      // ignore
    }

    const onModeEvent = (e: Event) => {
      const next = (e as CustomEvent<"default" | "chat_only">).detail;
      if (next === "chat_only" || next === "default") {
        setModeState(next);
      }
    };
    window.addEventListener("elloll:mode-change", onModeEvent);
    return () => window.removeEventListener("elloll:mode-change", onModeEvent);
  }, []);

  function setMode(next: "default" | "chat_only") {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("elloll:mode-change", { detail: next }));
  }

  return { mode, setMode };
}

export function ModeSwitcher() {
  const { mode, setMode } = useStorefrontMode();
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isChat = mode === "chat_only" && pathname === "/";

  function handleToggle() {
    if (isChat) {
      setMode("default");
    } else {
      setMode("chat_only");
      if (pathname !== "/") {
        router.push("/");
      }
    }
  }

  return (
    <Button
      type="button"
      variant={isChat ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className="h-8 w-8 gap-1.5 rounded-full p-0 text-xs font-semibold sm:w-auto sm:px-3"
      title={
        isChat
          ? locale === "ar"
            ? "العودة للمتجر"
            : "Back to Store"
          : locale === "ar"
            ? "وضع الشات فقط"
            : "Chat-Only Mode"
      }
    >
      {isChat ? (
        <>
          <Store className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {locale === "ar" ? "المتجر" : "Store"}
          </span>
        </>
      ) : (
        <>
          <Bot className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">
            {locale === "ar" ? "وضع الشات" : "AI Mode"}
          </span>
        </>
      )}
    </Button>
  );
}
