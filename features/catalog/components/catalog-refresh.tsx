"use client";

/**
 * Storefront catalog updates are pushed via server-side on-demand cache
 * revalidation (`revalidateCatalogCache`) whenever Admin writes to Supabase,
 * eliminating idle per-visitor Realtime WebSocket quota usage.
 */
export function CatalogRefresh() {
  return null;
}
