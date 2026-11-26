"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Eye,
  History,
  Loader2,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  Send,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/features/cart/lib/cart";
import { useCustomerAuth } from "@/features/auth/components/customer-auth-provider";
import { useLanguage } from "@/lib/i18n";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ModeSwitcher, useStorefrontMode } from "@/components/mode-switcher";
import { CartBadge } from "@/features/cart/components/cart-badge";
import { AccountButton } from "@/components/account-button";
import { Button } from "@/components/ui/button";
import type { Product } from "@/features/catalog/lib/catalog";

interface PublicAiConfig {
  enabled: boolean;
  mode: "default" | "chat_only";
  bot_name: string;
  welcome_message: string;
  daily_chat_limit?: number;
}

interface ChatQuota {
  daily_limit: number;
  guest_limit?: number;
  used_today: number;
  remaining: number;
  allowed: boolean;
  is_authenticated?: boolean;
  require_auth?: boolean;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  products?: Product[];
  toolsUsed?: string[];
}

interface ChatHistoryItem {
  id: string;
  session_id: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  preview?: string | null;
}

type ClientAction =
  | { type: "ADD_TO_CART"; product: Product; quantity: number }
  | { type: "UPDATE_CART_QTY"; productId: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "SET_LANGUAGE"; locale: "ar" | "en" }
  | { type: "NAVIGATE"; path: string }
  | { type: "OPEN_AUTH_MODAL"; mode?: "login" | "signup" };

const priceFmt = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

function getOrCreateId(key: string, prefix: string): string {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(key, created);
    return created;
  } catch {
    return `${prefix}-${Date.now()}`;
  }
}

