"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";

interface AiSettingsState {
  enabled: boolean;
  mode: "default" | "chat_only";
  bot_name: string;
  welcome_message: string;
  system_prompt: string;
  deepseek_model: string;
  deepseek_api_key: string;
  deepseek_api_key_masked?: string;
  has_deepseek_key?: boolean;
  telegram_bot_token: string;
  telegram_token_masked?: string;
  has_telegram_token?: boolean;
  telegram_chat_id: string;
  notify_support_telegram: boolean;
}

interface AnalyticsSummary {
  site_visitors_today?: number;
  chat_users_today?: number;
  page_views_today?: number;
  chat_messages_today?: number;
  orders_today?: number;
  revenue_today?: number;
  open_support_tickets?: number;
  total_ai_conversations?: number;
}

interface AiConversation {
  id: string;
  session_id: string;
  visitor_id: string;
  message_count: number;
  cleared_by_user?: boolean;
  last_message_at: string;
}

interface AiMessageRow {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls: string[] | null;
  created_at: string;
}

export function AiBotManager() {
  const { locale } = useLanguage();
  const [tab, setTab] = useState<
    "settings" | "analytics" | "conversations" | "tools"
  >("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const [settings, setSettings] = useState<AiSettingsState>({
    enabled: true,
    mode: "default",
    bot_name: "مساعد elloll الذكي",
    welcome_message: "",
    system_prompt: "",
    deepseek_model: "deepseek-chat",
    deepseek_api_key: "",
    telegram_bot_token: "",
    telegram_chat_id: "",
    notify_support_telegram: true,
  });

  const [analytics, setAnalytics] = useState<AnalyticsSummary>({});
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<AiMessageRow[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/api/ai-settings");
      if (res.ok) {
        const data = (await res.json()) as {
          settings: Partial<AiSettingsState>;
          analytics: AnalyticsSummary;
        };
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          deepseek_api_key: "",
        }));
        setAnalytics(data.analytics ?? {});
      }

      const supabase = createClient();
      const { data: convs } = await supabase
        .from("ai_conversations")
        .select(
          "id, session_id, visitor_id, message_count, cleared_by_user, last_message_at",
        )
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (convs) {
        const list = convs as AiConversation[];
        setConversations(list);
        if (list.length > 0 && !selectedConvId) {
          setSelectedConvId(list[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedConvId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedConvId) {
      setConvMessages([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("ai_messages")
      .select("id, role, content, tool_calls, created_at")
      .eq("conversation_id", selectedConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setConvMessages(data as AiMessageRow[]);
      });
  }, [selectedConvId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/admin/api/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", ...settings }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        has_deepseek_key?: boolean;
      };
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSettings((prev) => ({
        ...prev,
        deepseek_api_key: "",
        has_deepseek_key: data.has_deepseek_key ?? prev.has_deepseek_key,
      }));
      setStatusMsg(
        locale === "ar"
          ? "تم حفظ إعدادات الشات بوت والتليجرام بنجاح."
          : "AI Bot & Telegram settings saved.",
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPrompt() {
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/admin/api/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_prompt" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        system_prompt?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Failed to reset prompt");
      if (data.system_prompt) {
        setSettings((prev) => ({
          ...prev,
          system_prompt: data.system_prompt!,
        }));
      }
      setStatusMsg(
        locale === "ar"
          ? "تم استرجاع البرومت الافتراضي من قاعدة البيانات بنجاح."
          : "Default system prompt restored from Supabase.",
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTelegramAction(
    action: "detect_telegram" | "test_telegram" | "sync_telegram_updates",
  ) {
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/admin/api/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_chat_id: settings.telegram_chat_id,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        chatId?: string;
        processed?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Telegram action failed");

      if (data.chatId) {
        setSettings((prev) => ({ ...prev, telegram_chat_id: data.chatId! }));
      }
      if (action === "detect_telegram") {
        setStatusMsg(
          data.chatId
            ? `تم ربط حساب التليجرام تلقائياً (Chat ID: ${data.chatId})`
            : "لم يتم العثور على رسائل جديدة — أرسل /start للبوت @ecomm_elloll_bot ثم حاول مجدداً.",
        );
      } else if (action === "test_telegram") {
        setStatusMsg("تم إرسال رسالة الاختبار وتقرير التحليلات إلى التليجرام.");
      } else {
        setStatusMsg(`تمت معالجة ${data.processed ?? 0} تحديث من التليجرام.`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === "ar"
              ? "إدارة شات بوت AI والتليجرام"
              : "AI Assistant & Telegram"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar"
              ? "تحكم كامل في البوت الذكي (DeepSeek)، وضع الموقع، محادثات العملاء، والتحليلات اليومية."
              : "Configure DeepSeek AI, storefront mode, Telegram alerts, conversations, and analytics."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadAll()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {locale === "ar" ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5">
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "settings"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings2 className="h-4 w-4" />
          {locale === "ar" ? "الإعدادات والبرومت" : "Settings & Prompt"}
        </button>
        <button
          type="button"
          onClick={() => setTab("analytics")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "analytics"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {locale === "ar" ? "التحليلات اليومية" : "Daily Analytics"}
        </button>
        <button
          type="button"
          onClick={() => setTab("conversations")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "conversations"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {locale === "ar"
            ? `محادثات العملاء (${conversations.length})`
            : `Conversations (${conversations.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("tools")}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "tools"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className="h-4 w-4" />
          {locale === "ar" ? "الأدوات المتاحة (20)" : "Available Tools (20)"}
        </button>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: SETTINGS */}
      {tab === "settings" && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Visibility & Mode */}
          <div className="grid gap-6 rounded-2xl border border-border bg-card p-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-4">
                <div>
                  <p className="font-semibold text-sm">
                    {locale === "ar"
                      ? "تفعيل الشات بوت في المتجر"
                      : "Enable AI Chatbot on Storefront"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar"
                      ? "إظهار أو إخفاء المساعد الذكي للزوار"
                      : "Show or hide the AI assistant for visitors"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, enabled: e.target.checked }))
                  }
                  className="h-5 w-5 accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bot-name">
                  {locale === "ar" ? "اسم البوت" : "Bot Name"}
                </Label>
                <Input
                  id="bot-name"
                  value={settings.bot_name}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, bot_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bot-welcome">
                  {locale === "ar" ? "رسالة الترحيب" : "Welcome Message"}
                </Label>
                <textarea
                  id="bot-welcome"
                  rows={3}
                  value={settings.welcome_message}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      welcome_message: e.target.value,
                    }))
                  }
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* DeepSeek API & System Prompt */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-bold text-base">
              <Bot className="h-5 w-5 text-amber-500" />
              {locale === "ar"
                ? "إعدادات DeepSeek API والبرومت"
                : "DeepSeek API & System Prompt"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ds-key">
                  DEEPSEEK_API_KEY (.env){" "}
                  {settings.has_deepseek_key && (
                    <span className="text-xs text-emerald-500">
                      ({settings.deepseek_api_key_masked || "متصل من .env"})
                    </span>
                  )}
                </Label>
                <div className="relative" dir="ltr">
                  <Input
                    id="ds-key"
                    type={showKey ? "text" : "password"}
                    placeholder={
                      settings.has_deepseek_key
                        ? "اتركه فارغاً للإبقاء على المفتاح الحالي"
                        : "sk-..."
                    }
                    value={settings.deepseek_api_key}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        deepseek_api_key: e.target.value,
                      }))
                    }
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-0 top-0 flex h-full items-center px-2.5 text-muted-foreground"
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ds-model">DeepSeek Model</Label>
                <select
                  id="ds-model"
                  value={settings.deepseek_model}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      deepseek_model: e.target.value,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="deepseek-chat">deepseek-chat (V3)</option>
                  <option value="deepseek-reasoner">
                    deepseek-reasoner (R1)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="sys-prompt">
                  {locale === "ar"
                    ? "البرومت الرئيسي للبوت (System Prompt)"
                    : "System Prompt"}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleResetPrompt()}
                  className="h-7 gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  {locale === "ar"
                    ? "استرجاع البرومت الافتراضي"
                    : "Reset to Default Prompt"}
                </Button>
              </div>
              <textarea
                id="sys-prompt"
                rows={6}
                value={settings.system_prompt}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, system_prompt: e.target.value }))
                }
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "الأدوات الجاهزة المربوطة تلقائياً: البحث والفلترة، عرض الأقسام، إضافة/حذف السلة، إتمام الطلب، تتبع الطلب، وفتح تذكرة دعم."
                  : "Built-in tools attached automatically: list_categories, search_products, add_to_cart, remove_from_cart, place_order, track_order, create_support_ticket."}
              </p>
            </div>
          </div>

          {/* Telegram Bot Integration */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold text-base">
                <Send className="h-5 w-5 text-sky-400" />
                {locale === "ar"
                  ? "ربط بوت التليجرام (@ecomm_elloll_bot)"
                  : "Telegram Bot (@ecomm_elloll_bot)"}
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={settings.notify_support_telegram}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      notify_support_telegram: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-primary"
                />
                {locale === "ar"
                  ? "إرسال رسائل الدعم الفني فوراً لتليجرام"
                  : "Instant Support alerts to Telegram"}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tg-token">
                  TELEGRAM_BOT_TOKEN (.env){" "}
                  {settings.has_telegram_token && (
                    <span className="text-xs text-emerald-500">
                      ({settings.telegram_token_masked || "متصل من .env"})
                    </span>
                  )}
                </Label>
                <Input
                  id="tg-token"
                  type="password"
                  dir="ltr"
                  placeholder={
                    settings.has_telegram_token
                      ? "محفوظ في .env.local (اتركه فارغاً للإبقاء عليه)"
                      : "123456:ABC-..."
                  }
                  value={settings.telegram_bot_token}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      telegram_bot_token: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tg-chat">Telegram Owner Chat ID</Label>
                <Input
                  id="tg-chat"
                  dir="ltr"
                  placeholder="أرسل /start للبوت @ecomm_elloll_bot ثم اضغط ربط تلقائي"
                  value={settings.telegram_chat_id}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      telegram_chat_id: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void handleTelegramAction("detect_telegram")}
              >
                {locale === "ar"
                  ? "ربط تلقائي (بعد إرسال /start)"
                  : "Auto-Detect Chat ID"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void handleTelegramAction("test_telegram")}
              >
                {locale === "ar"
                  ? "إرسال رسالة اختبار + التحليلات"
                  : "Send Test & Analytics"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() =>
                  void handleTelegramAction("sync_telegram_updates")
                }
              >
                {locale === "ar"
                  ? "تنفيذ أوامر التليجرام الواردة"
                  : "Process Telegram Commands"}
              </Button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving
              ? locale === "ar"
                ? "جاري الحفظ..."
                : "Saving..."
              : locale === "ar"
                ? "حفظ جميع الإعدادات"
                : "Save All Settings"}
          </Button>
        </form>
      )}

      {/* TAB 2: ANALYTICS */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label:
                locale === "ar" ? "زوار الموقع اليوم" : "Site Visitors Today",
              value: analytics.site_visitors_today ?? 0,
              sub: `${analytics.page_views_today ?? 0} ${locale === "ar" ? "زيارة" : "views"}`,
              icon: Users,
            },
            {
              label:
                locale === "ar" ? "مستخدمو الشات اليوم" : "Chat Users Today",
              value: analytics.chat_users_today ?? 0,
              sub: `${analytics.chat_messages_today ?? 0} ${locale === "ar" ? "رسالة" : "messages"}`,
              icon: Bot,
            },
            {
              label: locale === "ar" ? "طلبات اليوم" : "Orders Today",
              value: analytics.orders_today ?? 0,
              sub: `EGP ${Number(analytics.revenue_today ?? 0).toFixed(2)}`,
              icon: BarChart3,
            },
            {
              label:
                locale === "ar"
                  ? "تذاكر الدعم المفتوحة"
                  : "Open Support Tickets",
              value: analytics.open_support_tickets ?? 0,
              sub: `${analytics.total_ai_conversations ?? 0} ${locale === "ar" ? "محادثة AI" : "AI chats"}`,
              icon: MessageSquare,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">{card.label}</span>
                <card.icon className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CONVERSATIONS — Organized as Rooms per Customer */}
      {tab === "conversations" && (
        <div className="grid min-h-[540px] grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Rooms Sidebar */}
          <div className="flex max-h-[580px] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-4">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-bold">
                {locale === "ar"
                  ? `غرف العملاء (${conversations.length})`
                  : `Customer Rooms (${conversations.length})`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {locale === "ar"
                  ? "كل غرفة تمثل جلسة محادثة مستقلة مع عميل"
                  : "Each room represents an independent customer session"}
              </p>
            </div>

            {conversations.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد محادثات عملاء مع البوت حتى الآن."
                  : "No AI conversations yet."}
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto">
                {conversations.map((c, idx) => {
                  const active = selectedConvId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConvId(c.id)}
                      className={`flex w-full items-center gap-3 p-3.5 text-start transition-colors ${
                        active ? "bg-primary/10" : "hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        #{conversations.length - idx}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold">
                            {locale === "ar"
                              ? `عميل (${c.visitor_id.slice(-6)})`
                              : `Visitor (${c.visitor_id.slice(-6)})`}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            {c.cleared_by_user && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500">
                                {locale === "ar" ? "أرشيف" : "Cleared"}
                              </span>
                            )}
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
                              {c.message_count}{" "}
                              {locale === "ar" ? "رسالة" : "msg"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate font-mono" dir="ltr">
                            {c.session_id.slice(0, 14)}
                          </span>
                          <span dir="ltr">
                            {new Date(c.last_message_at).toLocaleTimeString(
                              locale === "ar" ? "ar-EG" : "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Room Messages Panel */}
          <div className="flex max-h-[580px] flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-8">
            {selectedConvId ? (
              (() => {
                const room = conversations.find((c) => c.id === selectedConvId);
                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">
                          {locale === "ar"
                            ? `غرفة عميل (${room?.visitor_id.slice(-6) ?? ""})`
                            : `Room (${room?.visitor_id.slice(-6) ?? ""})`}
                        </p>
                        <p
                          className="font-mono text-[11px] text-muted-foreground"
                          dir="ltr"
                        >
                          Session: {room?.session_id}
                        </p>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold">
                        {convMessages.length}{" "}
                        {locale === "ar" ? "رسائل" : "messages"}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {convMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            m.role === "user" ? "items-start" : "items-end"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                              m.role === "user"
                                ? "bg-muted text-foreground"
                                : "border border-amber-500/30 bg-amber-500/10 text-foreground"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold opacity-75">
                              <span>
                                {m.role === "user"
                                  ? locale === "ar"
                                    ? "العميل"
                                    : "Customer"
                                  : "elloll AI"}
                              </span>
                              <span>•</span>
                              <span dir="ltr">
                                {new Date(m.created_at).toLocaleTimeString(
                                  locale === "ar" ? "ar-EG" : "en-US",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            {m.tool_calls && m.tool_calls.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {m.tool_calls.map((tool, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 rounded bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-amber-500"
                                  >
                                    <Wrench className="h-2.5 w-2.5" />
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "اختر غرفة عميل من القائمة لعرض المحادثة."
                  : "Select a customer room to view messages."}
              </div>
            )}
          </div>
        </div>
      )}
      {/* TAB 4: AVAILABLE TOOLS */}
      {tab === "tools" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Bot className="h-5 w-5 text-amber-500" />
              {locale === "ar"
                ? "أدوات شات بوت المتجر (15 أداة)"
                : "Storefront AI Chat Tools (15)"}
            </h2>
            <div className="divide-y divide-border">
              {[
                ["get_featured_products", "عرض أحدث المنتجات المميزة ببطاقات تفاعلية"],
                ["list_categories", "عرض جميع أقسام الملابس في المتجر"],
                ["search_products", "البحث والفلترة الذكية (الاسم، القسم، السعر، التوفر، الترتيب)"],
                ["get_product_details", "عرض تفاصيل المنتج والمخزون والوصف"],
                ["view_cart", "عرض محتويات السلة والإجمالي وحالة الشحن المجاني"],
                ["add_to_cart", "إضافة منتج لسلة العميل مباشرة"],
                ["update_cart_quantity", "تعديل كمية منتج داخل السلة"],
                ["remove_from_cart", "حذف منتج من السلة"],
                ["clear_cart", "تفريغ السلة بالكامل"],
                ["place_order", "إنشاء طلب جديد وتأكيده وخصم المخزون"],
                ["update_customer_order", "تعديل بيانات الطلب (العنوان، الهاتف، الدفع)"],
                ["cancel_customer_order", "إلغاء/مسح الطلب واسترجاع المخزون تلقائياً"],
                ["track_order", "تتبع حالة الطلب لحظياً برقم الطلب والإيميل"],
                ["create_support_ticket", "فتح تذكرة دعم وإرسال تنبيه فوري لتليجرام"],
                ["check_support_ticket / reply_support_ticket", "متابعة تذكرة الدعم والرد عليها"],
                ["switch_theme / switch_language / navigate_store", "تغيير المظهر واللغة والتنقل بين الصفحات"],
              ].map(([name, desc]) => (
                <div key={name} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-mono text-xs font-bold text-amber-500" dir="ltr">
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    {locale === "ar" ? "شغالة" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Send className="h-5 w-5 text-sky-400" />
              {locale === "ar"
                ? "أدوات وتحليلات بوت التليجرام (@ecomm_elloll_bot)"
                : "Telegram Owner Bot Tools (@ecomm_elloll_bot)"}
            </h2>
            <div className="divide-y divide-border">
              {[
                ["/start", "ربط حساب التليجرام وإظهار أزرار الإدارة"],
                ["/stats — get_daily_analytics", "زوار الموقع اليوم، مستخدمو الشات، الطلبات، المبيعات"],
                ["/top — get_store_inventory_summary", "ملخص المنتجات والمخزون والأكثر طلباً"],
                ["/orders — get_recent_orders", "عرض أحدث الطلبات وحالاتها"],
                ["/support — get_open_support_tickets", "عرض تذاكر الدعم المفتوحة + إشعار فوري لأي رسالة جديدة"],
                ["/mode_chat و /mode_default", "تحويل المتجر بين الوضع الافتراضي ووضع الشات فقط"],
              ].map(([name, desc]) => (
                <div key={name} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-mono text-xs font-bold text-sky-400" dir="ltr">
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    {locale === "ar" ? "شغالة" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
