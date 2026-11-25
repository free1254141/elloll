"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createProductWithImages,
  deleteProductWithImage,
  updateProductWithImages,
} from "@/features/admin/lib/products/images";
import {
  updateProductStatus,
  type ProductInput,
  type ProductMutationResult,
} from "@/features/admin/lib/products/products";
import type { ProductStatus } from "@/features/catalog/lib/catalog";
import { revalidateCatalogCache } from "@/features/catalog/lib/catalog-cache";

/**
 * Product write actions (ticket 09). The RLS admin policies on `products`
 * and the storage admin-write policy are the security boundary. Image
 * handling (validation, server-side compression to WebP, upload, and
 * best-effort cleanup of replaced/deleted images — ADR-0008) lives in
 * `features/admin/lib/products/images.ts`; these actions are thin glue.
 */

/**
 * Parses and validates the product form's text fields into a ProductInput.
 * Image rules live separately (`validateImageFile` / the create action's
 * presence check). Rules: name required; price a finite number >= 0; stock an
 * integer >= 0; status `active` or `inactive` (default `active`).
 */
function parseProductForm(
  formData: FormData,
): { input?: ProductInput; error?: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock_quantity") ?? "").trim();
  const price = Number(priceRaw);
  const stock_quantity = Number(stockRaw);
  const status = String(formData.get("status") ?? "active");
  const categoryRaw = String(formData.get("category_id") ?? "");
  const category_id = categoryRaw ? categoryRaw : null;
  const seo_title = String(formData.get("seo_title") ?? "").trim() || null;
  const seo_description =
    String(formData.get("seo_description") ?? "").trim() || null;
  const seo_keywords =
    String(formData.get("seo_keywords") ?? "").trim() || null;

  if (!name) return { error: "Product name is required." };
  // Reject blank fields explicitly — Number("") is 0, which would silently
  // create a $0 / zero-stock product if we only checked the parsed value.
  if (priceRaw === "" || !Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid price." };
  }
  if (
    stockRaw === "" ||
    !Number.isInteger(stock_quantity) ||
    stock_quantity < 0
  ) {
    return { error: "Enter a valid stock quantity." };
  }
  if (status !== "active" && status !== "inactive") {
    return { error: "Invalid status." };
  }

  return {
    input: {
      name,
      description,
      price,
      stock_quantity,
      status,
      category_id,
      image_url: "",
      seo_title,
      seo_description,
      seo_keywords,
    },
  };
}

function collectImageFiles(formData: FormData): File[] {
  const entries = [
    ...formData.getAll("images"),
    ...formData.getAll("image"),
  ];
  return entries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );
}

export async function createProductAction(
  formData: FormData,
): Promise<ProductMutationResult> {
  const supabase = await createClient();
  const { input, error } = parseProductForm(formData);
  if (error || !input) {
    return { ok: false, message: error ?? "Invalid form data." };
  }

  const files = collectImageFiles(formData);
  if (files.length === 0) {
    return { ok: false, message: "An image is required." };
  }

  const res = await createProductWithImages(supabase, input, files);
  if (res.ok) {
    revalidateCatalogCache(res.product.id);
  }
  return res;
}

export async function updateProductAction(
  formData: FormData,
): Promise<ProductMutationResult> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { input, error } = parseProductForm(formData);
  if (error || !input || !id) {
    return { ok: false, message: error ?? "Invalid form data." };
  }

  let keptImageUrls: string[] = [];
  const keptRaw = formData.get("kept_image_urls");
  if (typeof keptRaw === "string" && keptRaw.trim()) {
    try {
      const parsed = JSON.parse(keptRaw);
      if (Array.isArray(parsed)) {
        keptImageUrls = parsed.filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0,
        );
      }
    } catch {
      // ignore malformed JSON, will check existing / new files
    }
  } else {
    // Fallback for callers that didn't send kept_image_urls: retain current primary DB image
    const { data: existing } = await supabase
      .from("products")
      .select("image_url, image_urls")
      .eq("id", id)
      .maybeSingle();
    const row = existing as { image_url?: string; image_urls?: string[] } | null;
    keptImageUrls = Array.from(
      new Set([row?.image_url, ...(row?.image_urls ?? [])].filter((u): u is string => Boolean(u))),
    );
  }

  const newFiles = collectImageFiles(formData);
  const res = await updateProductWithImages(supabase, id, input, {
    keptImageUrls,
    newFiles,
  });
  if (res.ok) {
    revalidateCatalogCache(id);
  }
  return res;
}

export async function deleteProductAction(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const res = await deleteProductWithImage(supabase, id);
  if (res.ok) {
    revalidateCatalogCache(id);
  }
  return res;
}

export async function toggleProductStatusAction(
  id: string,
  status: ProductStatus,
): Promise<ProductMutationResult> {
  const supabase = await createClient();
  const res = await updateProductStatus(supabase, id, status);
  if (res.ok) {
    revalidateCatalogCache(id);
  }
  return res;
}
