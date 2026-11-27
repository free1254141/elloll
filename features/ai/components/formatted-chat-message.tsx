"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Scale,
  ShoppingCart,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportTableToExcel,
  splitMarkdownBlocks,
  TOOL_LABELS,
  type ChatVisuals,
  type ComparisonPayload,
  type OutfitCombo,
} from "@/features/ai/lib/chat-format";
import type { Product } from "@/features/catalog/lib/catalog";

const priceFmt = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

function renderTableCell(cellText: string) {
  const raw = String(cellText ?? "").trim();
  if (!raw || raw === "-" || raw === "—") {
    return <span className="font-mono text-muted-foreground">—</span>;
  }

  const clean = raw.replace(/\*\*/g, "").trim();

  if (
    /داخل الميزانية|أفضل سعر|مجاني|متوفر|Within budget|Best Price|Free|✅/i.test(clean)
  ) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        {clean}
      </span>
    );
  }

  if (/أعلى من الميزانية|Over budget|⚠️|❌/i.test(clean)) {
    return (
      <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
        {clean}
      </span>
    );
  }

  if (
    /^[\d,]+(?:\.\d+)?(?:\s*(?:ج\.م|جنيه|ج|EGP|سم|cm|كجم|kg|%|٪))?$/i.test(clean) ||
    /^EGP\s*[\d,]+(?:\.\d+)?$/i.test(clean)
  ) {
    return (
      <span
        dir="ltr"
        style={{ unicodeBidi: "isolate" }}
        className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-xs"
      >
        {clean}
      </span>
    );
  }

  if (/^(?:XS|S|M|L|XL|2XL|3XL|40|41|42|43|44|45|46)$/i.test(clean)) {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
        {clean.toUpperCase()}
      </span>
    );
  }

  const wasBold = raw.startsWith("**") && raw.endsWith("**");
  return (
    <span
      className={`text-[11px] sm:text-xs text-foreground ${
        wasBold ? "font-bold" : "font-medium"
      }`}
    >
      {clean}
    </span>
  );
}

