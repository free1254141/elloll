import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { CartView } from "@/features/cart/components/cart-view";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/cart",
  title: "سلة التسوق — elloll",
  description: "راجع المنتجات في سلة التسوق قبل إتمام الطلب في متجر elloll.",
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <CartView />
      </main>
      <SiteFooter />
    </div>
  );
}
