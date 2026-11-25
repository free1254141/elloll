"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const drawerLinks: { href: string; key: TranslationKey }[] = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/track", key: "trackOrder" },
];

export function StorefrontDrawer() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  const pathname = usePathname();
  const { t, dir } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      panelRef.current?.focus();
    } else if (hasOpened.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="store-drawer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" dir={dir}>
            <button
              type="button"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
            />
            <div
              ref={panelRef}
              id="store-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Store navigation"
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto border-r border-border bg-background p-4 shadow-xl outline-none"
            >
              <div dir="ltr" className="mb-2 flex items-center justify-between">
                <BrandLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("closeMenu")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {drawerLinks.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {t(link.key)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
