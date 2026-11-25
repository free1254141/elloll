import { getAiServerConfig } from "@/lib/ai-server-config";
import { handleTelegramUpdate, registerTelegramCommands } from "@/lib/telegram-bot";

declare global {
  var __ellollTelegramPollerStarted: boolean | undefined;
}

export function startTelegramPoller() {
  if (globalThis.__ellollTelegramPollerStarted) return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  // Run poller only on the admin server (or single-mode) so two local dev servers never conflict on getUpdates.
  if (process.env.NEXT_PUBLIC_APP_MODE === "storefront") return;

  globalThis.__ellollTelegramPollerStarted = true;
  let offset = 0;

  void registerTelegramCommands();

  const loop = async () => {
    while (true) {
      try {
        const cfg = getAiServerConfig();
        const token = cfg.telegramBotToken;
        if (!token) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        const res = await fetch(
          `https://api.telegram.org/bot${token}/getUpdates?timeout=20&offset=${offset}`,
          { cache: "no-store" },
        );

        if (res.ok) {
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

          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              offset = Math.max(offset, update.update_id + 1);
              try {
                await handleTelegramUpdate(update);
              } catch {
                // ignore single update error
              }
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  };

  void loop();
}
