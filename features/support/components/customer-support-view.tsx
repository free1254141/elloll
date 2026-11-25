"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Headset,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import {
  clearSupportSession,
  createSupportTicket,
  fetchSupportTicket,
  loadSavedSupportSession,
  saveSupportSession,
  sendCustomerSupportReply,
  type SupportStatus,
  type SupportTicketDetail,
} from "@/features/support/lib/support";

function StatusBadge({ status }: { status: SupportStatus }) {
  const { t } = useLanguage();
  const styles: Record<SupportStatus, string> = {
    open: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    in_progress: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    closed: "border-border bg-muted text-muted-foreground",
  };
  const labels: Record<SupportStatus, string> = {
    open: t("statusOpen"),
    in_progress: t("statusInProgress"),
    resolved: t("statusResolved"),
    closed: t("statusClosed"),
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function CustomerSupportView() {
  const { t, locale } = useLanguage();
  const [tab, setTab] = useState<"new" | "lookup">("new");
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New ticket fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Lookup fields
  const [lookupTicket, setLookupTicket] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");

  // Reply field
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-load saved session
  useEffect(() => {
    const saved = loadSavedSupportSession();
    if (!saved) return;
    setLookupTicket(saved.ticketNumber);
    setLookupEmail(saved.email);
    const supabase = createClient();
    fetchSupportTicket(supabase, saved.ticketNumber, saved.email)
      .then((res) => {
        if (res) setTicket(res);
      })
      .catch(() => {});
  }, []);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  // Realtime subscription via support_pings so Admin replies show instantly
  useEffect(() => {
    if (!ticket) return;
    const supabase = createClient();
    const activeTicketNum = ticket.ticket_number;
    const activeEmail = ticket.customer_email;

    const refreshTicket = async () => {
      try {
        const fresh = await fetchSupportTicket(
          supabase,
          activeTicketNum,
          activeEmail,
        );
        if (fresh) setTicket(fresh);
      } catch {
        // ignore transient network errors
      }
    };

    const channel = supabase
      .channel(`customer-support-${activeTicketNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_pings",
          filter: `ticket_number=eq.${activeTicketNum}`,
        },
        () => {
          void refreshTicket();
        },
      )
      .subscribe();

    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshTicket();
      }
    }, 6000);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [ticket?.ticket_number, ticket?.customer_email]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const created = await createSupportTicket(supabase, {
        name,
        email,
        subject,
        message,
        orderNumber,
      });
      setTicket(created);
      saveSupportSession(created.ticket_number, created.customer_email);
      void fetch("/api/support/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: created.ticket_number,
          customerName: created.customer_name,
          customerEmail: created.customer_email,
          subject: created.subject,
          message,
          orderNumber: created.order_number,
          isReply: false,
        }),
      }).catch(() => {});
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const found = await fetchSupportTicket(
        supabase,
        lookupTicket,
        lookupEmail,
      );
      if (!found) {
        setError(t("ticketNotFound"));
      } else {
        setTicket(found);
        saveSupportSession(found.ticket_number, found.customer_email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ticketNotFound"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const updated = await sendCustomerSupportReply(
        supabase,
        ticket.ticket_number,
        ticket.customer_email,
        reply,
      );
      void fetch("/api/support/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: updated.ticket_number,
          customerName: updated.customer_name,
          customerEmail: updated.customer_email,
          subject: updated.subject,
          message: reply,
          orderNumber: updated.order_number,
          isReply: true,
        }),
      }).catch(() => {});
      setTicket(updated);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  function handleResetSession() {
    clearSupportSession();
    setTicket(null);
    setError(null);
    setTab("new");
  }

  function copyTicketNumber() {
    if (!ticket) return;
    void navigator.clipboard?.writeText(ticket.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (ticket) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold">
                {ticket.subject}
              </h2>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{t("ticketSavedHint")}</span>
              <button
                type="button"
                onClick={copyTicketNumber}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {ticket.ticket_number}
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              {ticket.order_number && (
                <span className="rounded-md border border-border px-2 py-0.5 font-mono">
                  #{ticket.order_number}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("liveConnected")}
            </span>
            <Button variant="outline" size="sm" onClick={handleResetSession}>
              {t("startNewConversation")}
            </Button>
          </div>
        </div>

        {/* Messages thread */}
        <div className="flex h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {ticket.messages.map((msg) => {
              const isCustomer = msg.sender_role === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isCustomer ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isCustomer
                        ? "bg-primary text-primary-foreground"
                        : "border border-amber-500/30 bg-amber-500/10 text-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold opacity-80">
                      {!isCustomer && <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />}
                      <span>
                        {isCustomer ? t("customerLabel") : t("adminSupportLabel")}
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
            })}
            <div ref={messagesEndRef} />
          </div>

          {ticket.status === "closed" ? (
            <div className="border-t border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
              {t("ticketClosedNotice")}
            </div>
          ) : (
            <form
              onSubmit={handleSendReply}
              className="flex items-center gap-2 border-t border-border bg-background/60 p-3"
            >
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t("replyPlaceholder")}
                disabled={busy}
                className="flex-1"
              />
              <Button type="submit" disabled={busy || !reply.trim()} className="gap-1.5">
                <Send className="h-4 w-4" />
                {t("sendReply")}
              </Button>
            </form>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Mode switcher tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1.5">
        <button
          type="button"
          onClick={() => {
            setTab("new");
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            tab === "new"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t("newTicketTab")}
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("lookup");
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            tab === "lookup"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="h-4 w-4" />
          {t("existingTicketTab")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {tab === "new" ? (
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sup-name">{t("yourName")}</Label>
                <Input
                  id="sup-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-email">{t("yourEmail")}</Label>
                <Input
                  id="sup-email"
                  type="email"
                  dir="ltr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sup-subject">{t("subjectLabel")}</Label>
                <Input
                  id="sup-subject"
                  required
                  placeholder={t("subjectPlaceholder")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-order">{t("orderNumberOptional")}</Label>
                <Input
                  id="sup-order"
                  dir="ltr"
                  placeholder="ORD-..."
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-msg">{t("messageLabel")}</Label>
              <textarea
                id="sup-msg"
                required
                rows={4}
                placeholder={t("messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" disabled={busy} className="w-full gap-2">
              <Headset className="h-4 w-4" />
              {busy ? t("sending") : t("sendSupportBtn")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lookup-ticket">{t("ticketNumberLabel")}</Label>
              <Input
                id="lookup-ticket"
                dir="ltr"
                required
                placeholder={t("ticketNumberPlaceholder")}
                value={lookupTicket}
                onChange={(e) => setLookupTicket(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lookup-email">{t("yourEmail")}</Label>
              <Input
                id="lookup-email"
                type="email"
                dir="ltr"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" disabled={busy} className="w-full gap-2">
              <Ticket className="h-4 w-4" />
              {busy ? t("loading") : t("openTicketBtn")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
