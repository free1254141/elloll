"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const SLIDES: {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  image: string;
}[] = [
  {
    titleKey: "slide1Title",
    descKey: "slide1Desc",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&h=700&fit=crop",
  },
  {
    titleKey: "slide2Title",
    descKey: "slide2Desc",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=700&fit=crop",
  },
  {
    titleKey: "slide3Title",
    descKey: "slide3Desc",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&h=700&fit=crop",
  },
];

export function Hero() {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLanguage();

  const stopAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    timer.current = setInterval(() => {
      setCurrent((i) => (i + 1) % SLIDES.length);
    }, 5000);
  }, [stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);

  function goTo(index: number) {
    setCurrent(index);
    startAutoplay();
  }

  return (
    <section className="relative overflow-hidden">
      {/* Rotating background slides */}
      <div className="absolute inset-0 -z-30">
        {SLIDES.map((slide, index) => (
          <div
            key={index}
            aria-hidden={index !== current}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-1000",
              index === current
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105",
            )}
            style={{
              backgroundImage: `url(${slide.image})`,
              transition: "opacity 1s ease, transform 6s ease",
            }}
          />
        ))}
      </div>

      {/* Gradient overlay — adapts cleanly to pure black dark mode & warm light mode */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background/80 via-background/65 to-background/95 dark:from-background/85 dark:via-background/75 dark:to-background" />

      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_55%_55%_at_50%_30%,black,transparent)]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-14 text-center sm:py-20">
        <BrandLogo size="lg" animated priority />

        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          {t("heroTitleLead")}{" "}
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            {t("heroTitleHighlight")}
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
          {t("heroSubtitle")}
        </p>

        <div className="flex w-full justify-center sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/products">{t("heroCtaPrimary")}</Link>
          </Button>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={t(slide.titleKey)}
            aria-current={index === current ? "true" : undefined}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === current
                ? "w-6 bg-amber-500"
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60",
            )}
          />
        ))}
      </div>
    </section>
  );
}
