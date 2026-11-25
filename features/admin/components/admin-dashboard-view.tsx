"use client";

import {
  Banknote,
  CheckCircle2,
  Clock3,
  Download,
  Package,
  ShoppingCart,
  Smartphone,
  Users,
} from "lucide-react";
import { KpiCard } from "@/features/admin/components/kpi-card";
import { AdminCharts } from "@/features/admin/components/admin-charts";
import type { AdminKpis, ChartDataPoint } from "@/features/admin/lib/admin";
import { useLanguage } from "@/lib/i18n";

export function AdminDashboardView({
  kpis,
  chartData,
}: {
  kpis: AdminKpis;
  chartData: ChartDataPoint[];
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const currency = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  });

  const cards = [
    {
      label: isAr ? "إجمالي المنتجات" : "Total Products",
      value: kpis.totalProducts.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Package,
    },
    {
      label: isAr ? "إجمالي الطلبات" : "Total Orders",
      value: kpis.totalOrders.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: ShoppingCart,
    },
    {
      label: isAr ? "طلبات قيد الانتظار" : "Pending Orders",
      value: kpis.pendingOrders.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Clock3,
    },
    {
      label: isAr ? "طلبات مكتملة" : "Completed Orders",
      value: kpis.completedOrders.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: CheckCircle2,
    },
    {
      label: isAr ? "إجمالي العملاء" : "Total Customers",
      value: kpis.totalCustomers.toLocaleString(isAr ? "ar-EG" : "en-US"),
      icon: Users,
    },
    {
      label: isAr ? "إجمالي المبيعات" : "Total Sales",
      value: currency.format(kpis.totalSales),
      icon: Banknote,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr
              ? "نظرة شاملة ومباشرة على أداء المتجر، يتم تحديثها لحظياً مع كل طلب جديد."
              : "Overview of the store, updated live as customers place orders."}
          </p>
        </div>

        <a
          href="/elloll.apk"
          download="elloll.apk"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-500 shadow-sm transition-colors hover:bg-amber-500/20"
        >
          <Smartphone className="h-4 w-4" />
          <span>
            {isAr
              ? "تحميل تطبيق المتجر للأندرويد (elloll.apk)"
              : "Download Store Android App (elloll.apk)"}
          </span>
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <AdminCharts data={chartData} />
    </div>
  );
}
