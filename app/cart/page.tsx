import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontHeader } from "@/components/storefront-header";
import { CartView } from "@/features/cart/components/cart-view";

export const metadata: Metadata = {
  title: "سلة التسوق — elloll",
  description: "راجع المنتجات في سلة التسوق قبل إتمام الطلب في متجر elloll.",
};

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
