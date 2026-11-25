import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiServerConfig, saveAiServerConfig } from "@/lib/ai-server-config";
import { startTelegramPoller } from "@/lib/telegram-poller";
import {
  formatAnalyticsReport,
  handleTelegramUpdate,
  OWNER_KEYBOARD,
  sendTelegramMessage,
} from "@/lib/telegram-bot";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }
  return supabase;
}

export async function GET() {
  startTelegramPoller();
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: dbSettings }, { data: analytics }] = await Promise.all([
    supabase.from("ai_bot_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.rpc("get_store_analytics_summary"),
  ]);

  const srv = getAiServerConfig();
  return NextResponse.json({
    settings: {
      ...(dbSettings ?? {}),
      deepseek_api_key_masked: srv.deepseekApiKey
        ? `${srv.deepseekApiKey.slice(0, 6)}••••${srv.deepseekApiKey.slice(-4)}`
        : "",
      has_deepseek_key: Boolean(srv.deepseekApiKey),
      telegram_bot_token: "",
      telegram_token_masked: srv.telegramBotToken
        ? `${srv.telegramBotToken.slice(0, 8)}••••${srv.telegramBotToken.slice(-4)}`
        : "",
      has_telegram_token: Boolean(srv.telegramBotToken),
      telegram_chat_id: srv.telegramChatId || dbSettings?.telegram_chat_id || "",
      notify_support_telegram: srv.notifySupportTelegram,
    },
    analytics: analytics ?? {},
  });
}

export async function POST(req: Request) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action?:
      | "save"
      | "reset_prompt"
      | "detect_telegram"
      | "test_telegram"
      | "sync_telegram_updates";
    enabled?: boolean;
    mode?: "default" | "chat_only";
    bot_name?: string;
    welcome_message?: string;
    system_prompt?: string;
    deepseek_model?: string;
    deepseek_api_key?: string;
    telegram_bot_token?: string;
    telegram_chat_id?: string;
    notify_support_telegram?: boolean;
  };

  const srv = getAiServerConfig();
  const token = body.telegram_bot_token?.trim() || srv.telegramBotToken;

  if (body.action === "reset_prompt") {
    const { data: defaultPrompt, error: resetErr } = await supabase.rpc(
      "reset_ai_system_prompt",
    );
    if (resetErr) {
      return NextResponse.json({ error: resetErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, system_prompt: defaultPrompt });
  }

  if (body.action === "detect_telegram" || body.action === "sync_telegram_updates") {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
    const data = (await res.json()) as {
      ok?: boolean;
      result?: Array<{
        update_id: number;
        message?: {
          chat?: { id?: number | string };
          text?: string;
          from?: { first_name?: string };
        };
      }>;
    };

    if (!data.ok) {
      return NextResponse.json(
        { error: "فشل الاتصال ببوت التليجرام — تأكد من التوكن" },
        { status: 400 },
      );
    }

    const updates = data.result ?? [];
    let detectedChatId = "";
    let processed = 0;

    for (const u of updates) {
      if (u.message?.chat?.id) {
        detectedChatId = String(u.message.chat.id);
      }
      if (body.action === "sync_telegram_updates") {
        await handleTelegramUpdate(u);
        processed += 1;
      }
    }

    if (updates.length > 0) {
      const lastId = updates[updates.length - 1].update_id;
      await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${lastId + 1}`,
      );
    }

    if (detectedChatId) {
      saveAiServerConfig({ telegramChatId: detectedChatId, telegramBotToken: token });
      await supabase
        .from("ai_bot_settings")
        .update({
          telegram_chat_id: detectedChatId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "default");
    }

    return NextResponse.json({
      ok: true,
      chatId: detectedChatId || srv.telegramChatId,
      processed,
    });
  }

  if (body.action === "test_telegram") {
    const targetChatId = body.telegram_chat_id?.trim() || srv.telegramChatId;
    if (!targetChatId) {
      return NextResponse.json(
        { error: "أرسل /start لبوت التليجرام @ecomm_elloll_bot أولاً ثم اضغط ربط تلقائي." },
        { status: 400 },
      );
    }
    const report = await formatAnalyticsReport();
    const ok = await sendTelegramMessage(
      targetChatId,
      `✅ <b>رسالة اختبار من لوحة تحكم elloll</b>\n\n${report}`,
      OWNER_KEYBOARD,
      token,
    );
    return NextResponse.json({ ok });
  }

  // Save settings
  const serverUpdate: Partial<typeof srv> = {};
  if (body.deepseek_api_key && body.deepseek_api_key.trim() !== "") {
    serverUpdate.deepseekApiKey = body.deepseek_api_key.trim();
  }
  if (body.deepseek_model) {
    serverUpdate.deepseekModel = body.deepseek_model.trim();
  }
  if (body.telegram_bot_token) {
    serverUpdate.telegramBotToken = body.telegram_bot_token.trim();
  }
  if (body.telegram_chat_id !== undefined) {
    serverUpdate.telegramChatId = body.telegram_chat_id.trim();
  }
  if (body.notify_support_telegram !== undefined) {
    serverUpdate.notifySupportTelegram = body.notify_support_telegram;
  }
  const savedSrv = saveAiServerConfig(serverUpdate);

  const { error: dbErr } = await supabase
    .from("ai_bot_settings")
    .update({
      enabled: body.enabled ?? true,
      mode: body.mode ?? "default",
      bot_name: body.bot_name?.trim() || "مساعد elloll الذكي",
      welcome_message: body.welcome_message?.trim() || "",
      system_prompt: body.system_prompt?.trim() || "",
      deepseek_model: savedSrv.deepseekModel,
      telegram_chat_id: savedSrv.telegramChatId,
      notify_support_telegram: savedSrv.notifySupportTelegram,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    has_deepseek_key: Boolean(savedSrv.deepseekApiKey),
    telegram_chat_id: savedSrv.telegramChatId,
  });
}
