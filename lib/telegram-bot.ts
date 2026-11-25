import { createClient } from "@/lib/supabase/server";
import { getAiServerConfig, saveAiServerConfig } from "@/lib/ai-server-config";

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: unknown,
  overrideToken?: string,
): Promise<boolean> {
  const cfg = getAiServerConfig();
  const token = overrideToken || cfg.telegramBotToken;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerTelegramCommands(overrideToken?: string) {
  const cfg = getAiServerConfig();
  const token = overrideToken || cfg.telegramBotToken;
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "ربط الحساب وعرض لوحة التحكم" },
          { command: "stats", description: "تحليلات اليوم والزوار والشات" },
          { command: "top", description: "أكثر المنتجات مبيعاً وطلباً" },
          { command: "orders", description: "أحدث الطلبات" },
          { command: "support", description: "تذاكر الدعم المفتوحة" },
          { command: "mode_chat", description: "تحويل الموقع لوضع الشات فقط" },
          { command: "mode_default", description: "إعادة الموقع للوضع الافتراضي" },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifySupportOnTelegram(payload: {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  orderNumber?: string | null;
  isReply?: boolean;
}) {
  const cfg = getAiServerConfig();
  if (!cfg.notifySupportTelegram || !cfg.telegramChatId) return false;

  const header = payload.isReply
    ? "💬 <b>رد جديد من عميل في الدعم الفني</b>"
    : "🆘 <b>تذكرة دعم فني جديدة — elloll</b>";

  const lines = [
    header,
    "",
    `🎫 <b>التذكرة:</b> <code>${escapeHtml(payload.ticketNumber)}</code>`,
    `👤 <b>العميل:</b> ${escapeHtml(payload.customerName)}`,
    `📧 <b>الإيميل:</b> ${escapeHtml(payload.customerEmail)}`,
    payload.orderNumber
      ? `📦 <b>رقم الطلب:</b> <code>${escapeHtml(payload.orderNumber)}</code>`
      : null,
    `📝 <b>الموضوع:</b> ${escapeHtml(payload.subject)}`,
    "",
    `✉️ <b>الرسالة:</b>\n${escapeHtml(payload.message)}`,
  ]
    .filter((x) => x !== null)
    .join("\n");

  return sendTelegramMessage(cfg.telegramChatId, lines);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const OWNER_KEYBOARD = {
  keyboard: [
    [{ text: "📊 إحصائيات اليوم" }, { text: "📈 الأكثر طلباً" }],
    [{ text: "📦 أحدث الطلبات" }, { text: "🎧 تذاكر الدعم" }],
    [{ text: "🤖 وضع الشات فقط" }, { text: "🛍️ الوضع الافتراضي" }],
  ],
  resize_keyboard: true,
};

export async function formatAnalyticsReport(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_store_analytics_summary");
  const stats = (data ?? {}) as {
    site_visitors_today?: number;
    chat_users_today?: number;
    page_views_today?: number;
    chat_messages_today?: number;
    orders_today?: number;
    revenue_today?: number;
    open_support_tickets?: number;
    total_ai_conversations?: number;
  };

  return [
    "📊 <b>تحليلات متجر elloll — اليوم</b>",
    "",
    `👥 <b>زوار الموقع اليوم:</b> ${stats.site_visitors_today ?? 0} (${stats.page_views_today ?? 0} زيارة)`,
    `🤖 <b>مستخدمو الشات اليوم:</b> ${stats.chat_users_today ?? 0} (${stats.chat_messages_today ?? 0} رسالة)`,
    `💬 <b>إجمالي محادثات AI:</b> ${stats.total_ai_conversations ?? 0}`,
    `📦 <b>طلبات اليوم:</b> ${stats.orders_today ?? 0}`,
    `💰 <b>مبيعات اليوم:</b> EGP ${Number(stats.revenue_today ?? 0).toFixed(2)}`,
    `🎧 <b>تذاكر الدعم المفتوحة:</b> ${stats.open_support_tickets ?? 0}`,
  ].join("\n");
}

async function formatTopProductsReport(): Promise<string> {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("name, price, stock_quantity")
    .eq("status", "active")
    .order("stock_quantity", { ascending: true })
    .limit(5);

  if (!products || products.length === 0) {
    return "📈 لا توجد منتجات نشطة حالياً.";
  }

  const lines = products.map(
    (p, idx) =>
      `${idx + 1}. <b>${escapeHtml(p.name)}</b> — EGP ${Number(p.price).toFixed(2)} (المتبقي: ${p.stock_quantity})`,
  );

  return "📈 <b>ملخص المخزون والمنتجات النشطة:</b>\n\n" + lines.join("\n");
}

const TELEGRAM_OWNER_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_daily_analytics",
      description:
        "Get today's site visitors, AI chat users, messages, orders, revenue, and open support tickets.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_orders",
      description: "Get the latest orders in the store with statuses and totals.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_open_support_tickets",
      description: "Get currently open or in-progress customer support tickets.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_store_inventory_summary",
      description: "Get active products and low-stock inventory summary.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "set_store_mode",
      description: "Switch storefront mode between 'default' and 'chat_only'.",
      parameters: {
        type: "object",
        properties: { mode: { type: "string", enum: ["default", "chat_only"] } },
        required: ["mode"],
      },
    },
  },
];

