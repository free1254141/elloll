import { StorefrontDrawer } from "@/components/storefront-drawer";
import { CatalogRefresh } from "@/features/catalog/components/catalog-refresh";
import { CartBadge } from "@/features/cart/components/cart-badge";
import { StorefrontNav } from "@/components/storefront-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";

export function StorefrontHeader() {
  return (
    <header
      dir="ltr"
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur"
    >
      <CatalogRefresh />
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4 sm:gap-3 sm:px-5">
        <div className="md:hidden">
          <StorefrontDrawer />
        </div>

        <StorefrontNav />

        <div className="ml-auto flex items-center gap-1.5">
          <ModeSwitcher />
          <LanguageSwitcher />
          <ThemeSwitcher />
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
