import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiServerConfig } from "@/lib/ai-server-config";
import { notifySupportOnTelegram } from "@/lib/telegram-bot";
import {
  getFeaturedCategories,
  getFeaturedProducts,
  getProductById,
  searchCatalog,
  type CatalogSort,
  type PriceRangeKey,
} from "@/features/catalog/lib/catalog";
import { placeOrder, type PaymentMethod } from "@/features/checkout/lib/checkout";
import type { Product } from "@/features/catalog/lib/catalog";
import { revalidateCatalogCache } from "@/features/catalog/lib/catalog-cache";
import {
  EGYPT_GOVERNORATES,
  SHIPPING_ZONES,
  getGovernorateRate,
  type ShippingZoneId,
} from "@/features/shipping/lib/shipping";
import { getCachedShippingSettings } from "@/features/shipping/lib/shipping-cache";
import type {
  ChatVisuals,
  OutfitCombo,
  OutfitComboItem,
} from "@/features/ai/lib/chat-format";

type ClientAction =
  | { type: "ADD_TO_CART"; product: Product; quantity: number }
  | { type: "UPDATE_CART_QTY"; productId: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_THEME"; theme: "light" | "dark" }
  | { type: "SET_LANGUAGE"; locale: "ar" | "en" }
  | { type: "NAVIGATE"; path: string }
  | { type: "OPEN_AUTH_MODAL"; mode?: "login" | "signup" };

type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

type CartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_featured_products",
      description:
        "Show featured/latest active products in the elloll store as visual product cards in the chat.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", default: 8 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "Get all available clothing categories in the elloll store.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search and filter products in the store by keyword, category slug, min/max EGP price, price range, and sort order. Always check available categories or pass category_slug for broad Egyptian terms like كوتشي, بنطلون, هودي.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword in product name" },
          category_slug: { type: "string", description: "Category slug from list_categories" },
          price_range: {
            type: "string",
            enum: ["all", "under-500", "500-1500", "over-1500"],
          },
          min_price: { type: "number", description: "Minimum price in EGP" },
          max_price: { type: "number", description: "Maximum price in EGP" },
          sort: { type: "string", enum: ["newest", "price-asc", "price-desc"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_outfit_bundle",
      description:
        "Build 1 to 3 complete visual outfit combinations (e.g., pants + sneakers, hoodie + pants) within an optional EGP budget, displaying interactive outfit combo cards with 1-click Add Full Outfit to Cart button and a comparison table.",
      parameters: {
        type: "object",
        properties: {
          budget_egp: { type: "number", description: "Customer total budget in EGP" },
          combos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Outfit combination title in Arabic or user language" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_id: { type: "string" },
                      role_label: { type: "string", description: "Short label like بنطلون or كوتشي or هودي" },
                    },
                    required: ["product_id"],
                  },
                },
              },
              required: ["title", "items"],
            },
          },
        },
        required: ["combos"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_products",
      description:
        "Display an interactive side-by-side comparison widget and exportable table for 2 to 6 products by ID.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          product_ids: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["product_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipping_rates",
      description:
        "Display an interactive shipping rates and delivery timeframe table across Egypt's 27 governorates and 4 shipping zones, including the free shipping threshold.",
      parameters: {
        type: "object",
        properties: {
          governorate: {
            type: "string",
            description: "Optional Egyptian governorate name in Arabic or English",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_size_chart",
      description:
        "Display interactive sizing chart tables for clothing (S to 3XL) and/or shoes & sneakers (40 to 46 EU).",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["clothing", "shoes", "all"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get full details and stock for a specific product by ID.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_cart",
      description:
        "View the customer's current shopping cart items, quantities, subtotal in EGP, and whether they qualify for free shipping (EGP 2500+).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Add a product to the customer's shopping cart.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          quantity: { type: "number", default: 1 },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_cart_quantity",
      description: "Update the quantity of a product already in the customer's cart.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          quantity: { type: "number" },
        },
        required: ["product_id", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Remove a product from the customer's shopping cart.",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_cart",
      description: "Remove all items from the customer's shopping cart.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description:
        "Place a guest order for the customer using items in their cart or explicitly specified items. Always confirm customer name, email, phone, delivery address in Egypt, and payment method (cod, ewallet, bank_transfer) before calling.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          contact_number: { type: "string" },
          delivery_address: { type: "string" },
          payment_method: {
            type: "string",
            enum: ["cod", "ewallet", "bank_transfer"],
          },
          notes: { type: "string" },
          items: {
            type: "array",
            description: "Optional explicit items if cart is empty",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                quantity: { type: "number" },
              },
              required: ["product_id", "quantity"],
            },
          },
        },
        required: [
          "full_name",
          "email",
          "contact_number",
          "delivery_address",
          "payment_method",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_customer_order",
      description:
        "Update an existing customer order (delivery address, phone number, payment method, or notes) verified by order_number and email, while order status is pending or processing.",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string" },
          email: { type: "string" },
          delivery_address: { type: "string" },
          contact_number: { type: "string" },
          payment_method: {
            type: "string",
            enum: ["cod", "ewallet", "bank_transfer"],
          },
          notes: { type: "string" },
        },
        required: ["order_number", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_customer_order",
      description:
        "Cancel/delete an existing customer order verified by order_number and email while status is pending or processing, restoring product stock automatically.",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string" },
          email: { type: "string" },
        },
        required: ["order_number", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "track_order",
      description: "Track an existing order by order_number and customer email.",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string" },
          email: { type: "string" },
        },
        required: ["order_number", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description:
        "Create a customer support ticket and immediately alert the store owner on Telegram.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          subject: { type: "string" },
          message: { type: "string" },
          order_number: { type: "string" },
        },
        required: ["name", "email", "subject", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_support_ticket",
      description:
        "Check an existing customer support ticket status and messages by ticket_number and email.",
      parameters: {
        type: "object",
        properties: {
          ticket_number: { type: "string" },
          email: { type: "string" },
        },
        required: ["ticket_number", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_support_ticket",
      description:
        "Send a follow-up customer message on an existing support ticket and notify Telegram.",
      parameters: {
        type: "object",
        properties: {
          ticket_number: { type: "string" },
          email: { type: "string" },
          message: { type: "string" },
        },
        required: ["ticket_number", "email", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "switch_theme",
      description: "Switch the storefront visual theme between light and dark mode.",
      parameters: {
        type: "object",
        properties: { theme: { type: "string", enum: ["light", "dark"] } },
        required: ["theme"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "switch_language",
      description: "Switch the storefront language between Arabic (ar) and English (en).",
      parameters: {
        type: "object",
        properties: { locale: { type: "string", enum: ["ar", "en"] } },
        required: ["locale"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_store",
      description:
        "Navigate the storefront browser tab to a page (/products, /cart, /checkout, /track, /support).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_auth_dialog",
      description:
        "Open the customer Sign In / Sign Up dialog (Google OAuth & Email/Password) directly in the browser. Always call this when a guest customer wants to log in or register, OR when a guest tries to confirm an order (place_order).",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["login", "signup"] },
        },
      },
    },
  },
];

function resolveCategorySlugFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/كوتشي|حذاء|شوز|سنيكرز|أحذية|جزمة|sneaker|shoe/i.test(lower)) {
    return "shoes-sneakers";
  }
  if (/بنطلون|بناطيل|جينز|سويت بانت|شروال|جوجر|jogger|jeans|pants|sweatpant/i.test(lower)) {
    return "pants-jeans";
  }
  if (/هودي|هوديز|سويت شيرت|بلوفر|hoodie|sweatshirt|pullover/i.test(lower)) {
    return "hoodies-sweatshirts";
  }
  if (/تيشيرت|قميص|بدي|tshirt|t-shirt|shirt/i.test(lower)) {
    return "tshirts-tops";
  }
  if (/طقم رياضي|ترينج|أطقم رياضية|tracksuit/i.test(lower)) {
    return "tracksuits";
  }
  return undefined;
}

const ZONE_ETA_AR: Record<ShippingZoneId, string> = {
  cairo_giza: "1 – 2 يوم عمل",
  alex_delta_canal: "2 – 3 أيام عمل",
  upper_egypt: "3 – 4 أيام عمل",
  frontier: "3 – 5 أيام عمل",
};

function buildSuggestedButtons(executedTools: string[]): string[] {
  const set = new Set(executedTools);
  if (set.has("build_outfit_bundle")) {
    return [
      "أضف أول طقم للسلة",
      "قارن بين التركيبات المقترحة",
      "أسعار الشحن لمحافظتي",
      "اعرض جدول المقاسات",
    ];
  }
  if (set.has("compare_products")) {
    return [
      "أضف أرخص منتج للسلة",
      "رشّح لي طقم متناسق معاه",
      "اعرض جدول المقاسات",
      "أسعار الشحن لمحافظتي",
    ];
  }
  if (set.has("get_shipping_rates")) {
    return [
      "تصفح أحدث المنتجات",
      "عملّي طقم في حدود 1000 ج.م",
      "اعرض جدول المقاسات",
      "محتاج أتتبع طلبي",
    ];
  }
  if (set.has("get_size_chart")) {
    return [
      "تصفح الهوديز والسويت شيرتات",
      "تصفح البنطلونات والسويت بانتس",
      "أسعار الشحن لكل مصر",
    ];
  }
  if (set.has("search_products") || set.has("get_featured_products")) {
    return [
      "قارن بين أفضل المنتجات دي",
      "عملّي طقم كامل بـ 1000 ج.م",
      "اعرض جدول المقاسات",
      "أسعار الشحن لمحافظتي",
    ];
  }
  return [
    "عملّي طقم بنطلون وكوتشي بـ 900 ج.م",
    "تصفح أحدث المنتجات",
    "أسعار الشحن لكل محافظات مصر",
  ];
}

function parseDsmlToolCalls(content: string): Array<{
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}> {
  if (!content || !content.includes("DSML")) return [];
  const calls: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }> = [];
  const invokeRe = /<[^>]*invoke\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/[^>]*invoke>/g;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = invokeRe.exec(content)) !== null) {
    const fnName = m[1];
    const inner = m[2];
    const params: Record<string, unknown> = {};
    const paramRe =
      /<[^>]*parameter\s+name="([^"]+)"(?:\s+string="(true|false)")?[^>]*>([\s\S]*?)<\/[^>]*parameter>/g;
    let pm: RegExpExecArray | null;
    while ((pm = paramRe.exec(inner)) !== null) {
      const k = pm[1];
      const isStr = pm[2] !== "false";
      const val = pm[3].trim();
      if (isStr) {
        params[k] = val;
      } else {
        try {
          params[k] = JSON.parse(val);
        } catch {
          params[k] = val;
        }
      }
    }
    calls.push({
      id: `dsml-${Date.now()}-${idx++}`,
      type: "function",
      function: { name: fnName, arguments: JSON.stringify(params) },
    });
  }
  return calls;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get("visitorId") || "anonymous";
    const sessionId = searchParams.get("sessionId")?.trim() || "";
    const includeHistory = searchParams.get("includeHistory") === "1";

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const [{ data: quota }, convsRes, msgsRes] = await Promise.all([
      supabase.rpc("check_ai_chat_quota", {
        p_visitor_id: visitorId,
      }),
      includeHistory
        ? supabase.rpc("get_customer_ai_conversations", {
            p_visitor_id: visitorId,
            p_limit: 25,
          })
        : Promise.resolve({ data: null }),
      sessionId
        ? supabase.rpc("get_customer_ai_messages", {
            p_session_id: sessionId,
            p_visitor_id: visitorId,
          })
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      quota: quota ?? {
        daily_limit: 20,
        guest_limit: 5,
        used_today: 0,
        remaining: authUser ? 20 : 5,
        allowed: true,
        is_authenticated: Boolean(authUser),
        require_auth: false,
      },
      ...(includeHistory
        ? { conversations: Array.isArray(convsRes.data) ? convsRes.data : [] }
        : {}),
      ...(sessionId
        ? { messages: Array.isArray(msgsRes.data) ? msgsRes.data : [] }
        : {}),
    });
  } catch {
    return NextResponse.json({
      quota: {
        daily_limit: 20,
        guest_limit: 5,
        used_today: 0,
        remaining: 5,
        allowed: true,
        is_authenticated: false,
        require_auth: false,
      },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get("visitorId") || "anonymous";
    const sessionId = searchParams.get("sessionId")?.trim() || "";
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("hide_customer_ai_conversation", {
      p_session_id: sessionId,
      p_visitor_id: visitorId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: Boolean(data) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessageInput[];
      sessionId?: string;
      visitorId?: string;
      cartItems?: CartItemInput[];
    };

    const messages = body.messages ?? [];
    const sessionId = body.sessionId || `sess-${Date.now()}`;
    const visitorId = body.visitorId || "anonymous";
    const cartItems = body.cartItems ?? [];

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user")?.content;

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message provided" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: pubConfig } = await supabase.rpc("get_public_ai_config");
    const aiConfig = (pubConfig ?? {}) as {
      enabled?: boolean;
      mode?: string;
      system_prompt?: string;
      deepseek_model?: string;
    };

    if (aiConfig.enabled === false) {
      return NextResponse.json(
        { error: "AI Assistant is currently disabled by Admin." },
        { status: 403 },
      );
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Enforce guest 5-message gate & signed-in daily AI chat quota (default: 20 messages/day)
    const { data: preQuotaData } = await supabase.rpc("check_ai_chat_quota", {
      p_visitor_id: visitorId,
    });
    const preQuota = (preQuotaData ?? {
      daily_limit: 20,
      guest_limit: 5,
      used_today: 0,
      remaining: authUser ? 20 : 5,
      allowed: true,
      is_authenticated: Boolean(authUser),
      require_auth: false,
    }) as {
      daily_limit: number;
      guest_limit?: number;
      used_today: number;
      remaining: number;
      allowed: boolean;
      is_authenticated?: boolean;
      require_auth?: boolean;
    };

    if (!authUser && (preQuota.require_auth || preQuota.used_today >= 5)) {
      return NextResponse.json(
        {
          requireAuth: true,
          rateLimited: true,
          quota: preQuota,
          reply:
            "أكملت 5 رسائل مجانية كزائر! يرجى تسجيل الدخول بحساب Google أو البريد الإلكتروني لإكمال المحادثة (متاح حتى 20 رسالة يومياً).",
          actions: [{ type: "OPEN_AUTH_MODAL", mode: "login" }],
          products: [],
        },
        { status: 401 },
      );
    }

    if (!preQuota.allowed) {
      return NextResponse.json(
        {
          rateLimited: true,
          quota: preQuota,
          reply: `لقد وصلت إلى الحد اليومي المسموح به (${preQuota.daily_limit} رسالة يومياً). يمكنك متابعة استخدام الشات غداً أو التواصل معنا عبر صفحة دعم العملاء (/support).`,
          actions: [],
          products: [],
        },
        { status: 429 },
      );
    }

    const serverCfg = getAiServerConfig();
    if (!serverCfg.deepseekApiKey) {
      return NextResponse.json({
        reply:
          "المساعد الذكي جاهز، لكن لم يتم إضافة مفتاح DeepSeek API بعد من لوحة تحكم الأدمن (/admin/ai-bot).",
        actions: [],
        products: [],
      });
    }

    const cartContext =
      cartItems.length > 0
        ? `\n\n[Current Customer Cart]:\n${cartItems
            .map(
              (c) =>
                `- ${c.name} (id: ${c.id}) x${c.quantity} = EGP ${(c.price * c.quantity).toFixed(2)}`,
            )
            .join("\n")}`
        : "\n\n[Current Customer Cart]: Empty";

    const authContext = authUser
      ? `\n[Customer Auth Status]: Signed in (${authUser.email ?? authUser.id}). Allowed to place orders.`
      : `\n[Customer Auth Status]: Guest (NOT signed in). Before confirming/placing an order via place_order, OR if the customer asks to sign in/register, you MUST call open_auth_dialog so the login/signup dialog opens in the browser.`;

    const startedAt = Date.now();
    const formattingGuidance = `

[Formatting & Interactive Display Rules]:
- Format replies using clean Markdown: use ### for section headings, bullet lists (- ), and **bold** ONLY around short phrases/names (never wrap prices+text inconsistently or output messy unclosed **).
- All products in the store are ALWAYS available in unlimited stock — NEVER mention stock counts, limited pieces, or out-of-stock warnings.
- Whenever the user asks for an outfit, combo, or combined budget (e.g., "بنطلون وكوتشي ب 1200"), you MUST search BOTH categories first (calling search_products for each category separately), then call build_outfit_bundle with 2–3 curated combos (each containing real product IDs from search results) so interactive Outfit Cards & Comparison Table render!
- Whenever the user asks to compare products, call compare_products with their exact product IDs.
- Whenever the user asks about shipping fees or delivery duration across Egypt, call get_shipping_rates.
- Whenever the user asks about sizes or measurements, call get_size_chart.
- When listing 3+ individual products outside a bundle, also include a clean Markdown table | المنتج | السعر | الميزة | in addition to concise advice.`;

    const systemPrompt = `${aiConfig.system_prompt || "You are elloll AI assistant."}${cartContext}${authContext}${formattingGuidance}`;

    const deepseekMessages: Array<Record<string, unknown>> = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    ];

    const clientActions: ClientAction[] = [];
    const previewProducts: Product[] = [];
    const visuals: ChatVisuals = { tables: [], outfits: [] };
    const executedTools: string[] = [];

    const addPreviewProducts = (items: Product[]) => {
      for (const p of items) {
        if (
          p &&
          !previewProducts.some((x) => x.id === p.id) &&
          previewProducts.length < 16
        ) {
          previewProducts.push(p);
        }
      }
    };

    let finalReply = "";

    for (let step = 0; step < 6; step++) {
      const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serverCfg.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.deepseek_model || serverCfg.deepseekModel || "deepseek-chat",
          messages: deepseekMessages,
          tools: step < 5 ? TOOLS : undefined,
          temperature: 0.1,
        }),
      });

      if (!dsRes.ok) {
        const errText = await dsRes.text();
        return NextResponse.json(
          { error: `DeepSeek API error (${dsRes.status}): ${errText}` },
          { status: 502 },
        );
      }

      const dsData = (await dsRes.json()) as {
        choices?: {
          message?: {
            role?: string;
            content?: string | null;
            tool_calls?: Array<{
              id: string;
              type: "function";
              function: { name: string; arguments: string };
            }>;
          };
        }[];
      };

      const msg = dsData.choices?.[0]?.message;
      if (!msg) break;

      const toolCalls =
        msg.tool_calls && msg.tool_calls.length > 0
          ? msg.tool_calls
          : parseDsmlToolCalls(msg.content ?? "");
      if (toolCalls.length === 0) {
        finalReply = msg.content ?? "";
        break;
      }

      deepseekMessages.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        executedTools.push(fnName);
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}") as Record<
            string,
            unknown
          >;
        } catch {
          args = {};
        }

        let toolResult: unknown = { ok: false };

        if (fnName === "get_featured_products") {
          const limit = Math.min(12, Math.max(1, Number(args.limit ?? 8)));
          const prods = await getFeaturedProducts(supabase, limit);
          addPreviewProducts(prods);
          toolResult = prods;
        } else if (fnName === "list_categories") {
          toolResult = await getFeaturedCategories(supabase);
        } else if (fnName === "search_products") {
          const cats = await getFeaturedCategories(supabase);
          const rawQuery =
            typeof args.query === "string" ? args.query.trim() : "";
          const catSlug =
            (args.category_slug as string | undefined) ||
            resolveCategorySlugFromText(rawQuery);
          const matchedCat = catSlug
            ? cats.find((c) => c.slug === catSlug)
            : undefined;
          let res = await searchCatalog(supabase, {
            q: rawQuery || undefined,
            categoryId: matchedCat?.id,
            priceRange: (args.price_range as PriceRangeKey) || "all",
            sort: (args.sort as CatalogSort) || "newest",
            pageSize: 20,
          });
          // Fall back to category-wide results when colloquial Arabic term doesn't literally appear in product name
          if (res.products.length === 0 && matchedCat && rawQuery) {
            res = await searchCatalog(supabase, {
              categoryId: matchedCat.id,
              priceRange: (args.price_range as PriceRangeKey) || "all",
              sort: (args.sort as CatalogSort) || "newest",
              pageSize: 20,
            });
          }
          const minPrice =
            typeof args.min_price === "number" && Number.isFinite(args.min_price)
              ? args.min_price
              : null;
          const maxPrice =
            typeof args.max_price === "number" && Number.isFinite(args.max_price)
              ? args.max_price
              : null;
          const filtered = res.products.filter((p) => {
            if (minPrice !== null && Number(p.price) < minPrice) return false;
            if (maxPrice !== null && Number(p.price) > maxPrice) return false;
            return true;
          });
          addPreviewProducts(filtered);
          toolResult = filtered;
        } else if (fnName === "build_outfit_bundle") {
          const budget =
            typeof args.budget_egp === "number" && Number.isFinite(args.budget_egp)
              ? args.budget_egp
              : undefined;
          const rawCombos = Array.isArray(args.combos) ? args.combos : [];
          const builtCombos: OutfitCombo[] = [];

          for (const rawCombo of rawCombos.slice(0, 4)) {
            const comboObj = (rawCombo ?? {}) as {
              title?: string;
              items?: Array<{ product_id?: string; role_label?: string }>;
            };
            const rawItems = Array.isArray(comboObj.items) ? comboObj.items : [];
            const resolvedItems: OutfitComboItem[] = [];
            for (const it of rawItems) {
              const pid = String(it?.product_id ?? "").trim();
              if (!pid) continue;
              const prod = await getProductById(supabase, pid);
              if (prod) {
                resolvedItems.push({
                  product: prod,
                  roleLabel: it?.role_label ? String(it.role_label) : undefined,
                });
              }
            }
            if (resolvedItems.length > 0) {
              const totalEgp = Number(
                resolvedItems
                  .reduce((sum, x) => sum + Number(x.product.price), 0)
                  .toFixed(2),
              );
              const remainingEgp =
                budget !== undefined ? Number((budget - totalEgp).toFixed(2)) : undefined;
              builtCombos.push({
                title: String(comboObj.title || "تركيبة مقترحة"),
                items: resolvedItems,
                totalEgp,
                budgetEgp: budget,
                remainingEgp,
                withinBudget: budget !== undefined ? totalEgp <= budget : true,
              });
              addPreviewProducts(resolvedItems.map((x) => x.product));
            }
          }

          if (builtCombos.length > 0) {
            visuals.outfits = [...(visuals.outfits ?? []), ...builtCombos];
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `outfit-summary-${Date.now()}`,
                title: "ملخص ومقارنة التركيبات",
                headers: [
                  "التركيبة",
                  "القطع المختارة",
                  "الإجمالي",
                  ...(budget !== undefined ? ["حالة الميزانية"] : []),
                ],
                rows: builtCombos.map((c) => [
                  c.title,
                  c.items.map((x) => x.product.name).join(" + "),
                  `${c.totalEgp} ج.م`,
                  ...(budget !== undefined
                    ? [
                        c.withinBudget
                          ? `داخل الميزانية (متبقي ${Math.max(0, c.remainingEgp ?? 0)} ج.م)`
                          : `أعلى من الميزانية بـ ${Math.abs(c.remainingEgp ?? 0)} ج.م`,
                      ]
                    : []),
                ]),
              },
            ];
          }
          toolResult = {
            ok: builtCombos.length > 0,
            combos: builtCombos.map((c) => ({
              title: c.title,
              total_egp: c.totalEgp,
              remaining_egp: c.remainingEgp,
              within_budget: c.withinBudget,
              items: c.items.map((x) => ({
                id: x.product.id,
                name: x.product.name,
                price: x.product.price,
              })),
            })),
          };
        } else if (fnName === "compare_products") {
          const ids = Array.isArray(args.product_ids)
            ? args.product_ids.map((x) => String(x).trim()).filter(Boolean).slice(0, 6)
            : [];
          const cats = await getFeaturedCategories(supabase);
          const compared: Array<Product & { categoryName?: string }> = [];
          for (const pid of ids) {
            const p = await getProductById(supabase, pid);
            if (p) {
              const cat = cats.find((c) => c.id === p.category_id);
              compared.push({ ...p, categoryName: cat?.name });
            }
          }
          if (compared.length > 0) {
            addPreviewProducts(compared);
            const title = String(args.title || "مقارنة المنتجات");
            visuals.comparison = { title, products: compared };
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `compare-${Date.now()}`,
                title,
                headers: ["المنتج", "القسم", "السعر", "الوصف"],
                rows: compared.map((p) => [
                  p.name,
                  p.categoryName || "elloll",
                  `${Number(p.price)} ج.م`,
                  (p.description || "").slice(0, 75),
                ]),
              },
            ];
          }
          toolResult = { ok: compared.length > 0, products: compared };
        } else if (fnName === "get_shipping_rates") {
          const settings = await getCachedShippingSettings();
          const queryGov =
            typeof args.governorate === "string"
              ? args.governorate.trim().toLowerCase()
              : "";
          const matchedGovs = queryGov
            ? EGYPT_GOVERNORATES.filter(
                (g) =>
                  g.nameAr.includes(queryGov) ||
                  g.nameEn.toLowerCase().includes(queryGov),
              )
            : [];
          if (matchedGovs.length > 0) {
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `shipping-gov-${Date.now()}`,
                title: "أسعار الشحن حسب المحافظة",
                headers: ["المحافظة", "رسوم الشحن", "مدة التوصيل", "الشحن المجاني"],
                rows: matchedGovs.map((g) => {
                  const fee = getGovernorateRate(settings, g.code);
                  return [
                    g.nameAr,
                    `${fee} ج.م`,
                    ZONE_ETA_AR[g.zone],
                    `فوق ${settings.free_shipping_threshold} ج.م مجاني`,
                  ];
                }),
              },
            ];
            toolResult = {
              free_shipping_threshold: settings.free_shipping_threshold,
              governorates: matchedGovs.map((g) => ({
                name_ar: g.nameAr,
                fee_egp: getGovernorateRate(settings, g.code),
                eta_ar: ZONE_ETA_AR[g.zone],
              })),
            };
          } else {
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `shipping-zones-${Date.now()}`,
                title: "أسعار الشحن لجميع مناطق مصر (27 محافظة)",
                headers: ["المنطقة", "رسوم الشحن", "مدة التوصيل", "الشحن المجاني"],
                rows: SHIPPING_ZONES.map((z) => [
                  z.nameAr,
                  `${settings.zone_rates[z.id] ?? z.defaultRate} ج.م`,
                  ZONE_ETA_AR[z.id],
                  `فوق ${settings.free_shipping_threshold} ج.م مجاني`,
                ]),
              },
            ];
            toolResult = {
              free_shipping_threshold: settings.free_shipping_threshold,
              zones: SHIPPING_ZONES.map((z) => ({
                name_ar: z.nameAr,
                fee_egp: settings.zone_rates[z.id] ?? z.defaultRate,
                eta_ar: ZONE_ETA_AR[z.id],
              })),
            };
          }
        } else if (fnName === "get_size_chart") {
          const chartType = String(args.type || "all");
          if (chartType === "clothing" || chartType === "all") {
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `size-clothing-${Date.now()}`,
                title: "دليل مقاسات الملابس (هوديز وسويت شيرتات)",
                headers: ["المقاس", "عرض الصدر", "الطول الكلي", "الوزن المناسب"],
                rows: [
                  ["S", "52 سم", "67 سم", "55 – 65 كجم"],
                  ["M", "55 سم", "69 سم", "65 – 75 كجم"],
                  ["L", "58 سم", "72 سم", "75 – 85 كجم"],
                  ["XL", "61 سم", "74 سم", "85 – 95 كجم"],
                  ["2XL", "64 سم", "76 سم", "95 – 108 كجم"],
                  ["3XL", "67 سم", "78 سم", "108 – 120 كجم"],
                ],
              },
            ];
          }
          if (chartType === "shoes" || chartType === "all") {
            visuals.tables = [
              ...(visuals.tables ?? []),
              {
                id: `size-shoes-${Date.now()}`,
                title: "دليل مقاسات الأحذية والسنيكرز (EU)",
                headers: ["المقاس (EU)", "طول القدم الداخلي"],
                rows: [
                  ["40", "25.0 سم"],
                  ["41", "25.5 سم"],
                  ["42", "26.5 سم"],
                  ["43", "27.0 سم"],
                  ["44", "28.0 سم"],
                  ["45", "28.5 سم"],
                  ["46", "29.5 سم"],
                ],
              },
            ];
          }
          toolResult = { ok: true, displayed: chartType };
        } else if (fnName === "get_product_details") {
          const prod = await getProductById(
            supabase,
            String(args.product_id ?? ""),
          );
          if (prod) addPreviewProducts([prod]);
          toolResult = prod ?? { error: "Product not found" };
        } else if (fnName === "view_cart") {
          const subtotal = cartItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          toolResult = {
            items: cartItems,
            count: cartItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal_egp: Number(subtotal.toFixed(2)),
            free_shipping_eligible: subtotal >= 2500,
          };
        } else if (fnName === "add_to_cart") {
          const prod = await getProductById(
            supabase,
            String(args.product_id ?? ""),
          );
          const qty = Math.max(1, Number(args.quantity ?? 1));
          if (!prod) {
            toolResult = { error: "Product not found" };
          } else {
            clientActions.push({
              type: "ADD_TO_CART",
              product: prod,
              quantity: Math.min(qty, 99),
            });
            toolResult = {
              ok: true,
              added: prod.name,
              quantity: Math.min(qty, 99),
            };
          }
        } else if (fnName === "update_cart_quantity") {
          const prodId = String(args.product_id ?? "");
          const qty = Math.max(1, Number(args.quantity ?? 1));
          clientActions.push({
            type: "UPDATE_CART_QTY",
            productId: prodId,
            quantity: qty,
          });
          toolResult = { ok: true, product_id: prodId, quantity: qty };
        } else if (fnName === "remove_from_cart") {
          clientActions.push({
            type: "REMOVE_FROM_CART",
            productId: String(args.product_id ?? ""),
          });
          toolResult = { ok: true };
        } else if (fnName === "clear_cart") {
          clientActions.push({ type: "CLEAR_CART" });
          toolResult = { ok: true };
        } else if (fnName === "place_order") {
          if (!authUser) {
            if (!clientActions.some((a) => a.type === "OPEN_AUTH_MODAL")) {
              clientActions.push({ type: "OPEN_AUTH_MODAL", mode: "login" });
            }
            toolResult = {
              ok: false,
              require_auth: true,
              error:
                "Customer must sign in before confirming an order. The Sign In / Sign Up dialog (Google or Email) is now open in the browser.",
            };
          } else {
            const explicitItems = Array.isArray(args.items)
              ? (args.items as Array<{ product_id: string; quantity: number }>)
              : [];
            const orderItems =
              explicitItems.length > 0
                ? explicitItems.map((i) => ({
                    product_id: String(i.product_id),
                    quantity: Math.max(1, Number(i.quantity ?? 1)),
                  }))
                : cartItems.map((c) => ({
                    product_id: c.id,
                    quantity: c.quantity,
                  }));

            if (orderItems.length === 0) {
              toolResult = {
                error: "Cart is empty. Add items to the cart before placing an order.",
              };
            } else {
              const orderRes = await placeOrder(
                supabase,
                {
                  fullName: String(args.full_name ?? authUser.user_metadata?.full_name ?? ""),
                  email: String(args.email ?? authUser.email ?? ""),
                  contactNumber: String(args.contact_number ?? ""),
                  deliveryAddress: String(args.delivery_address ?? ""),
                  paymentMethod: (String(args.payment_method ?? "cod") as PaymentMethod),
                  notes: args.notes ? String(args.notes) : undefined,
                },
              orderItems.map((i) => ({
                productId: i.product_id,
                quantity: i.quantity,
              })),
            );
            if (!orderRes.ok) {
              toolResult = { error: orderRes.message, code: orderRes.code };
            } else {
              revalidateCatalogCache();
              clientActions.push({ type: "CLEAR_CART" });
              toolResult = {
                ok: true,
                order_number: orderRes.orderNumber,
                total_amount: orderRes.totalAmount,
              };
            }
            }
          }
        } else if (fnName === "update_customer_order") {
          const { data: updData, error: updErr } = await supabase.rpc(
            "update_customer_order",
            {
              p_order_number: String(args.order_number ?? ""),
              p_email: String(args.email ?? ""),
              p_delivery_address: args.delivery_address
                ? String(args.delivery_address)
                : null,
              p_contact_number: args.contact_number
                ? String(args.contact_number)
                : null,
              p_payment_method: args.payment_method
                ? String(args.payment_method)
                : null,
              p_notes: args.notes ? String(args.notes) : null,
            },
          );
          toolResult = updErr
            ? { error: updErr.message }
            : { ok: true, order: updData };
        } else if (fnName === "cancel_customer_order") {
          const { data: canData, error: canErr } = await supabase.rpc(
            "cancel_customer_order",
            {
              p_order_number: String(args.order_number ?? ""),
              p_email: String(args.email ?? ""),
            },
          );
          if (!canErr) revalidateCatalogCache();
          toolResult = canErr
            ? { error: canErr.message }
            : { ok: true, result: canData };
        } else if (fnName === "track_order") {
          const { data: trackData, error: trackErr } = await supabase.rpc(
            "track_order",
            {
              p_order_number: String(args.order_number ?? ""),
              p_email: String(args.email ?? ""),
            },
          );
          toolResult = trackErr
            ? { error: trackErr.message }
            : trackData ?? { error: "Order not found" };
        } else if (fnName === "create_support_ticket") {
          const { data: supData, error: supErr } = await supabase.rpc(
            "create_support_ticket",
            {
              p_name: String(args.name ?? ""),
              p_email: String(args.email ?? ""),
              p_subject: String(args.subject ?? ""),
              p_message: String(args.message ?? ""),
              p_order_number: args.order_number
                ? String(args.order_number)
                : null,
            },
          );
          if (supErr) {
            toolResult = { error: supErr.message };
          } else {
            const tk = supData as { ticket_number?: string };
            await notifySupportOnTelegram({
              ticketNumber: tk.ticket_number ?? "SUP",
              customerName: String(args.name ?? ""),
              customerEmail: String(args.email ?? ""),
              subject: String(args.subject ?? ""),
              message: String(args.message ?? ""),
              orderNumber: args.order_number ? String(args.order_number) : null,
            });
            toolResult = { ok: true, ticket: supData };
          }
        } else if (fnName === "check_support_ticket") {
          const { data: tkData, error: tkErr } = await supabase.rpc(
            "get_support_ticket",
            {
              p_ticket_number: String(args.ticket_number ?? ""),
              p_email: String(args.email ?? ""),
            },
          );
          toolResult = tkErr
            ? { error: tkErr.message }
            : tkData ?? { error: "Ticket not found" };
        } else if (fnName === "reply_support_ticket") {
          const { data: repData, error: repErr } = await supabase.rpc(
            "add_customer_support_message",
            {
              p_ticket_number: String(args.ticket_number ?? ""),
              p_email: String(args.email ?? ""),
              p_body: String(args.message ?? ""),
            },
          );
          if (repErr) {
            toolResult = { error: repErr.message };
          } else {
            const tk = repData as {
              ticket_number?: string;
              customer_name?: string;
              customer_email?: string;
              subject?: string;
              order_number?: string | null;
            };
            await notifySupportOnTelegram({
              ticketNumber: tk.ticket_number ?? String(args.ticket_number ?? ""),
              customerName: tk.customer_name ?? "Customer",
              customerEmail: tk.customer_email ?? String(args.email ?? ""),
              subject: tk.subject ?? "Support Follow-up",
              message: String(args.message ?? ""),
              orderNumber: tk.order_number ?? null,
              isReply: true,
            });
            toolResult = { ok: true, ticket: repData };
          }
        } else if (fnName === "switch_theme") {
          const themeVal = args.theme === "light" ? "light" : "dark";
          clientActions.push({ type: "SET_THEME", theme: themeVal });
          toolResult = { ok: true, theme: themeVal };
        } else if (fnName === "switch_language") {
          const locVal = args.locale === "en" ? "en" : "ar";
          clientActions.push({ type: "SET_LANGUAGE", locale: locVal });
          toolResult = { ok: true, locale: locVal };
        } else if (fnName === "navigate_store") {
          const targetPath = String(args.path ?? "/products");
          clientActions.push({ type: "NAVIGATE", path: targetPath });
          toolResult = { ok: true, navigatedTo: targetPath };
        } else if (fnName === "open_auth_dialog") {
          const mode = args.mode === "signup" ? "signup" : "login";
          if (!clientActions.some((a) => a.type === "OPEN_AUTH_MODAL")) {
            clientActions.push({ type: "OPEN_AUTH_MODAL", mode });
          }
          toolResult = {
            ok: true,
            opened: true,
            mode,
            signed_in: Boolean(authUser),
          };
        }

        deepseekMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    if (!finalReply) {
      finalReply = "تم تنفيذ طلبك بنجاح! هل تحتاج أي مساعدة أخرى؟";
    }

    // Persist conversation & increment daily chat user analytics + quota
    await supabase.rpc("save_ai_chat_turn", {
      p_session_id: sessionId,
      p_visitor_id: visitorId,
      p_user_msg: lastUserMessage,
      p_assistant_msg: finalReply,
      p_tool_calls: executedTools.length > 0 ? executedTools : null,
    });

    const { data: postQuota } = await supabase.rpc("check_ai_chat_quota", {
      p_visitor_id: visitorId,
    });

    const latencyMs = Date.now() - startedAt;
    const uniqueTools = [...new Set(executedTools)];
    const hasVisuals =
      (visuals.tables?.length ?? 0) > 0 ||
      (visuals.outfits?.length ?? 0) > 0 ||
      Boolean(visuals.comparison);

    return NextResponse.json({
      reply: finalReply,
      actions: clientActions,
      products: previewProducts,
      ...(hasVisuals ? { visuals } : {}),
      suggestedButtons: buildSuggestedButtons(uniqueTools),
      toolsUsed: uniqueTools,
      latencyMs,
      quota: postQuota ?? {
        daily_limit: preQuota.daily_limit,
        guest_limit: preQuota.guest_limit ?? 5,
        used_today: preQuota.used_today + 1,
        remaining: Math.max(
          0,
          (authUser ? preQuota.daily_limit : preQuota.guest_limit ?? 5) -
            (preQuota.used_today + 1),
        ),
        allowed:
          preQuota.used_today + 1 <
          (authUser ? preQuota.daily_limit : preQuota.guest_limit ?? 5),
        is_authenticated: Boolean(authUser),
        require_auth: !authUser && preQuota.used_today + 1 >= 5,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI chat error" },
      { status: 500 },
    );
  }
}
