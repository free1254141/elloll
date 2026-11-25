"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, Pencil, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listCategoriesWithCounts,
  type CategoryWithCount,
} from "@/features/admin/lib/categories/categories";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/features/admin/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryFormModal } from "@/features/admin/components/category-form-modal";
import { ConfirmDeleteModal } from "@/features/admin/components/confirm-delete-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

type ToastState = { message: string; tone: "success" | "error" };

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryWithCount[];
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [categories, setCategories] = useState(initialCategories);
  const [searchDraft, setSearchDraft] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithCount | null>(null);
  const [cannotDelete, setCannotDelete] = useState<CategoryWithCount | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  async function refresh() {
    const supabase = createClient();
    setCategories(await listCategoriesWithCounts(supabase));
  }

  async function handleCreate(name: string) {
    if (busy !== null || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy("create");
    try {
      const result = await createCategoryAction(name);
      if (result.ok) {
        setToast({
          message: isAr
            ? `تم إنشاء قسم "${result.category.name}"`
            : `"${result.category.name}" created`,
          tone: "success",
        });
        await refresh();
      } else {
        setToast({ message: result.message, tone: "error" });
      }
    } finally {
      inFlightRef.current = false;
      setBusy(null);
    }
  }

  async function handleRename(name: string) {
    if (!editing || busy !== null || inFlightRef.current || !name.trim()) return;
    const { id } = editing;
    inFlightRef.current = true;
    setBusy(id);
    try {
      const result = await renameCategoryAction(id, name);
      if (result.ok) {
        setToast({
          message: isAr ? `تم تعديل الاسم إلى "${name}"` : `"${name}" renamed`,
          tone: "success",
        });
        await refresh();
      } else {
        setToast({ message: result.message, tone: "error" });
      }
    } finally {
      inFlightRef.current = false;
      setBusy(null);
      setEditing(null);
    }
  }

  async function handleDelete(id: string) {
    if (busy !== null || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(id);
    try {
      const result = await deleteCategoryAction(id);
      if (result.ok) {
        setToast({
          message: isAr
            ? `تم حذف قسم "${deleting?.name}"`
            : `"${deleting?.name}" deleted`,
          tone: "success",
        });
        await refresh();
      } else {
        setToast({ message: result.message, tone: "error" });
      }
    } finally {
      inFlightRef.current = false;
      setBusy(null);
      setDeleting(null);
    }
  }

  function handleDeleteClick(category: CategoryWithCount) {
    if (category.productCount > 0) {
      setCannotDelete(category);
    } else {
      setDeleting(category);
    }
  }

  const filtered = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchDraft]);

  const iconButton =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "الأقسام" : "Categories"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAr
            ? "تنظيم أقسام المتجر والملابس — تظهر التغييرات في المتجر فوراً."
            : "Organise the catalog. Changes appear in the storefront immediately."}
        </p>
      </div>

      {/* Toolbar: search + create button */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={isAr ? "ابحث في الأقسام…" : "Search categories…"}
            aria-label={isAr ? "البحث في الأقسام" : "Search categories"}
            className="ps-8"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="shrink-0">
          <FolderPlus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isAr ? "قسم جديد" : "New category"}
          </span>
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {categories.length === 0
            ? isAr
              ? "لا توجد أقسام بعد — أنشئ أول قسم من الأعلى."
              : "No categories yet — create the first one above."
            : isAr
              ? "لا توجد أقسام مطابقة لعملية البحث."
              : "No categories match this search."}
        </div>
      ) : (
        <ul className="min-h-[400px] max-h-[600px] divide-y divide-border overflow-y-auto rounded-xl border border-border bg-background">
          {filtered.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{category.name}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {isAr
                      ? `${category.productCount} منتج`
                      : `${category.productCount} product${category.productCount === 1 ? "" : "s"}`}
                  </span>
                </div>
                <p
                  dir="ltr"
                  className="mt-0.5 truncate text-start text-xs text-muted-foreground"
                >
                  /{category.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(category)}
                  aria-label={
                    isAr ? `تعديل ${category.name}` : `Edit ${category.name}`
                  }
                  className={iconButton}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(category)}
                  aria-label={
                    isAr ? `حذف ${category.name}` : `Delete ${category.name}`
                  }
                  className={cn(
                    iconButton,
                    "hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreateModal && (
        <CategoryFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSaved={(name) => void handleCreate(name)}
        />
      )}

      {editing && (
        <CategoryFormModal
          mode="edit"
          initialName={editing.name}
          initialSlug={editing.slug}
          onClose={() => setEditing(null)}
          onSaved={(name) => void handleRename(name)}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title={isAr ? "حذف القسم؟" : "Delete category?"}
          message={
            isAr
              ? `هل أنت متأكد من حذف قسم "${deleting.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to delete "${deleting.name}"? This action cannot be undone.`
          }
          busy={busy === deleting.id}
          onConfirm={() => void handleDelete(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {cannotDelete && (
        <ConfirmModal
          title={isAr ? "لا يمكن حذف القسم" : "Cannot delete category"}
          message={
            isAr
              ? `لا يمكن حذف قسم "${cannotDelete.name}" لأنه مرتبط بـ ${cannotDelete.productCount} منتج.`
              : `"${cannotDelete.name}" cannot be deleted because it has ${cannotDelete.productCount} product${cannotDelete.productCount === 1 ? "" : "s"} linked.`
          }
          warning={
            isAr
              ? "انقل المنتجات إلى قسم آخر أو احذفها أولاً ثم أعد المحاولة."
              : "Remove or reassign the products first, then try again."
          }
          confirmLabel={isAr ? "إغلاق" : "Close"}
          hideCancel={true}
          busy={false}
          onConfirm={() => setCannotDelete(null)}
          onCancel={() => setCannotDelete(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
