import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SupportManager } from "@/features/admin/components/support-manager";
import type { AdminSupportTicketSummary } from "@/features/support/lib/support";

export const metadata: Metadata = {
  title: "دعم العملاء — إدارة elloll",
};

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, ticket_number, customer_name, customer_email, order_number, subject, status, unread_by_admin, unread_by_customer, last_message_at, created_at",
    )
    .order("last_message_at", { ascending: false });

  const initialTickets = (data as AdminSupportTicketSummary[] | null) ?? [];

  return <SupportManager initialTickets={initialTickets} />;
}
