"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const navItems: {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}[] = [
  { href: "/admin", labelKey: "adminDashboard", icon: LayoutDashboard },
  { href: "/admin/categories", labelKey: "adminCategories", icon: FolderTree },
  { href: "/admin/products", labelKey: "adminProducts", icon: Package },
  { href: "/admin/orders", labelKey: "adminOrders", icon: ShoppingCart },
  { href: "/admin/shipping", labelKey: "adminShipping", icon: Truck },
  { href: "/admin/customers", labelKey: "adminCustomers", icon: Users },
  { href: "/admin/support", labelKey: "adminSupport", icon: Headset },
  { href: "/admin/ai-bot", labelKey: "adminAiBot", icon: Bot },
];

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  badgeCount,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const base = collapsed
    ? "relative flex w-full items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors"
    : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`${base} ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {badgeCount && badgeCount > 0 ? (
        collapsed ? (
          <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
        ) : (
          <span className="ms-auto rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
            {badgeCount}
          </span>
        )
      ) : null}
    </Link>
  );
}

function SidebarLogout({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } finally {
      setBusy(false);
    }
  };

  if (collapsed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          title={t("logout")}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
        {showConfirm && (
          <ConfirmModal
            title={t("logoutConfirmTitle")}
            message={t("logoutConfirmMsg")}
            confirmLabel={t("logout")}
            confirmIcon={LogOut}
            busy={busy}
            onConfirm={logout}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    );
  }

  return <LogoutButton />;
}

export function AdminNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const { t, locale, dir } = useLanguage();
  const isAr = locale === "ar";

  const fetchUnreadSupport = useCallback(async () => {
    const supabase = createClient();
    const { count } = await supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("unread_by_admin", true);
    setUnreadSupport(count ?? 0);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    void fetchUnreadSupport();
    const supabase = createClient();
    const channelId = `admin-nav-support-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          void fetchUnreadSupport();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchUnreadSupport]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin-sidebar-collapsed", String(next));
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  }

  function handleMouseLeave() {
    setMouseY(null);
  }

  const ExpandIcon = dir === "rtl" ? ChevronLeft : ChevronRight;
  const CollapseIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <>
      {/* Mobile top bar */}
      <header
        dir="ltr"
        className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-background px-4 md:hidden"
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("openMenu")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" aria-label="elloll Admin" className="flex items-center">
          <BrandLogo size="sm" adminBadge priority />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 flex w-72 flex-col border-e border-border bg-background shadow-2xl">
            <div dir="ltr" className="flex h-16 items-center justify-between border-b border-border px-4">
              <BrandLogo size="sm" adminBadge />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t("closeMenu")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={t(item.labelKey)}
                  icon={item.icon}
                  collapsed={false}
                  badgeCount={
                    item.href === "/admin/support" ? unreadSupport : undefined
                  }
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="border-t border-border p-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`group/sidebar fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-border bg-background transition-[width] duration-200 md:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          {collapsed ? (
            <BrandLogo variant="icon" size="sm" priority />
          ) : (
            <BrandLogo size="sm" adminBadge priority />
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              collapsed={collapsed}
              badgeCount={
                item.href === "/admin/support" ? unreadSupport : undefined
              }
            />
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div
            className={`mb-2 flex items-center ${
              collapsed ? "flex-col gap-1" : "justify-between"
            }`}
          >
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <SidebarLogout collapsed={collapsed} />
        </div>

        {/* Hover toggle arrow follows mouse on sidebar edge */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={
            collapsed
              ? isAr
                ? "توسيع القائمة الجانبية"
                : "Expand sidebar"
              : isAr
                ? "طي القائمة الجانبية"
                : "Collapse sidebar"
          }
          className="absolute -end-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-opacity hover:bg-muted hover:text-foreground"
          style={{
            top: mouseY !== null ? `${mouseY}px` : "80px",
            transform: "translateY(-50%)",
            opacity: mouseY !== null ? 1 : 0,
          }}
        >
          {collapsed ? (
            <ExpandIcon className="h-3 w-3" />
          ) : (
            <CollapseIcon className="h-3 w-3" />
          )}
        </button>
      </aside>
    </>
  );
}
