"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { useCustomerAuth } from "@/features/auth/components/customer-auth-provider";
import { useLanguage } from "@/lib/i18n";

export function AccountButton() {
  const { user, loading, openAuthModal, signOut } = useCustomerAuth();
  const { locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  if (loading || !user) {
    return null;
  }

  return (
    <div ref={wrapRef} className="relative" dir={dir}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        title={user.email}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-500">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[90px] truncate sm:inline">
          {user.name}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute end-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-background p-2 shadow-xl">
          <div className="border-b border-border px-2.5 pb-2 pt-1">
            <p className="flex items-center gap-1.5 truncate text-xs font-bold">
              <User className="h-3.5 w-3.5 text-amber-500" />
              {user.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isAr ? "تسجيل الخروج" : "Sign out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
