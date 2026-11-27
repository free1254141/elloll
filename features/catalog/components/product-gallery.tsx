"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Images,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3.25;
const ZOOM_STEP = 0.5;

export function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const movedRef = useRef(false);

  const safeImages = images.length > 0 ? images : [];
  const current = safeImages[activeIndex] ?? safeImages[0] ?? "";
  const total = safeImages.length;

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((i) => (i - 1 + total) % total);
    resetZoom();
  }, [total, resetZoom]);

  const next = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((i) => (i + 1) % total);
    resetZoom();
  }, [total, resetZoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const nextZoom = Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2)));
      if (nextZoom <= 1) setOffset({ x: 0, y: 0 });
      return nextZoom;
    });
  }, []);

  const openLightbox = () => {
    if (!current) return;
    resetZoom();
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    resetZoom();
  }, [resetZoom]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") resetZoom();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, closeLightbox, prev, next, zoomIn, zoomOut, resetZoom]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    movedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      movedRef.current = true;
    }
    setOffset({
      x: dragStartRef.current.ox + dx,
      y: dragStartRef.current.oy + dy,
    });
  }

  function handlePointerUp() {
    setDragging(false);
    dragStartRef.current = null;
  }

  function handleStageImageClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2.25);
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={openLightbox}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox();
          }
        }}
        aria-label={isAr ? `تكبير صورة ${name}` : `Zoom image for ${name}`}
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {current && (
          <Image
            src={current}
            alt={`${name} (${activeIndex + 1})`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        <span className="pointer-events-none absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-opacity group-hover:bg-background">
          <ZoomIn className="h-3.5 w-3.5 text-amber-500" />
          <span>{isAr ? "اضغط للتكبير" : "Click to zoom"}</span>
        </span>

        {total > 1 && (
          <>
            <span className="pointer-events-none absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur">
              <Images className="h-3.5 w-3.5 text-amber-500" />
              {activeIndex + 1} / {total}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label={isAr ? "الصورة السابقة" : "Previous image"}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label={isAr ? "الصورة التالية" : "Next image"}
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
                onClick={() => {
                  setActiveIndex(idx);
                  resetZoom();
                }}
                aria-label={isAr ? `عرض الصورة ${idx + 1}` : `View image ${idx + 1}`}
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

      {lightboxOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? `معرض صور ${name}` : `${name} gallery`}
            dir={isAr ? "rtl" : "ltr"}
            onClick={closeLightbox}
            className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white backdrop-blur-md select-none"
          >
            {/* Top controls bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                {total > 1 && (
                  <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                    {activeIndex + 1} / {total}
                  </span>
                )}
                <p className="truncate text-sm font-medium text-white/90">{name}</p>
              </div>

              <div dir="ltr" className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label={isAr ? "تصغير" : "Zoom out"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/15 disabled:opacity-40"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold tabular-nums text-white/80">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label={isAr ? "تكبير" : "Zoom in"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/15 disabled:opacity-40"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
                  aria-label={isAr ? "إعادة الضبط" : "Reset zoom"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/15 disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label={isAr ? "إغلاق المعرض" : "Close lightbox"}
                  className="ms-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center stage */}
            <div
              onWheel={handleWheel}
              className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
            >
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    aria-label={isAr ? "الصورة السابقة" : "Previous image"}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-black/90 sm:left-6"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    aria-label={isAr ? "الصورة التالية" : "Next image"}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-black/90 sm:right-6"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div
                onClick={handleStageImageClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={cn(
                  "relative flex max-h-full max-w-full items-center justify-center touch-none",
                  zoom > 1
                    ? dragging
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-zoom-in",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current}
                  alt={`${name} (${activeIndex + 1})`}
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: dragging ? "none" : "transform 160ms ease-out",
                  }}
                  className="max-h-[75vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
              </div>

              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white/75 backdrop-blur">
                {zoom > 1
                  ? isAr
                    ? "اسحب لتحريك الصورة • اضغط للرجوع"
                    : "Drag to pan • Click to reset"
                  : isAr
                    ? "اضغط على الصورة أو حرّك العجلة للتكبير"
                    : "Click image or scroll to zoom"}
              </div>
            </div>

            {/* Bottom thumbnails */}
            {total > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-3"
              >
                {safeImages.map((src, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={`lb-${src}-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveIndex(idx);
                        resetZoom();
                      }}
                      aria-label={isAr ? `اختيار الصورة ${idx + 1}` : `Select image ${idx + 1}`}
                      className={cn(
                        "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                        active
                          ? "border-amber-500 ring-2 ring-amber-500/40"
                          : "border-white/20 opacity-60 hover:opacity-100",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