export function ExportableTable({
  title,
  headers,
  rows,
  locale,
}: {
  title?: string;
  headers: string[];
  rows: string[][];
  locale: "ar" | "en";
}) {
  const [exported, setExported] = useState(false);
  const isAr = locale === "ar";
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  if (safeHeaders.length === 0 || safeRows.length === 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="shrink-0 rounded-md bg-emerald-500/15 p-1 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <span className="truncate text-xs font-bold text-foreground">
            {title || (isAr ? "جدول البيانات والمقارنة" : "Data & Comparison Table")}
          </span>
          <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
            {safeRows.length}{" "}
            {isAr
              ? safeRows.length === 1
                ? "صف"
                : safeRows.length <= 10
                  ? "صفوف"
                  : "صف"
              : safeRows.length === 1
                ? "row"
                : "rows"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            exportTableToExcel(
              safeHeaders,
              safeRows,
              (title || "elloll_table").replace(/\s+/g, "_"),
            );
            setExported(true);
            setTimeout(() => setExported(false), 2000);
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
          title={isAr ? "تصدير الجدول كملف Excel / CSV" : "Export table to Excel / CSV"}
        >
          {exported ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
          <span>
            {exported
              ? isAr
                ? "تم التحميل!"
                : "Downloaded!"
              : isAr
                ? "تصدير لإكسيل"
                : "Export Excel"}
          </span>
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-start text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-foreground">
              {safeHeaders.map((h, idx) => (
                <th
                  key={idx}
                  className="whitespace-nowrap border-e border-border/60 px-3 py-2 text-start text-[11px] font-extrabold text-muted-foreground last:border-e-0 sm:text-xs"
                >
                  {h.replace(/\*\*/g, "").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {safeRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="transition-colors even:bg-muted/20 hover:bg-amber-500/5"
              >
                {safeHeaders.map((_, cIdx) => (
                  <td
                    key={cIdx}
                    className="whitespace-nowrap border-e border-border/40 px-3 py-2 text-[11px] last:border-e-0 sm:text-xs"
                  >
                    {renderTableCell(row[cIdx] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutfitComboCard({
  combo,
  locale,
  onAddBundle,
  onCloseDrawer,
}: {
  combo: OutfitCombo;
  locale: "ar" | "en";
  onAddBundle?: (products: Product[]) => void;
  onCloseDrawer?: () => void;
}) {
  const [added, setAdded] = useState(false);
  const isAr = locale === "ar";
  const within = combo.withinBudget !== false;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            <h4 className="text-xs font-extrabold text-foreground sm:text-sm">
              {combo.title}
            </h4>
          </div>
          {typeof combo.budgetEgp === "number" && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                within
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {within ? (
                <>
                  <Check className="h-3 w-3" />
                  {isAr
                    ? `داخل الميزانية${typeof combo.remainingEgp === "number" ? ` • متبقي ${combo.remainingEgp} ج.م` : ""}`
                    : `Within budget${typeof combo.remainingEgp === "number" ? ` • EGP ${combo.remainingEgp} left` : ""}`}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  {isAr ? "يتجاوز الميزانية" : "Over budget"}
                </>
              )}
            </span>
          )}
        </div>

        <div className="divide-y divide-border/60 p-3">
          {combo.items.map(({ product, roleLabel }, idx) => (
            <div key={`${product.id}-${idx}`} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <Link
                href={`/products/${product.id}`}
                onClick={onCloseDrawer}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                {roleLabel && (
                  <span className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {roleLabel}
                  </span>
                )}
                <Link
                  href={`/products/${product.id}`}
                  onClick={onCloseDrawer}
                  className="block truncate text-xs font-semibold text-foreground hover:text-amber-500"
                >
                  {product.name}
                </Link>
              </div>
              <span
                dir="ltr"
                className="shrink-0 font-mono text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                {priceFmt.format(product.price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/25 px-3.5 py-2.5">
        <div>
          <span className="text-[11px] text-muted-foreground">
            {isAr ? "الإجمالي:" : "Total:"}{" "}
          </span>
          <span
            dir="ltr"
            className="font-display text-sm font-extrabold tabular-nums text-amber-500"
          >
            {priceFmt.format(combo.totalEgp)}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            onAddBundle?.(combo.items.map((i) => i.product));
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
          className={`h-8 gap-1.5 px-3 text-xs ${
            added ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""
          }`}
        >
          {added ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>{isAr ? "تمت إضافة الطقم" : "Outfit Added"}</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{isAr ? "أضف الطقم كامل للسلة" : "Add Full Outfit"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ComparisonVisualCard({
  comparison,
  locale,
  onAddProduct,
  onCloseDrawer,
}: {
  comparison: ComparisonPayload;
  locale: "ar" | "en";
  onAddProduct?: (p: Product) => void;
  onCloseDrawer?: () => void;
}) {
  const isAr = locale === "ar";
  const [addedId, setAddedId] = useState<string | null>(null);
  if (!comparison.products || comparison.products.length === 0) return null;
  const minPrice = Math.min(...comparison.products.map((p) => Number(p.price)));

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3.5 py-2.5">
        <Scale className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-extrabold text-foreground">
          {comparison.title || (isAr ? "مقارنة المنتجات" : "Product Comparison")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {comparison.products.map((p) => {
          const isBest = Number(p.price) === minPrice && comparison.products.length > 1;
          const added = addedId === p.id;
          return (
            <div
              key={p.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-background p-3 ${
                isBest ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-border"
              }`}
            >
              <div className="relative mb-2.5 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                {isBest && (
                  <span className="absolute start-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    {isAr ? "أفضل سعر" : "Best Price"}
                  </span>
                )}
              </div>
              {p.categoryName && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {p.categoryName}
                </span>
              )}
              <h5 className="mt-0.5 line-clamp-2 text-xs font-bold text-foreground">
                {p.name}
              </h5>
              <p
                dir="ltr"
                className="mt-1 font-display text-sm font-extrabold tabular-nums text-amber-500"
              >
                {priceFmt.format(p.price)}
              </p>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              )}
              <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
                <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                  <Link href={`/products/${p.id}`} onClick={onCloseDrawer}>
                    <Eye className="h-3 w-3" />
                    {isAr ? "التفاصيل" : "View"}
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onAddProduct?.(p);
                    setAddedId(p.id);
                    setTimeout(() => setAddedId(null), 1500);
                  }}
                  className={`h-7 gap-1 px-2 text-[11px] ${
                    added ? "bg-emerald-600 text-white" : ""
                  }`}
                >
                  {added ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
                  {added ? (isAr ? "تمت" : "Added") : isAr ? "أضف" : "Add"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseInlineSpans(text: string, onCloseDrawer?: () => void): React.ReactNode[] {
  const tokenRegex =
    /(\[[^\]]+\]\((?:https?:\/\/|\/[a-zA-Z0-9_\-/?&=#%]+)[^\s)]*\)|`[^`]+`|\*\*[^*]+\*\*|https?:\/\/[^\s<>]+|\b(?:ORD|SUP)-[A-Z0-9-]+\b|\d[\d,]*(?:\.\d+)?\s*(?:ج\.م|جنيه|ج|EGP)\b|\bEGP\s*\d[\d,]*(?:\.\d+)?)/gi;

  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;

    const mdLink = part.match(
      /^\[([^\]]+)\]\(((?:https?:\/\/|\/[a-zA-Z0-9_\-/?&=#%]+)[^\s)]*)\)$/,
    );
    if (mdLink) {
      const [, label, href] = mdLink;
      if (href.startsWith("/")) {
        return (
          <Link
            key={idx}
            href={href}
            onClick={onCloseDrawer}
            className="font-semibold text-amber-500 underline underline-offset-2 hover:text-amber-400"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-amber-500 underline underline-offset-2 hover:text-amber-400"
        >
          {label}
        </a>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={idx}
          dir="ltr"
          className="mx-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={idx} className="font-extrabold text-foreground">
          {parseInlineSpans(part.slice(2, -2), onCloseDrawer)}
        </strong>
      );
    }

    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="break-all font-medium text-amber-500 underline underline-offset-2"
        >
          {part}
        </a>
      );
    }

    if (/^(?:ORD|SUP)-[A-Z0-9-]+$/i.test(part)) {
      return (
        <span
          key={idx}
          dir="ltr"
          style={{ unicodeBidi: "isolate" }}
          className="mx-0.5 inline-block rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400"
        >
          {part}
        </span>
      );
    }

    if (
      /^\d[\d,]*(?:\.\d+)?\s*(?:ج\.م|جنيه|ج|EGP)$/i.test(part) ||
      /^EGP\s*\d[\d,]*(?:\.\d+)?$/i.test(part)
    ) {
      return (
        <span
          key={idx}
          dir="ltr"
          style={{ unicodeBidi: "isolate" }}
          className="mx-0.5 inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-xs"
        >
          {part}
        </span>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedText(content: string, onCloseDrawer?: () => void) {
  const lines = content.split(/\r?\n/);

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={idx} className="my-2.5 border-border/60" />;
    }

    if (trimmed.startsWith("#### ")) {
      return (
        <h4
          key={idx}
          className="my-1.5 text-xs font-extrabold text-amber-500 sm:text-sm"
        >
          {parseInlineSpans(trimmed.slice(5), onCloseDrawer)}
        </h4>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={idx}
          className="my-2 flex items-center gap-1.5 border-b border-border/60 pb-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-sm"
        >
          {parseInlineSpans(trimmed.slice(4), onCloseDrawer)}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={idx} className="my-2 text-sm font-extrabold text-foreground sm:text-base">
          {parseInlineSpans(trimmed.slice(3), onCloseDrawer)}
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1
          key={idx}
          className="my-2.5 border-b border-border pb-1 text-base font-extrabold text-foreground sm:text-lg"
        >
          {parseInlineSpans(trimmed.slice(2), onCloseDrawer)}
        </h1>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote
          key={idx}
          className="my-2 rounded-lg border-s-4 border-amber-500 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground sm:text-sm"
        >
          {parseInlineSpans(trimmed.slice(2), onCloseDrawer)}
        </blockquote>
      );
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={idx} className="my-1 flex items-start gap-2 text-xs leading-relaxed sm:text-sm">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
            {numMatch[1]}
          </span>
          <div className="min-w-0 flex-1">{parseInlineSpans(numMatch[2], onCloseDrawer)}</div>
        </div>
      );
    }

    const bulletMatch = trimmed.match(/^(?:[-*•])\s*(.*)$/);
    if (bulletMatch && (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("•"))) {
      return (
        <div key={idx} className="my-1 flex items-start gap-2 text-xs leading-relaxed sm:text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0 flex-1">{parseInlineSpans(bulletMatch[1], onCloseDrawer)}</div>
        </div>
      );
    }

    return (
      <p key={idx} className="my-1 text-xs leading-relaxed text-foreground sm:text-sm">
        {parseInlineSpans(trimmed, onCloseDrawer)}
      </p>
    );
  });
}

export function FormattedChatMessage({
  content,
  visuals,
  suggestedButtons,
  showSuggestedButtons = false,
  toolsUsed,
  latencyMs,
  locale,
  dir,
  onQuickReply,
  onAddProduct,
  onAddBundle,
  onCloseDrawer,
}: {
  content: string;
  visuals?: ChatVisuals;
  suggestedButtons?: string[];
  showSuggestedButtons?: boolean;
  toolsUsed?: string[];
  latencyMs?: number;
  locale: "ar" | "en";
  dir: "rtl" | "ltr";
  onQuickReply?: (text: string) => void;
  onAddProduct?: (product: Product) => void;
  onAddBundle?: (products: Product[]) => void;
  onCloseDrawer?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isAr = locale === "ar";
  const blocks = splitMarkdownBlocks(content);
  const structuredTables = visuals?.tables ?? [];
  const outfits = visuals?.outfits ?? [];
  const comparison = visuals?.comparison;

  function handleCopyAll() {
    const tableTxt = structuredTables
      .map((t) =>
        [t.title, t.headers.join("\t"), ...t.rows.map((r) => r.join("\t"))].join("\n"),
      )
      .join("\n\n");
    const cleanBody = content.replace(/\*\*/g, "");
    const payload = [cleanBody, tableTxt].filter(Boolean).join("\n\n");
    void navigator.clipboard?.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div dir={dir} className="w-full min-w-0 space-y-2.5 text-start">
      {/* Interactive Outfit / Combo Cards */}
      {outfits.length > 0 && (
        <div
          className={`grid gap-3 ${
            outfits.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          {outfits.map((combo, idx) => (
            <OutfitComboCard
              key={`${combo.title}-${idx}`}
              combo={combo}
              locale={locale}
              onAddBundle={onAddBundle}
              onCloseDrawer={onCloseDrawer}
            />
          ))}
        </div>
      )}

      {/* Side-by-side Product Comparison Card */}
      {comparison && comparison.products.length > 0 && (
        <ComparisonVisualCard
          comparison={comparison}
          locale={locale}
          onAddProduct={onAddProduct}
          onCloseDrawer={onCloseDrawer}
        />
      )}

      {/* Tool-provided Structured Exportable Tables */}
      {structuredTables.map((t, idx) => (
        <ExportableTable
          key={`${t.id}-${idx}`}
          title={t.title}
          headers={t.headers}
          rows={t.rows}
          locale={locale}
        />
      ))}

      {/* Markdown Text + Inline Pipe Tables */}
      <div className="space-y-1">
        {blocks.map((block, idx) =>
          block.type === "table" ? (
            <ExportableTable
              key={`md-tbl-${idx}`}
              headers={block.headers}
              rows={block.rows}
              locale={locale}
            />
          ) : (
            <div key={`md-txt-${idx}`}>{renderFormattedText(block.content, onCloseDrawer)}</div>
          ),
        )}
      </div>

      {/* Footer Action Bar: Copy + Latency + Tools Used + Quick-Reply Chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-muted active:scale-95"
          title={isAr ? "نسخ الرد والجداول" : "Copy reply & tables"}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span>{copied ? (isAr ? "تم النسخ" : "Copied!") : isAr ? "نسخ" : "Copy"}</span>
        </button>

        {typeof latencyMs === "number" && latencyMs > 0 && (
          <span
            dir="ltr"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
          >
            <Zap className="h-3 w-3" />
            {(latencyMs / 1000).toFixed(1)}s
          </span>
        )}

        {toolsUsed &&
          toolsUsed.map((tool) => {
            const meta = TOOL_LABELS[tool];
            return (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
              >
                <span>{meta?.icon ?? "⚡"}</span>
                <span>{meta ? (isAr ? meta.ar : meta.en) : tool}</span>
              </span>
            );
          })}
      </div>

      {showSuggestedButtons &&
        onQuickReply &&
        suggestedButtons &&
        suggestedButtons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestedButtons.map((btn, idx) => (
              <button
                key={`${btn}-${idx}`}
                type="button"
                onClick={() => onQuickReply(btn)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-500/20 active:scale-95 dark:text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{btn}</span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
