import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listCategoriesWithCounts } from "@/features/admin/lib/categories/categories";
import { CategoriesManager } from "@/features/admin/components/categories-manager";

export const metadata: Metadata = {
  title: "الأقسام — إدارة elloll",
  description: "إدارة أقسام المتجر: إنشاء وتعديل وحذف الأقسام.",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const categories = await listCategoriesWithCounts(supabase);

  return <CategoriesManager initialCategories={categories} />;
}
