import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getOrderDetail } from "@/features/admin/lib/orders/orders";
import { AdminOrderDetailView } from "@/features/admin/components/admin-order-detail-view";

export const metadata: Metadata = {
  title: "تفاصيل الطلب — إدارة elloll",
  description: "تفاصيل الطلب وتحديث حالة التوصيل.",
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; customerId?: string }>;
}) {
  const { id } = await params;
  const { from, customerId } = await searchParams;
  const supabase = await createClient();
  const order = await getOrderDetail(supabase, id);

  return (
    <AdminOrderDetailView order={order} from={from} customerId={customerId} />
  );
}
