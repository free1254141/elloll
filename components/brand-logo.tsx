"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const SIZES = {
  sm: {
    iconPx: 32,
    iconClass: "h-8 w-8",
    wordmarkW: 76,
    wordmarkH: 21,
    wordmarkClass: "h-[21px] w-auto",
    gap: "gap-2",
  },
  md: {
    iconPx: 56,
    iconClass: "h-14 w-14",
    wordmarkW: 112,
    wordmarkH: 31,
    wordmarkClass: "h-[31px] w-auto",
    gap: "gap-2.5",
  },
  lg: {
    iconPx: 76,
    iconClass: "h-[76px] w-[76px]",
    wordmarkW: 144,
    wordmarkH: 40,
    wordmarkClass: "h-10 w-auto",
    gap: "gap-3",
  },
} as const;

export function BrandLogo({
  variant = "full",
  size = "sm",
  layout = "inline",
  adminBadge = false,
  animated = false,
  priority = false,
  className,
}: {
  variant?: "full" | "icon" | "wordmark";
  size?: keyof typeof SIZES;
  layout?: "inline" | "stacked";
  adminBadge?: boolean;
  animated?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const s = SIZES[size];
  const showIcon = variant === "full" || variant === "icon";
  const showWordmark = variant === "full" || variant === "wordmark";

  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex select-none items-center",
        layout === "stacked" ? "flex-col" : "flex-row",
        s.gap,
        animated && "animate-in fade-in zoom-in-95 duration-500",
        className,
      )}
    >
      {showIcon && (
        <Image
          src="/logo-icon.png"
          alt={showWordmark ? "" : "elloll"}
          width={s.iconPx}
          height={s.iconPx}
          priority={priority}
          className={cn("shrink-0 object-contain", s.iconClass)}
        />
      )}
      {showWordmark && (
        <Image
          src="/logo-wordmark.png"
          alt="elloll"
          width={s.wordmarkW}
          height={s.wordmarkH}
          priority={priority}
          className={cn("shrink-0 object-contain", s.wordmarkClass)}
        />
      )}
      {adminBadge && (
        <span className="rounded-md border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("adminBadge")}
        </span>
      )}
    </span>
  );
}
