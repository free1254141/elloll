import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  const deleteAll = searchParams.get("all") === "true";

  if (deleteAll) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .delete()
      .not("id", "is", null)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deletedCount: data?.length ?? 0,
    });
  }

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Valid conversation id is required" },
      { status: 400 },
    );
  }

  // Deleting from ai_conversations permanently removes both the room row and
  // all child ai_messages rows in Supabase via ON DELETE CASCADE.
  const { data, error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    deletedId: id,
    deletedCount: data.length,
  });
}
