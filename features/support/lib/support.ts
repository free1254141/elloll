import type { SupabaseClient } from "@supabase/supabase-js";

export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportMessage {
  id: string;
  sender_role: "customer" | "admin";
  sender_name: string;
  body: string;
  created_at: string;
}

export interface SupportTicketDetail {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  order_number: string | null;
  subject: string;
  status: SupportStatus;
  last_message_at: string;
  created_at: string;
  messages: SupportMessage[];
}

export interface AdminSupportTicketSummary {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  order_number: string | null;
  subject: string;
  status: SupportStatus;
  unread_by_admin: boolean;
  unread_by_customer: boolean;
  last_message_at: string;
  created_at: string;
}

const STORAGE_KEY = "elloll-support-session";

export function loadSavedSupportSession(): {
  ticketNumber: string;
  email: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ticketNumber?: string; email?: string };
    if (parsed.ticketNumber && parsed.email) {
      return { ticketNumber: parsed.ticketNumber, email: parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSupportSession(ticketNumber: string, email: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ticketNumber, email }),
    );
  } catch {
    // ignore
  }
}

export function clearSupportSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function createSupportTicket(
  supabase: SupabaseClient,
  input: {
    name: string;
    email: string;
    subject: string;
    message: string;
    orderNumber?: string;
  },
): Promise<SupportTicketDetail> {
  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
    p_order_number: input.orderNumber || null,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create support ticket");
  return data as SupportTicketDetail;
}

export async function fetchSupportTicket(
  supabase: SupabaseClient,
  ticketNumber: string,
  email: string,
): Promise<SupportTicketDetail | null> {
  const { data, error } = await supabase.rpc("get_support_ticket", {
    p_ticket_number: ticketNumber,
    p_email: email,
  });
  if (error) throw new Error(error.message);
  return (data as SupportTicketDetail | null) ?? null;
}

export async function sendCustomerSupportReply(
  supabase: SupabaseClient,
  ticketNumber: string,
  email: string,
  body: string,
): Promise<SupportTicketDetail> {
  const { data, error } = await supabase.rpc("add_customer_support_message", {
    p_ticket_number: ticketNumber,
    p_email: email,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to send reply");
  return data as SupportTicketDetail;
}
