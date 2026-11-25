"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/features/admin/components/admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);

    function onStorage() {
      const val = localStorage.getItem("admin-sidebar-collapsed");
      setCollapsed(val === "true");
    }
    window.addEventListener("storage", onStorage);

    const interval = setInterval(() => {
      const val = localStorage.getItem("admin-sidebar-collapsed");
      setCollapsed(val === "true");
    }, 200);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      <main
        className={`transition-[padding] duration-200 ${
          collapsed ? "md:ps-16" : "md:ps-64"
        }`}
      >
        <div
          className={`mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 ${
            collapsed ? "" : "max-w-6xl"
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