export function StorefrontAiShell() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const { setTheme } = useTheme();
  const { user: authUser, openAuthModal } = useCustomerAuth();
  const isAdminOrAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/auth");

  const [config, setConfig] = useState<PublicAiConfig | null>(null);
  const { mode: userMode } = useStorefrontMode();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [conversations, setConversations] = useState<ChatHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [quota, setQuota] = useState<ChatQuota>({
    daily_limit: 20,
    guest_limit: 5,
    used_today: 0,
    remaining: 5,
    allowed: true,
    is_authenticated: false,
    require_auth: false,
  });
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevPathRef = useRef(pathname);
  const welcomeRef = useRef("");

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      if (userMode === "chat_only" && pathname !== "/") {
        setOpen(true);
        setExpanded(false);
      }
      prevPathRef.current = pathname;
    }
  }, [pathname, userMode]);

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (isAdminOrAuth) return;

    const vid = getOrCreateId("elloll-visitor-id", "vis");
    const sid = getOrCreateId("elloll-ai-session", "sess");
    setVisitorId(vid);
    setSessionId(sid);

    const supabase = createClient();
    if (!sessionStorage.getItem("elloll-site-tracked")) {
      sessionStorage.setItem("elloll-site-tracked", "1");
      void supabase.rpc("track_visitor_event", {
        p_visitor_id: vid,
        p_event_type: "site",
      });
    }

    supabase.rpc("get_public_ai_config").then(({ data }) => {
      if (data) {
        const cfg = data as PublicAiConfig;
        setConfig(cfg);
        welcomeRef.current = cfg.welcome_message ?? "";
        setMessages((prev) =>
          prev.length === 0 && cfg.welcome_message
            ? [
                {
                  id: "welcome",
                  role: "assistant",
                  content: cfg.welcome_message,
                },
              ]
            : prev,
        );
      }
    });
  }, [isAdminOrAuth]);

  const loadHistoryAndMessages = useCallback(
    async (vid: string, sid: string) => {
      if (!vid) return;
      setLoadingHistory(true);
      try {
        const qs = new URLSearchParams({
          visitorId: vid,
          includeHistory: "1",
        });
        if (sid) qs.set("sessionId", sid);
        const r = await fetch(`/api/ai/chat?${qs.toString()}`);
        if (!r.ok) return;
        const d = (await r.json()) as {
          quota?: ChatQuota;
          conversations?: ChatHistoryItem[];
          messages?: Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
            created_at: string;
          }>;
        };
        if (d.quota) setQuota(d.quota);
        if (Array.isArray(d.conversations)) {
          setConversations(d.conversations);
        }
        if (Array.isArray(d.messages) && d.messages.length > 0) {
          const restored: ChatMsg[] = d.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          }));
          setMessages([
            ...(welcomeRef.current
              ? [
                  {
                    id: "welcome",
                    role: "assistant" as const,
                    content: welcomeRef.current,
                  },
                ]
              : []),
            ...restored,
          ]);
        }
      } catch {
        // ignore network hiccups
      } finally {
        setLoadingHistory(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isAdminOrAuth || !visitorId) return;
    void loadHistoryAndMessages(visitorId, sessionId);
  }, [isAdminOrAuth, visitorId, sessionId, authUser?.id, loadHistoryAndMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open, expanded]);

  if (isAdminOrAuth || !config || !config.enabled) {
    return null;
  }

  const isChatOnly = userMode === "chat_only" && pathname === "/";
  const isFullViewport = isChatOnly || expanded;

  const quickPrompts =
    locale === "ar"
      ? [
          "اعرض أحدث المنتجات المتوفرة",
          "عايز حاجة سعرها أقل من 1500 جنيه",
          "وريني الأقسام المتاحة",
          "محتاج أتتبع طلبي",
        ]
      : [
          "Show latest available products",
          "Products under EGP 1500",
          "List store categories",
          "Track my order",
        ];

  function resetTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  }

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    if (!authUser && (quota.require_auth || !quota.allowed)) {
      openAuthModal("login");
      return;
    }

    const nowIso = new Date().toISOString();
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: nowIso,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    resetTextareaHeight();
    setBusy(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          visitorId,
          messages: nextHistory
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
          cartItems: cartItems.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        actions?: ClientAction[];
        products?: Product[];
        toolsUsed?: string[];
        quota?: ChatQuota;
        rateLimited?: boolean;
        requireAuth?: boolean;
        error?: string;
      };

      if (data.quota) {
        setQuota(data.quota);
      }

      let openedAuthModal = false;
      if (data.actions) {
        for (const act of data.actions) {
          if (act.type === "ADD_TO_CART") {
            addItem(act.product, act.quantity);
          } else if (act.type === "UPDATE_CART_QTY") {
            updateQuantity(act.productId, act.quantity);
          } else if (act.type === "REMOVE_FROM_CART") {
            removeItem(act.productId);
          } else if (act.type === "CLEAR_CART") {
            clearCart();
          } else if (act.type === "SET_THEME") {
            setTheme(act.theme);
          } else if (act.type === "SET_LANGUAGE") {
            setLocale(act.locale);
          } else if (act.type === "NAVIGATE" && !isChatOnly) {
            router.push(act.path);
          } else if (act.type === "OPEN_AUTH_MODAL") {
            openedAuthModal = true;
            openAuthModal(act.mode ?? "login");
          }
        }
      }

      if (
        !openedAuthModal &&
        !authUser &&
        (data.requireAuth || data.quota?.require_auth)
      ) {
        setTimeout(() => openAuthModal("login"), 450);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ||
            data.error ||
            "حدث خطأ غير متوقع، حاول مرة أخرى.",
          createdAt: new Date().toISOString(),
          products: data.products,
          toolsUsed: data.toolsUsed,
        },
      ]);

      if (res.ok && visitorId) {
        fetch(
          `/api/ai/chat?visitorId=${encodeURIComponent(visitorId)}&includeHistory=1`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { conversations?: ChatHistoryItem[] } | null) => {
            if (Array.isArray(d?.conversations)) {
              setConversations(d.conversations);
            }
          })
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "تعذر الاتصال بالمساعد الذكي حالياً.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleAddProduct(p: Product) {
    addItem(p, 1);
    setJustAddedId(p.id);
    setTimeout(() => setJustAddedId(null), 1400);
  }

  function startNewChat() {
    const newSess = `sess-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    try {
      localStorage.setItem("elloll-ai-session", newSess);
    } catch {
      // ignore
    }
    setSessionId(newSess);
    setHistoryOpen(false);
    setMessages(
      config?.welcome_message
        ? [{ id: "welcome", role: "assistant", content: config.welcome_message }]
        : [],
    );
  }

  function openConversation(targetSessionId: string) {
    setHistoryOpen(false);
    if (targetSessionId === sessionId) return;
    try {
      localStorage.setItem("elloll-ai-session", targetSessionId);
    } catch {
      // ignore
    }
    setMessages(
      config?.welcome_message
        ? [{ id: "welcome", role: "assistant", content: config.welcome_message }]
        : [],
    );
    setSessionId(targetSessionId);
  }

  async function deleteHistoryItem(targetSessionId: string) {
    if (!visitorId) return;
    try {
      const res = await fetch(
        `/api/ai/chat?visitorId=${encodeURIComponent(visitorId)}&sessionId=${encodeURIComponent(targetSessionId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) return;
      setConversations((prev) =>
        prev.filter((c) => c.session_id !== targetSessionId),
      );
      if (targetSessionId === sessionId) {
        startNewChat();
      }
    } catch {
      // ignore
    }
  }

  const chatBody = (
    <>
      {historyOpen ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold">
                {locale === "ar"
                  ? `سجل محادثاتك (${conversations.length})`
                  : `Chat History (${conversations.length})`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startNewChat}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {locale === "ar" ? "محادثة جديدة" : "New chat"}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setHistoryOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
            {loadingHistory && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                <Loader2 className="me-2 h-4 w-4 animate-spin text-amber-500" />
                {locale === "ar" ? "جاري تحميل السجل..." : "Loading history..."}
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد محادثات سابقة بعد."
                  : "No previous conversations yet."}
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.session_id === sessionId;
                const dt = new Date(conv.last_message_at);
                const formattedDate = dt.toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );
                return (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-border bg-card hover:border-amber-500/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openConversation(conv.session_id)}
                      className="min-w-0 flex-1 text-start"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {conv.preview ||
                          (locale === "ar" ? "محادثة متجر elloll" : "elloll store chat")}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span>
                          {conv.message_count}{" "}
                          {locale === "ar" ? "رسائل" : "messages"}
                        </span>
                        {isActive && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                            {locale === "ar" ? "الحالية" : "Active"}
                          </span>
                        )}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void deleteHistoryItem(conv.session_id)}
                      title={locale === "ar" ? "حذف من السجل" : "Delete from history"}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className="space-y-3">
              <div
                className={`flex flex-col ${
                  isUser ? "items-start" : "items-end"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.createdAt && (
                    <p
                      dir="ltr"
                      className={`mt-1 text-[10px] opacity-65 ${
                        isUser ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString(
                        locale === "ar" ? "ar-EG" : "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  )}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-border/50 pt-1.5">
                      {msg.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-500"
                        >
                          ⚡ {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {msg.products && msg.products.length > 0 && (
                <div
                  className={
                    isFullViewport
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                      : "flex gap-3 overflow-x-auto pb-2 pt-1"
                  }
                >
                  {msg.products.map((p) => {
                    const added = justAddedId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-amber-500/40 ${
                          isFullViewport ? "w-full" : "w-48 shrink-0"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col gap-1.5 p-3">
                          <p className="line-clamp-2 text-xs font-semibold leading-snug">
                            {p.name}
                          </p>
                          <p className="mt-auto font-display text-sm font-bold text-amber-500 tabular-nums">
                            {priceFmt.format(p.price)}
                          </p>
                          <div className="mt-1 grid grid-cols-2 gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 px-2 text-[11px]"
                            >
                              <Link
                                href={`/products/${p.id}`}
                                onClick={() => {
                                  if (!isChatOnly) setExpanded(false);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                {locale === "ar" ? "التفاصيل" : "View"}
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddProduct(p)}
                              className={`h-7 gap-1 px-2 text-[11px] ${
                                added ? "bg-emerald-600 text-white" : ""
                              }`}
                            >
                              {added ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  {locale === "ar" ? "تمت" : "Added"}
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="h-3 w-3" />
                                  {locale === "ar" ? "أضف" : "Add"}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              <span>{locale === "ar" ? "جاري التفكير..." : "Thinking..."}</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      )}

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-4 py-2.5">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              type="button"
              onClick={() => void sendText(qp)}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      {/* Daily quota indicator bar */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-1.5 text-[11px]">
        <span className="text-muted-foreground">
          {authUser
            ? locale === "ar"
              ? "الاستخدام اليومي للشات:"
              : "Daily AI Chat Limit:"
            : locale === "ar"
              ? "رسائل مجانية قبل الدخول:"
              : "Free guest questions:"}
        </span>
        {!authUser && quota.require_auth ? (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="font-bold text-amber-500 underline underline-offset-2 hover:text-amber-400"
          >
            {locale === "ar"
              ? `سجّل دخولك لمتابعة المحادثة (${quota.daily_limit}/يوم)`
              : `Sign in to continue (${quota.daily_limit}/day)`}
          </button>
        ) : (
          <span
            className={`font-semibold tabular-nums ${
              quota.remaining === 0
                ? "text-destructive"
                : quota.remaining <= 2
                  ? "text-amber-500"
                  : "text-emerald-500"
            }`}
          >
            {authUser
              ? locale === "ar"
                ? `${quota.remaining} / ${quota.daily_limit} متبقي اليوم`
                : `${quota.remaining} / ${quota.daily_limit} left today`
              : locale === "ar"
                ? `${quota.remaining} / ${quota.guest_limit ?? 5} متبقي`
                : `${quota.remaining} / ${quota.guest_limit ?? 5} left`}
          </span>
        )}
      </div>

      {/* Auto-resizing Input form (Shift+Enter = newline, Enter = send) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendText(input);
        }}
        className="flex items-end gap-2 border-t border-border bg-background/90 p-3 sm:p-4"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleTextareaKeyDown}
          placeholder={
            !authUser && quota.require_auth
              ? locale === "ar"
                ? "أكملت 5 أسئلة — سجّل الدخول بـ Google أو الإيميل للمتابعة (20/يوم)"
                : "5 free questions reached — sign in with Google or email to continue"
              : quota.remaining === 0
                ? locale === "ar"
                  ? `تم الوصول للحد اليومي (${quota.daily_limit} رسالة) — يتجدد غداً`
                  : `Daily limit reached (${quota.daily_limit} messages) — resets tomorrow`
                : locale === "ar"
                  ? "اكتب طلبك هنا (Shift + Enter لسطر جديد)..."
                  : "Ask anything (Shift + Enter for new line)..."
          }
          disabled={busy || (Boolean(authUser) && !quota.allowed)}
          className="max-h-40 min-h-[38px] flex-1 resize-none overflow-y-auto rounded-xl border border-input bg-background px-3.5 py-2 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={
            busy ||
            (Boolean(authUser) && (!input.trim() || !quota.allowed)) ||
            (!authUser && !quota.require_auth && !input.trim())
          }
          size="icon"
          className="h-[38px] w-[38px] shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </>
  );

  // Full-screen Chat-Only Mode (100% viewport width & height)
  if (isChatOnly) {
    return (
      <div className="fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-background">
        <header
          dir="ltr"
          className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur sm:h-16 sm:px-6"
        >
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <Link href="/" className="flex shrink-0 items-center">
              <BrandLogo size="sm" priority />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 md:inline-flex">
              <Sparkles className="h-3 w-3" />
              {config.bot_name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <ModeSwitcher />
            <Button
              type="button"
              variant={historyOpen ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setHistoryOpen((v) => !v)}
              title={locale === "ar" ? "سجل المحادثات" : "Chat history"}
              className="relative h-8 w-8 text-muted-foreground sm:h-9 sm:w-9"
            >
              <History className="h-4 w-4" />
              {conversations.length > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
                  {conversations.length}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              title={locale === "ar" ? "محادثة جديدة" : "New chat"}
              className="h-8 w-8 text-muted-foreground sm:h-9 sm:w-9"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-1 sm:flex">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            <AccountButton />
            <CartBadge />
          </div>
        </header>

        <div className="flex w-full flex-1 flex-col overflow-hidden">
          {chatBody}
        </div>
      </div>
    );
  }

  // Default Mode: Pinned to RIGHT corner with Site Logo & Name
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={config.bot_name}
          dir="ltr"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-card/95 px-3.5 py-2 shadow-xl backdrop-blur transition-transform hover:scale-105 hover:border-amber-500"
        >
          <BrandLogo size="sm" priority />
        </button>
      )}

      {open && (
        <div
          className={
            expanded
              ? "fixed inset-0 z-50 flex h-dvh w-screen flex-col overflow-hidden bg-background"
              : "fixed bottom-4 right-4 z-50 flex h-[560px] max-h-[85vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-200"
          }
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="icon" size="sm" priority />
              <div>
                <p className="text-sm font-bold">elloll</p>
                <p className="text-[11px] text-emerald-500">
                  {config.bot_name} • {locale === "ar" ? "متصل" : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {expanded && <CartBadge />}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setExpanded((v) => !v)}
                title={
                  expanded
                    ? locale === "ar"
                      ? "تصغير"
                      : "Minimize"
                    : locale === "ar"
                      ? "تكبير لكامل الشاشة"
                      : "Expand full screen"
                }
                className="h-8 w-8 text-muted-foreground"
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant={historyOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setHistoryOpen((v) => !v)}
                title={locale === "ar" ? "سجل المحادثات" : "Chat history"}
                className="relative h-8 w-8 text-muted-foreground"
              >
                <History className="h-4 w-4" />
                {conversations.length > 0 && (
                  <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
                    {conversations.length}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startNewChat}
                title={locale === "ar" ? "محادثة جديدة" : "New chat"}
                className="h-8 w-8 text-muted-foreground"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
                className="h-8 w-8 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {chatBody}
        </div>
      )}
    </>
  );
}
