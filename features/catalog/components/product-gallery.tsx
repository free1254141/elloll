"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : [];
  const current = safeImages[activeIndex] ?? safeImages[0] ?? "";
  const total = safeImages.length;

  function prev() {
    if (total <= 1) return;
    setActiveIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    if (total <= 1) return;
    setActiveIndex((i) => (i + 1) % total);
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        {current && (
          <Image
            src={current}
            alt={`${name} (${activeIndex + 1})`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-all duration-300"
          />
        )}

        {total > 1 && (
          <>
            <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur">
              <Images className="h-3.5 w-3.5 text-amber-500" />
              {activeIndex + 1} / {total}
            </span>

            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {safeImages.map((src, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl border-2 bg-muted transition-all",
                  active
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={src}
                  alt={`${name} thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
