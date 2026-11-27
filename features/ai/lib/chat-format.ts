import type { Product } from "@/features/catalog/lib/catalog";

export interface ChatTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface OutfitComboItem {
  product: Product;
  roleLabel?: string;
}

export interface OutfitCombo {
  title: string;
  items: OutfitComboItem[];
  totalEgp: number;
  budgetEgp?: number;
  remainingEgp?: number;
  withinBudget?: boolean;
}

export interface ComparisonPayload {
  title: string;
  products: Array<Product & { categoryName?: string }>;
}

export interface ProductCardPayload {
  product: Product;
  categoryName?: string;
  categorySlug?: string;
  highlightBadge?: string;
}

export interface ChatVisuals {
  tables?: ChatTable[];
  outfits?: OutfitCombo[];
  comparison?: ComparisonPayload;
  productCards?: ProductCardPayload[];
}

export type MarkdownBlock =
  | { type: "text"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function parsePipeRow(line: string): string[] {
  const trimmed = line.trim();
  const stripped = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return stripped.split("|").map((c) => c.trim());
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|") || !trimmed.includes("-")) return false;
  const cells = parsePipeRow(trimmed);
  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

/**
 * Splits markdown content into alternating prose text blocks and structured
 * GFM pipe table blocks so tables render via ExportableTable cleanly.
 */
export function splitMarkdownBlocks(markdown: string): MarkdownBlock[] {
  if (!markdown || typeof markdown !== "string") return [];
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    const joined = textBuffer.join("\n");
    if (joined.trim()) {
      blocks.push({ type: "text", content: joined });
    }
    textBuffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const cur = lines[i]?.trim() ?? "";
    const next = lines[i + 1]?.trim() ?? "";

    if (cur.includes("|") && isSeparatorRow(next)) {
      const headers = parsePipeRow(cur);
      const sepCells = parsePipeRow(next);
      if (headers.length >= 2 && sepCells.length >= 2) {
        const rows: string[][] = [];
        let j = i + 2;
        while (j < lines.length) {
          const rowLine = lines[j]?.trim() ?? "";
          if (!rowLine || !rowLine.includes("|") || isSeparatorRow(rowLine)) {
            break;
          }
          const cells = parsePipeRow(rowLine);
          if (cells.length >= 2) {
            const normalized = headers.map((_, idx) => cells[idx] ?? "");
            rows.push(normalized);
          } else {
            break;
          }
          j++;
        }

        if (rows.length > 0) {
          flushText();
          blocks.push({ type: "table", headers, rows });
          i = j;
          continue;
        }
      }
    }

    textBuffer.push(lines[i]);
    i++;
  }

  flushText();
  return blocks;
}

/**
 * Exports a table to a UTF-8 BOM CSV file compatible with Microsoft Excel Arabic rendering,
 * neutralizing formula-like cells to prevent CSV injection.
 */
export function exportTableToExcel(
  headers: string[],
  rows: string[][],
  filename = "elloll_AI_Table",
): void {
  if (!headers.length || !rows.length || typeof document === "undefined") return;

  const BOM = "\uFEFF";
  const escapeCell = (value: string) => {
    const text = String(value ?? "").replace(/\*\*/g, "");
    const trimmed = text.trimStart();
    const formulaLike =
      /^[=@+]/.test(trimmed) || (/^-/.test(trimmed) && !/^-\d/.test(trimmed));
    const safeText = formulaLike ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((_, idx) => escapeCell(row[idx] ?? "")).join(",")),
  ];

  const blob = new Blob([BOM + lines.join("\n") + "\n"], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export const TOOL_LABELS: Record<string, { ar: string; en: string; icon: string }> = {
  search_products: { ar: "بحث المنتجات", en: "Product Search", icon: "🔍" },
  get_featured_products: { ar: "المميز بالمتجر", en: "Featured", icon: "✨" },
  list_categories: { ar: "أقسام المتجر", en: "Categories", icon: "📂" },
  get_product_details: { ar: "تفاصيل المنتج", en: "Product Details", icon: "🏷️" },
  show_product_cards: { ar: "كارت المنتج", en: "Product Card", icon: "🛍️" },
  build_outfit_bundle: { ar: "تجهيز الطقم", en: "Outfit Builder", icon: "👔" },
  compare_products: { ar: "مقارنة المنتجات", en: "Compare", icon: "⚖️" },
  get_shipping_rates: { ar: "أسعار الشحن", en: "Shipping Rates", icon: "🚚" },
  get_size_chart: { ar: "جدول المقاسات", en: "Size Chart", icon: "📏" },
  view_cart: { ar: "عرض السلة", en: "View Cart", icon: "🛒" },
  add_to_cart: { ar: "إضافة للسلة", en: "Added to Cart", icon: "➕" },
  update_cart_quantity: { ar: "تعديل الكمية", en: "Update Qty", icon: "🔄" },
  remove_from_cart: { ar: "حذف من السلة", en: "Remove Item", icon: "🗑️" },
  clear_cart: { ar: "تفريغ السلة", en: "Clear Cart", icon: "🧹" },
  place_order: { ar: "تأكيد الطلب", en: "Place Order", icon: "✅" },
  track_order: { ar: "تتبع الطلب", en: "Track Order", icon: "📦" },
  update_customer_order: { ar: "تعديل الطلب", en: "Update Order", icon: "✏️" },
  cancel_customer_order: { ar: "إلغاء الطلب", en: "Cancel Order", icon: "❌" },
  create_support_ticket: { ar: "تذكرة دعم", en: "Support Ticket", icon: "🎫" },
  check_support_ticket: { ar: "حالة التذكرة", en: "Ticket Status", icon: "🎫" },
  reply_support_ticket: { ar: "رد على الدعم", en: "Support Reply", icon: "💬" },
  switch_theme: { ar: "تغيير المظهر", en: "Theme", icon: "🌗" },
  switch_language: { ar: "تغيير اللغة", en: "Language", icon: "🌐" },
  navigate_store: { ar: "الانتقال بالمتجر", en: "Navigate", icon: "🧭" },
  open_auth_dialog: { ar: "تسجيل الدخول", en: "Sign In", icon: "🔐" },
};
