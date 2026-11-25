import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiServerConfig } from "@/lib/ai-server-config";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      name?: string;
      categoryName?: string;
      price?: string | number;
      currentDescription?: string;
    };

    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "اكتب اسم المنتج أولاً لتوليد الوصف والـ SEO." },
        { status: 400 },
      );
    }

    const cfg = getAiServerConfig();
    if (!cfg.deepseekApiKey) {
      return NextResponse.json(
        { error: "مفتاح DEEPSEEK_API_KEY غير موجود في ملف .env.local" },
        { status: 500 },
      );
    }

    const categoryInfo = body.categoryName ? `القسم: ${body.categoryName}` : "";
    const priceInfo =
      body.price !== undefined && String(body.price).trim() !== ""
        ? `السعر: ${body.price} جنيه مصري (EGP)`
        : "";
    const draftInfo = body.currentDescription?.trim()
      ? `ملاحظات إضافية: ${body.currentDescription.trim()}`
      : "";

    const systemPrompt = `أنت خبير تسويق أزياء وكتابة محتوى وSEO لمتجر "elloll" للملابس والأزياء العصرية في مصر.
اكتب محتوى تسويقياً احترافياً باللغة العربية الفصحى العصرية الممزوجة بلمسة مصرية راقية، وأعد النتيجة بصيغة JSON فقط بدون أي نص خارج JSON بالهيكل التالي تماماً:
{
  "description": "وصف تسويقي جذاب ومقنع للمنتج من 2 إلى 3 جمل يبرز الخامة والراحة وسهولة التنسيق",
  "seo_title": "عنوان مخصص لمحركات البحث Google بين 45 و60 حرف يتضمن اسم المنتج وينتهي بـ | elloll",
  "seo_description": "وصف ميتا لمحركات البحث بين 120 و155 حرف يحفز الشراء ويذكر التوصيل السريع في مصر",
  "seo_keywords": "6 إلى 10 كلمات مفتاحية مفصولة بفواصل بالعربية والإنجليزية تناسب البحث في مصر"
}`;

    const userPrompt = [
      `اسم المنتج: ${name}`,
      categoryInfo,
      priceInfo,
      draftInfo,
    ]
      .filter(Boolean)
      .join("\n");

    const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: cfg.deepseekModel || "deepseek-chat",
        response_format: { type: "json_object" },
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!dsRes.ok) {
      const errTxt = await dsRes.text();
      return NextResponse.json(
        { error: `DeepSeek API error (${dsRes.status}): ${errTxt}` },
        { status: 502 },
      );
    }

    const dsData = (await dsRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawContent = dsData.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(rawContent) as {
      description?: string;
      seo_title?: string;
      seo_description?: string;
      seo_keywords?: string;
    };

    return NextResponse.json({
      ok: true,
      description: (parsed.description ?? "").trim(),
      seo_title: (parsed.seo_title ?? "").trim(),
      seo_description: (parsed.seo_description ?? "").trim(),
      seo_keywords: (parsed.seo_keywords ?? "").trim(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "فشل توليد بيانات المنتج بالـ AI",
      },
      { status: 500 },
    );
  }
}
