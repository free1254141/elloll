import { StorefrontDrawer } from "@/components/storefront-drawer";
import { CatalogRefresh } from "@/features/catalog/components/catalog-refresh";
import { CartBadge } from "@/features/cart/components/cart-badge";
import { StorefrontNav } from "@/components/storefront-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import { AccountButton } from "@/components/account-button";

export function StorefrontHeader() {
  return (
    <header
      dir="ltr"
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur"
    >
      <CatalogRefresh />
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <div className="md:hidden">
            <StorefrontDrawer />
          </div>
          <StorefrontNav />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ModeSwitcher />
          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <AccountButton />
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
