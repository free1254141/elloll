"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  type CategoryMutationResult,
  type DeleteCategoryResult,
} from "@/features/admin/lib/categories/categories";
import { revalidateCatalogCache } from "@/features/catalog/lib/catalog-cache";

/**
 * Category write actions (ticket 08). The RLS admin policies on `categories`
 * are the security boundary — a non-admin calling these directly gets an RLS
 * error, surfaced here as a friendly failure.
 */

export async function createCategoryAction(
  name: string,
): Promise<CategoryMutationResult> {
  const supabase = await createClient();
  const res = await createCategory(supabase, name);
  if (res.ok) revalidateCatalogCache();
  return res;
}

export async function renameCategoryAction(
  id: string,
  name: string,
): Promise<CategoryMutationResult> {
  const supabase = await createClient();
  const res = await renameCategory(supabase, id, name);
  if (res.ok) revalidateCatalogCache();
  return res;
}

export async function deleteCategoryAction(
  id: string,
): Promise<DeleteCategoryResult> {
  const supabase = await createClient();
  const res = await deleteCategory(supabase, id);
  if (res.ok) revalidateCatalogCache();
  return res;
}
