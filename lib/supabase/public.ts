import { createClient } from "@supabase/supabase-js";

/**
 * Stateless anonymous Supabase client for Next.js Data Cache (`unstable_cache`).
 * Never reads request cookies, allowing public catalog pages (`/`, `/products`,
 * `/products/[id]`, `/sitemap.xml`) to be cached across requests on Vercel until
 * Admin mutations trigger on-demand revalidation.
 */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
