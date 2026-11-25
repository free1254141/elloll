import type { Metadata } from "next";
import { AiBotManager } from "@/features/admin/components/ai-bot-manager";
import { startTelegramPoller } from "@/lib/telegram-poller";

export const metadata: Metadata = {
  title: "شات بوت AI — إدارة elloll",
};

export default function AdminAiBotPage() {
  startTelegramPoller();
  return <AiBotManager />;
}
