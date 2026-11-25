"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ImagePlus, Loader2, Sparkles, Star, X } from "lucide-react";
import { getProductImages, type Category, type ProductStatus } from "@/features/catalog/lib/catalog";
import { validateImageFile } from "@/features/admin/lib/products/products";
import {
  createProductAction,
  updateProductAction,
} from "@/features/admin/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AdminProduct } from "@/features/admin/components/products-manager";
import { useLanguage } from "@/lib/i18n";

type FormState = {
  name: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  status: ProductStatus;
  description: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
};

type GalleryEntry =
  | { kind: "existing"; id: string; url: string }
  | { kind: "new"; id: string; file: File; previewUrl: string };

const MAX_IMAGES = 10;

export function ProductFormModal({
  mode,
  product,
  hasOrders = false,
  categories,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  product: AdminProduct | null;
  hasOrders?: boolean;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [form, setForm] = useState<FormState>(() => ({
    name: product?.name ?? "",
    category_id: product?.category_id ?? "",
    price: product ? String(product.price) : "",
    stock_quantity: product ? String(product.stock_quantity) : "",
    status: product?.status ?? "active",
    description: product?.description ?? "",
    seo_title: product?.seo_title ?? "",
    seo_description: product?.seo_description ?? "",
    seo_keywords: product?.seo_keywords ?? "",
  }));

  const initialUrls = product ? getProductImages(product) : [];
  const [gallery, setGallery] = useState<GalleryEntry[]>(() =>
    initialUrls.map((url, idx) => ({
      kind: "existing",
      id: `existing-${idx}-${url}`,
      url,
    })),
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);

  const galleryUrlsKey = gallery
    .map((g) => (g.kind === "existing" ? g.url : `new:${g.id}`))
    .join("|");
  const initialUrlsKey = initialUrls.join("|");

  const isDirty =
    mode === "create" ||
    form.name !== (product?.name ?? "") ||
    form.category_id !== (product?.category_id ?? "") ||
    form.price !== (product ? String(product.price) : "") ||
    form.stock_quantity !== (product ? String(product.stock_quantity) : "") ||
    form.status !== (product?.status ?? "active") ||
    form.description !== (product?.description ?? "") ||
    form.seo_title !== (product?.seo_title ?? "") ||
    form.seo_description !== (product?.seo_description ?? "") ||
    form.seo_keywords !== (product?.seo_keywords ?? "") ||
    galleryUrlsKey !== initialUrlsKey;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(
    () => () => {
      for (const u of objectUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
      objectUrlsRef.current = [];
    },
    [],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddFiles(selectedFiles: FileList | File[] | null) {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const incoming = Array.from(selectedFiles);
    const availableSlots = MAX_IMAGES - gallery.length;
    if (availableSlots <= 0) {
      setFileError(
        isAr
          ? `الحد الأقصى ${MAX_IMAGES} صور للمنتج الواحد.`
          : `Maximum ${MAX_IMAGES} images per product.`,
      );
      return;
    }

    const accepted: GalleryEntry[] = [];
    let firstError: string | null = null;
    for (const f of incoming.slice(0, availableSlots)) {
      const invalid = validateImageFile(f);
      if (invalid) {
        if (!firstError) firstError = invalid;
        continue;
      }
      const previewUrl = URL.createObjectURL(f);
      objectUrlsRef.current.push(previewUrl);
      accepted.push({
        kind: "new",
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl,
      });
    }

    if (incoming.length > availableSlots && !firstError) {
      firstError = isAr
        ? `تم قبول أول ${availableSlots} صور فقط (الحد الأقصى ${MAX_IMAGES}).`
        : `Only the first ${availableSlots} images were added (max ${MAX_IMAGES}).`;
    }

    setFileError(firstError);
    if (accepted.length > 0) {
      setGallery((prev) => [...prev, ...accepted]);
    }
  }

  function handleRemoveImage(id: string) {
    setFileError(null);
    setGallery((prev) => prev.filter((item) => item.id !== id));
  }

  function handleMakeCover(id: string) {
    setGallery((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((item) => item.id !== id)];
    });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      handleAddFiles(e.dataTransfer.files);
    }
  }

  async function handleGenerateAiSeo() {
    if (!form.name.trim()) {
      setFormError("اكتب اسم المنتج أولاً ليقوم الذكاء الاصطناعي بتوليد الوصف والـ SEO.");
      return;
    }
    setGeneratingAi(true);
    setFormError(null);
    setAiSuccess(false);
    try {
      const catName =
        categories.find((c) => c.id === form.category_id)?.name ?? "";
      const res = await fetch("/admin/api/generate-product-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryName: catName,
          price: form.price,
          currentDescription: form.description,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        description?: string;
        seo_title?: string;
        seo_description?: string;
        seo_keywords?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "فشل توليد الوصف والـ SEO");
      }
      setForm((prev) => ({
        ...prev,
        description: data.description || prev.description,
        seo_title: data.seo_title || prev.seo_title,
        seo_description: data.seo_description || prev.seo_description,
        seo_keywords: data.seo_keywords || prev.seo_keywords,
      }));
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3500);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "فشل الاتصال بالذكاء الاصطناعي",
      );
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || inFlightRef.current) return;

    if (!form.name.trim()) {
      setFormError(isAr ? "اسم المنتج مطلوب." : "Product name is required.");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      setFormError(isAr ? "أدخل سعراً صحيحاً." : "Enter a valid price.");
      return;
    }
    if (
      form.stock_quantity === "" ||
      !Number.isInteger(Number(form.stock_quantity)) ||
      Number(form.stock_quantity) < 0
    ) {
      setFormError(isAr ? "أدخل كمية مخزون صحيحة." : "Enter a valid stock quantity.");
      return;
    }
    if (gallery.length === 0) {
      setFileError(
        isAr ? "يجب إضافة صورة واحدة على الأقل للمنتج." : "At least one product image is required.",
      );
      return;
    }

    const formData = new FormData();
    formData.set("name", form.name.trim());
    formData.set("description", form.description.trim());
    formData.set("price", String(Number(form.price)));
    formData.set("stock_quantity", String(Number(form.stock_quantity)));
    formData.set("status", form.status);
    formData.set("category_id", form.category_id);
    formData.set("seo_title", form.seo_title.trim());
    formData.set("seo_description", form.seo_description.trim());
    formData.set("seo_keywords", form.seo_keywords.trim());
    if (mode === "edit" && product) {
      formData.set("id", product.id);
    }

    const keptUrls = gallery
      .filter((g): g is Extract<GalleryEntry, { kind: "existing" }> => g.kind === "existing")
      .map((g) => g.url);
    formData.set("kept_image_urls", JSON.stringify(keptUrls));

    for (const item of gallery) {
      if (item.kind === "new") {
        formData.append("images", item.file);
      }
    }

    inFlightRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const result =
        mode === "create"
          ? await createProductAction(formData)
          : await updateProductAction(formData);
      if (result.ok) {
        onSaved(
          mode === "create"
            ? isAr
              ? `تمت إضافة "${result.product.name}"`
              : `"${result.product.name}" created`
            : isAr
              ? `تم تحديث "${result.product.name}"`
              : `"${result.product.name}" updated`,
        );
        onClose();
      } else {
        setFormError(result.message);
      }
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  const lockedFields = hasOrders;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="product-form-title" className="text-lg font-bold tracking-tight">
            {mode === "create"
              ? isAr
                ? "إضافة منتج جديد"
                : "New product"
              : isAr
                ? `تعديل — ${product?.name}`
                : `Edit — ${product?.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {lockedFields && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {isAr
                    ? "هذا المنتج مرتبط بطلبات سابقة، لذلك لا يمكن تعديل الاسم أو السعر أو القسم حفاظاً على سجل الطلبات (يمكنك تحديث الصور والمخزون والوصف بحرية)."
                    : "This product has been ordered. Name, price, and category are locked to preserve order history (images, stock, and description remain editable)."}
                </p>
              </div>
            )}

            {/* Multi-Image Gallery */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>
                  {isAr ? "صور المنتج (حتى 10 صور)" : "Product images (up to 10)"}
                </Label>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {gallery.length} / {MAX_IMAGES}
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "mt-1.5 space-y-3 rounded-lg border-2 border-dashed p-4 transition-colors",
                  dragging ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                {gallery.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {gallery.map((item, idx) => {
                      const src = item.kind === "existing" ? item.url : item.previewUrl;
                      const isCover = idx === 0;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                            isCover ? "border-amber-500 ring-2 ring-amber-500/30" : "border-border",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                          <img
                            src={src}
                            alt={`Product image ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {isCover && (
                            <span className="absolute start-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                              {isAr ? "رئيسية" : "Cover"}
                            </span>
                          )}
                          <div className="absolute end-1 top-1 flex items-center gap-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleMakeCover(item.id)}
                                title={isAr ? "تعيين كصورة رئيسية" : "Set as cover"}
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 text-amber-500 shadow hover:bg-background"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(item.id)}
                              title={isAr ? "حذف الصورة" : "Remove image"}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive text-destructive-foreground shadow hover:bg-destructive/90"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <label className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                    <ImagePlus className="h-4 w-4 text-amber-500" />
                    {dragging
                      ? isAr
                        ? "أفلت الصور هنا…"
                        : "Drop images here…"
                      : gallery.length > 0
                        ? isAr
                          ? "إضافة صور أخرى (2، 4، 6+)…"
                          : "Add more images (2, 4, 6+)…"
                        : isAr
                          ? "اختر صور المنتج (متعدد)…"
                          : "Choose product images…"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleAddFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                  <span className="text-xs text-muted-foreground">
                    {isAr
                      ? "JPG / PNG / WebP · حتى 5 ميجا للصورة · تُضغط وتُحفظ في Supabase Storage"
                      : "JPG, PNG, WebP · max 5 MB each · saved to Supabase Storage"}
                  </span>
                </label>
              </div>
              {fileError && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                  {fileError}
                </p>
              )}
            </div>

            <Field label={isAr ? "اسم المنتج" : "Name"} htmlFor="product-name">
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="مثال: هودي أوفرسايز قطن مصري أسود"
                disabled={lockedFields}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isAr ? "السعر (ج.م / EGP)" : "Price (EGP)"} htmlFor="product-price">
                <Input
                  id="product-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) => set("price", event.target.value)}
                  placeholder="750"
                  disabled={lockedFields}
                />
              </Field>
              <Field label={isAr ? "الكمية في المخزون" : "Stock quantity"} htmlFor="product-stock">
                <Input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={form.stock_quantity}
                  onChange={(event) => set("stock_quantity", event.target.value)}
                  placeholder="50"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isAr ? "القسم" : "Category"} htmlFor="product-category">
                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(event) => set("category_id", event.target.value)}
                  disabled={lockedFields}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{isAr ? "بدون قسم" : "No category"}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={isAr ? "الحالة في المتجر" : "Status"} htmlFor="product-status">
                <select
                  id="product-status"
                  value={form.status}
                  onChange={(event) => set("status", event.target.value as ProductStatus)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="active">{isAr ? "نشط (ظاهر في المتجر)" : "Active (visible)"}</option>
                  <option value="inactive">{isAr ? "مخفي (غير ظاهر)" : "Inactive (hidden)"}</option>
                </select>
              </Field>
            </div>

            {/* Description + AI Copy & SEO Generator Button */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="product-description">{isAr ? "وصف المنتج" : "Description"}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingAi || submitting}
                  onClick={() => void handleGenerateAiSeo()}
                  className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 hover:text-amber-400"
                >
                  {generatingAi ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generatingAi
                    ? "جاري التوليد بالـ AI..."
                    : "توليد الوصف والـ SEO بالذكاء الاصطناعي"}
                </Button>
              </div>
              <textarea
                id="product-description"
                rows={3}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="اكتب ملاحظة بسيطة أو اضغط زر الذكاء الاصطناعي لتوليد الوصف والـ SEO تلقائياً..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              />
              {aiSuccess && (
                <p className="text-xs font-medium text-emerald-500">
                  ✓ تم توليد الوصف التسويقي وبيانات محركات البحث (SEO) تلقائياً!
                </p>
              )}
            </div>

            {/* Dynamic SEO Metadata Section */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {isAr ? "بيانات محركات البحث (SEO)" : "SEO Metadata (Google & Social)"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isAr ? "اختياري — يُولّد تلقائياً بالـ AI" : "Optional — AI generated"}
                </span>
              </div>

              <Field label={isAr ? "عنوان البحث (SEO Title)" : "SEO Title"} htmlFor="product-seo-title">
                <Input
                  id="product-seo-title"
                  value={form.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  placeholder="يُترك فارغاً لاستخدام العنوان الديناميكي التلقائي"
                />
              </Field>

              <Field label={isAr ? "وصف الميتا (Meta Description)" : "SEO Meta Description"} htmlFor="product-seo-desc">
                <textarea
                  id="product-seo-desc"
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  placeholder="وصف مخصص لنتائج بحث Google..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>

              <Field label={isAr ? "الكلمات المفتاحية (Keywords)" : "SEO Keywords"} htmlFor="product-seo-keywords">
                <Input
                  id="product-seo-keywords"
                  value={form.seo_keywords}
                  onChange={(e) => set("seo_keywords", e.target.value)}
                  placeholder="هودي قطن, ملابس رجالي مصر, elloll, ..."
                />
              </Field>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm font-medium text-destructive"
              >
                {formError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={submitting || !isDirty}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create"
                ? isAr
                  ? "إنشاء المنتج"
                  : "Create product"
                : isAr
                  ? "حفظ التعديلات"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
