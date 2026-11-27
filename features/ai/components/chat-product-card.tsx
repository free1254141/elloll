"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Images,
  Minus,
  Plus,
  RefreshCw,
  Ruler,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductImages, type Product } from "@/features/catalog/lib/catalog";
import type { ProductCardPayload } from "@/features/ai/lib/chat-format";
import { getLocalizedCategoryName } from "@/lib/seo";

const priceFmt = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

export function ChatProductCard({
  item,
  locale,
  compact = false,
  onAddProduct,
  onQuickReply,
  onCloseDrawer,
}: {
  item: ProductCardPayload;
  locale: "ar" | "en";
  compact?: boolean;
  onAddProduct?: (product: Product, quantity: number) => void;
  onQuickReply?: (text: string) => void;
  onCloseDrawer?: () => void;
}) {
  const { product } = item;
  const isAr = locale === "ar";
  const images = getProductImages(product);
  const safeImages = images.length > 0 ? images : product.image_url ? [product.image_url] : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const currentImg = safeImages[activeIdx] ?? safeImages[0] ?? "";
  const totalImgs = safeImages.length;

  const categoryLabel =
    item.categorySlug && item.categoryName
      ? getLocalizedCategoryName(
          { name: item.categoryName, slug: item.categorySlug },
          locale,
        )
      : item.categoryName;

  const prevImg = useCallback(() => {
    if (totalImgs <= 1) return;
    setActiveIdx((i) => (i - 1 + totalImgs) % totalImgs);
  }, [totalImgs]);

  const nextImg = useCallback(() => {
    if (totalImgs <= 1) return;
    setActiveIdx((i) => (i + 1) % totalImgs);
  }, [totalImgs]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setZoom(1);
      } else if (e.key === "ArrowLeft") {
        prevImg();
      } else if (e.key === "ArrowRight") {
        nextImg();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(2))));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(2))));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, prevImg, nextImg]);

  function handleCopyLink() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://elloll.vercel.app";
    const summary = `${product.name} — ${priceFmt.format(product.price)}\n${origin}/products/${product.id}`;
    void navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleAdd() {
    onAddProduct?.(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-colors hover:border-amber-500/45">
      {/* Subtle golden glow accent like stokscan_AI cards */}
      <div className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

      {/* Product Image Header + Zoom + Multi-image Switcher */}
      <div className="relative bg-muted">
        <button
          type="button"
          onClick={() => {
            if (!currentImg) return;
            setZoom(1);
            setLightboxOpen(true);
          }}
          aria-label={isAr ? `تكبير صورة ${product.name}` : `Zoom ${product.name}`}
          className={`relative block w-full cursor-zoom-in overflow-hidden ${
            compact ? "aspect-square" : "aspect-[4/3] sm:aspect-[16/10]"
          }`}
        >
          {currentImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImg}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}

          {/* Top Floating Badges */}
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex flex-wrap items-center justify-between gap-1.5">
            {categoryLabel ? (
              <span className="rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                {categoryLabel}
              </span>
            ) : (
              <span />
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-black/75 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {item.highlightBadge ||
                (isAr ? "متوفر • دفع عند الاستلام" : "Available • COD")}
            </span>
          </div>

          {/* Bottom Floating Counter & Zoom Cue */}
          <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2">
            {totalImgs > 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur">
                <Images className="h-3 w-3 text-amber-400" />
                {activeIdx + 1}/{totalImgs}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              <ZoomIn className="h-3 w-3 text-amber-400" />
              <span>{isAr ? "تكبير" : "Zoom"}</span>
            </span>
          </div>
        </button>

        {totalImgs > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/60 bg-background/60 px-2.5 py-1.5">
            {safeImages.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={isAr ? `صورة ${idx + 1}` : `Image ${idx + 1}`}
                className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 transition ${
                  idx === activeIdx
                    ? "border-amber-500 ring-1 ring-amber-500/40"
                    : "border-border opacity-65 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
        {/* Title + Copy Share */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.id}`}
            onClick={onCloseDrawer}
            className={`font-extrabold leading-snug text-foreground transition-colors hover:text-amber-500 ${
              compact ? "line-clamp-2 text-xs sm:text-sm" : "text-sm sm:text-base"
            }`}
          >
            {product.name}
          </Link>
          <button
            type="button"
            onClick={handleCopyLink}
            title={isAr ? "نسخ رابط وبيانات المنتج" : "Copy product link & price"}
            aria-label={isAr ? "نسخ رابط المنتج" : "Copy product link"}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Bold Price Banner */}
        <div className="flex items-baseline justify-between gap-2 border-y border-border/60 py-2">
          <div className="flex items-baseline gap-1.5">
            <span
              dir="ltr"
              className={`font-display font-black tabular-nums text-amber-500 ${
                compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
              }`}
            >
              {priceFmt.format(product.price)}
            </span>
          </div>
          {!compact && (
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {isAr ? "جاهز للشحن الفوري" : "Ready to Ship"}
            </span>
          )}
        </div>

        {/* 2x2 Info Tiles (Full spotlight mode only) */}
        {!compact && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/40 p-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Truck className="h-3 w-3 shrink-0 text-amber-500" />
                <span>{isAr ? "الشحن" : "Shipping"}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-bold text-foreground">
                {isAr ? "من 50 ج.م لكل مصر" : "From 50 EGP"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Banknote className="h-3 w-3 shrink-0" />
                <span>{isAr ? "الدفع" : "Payment"}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-bold text-foreground">
                {isAr ? "عند الاستلام" : "Cash on Delivery"}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                <RefreshCw className="h-3 w-3 shrink-0" />
                <span>{isAr ? "الاستبدال" : "Returns"}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-bold text-foreground">
                {isAr ? "خلال 14 يوماً" : "14-Day Return"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Ruler className="h-3 w-3 shrink-0 text-purple-500" />
                <span>{isAr ? "المقاسات" : "Sizes"}</span>
              </div>
              <p dir="ltr" className="mt-0.5 truncate text-[11px] font-bold text-foreground">
                S–3XL / 40–46
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p
            className={`text-xs leading-relaxed text-muted-foreground ${
              compact ? "line-clamp-2" : "line-clamp-3"
            }`}
          >
            {product.description}
          </p>
        )}

        {/* Interactive Quantity Stepper + Add to Cart */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            {!compact && (
              <div className="flex h-8 shrink-0 items-center rounded-lg border border-input bg-background">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label={isAr ? "تقليل الكمية" : "Decrease quantity"}
                  className="flex h-full w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-6 text-center text-xs font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  disabled={qty >= 99}
                  aria-label={isAr ? "زيادة الكمية" : "Increase quantity"}
                  className="flex h-full w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className={`h-8 flex-1 gap-1.5 text-xs font-bold ${
                added ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{isAr ? "تمت الإضافة" : "Added"}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>{isAr ? "أضف للسلة" : "Add to Cart"}</span>
                </>
              )}
            </Button>
          </div>

          {/* Action Chips Row (stokscan_AI style) */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/products/${product.id}`}
              onClick={onCloseDrawer}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-amber-500/40 hover:text-amber-500"
            >
              <span>{isAr ? "صفحة المنتج" : "Product Page"}</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>

            {onQuickReply && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onQuickReply(
                      isAr
                        ? `نسّق لي طقم كامل مع "${product.name}"`
                        : `Style an outfit with "${product.name}"`,
                    )
                  }
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-300"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isAr ? "نسّق طقم معاه" : "Style Outfit"}</span>
                </button>

                {!compact && (
                  <button
                    type="button"
                    onClick={() =>
                      onQuickReply(
                        isAr ? "اعرض جدول المقاسات" : "Show the size chart",
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
                  >
                    <Ruler className="h-3 w-3" />
                    <span>{isAr ? "المقاسات" : "Sizes"}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Fullscreen Zoom Lightbox */}
      {lightboxOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            onClick={() => {
              setLightboxOpen(false);
              setZoom(1);
            }}
            className="fixed inset-0 z-[95] flex flex-col bg-black/95 text-white backdrop-blur-md"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3"
            >
              <p className="truncate text-sm font-bold text-white/90">
                {product.name}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(2))))
                  }
                  disabled={zoom <= 1}
                  aria-label={isAr ? "تصغير" : "Zoom out"}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 disabled:opacity-40"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-11 text-center font-mono text-xs font-bold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(2))))
                  }
                  disabled={zoom >= 3}
                  aria-label={isAr ? "تكبير" : "Zoom in"}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 disabled:opacity-40"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxOpen(false);
                    setZoom(1);
                  }}
                  aria-label={isAr ? "إغلاق" : "Close"}
                  className="ms-1 grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
              {totalImgs > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImg();
                    }}
                    aria-label={isAr ? "السابقة" : "Previous"}
                    className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 hover:bg-black"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImg();
                    }}
                    aria-label={isAr ? "التالية" : "Next"}
                    className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/70 hover:bg-black"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt={product.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => (z > 1 ? 1 : 2));
                }}
                style={{
                  transform: `scale(${zoom})`,
                  transition: "transform 160ms ease-out",
                }}
                className="max-h-[78vh] max-w-[92vw] cursor-zoom-in rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
