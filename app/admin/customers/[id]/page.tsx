import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetail } from "@/features/admin/lib/customers/customers";
import { AdminCustomerDetailView } from "@/features/admin/components/admin-customer-detail-view";

export const metadata: Metadata = {
  title: "تفاصيل العميل — إدارة elloll",
  description: "بيانات العميل وسجل طلباته.",
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const customer = await getCustomerDetail(supabase, id);

  return <AdminCustomerDetailView customer={customer} />;
}
