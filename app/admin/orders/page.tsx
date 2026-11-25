import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  listOrders,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/features/admin/lib/orders/orders";
import { OrdersManager } from "@/features/admin/components/orders-manager";

export const metadata: Metadata = {
  title: "الطلبات — إدارة elloll",
  description: "متابعة طلبات العملاء وتحديث حالاتها وتصديرها إلى CSV.",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = ORDER_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const supabase = await createClient();
  const orders = await listOrders(supabase);

  return <OrdersManager initialOrders={orders} initialStatus={activeStatus} />;
}
