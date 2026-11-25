import fs from "node:fs";
import path from "node:path";

export interface AiServerConfig {
  deepseekApiKey: string;
  deepseekModel: string;
  telegramBotToken: string;
  telegramChatId: string;
  notifySupportTelegram: boolean;
}

function getEnvLocalPath(): string {
  return path.join(process.cwd(), ".env.local");
}

function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    if (!fs.existsSync(filePath)) return out;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  } catch {
    // ignore read errors (e.g. serverless runtime without .env.local)
  }
  return out;
}

/**
 * Reads AI & Telegram credentials strictly from environment variables
 * (`process.env` in production/Vercel, plus live `.env.local` lookup in local dev
 * so changes in `.env.local` take effect immediately without a server restart).
 */
export function getAiServerConfig(): AiServerConfig {
  const fileEnv = parseEnvFile(getEnvLocalPath());
  const get = (key: string) => fileEnv[key] || process.env[key] || "";

  const notifyRaw = get("NOTIFY_SUPPORT_TELEGRAM");
  return {
    deepseekApiKey: get("DEEPSEEK_API_KEY"),
    deepseekModel: get("DEEPSEEK_MODEL") || "deepseek-chat",
    telegramBotToken: get("TELEGRAM_BOT_TOKEN"),
    telegramChatId: get("TELEGRAM_CHAT_ID"),
    notifySupportTelegram: notifyRaw === "" ? true : notifyRaw !== "false",
  };
}

/**
 * Updates `.env.local` in local development when the Admin updates a key or
 * links Telegram `/start`. On read-only serverless deployments (Vercel),
 * fails silently — production secrets live in Vercel Environment Variables.
 */
export function saveAiServerConfig(partial: Partial<AiServerConfig>): AiServerConfig {
  const mapping: Array<[keyof AiServerConfig, string]> = [
    ["deepseekApiKey", "DEEPSEEK_API_KEY"],
    ["deepseekModel", "DEEPSEEK_MODEL"],
    ["telegramBotToken", "TELEGRAM_BOT_TOKEN"],
    ["telegramChatId", "TELEGRAM_CHAT_ID"],
    ["notifySupportTelegram", "NOTIFY_SUPPORT_TELEGRAM"],
  ];

  try {
    const envPath = getEnvLocalPath();
    const lines = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf8").split(/\r?\n/)
      : [];

    for (const [prop, envKey] of mapping) {
      if (partial[prop] === undefined) continue;
      const strVal = String(partial[prop]);
      process.env[envKey] = strVal;
      const idx = lines.findIndex((l) =>
        new RegExp(`^\\s*${envKey}\\s*=`).test(l),
      );
      if (idx >= 0) {
        lines[idx] = `${envKey}=${strVal}`;
      } else {
        lines.push(`${envKey}=${strVal}`);
      }
    }

    fs.writeFileSync(
      envPath,
      lines.filter((l, i, arr) => i < arr.length - 1 || l !== "").join("\n") + "\n",
      "utf8",
    );
  } catch {
    // Read-only filesystem in serverless production — ignore
  }

  return getAiServerConfig();
}
