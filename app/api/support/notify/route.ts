import { NextResponse } from "next/server";
import { notifySupportOnTelegram } from "@/lib/telegram-bot";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      ticketNumber: string;
      customerName: string;
      customerEmail: string;
      subject: string;
      message: string;
      orderNumber?: string | null;
      isReply?: boolean;
    };

    if (!body.ticketNumber || !body.message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const sent = await notifySupportOnTelegram(body);
    return NextResponse.json({ ok: sent });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
