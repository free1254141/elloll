"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  Eye,
  Loader2,
  Maximize2,
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
  products?: Product[];
  toolsUsed?: string[];
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

  useEffect(() => {
    if (isAdminOrAuth || !visitorId) return;
    fetch(`/api/ai/chat?visitorId=${encodeURIComponent(visitorId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { quota?: ChatQuota } | null) => {
        if (d?.quota) setQuota(d.quota);
      })
      .catch(() => {});
  }, [isAdminOrAuth, visitorId, authUser?.id]);

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

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
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
          products: data.products,
          toolsUsed: data.toolsUsed,
        },
      ]);
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
    if (p.stock_quantity <= 0) return;
    addItem(p, 1);
    setJustAddedId(p.id);
    setTimeout(() => setJustAddedId(null), 1400);
  }

  function resetChat() {
    if (sessionId) {
      const supabase = createClient();
      void supabase.rpc("mark_ai_session_cleared", { p_session_id: sessionId });
    }
    const newSess = `sess-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    try {
      localStorage.setItem("elloll-ai-session", newSess);
    } catch {
      // ignore
    }
    setSessionId(newSess);
    setMessages(
      config?.welcome_message
        ? [{ id: "welcome", role: "assistant", content: config.welcome_message }]
        : [],
    );
  }

  const chatBody = (
    <>
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
                    const out = p.stock_quantity <= 0;
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
                          <span
                            className={`absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              out
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-black/70 text-emerald-400 backdrop-blur"
                            }`}
                          >
                            {out
                              ? locale === "ar"
                                ? "نفد"
                                : "Out"
                              : locale === "ar"
                                ? `متوفر (${p.stock_quantity})`
                                : `${p.stock_quantity} left`}
                          </span>
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
                              disabled={out}
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
              variant="ghost"
              size="icon"
              onClick={resetChat}
              title={locale === "ar" ? "محادثة جديدة" : "New chat"}
              className="h-8 w-8 text-muted-foreground sm:h-9 sm:w-9"
            >
              <Trash2 className="h-4 w-4" />
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
                variant="ghost"
                size="icon"
                onClick={resetChat}
                title={locale === "ar" ? "محادثة جديدة" : "New chat"}
                className="h-8 w-8 text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
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