export async function handleTelegramUpdate(update: {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    from?: { first_name?: string };
  };
}): Promise<string | null> {
  const msg = update.message;
  const chatId = msg?.chat?.id ? String(msg.chat.id) : "";
  const text = (msg?.text ?? "").trim();
  if (!chatId || !text) return null;

  const cfg = getAiServerConfig();
  const supabase = await createClient();

  if (text === "/start") {
    saveAiServerConfig({ telegramChatId: chatId });
    await supabase
      .from("ai_bot_settings")
      .update({ telegram_chat_id: chatId, updated_at: new Date().toISOString() })
      .eq("id", "default");
    await registerTelegramCommands();

    await sendTelegramMessage(
      chatId,
      "✅ <b>تم ربط بوت إدارة elloll بنجاح!</b>\n\nسيصلك هنا إشعار فوري عند أي رسالة دعم من العملاء، ويمكنك استخدام الأزرار بالأسفل أو سؤالي مباشرة عن التحليلات والطلبات والمخزون.",
      OWNER_KEYBOARD,
    );
    return "Linked chat " + chatId;
  }

  if (text === "/stats" || text === "📊 إحصائيات اليوم") {
    const report = await formatAnalyticsReport();
    await sendTelegramMessage(chatId, report, OWNER_KEYBOARD);
    return "Sent stats";
  }

  if (text === "/top" || text === "📈 الأكثر طلباً") {
    const report = await formatTopProductsReport();
    await sendTelegramMessage(chatId, report, OWNER_KEYBOARD);
    return "Sent top products";
  }

  if (text === "/orders" || text === "📦 أحدث الطلبات") {
    const { data: orders } = await supabase
      .from("orders")
      .select("order_number, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!orders || orders.length === 0) {
      await sendTelegramMessage(chatId, "📦 لا توجد طلبات حتى الآن.", OWNER_KEYBOARD);
      return "No orders";
    }
    const lines = orders.map(
      (o) =>
        `• <code>${o.order_number}</code> — <b>${o.status}</b> — EGP ${Number(o.total_amount).toFixed(2)}`,
    );
    await sendTelegramMessage(
      chatId,
      "📦 <b>أحدث 5 طلبات:</b>\n\n" + lines.join("\n"),
      OWNER_KEYBOARD,
    );
    return "Sent orders";
  }

  if (text === "/support" || text === "🎧 تذاكر الدعم") {
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("ticket_number, customer_name, subject, status")
      .in("status", ["open", "in_progress"])
      .order("last_message_at", { ascending: false })
      .limit(5);

    if (!tickets || tickets.length === 0) {
      await sendTelegramMessage(chatId, "🎧 لا توجد تذاكر دعم مفتوحة حالياً.", OWNER_KEYBOARD);
      return "No open tickets";
    }
    const lines = tickets.map(
      (tk) =>
        `• <code>${tk.ticket_number}</code> — ${escapeHtml(tk.customer_name)}: ${escapeHtml(tk.subject)} (${tk.status})`,
    );
    await sendTelegramMessage(
      chatId,
      "🎧 <b>تذاكر الدعم المفتوحة:</b>\n\n" + lines.join("\n"),
      OWNER_KEYBOARD,
    );
    return "Sent tickets";
  }

  if (text === "/mode_chat" || text === "🤖 وضع الشات فقط") {
    await supabase
      .from("ai_bot_settings")
      .update({ mode: "chat_only", enabled: true, updated_at: new Date().toISOString() })
      .eq("id", "default");
    await sendTelegramMessage(
      chatId,
      "🤖 تم تحويل المتجر إلى <b>وضع الشات فقط (Chat-Only Mode)</b>.",
      OWNER_KEYBOARD,
    );
    return "Mode chat_only";
  }

  if (text === "/mode_default" || text === "🛍️ الوضع الافتراضي") {
    await supabase
      .from("ai_bot_settings")
      .update({ mode: "default", updated_at: new Date().toISOString() })
      .eq("id", "default");
    await sendTelegramMessage(
      chatId,
      "🛍️ تم إعادة المتجر إلى <b>الوضع الافتراضي</b>.",
      OWNER_KEYBOARD,
    );
    return "Mode default";
  }

  // DeepSeek Owner Assistant with Analytics Tools
  if (cfg.deepseekApiKey) {
    try {
      const dsMsgs: Array<Record<string, unknown>> = [
        {
          role: "system",
          content:
            "أنت مساعد تحليلات وإدارة متجر elloll لصاحب الموقع عبر تليجرام. استخدم الأدوات المتاحة لجلب الأرقام الحقيقية وأجب بالعربية باختصار ووضوح.",
        },
        { role: "user", content: text },
      ];

      for (let i = 0; i < 3; i++) {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: cfg.deepseekModel || "deepseek-chat",
            messages: dsMsgs,
            tools: TELEGRAM_OWNER_TOOLS,
          }),
        });
        const data = (await res.json()) as {
          choices?: {
            message?: {
              content?: string | null;
              tool_calls?: Array<{
                id: string;
                type: "function";
                function: { name: string; arguments: string };
              }>;
            };
          }[];
        };
        const aiMsg = data.choices?.[0]?.message;
        if (!aiMsg) break;

        if (!aiMsg.tool_calls || aiMsg.tool_calls.length === 0) {
          if (aiMsg.content) {
            await sendTelegramMessage(chatId, escapeHtml(aiMsg.content), OWNER_KEYBOARD);
            return "Replied via DeepSeek";
          }
          break;
        }

        dsMsgs.push({
          role: "assistant",
          content: aiMsg.content ?? "",
          tool_calls: aiMsg.tool_calls,
        });

        for (const tc of aiMsg.tool_calls) {
          let result: unknown = {};
          const fn = tc.function.name;
          if (fn === "get_daily_analytics") {
            const { data: sum } = await supabase.rpc("get_store_analytics_summary");
            result = sum ?? {};
          } else if (fn === "get_recent_orders") {
            const { data: orders } = await supabase
              .from("orders")
              .select("order_number, status, total_amount, created_at")
              .order("created_at", { ascending: false })
              .limit(10);
            result = orders ?? [];
          } else if (fn === "get_open_support_tickets") {
            const { data: tks } = await supabase
              .from("support_tickets")
              .select("ticket_number, customer_name, subject, status")
              .in("status", ["open", "in_progress"]);
            result = tks ?? [];
          } else if (fn === "get_store_inventory_summary") {
            const { data: prods } = await supabase
              .from("products")
              .select("name, price, stock_quantity")
              .eq("status", "active")
              .order("stock_quantity", { ascending: true })
              .limit(10);
            result = prods ?? [];
          } else if (fn === "set_store_mode") {
            const parsed = JSON.parse(tc.function.arguments || "{}") as {
              mode?: "default" | "chat_only";
            };
            if (parsed.mode) {
              await supabase
                .from("ai_bot_settings")
                .update({ mode: parsed.mode, updated_at: new Date().toISOString() })
                .eq("id", "default");
              result = { ok: true, mode: parsed.mode };
            }
          }
          dsMsgs.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
      }
    } catch {
      // fallback below
    }
  }

  await sendTelegramMessage(
    chatId,
    "استخدم الأزرار بالأسفل أو الأوامر: /stats ، /top ، /orders ، /support ، /mode_chat ، /mode_default",
    OWNER_KEYBOARD,
  );
  return "Sent help";
}
