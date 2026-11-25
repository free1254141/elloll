"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Headset,
  Mail,
  Package,
  Search,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import type {
  AdminSupportTicketSummary,
  SupportMessage,
  SupportStatus,
} from "@/features/support/lib/support";

const STATUS_OPTIONS: SupportStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export function SupportManager({
  initialTickets,
}: {
  initialTickets: AdminSupportTicketSummary[];
}) {
  const { t, locale } = useLanguage();
  const [tickets, setTickets] =
    useState<AdminSupportTicketSummary[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTickets[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusLabels: Record<SupportStatus, string> = {
    open: t("statusOpen"),
    in_progress: t("statusInProgress"),
    resolved: t("statusResolved"),
    closed: t("statusClosed"),
  };

  const statusStyles: Record<SupportStatus, string> = {
    open: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    in_progress: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    closed: "border-border bg-muted text-muted-foreground",
  };

  const refreshTickets = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("support_tickets")
      .select(
        "id, ticket_number, customer_name, customer_email, order_number, subject, status, unread_by_admin, unread_by_customer, last_message_at, created_at",
      )
      .order("last_message_at", { ascending: false });
    if (data) {
      setTickets(data as AdminSupportTicketSummary[]);
    }
  }, []);

  const loadMessages = useCallback(async (ticketId: string) => {
    setLoadingMsgs(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("support_messages")
      .select("id, sender_role, sender_name, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as SupportMessage[]);
    }
    setLoadingMsgs(false);

    // Mark as read by admin
    await supabase
      .from("support_tickets")
      .update({ unread_by_admin: false })
      .eq("id", ticketId)
      .eq("unread_by_admin", true);

    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === ticketId ? { ...tk, unread_by_admin: false } : tk,
      ),
    );
  }, []);

  useEffect(() => {
    if (selectedId) {
      void loadMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Live Realtime updates on tickets & messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-support-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          void refreshTickets();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        (payload) => {
          void refreshTickets();
          const newTicketId = (payload.new as { ticket_id?: string })?.ticket_id;
          if (newTicketId && newTicketId === selectedId) {
            void loadMessages(newTicketId);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId, refreshTickets, loadMessages]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (statusFilter !== "all" && tk.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tk.customer_name.toLowerCase().includes(q) ||
        tk.customer_email.toLowerCase().includes(q) ||
        tk.ticket_number.toLowerCase().includes(q) ||
        tk.subject.toLowerCase().includes(q) ||
        (tk.order_number?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tickets, statusFilter, search]);

  const selectedTicket = useMemo(
    () => tickets.find((tk) => tk.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const cleanBody = reply.trim();
      const nextStatus: SupportStatus =
        selectedTicket.status === "open" ? "in_progress" : selectedTicket.status;

      const { error: msgErr } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_role: "admin",
        sender_name: "elloll Support",
        body: cleanBody,
      });
      if (msgErr) throw msgErr;

      await supabase
        .from("support_tickets")
        .update({
          status: nextStatus,
          unread_by_customer: true,
          unread_by_admin: false,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      setReply("");
      await Promise.all([loadMessages(selectedTicket.id), refreshTickets()]);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(nextStatus: SupportStatus) {
    if (!selectedTicket) return;
    const supabase = createClient();
    await supabase
      .from("support_tickets")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id);

    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === selectedTicket.id ? { ...tk, status: nextStatus } : tk,
      ),
    );
  }

  const openCount = tickets.filter(
    (tk) => tk.status === "open" || tk.status === "in_progress",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("adminSupportTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adminSupportSubtitle")}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
          <Headset className="h-4 w-4 text-amber-500" />
          <span>{t("openTicketsCount")}:</span>
          <span className="text-amber-500">{openCount}</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchTicketsPlaceholder")}
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("filterAll")} ({tickets.length})
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {statusLabels[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Split view: Tickets list + Conversation panel */}
      <div className="grid min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left/Start column: Ticket list */}
        <div className="flex max-h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-5">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <Headset className="h-8 w-8 opacity-40" />
              <p>{t("noTicketsFound")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto">
              {filteredTickets.map((tk) => {
                const active = tk.id === selectedId;
                return (
                  <button
                    key={tk.id}
                    type="button"
                    onClick={() => setSelectedId(tk.id)}
                    className={`flex w-full flex-col gap-1.5 p-4 text-start transition-colors ${
                      active
                        ? "bg-primary/10"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 font-semibold text-sm">
                        {tk.subject}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {tk.unread_by_admin && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                            {t("unreadBadge")}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[tk.status]}`}
                        >
                          {statusLabels[tk.status]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{tk.customer_name}</span>
                      <span className="font-mono text-[11px]" dir="ltr">
                        {tk.ticket_number}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground/80">
                      <span className="truncate" dir="ltr">
                        {tk.customer_email}
                      </span>
                      <span dir="ltr">
                        {new Date(tk.last_message_at).toLocaleString(
                          locale === "ar" ? "ar-EG" : "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right/End column: Conversation thread */}
        <div className="flex max-h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-7">
          {!selectedTicket ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <Headset className="h-10 w-10 opacity-30" />
              <p>{t("selectTicketPrompt")}</p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-base">
                      {selectedTicket.subject}
                    </h2>
                    <span
                      className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs"
                      dir="ltr"
                    >
                      {selectedTicket.ticket_number}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {selectedTicket.customer_name}
                    </span>
                    <span className="inline-flex items-center gap-1" dir="ltr">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedTicket.customer_email}
                    </span>
                    {selectedTicket.order_number && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-primary"
                        dir="ltr"
                      >
                        <Package className="h-3.5 w-3.5" />
                        {selectedTicket.order_number}
                      </span>
                    )}
                  </div>
                </div>

                <select
                  value={selectedTicket.status}
                  onChange={(e) =>
                    void handleStatusChange(e.target.value as SupportStatus)
                  }
                  className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {statusLabels[st]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMsgs && messages.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {t("loading")}
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_role === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isAdmin ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isAdmin
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-muted/60 text-foreground"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold opacity-80">
                            {isAdmin && <ShieldCheck className="h-3.5 w-3.5" />}
                            <span>
                              {isAdmin
                                ? t("adminSupportLabel")
                                : msg.sender_name}
                            </span>
                            <span>•</span>
                            <span dir="ltr">
                              {new Date(msg.created_at).toLocaleTimeString(
                                locale === "ar" ? "ar-EG" : "en-US",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply form */}
              <form
                onSubmit={handleSendReply}
                className="flex items-center gap-2 border-t border-border bg-background/50 p-3"
              >
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t("adminReplyPlaceholder")}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  {t("sendAdminReply")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
