import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram-bot";

export async function POST(req: Request) {
  try {
    const update = (await req.json()) as {
      message?: {
        chat?: { id?: number | string };
        text?: string;
        from?: { first_name?: string };
      };
    };
    const result = await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    );
  }
}
