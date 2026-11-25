import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  CUSTOMER_SORTS,
  listCustomers,
  type CustomerSort,
} from "@/features/admin/lib/customers/customers";
import { CustomersManager } from "@/features/admin/components/customers-manager";

export const metadata: Metadata = {
  title: "العملاء — إدارة elloll",
  description: "قائمة العملاء وإجمالي الطلبات والإنفاق الفعلي.",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const activeSort = (CUSTOMER_SORTS.includes(sort as CustomerSort)
    ? sort
    : "name") as CustomerSort;

  const supabase = await createClient();
  const customers = await listCustomers(supabase, { sort: activeSort });

  return <CustomersManager initialCustomers={customers} initialSort={activeSort} />;
}
