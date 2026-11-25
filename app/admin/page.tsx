import type { Metadata } from "next";
import { getAdminKpis, getAdminChartData } from "@/features/admin/lib/admin";
import { AdminDashboardView } from "@/features/admin/components/admin-dashboard-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "لوحة التحكم — إدارة elloll",
  description: "نظرة شاملة ومباشرة على أداء متجر elloll والطلبات والمبيعات.",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [kpis, chartData] = await Promise.all([
    getAdminKpis(supabase),
    getAdminChartData(supabase),
  ]);

  return <AdminDashboardView kpis={kpis} chartData={chartData} />;
}
