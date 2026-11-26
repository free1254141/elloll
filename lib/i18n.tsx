"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "ar" | "en";

const STORAGE_KEY = "elloll-lang";

const translations = {
  ar: {
    // Nav & Common
    home: "الرئيسية",
    collections: "الأقسام",
    products: "المنتجات",
    trackOrder: "تتبع الطلب",
    support: "دعم العملاء",
    cart: "السلة",
    checkout: "إتمام الطلب",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    toggleTheme: "تغيير المظهر",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    loading: "جاري التحميل...",
    // Hero (updated e-commerce copy — no longer cube/puzzle specific)
    heroTitleLead: "أناقتك تبدأ هنا،",
    heroTitleHighlight: "ستايل يناسبك",
    heroSubtitle:
      "وجهتك الأولى لأحدث الملابس والأزياء العصرية في مصر — خامات مختارة بعناية، مقاسات متنوعة، وشحن سريع لجميع المحافظات.",
    heroCtaPrimary: "تسوق التشكيلة",
    heroCtaSupport: "تحدث مع الدعم",
    slide1Title: "كولكشن جديد",
    slide1Desc: "أحدث صيحات الملابس الكاجوال والكلاسيك وصلت الآن.",
    slide2Title: "عروض الموسم",
    slide2Desc: "خصومات حصرية على مختارات الملابس لفترة محدودة.",
    slide3Title: "جودة وخامات ممتازة",
    slide3Desc: "توصيل سريع لجميع محافظات مصر مع إمكانية متابعة طلبك لحظياً.",
    // Featured & Catalog
    shopByCategory: "التسوق حسب القسم",
    featuredProducts: "منتجات مميزة",
    viewAll: "عرض الكل",
    allProducts: "كل المنتجات",
    searchPlaceholder: "ابحث عن منتج...",
    allCategories: "كل الأقسام",
    sortByPrice: "الترتيب حسب السعر",
    priceLowHigh: "السعر: من الأقل للأعلى",
    priceHighLow: "السعر: من الأعلى للأقل",
    viewDetails: "التفاصيل",
    addToCart: "أضف للسلة",
    added: "تمت الإضافة",
    outOfStock: "نفد المخزون",
    noProductsYet: "لا توجد منتجات حالياً.",
    // Footer
    footerTagline:
      "متجر elloll للملابس والأزياء العصرية في مصر — خامات عالية الجودة، شحن لجميع المحافظات، ودعم عملاء مباشر.",
    footerShopHeading: "التسوق والخدمات",
    footerSupportHeading: "خدمة العملاء",
    footerSupportDesc: "عندك استفسار أو محتاج مساعدة في طلبك؟ فريقنا جاهز للرد عليك فوراً.",
    contactSupportBtn: "تواصل مع دعم العملاء",
    copyright: "© 2026 elloll. جميع الحقوق محفوظة.",
    // Track Order
    trackPageTitle: "تتبع طلبك",
    trackPageSubtitle: "أدخل رقم الطلب والبريد الإلكتروني لمتابعة حالة طلبك لحظة بلحظة.",
    // Customer Support (Storefront)
    supportTitle: "دعم العملاء",
    supportSubtitle: "نحن هنا لمساعدتك — أرسل استفسارك أو تابع تذكرتك مباشرة مع فريق الإدارة.",
    newTicketTab: "رسالة جديدة",
    existingTicketTab: "متابعة محادثة",
    yourName: "الاسم الكامل",
    yourEmail: "البريد الإلكتروني",
    orderNumberOptional: "رقم الطلب (اختياري)",
    subjectLabel: "عنوان الاستفسار",
    subjectPlaceholder: "مثال: استفسار عن حالة شحن طلبي",
    messageLabel: "رسالتك",
    messagePlaceholder: "اكتب تفاصيل استفسارك أو مشكلتك هنا...",
    sendSupportBtn: "إرسال للدعم الفني",
    sending: "جاري الإرسال...",
    ticketNumberLabel: "رقم التذكرة",
    ticketNumberPlaceholder: "مثال: SUP-20261125-ABCD",
    openTicketBtn: "فتح المحادثة",
    ticketNotFound: "لم يتم العثور على محادثة بهذه البيانات. تأكد من رقم التذكرة والبريد الإلكتروني.",
    statusOpen: "مفتوحة",
    statusInProgress: "قيد المتابعة",
    statusResolved: "تم الحل",
    statusClosed: "مغلقة",
    replyPlaceholder: "اكتب ردك هنا...",
    sendReply: "إرسال",
    startNewConversation: "بدء محادثة جديدة",
    customerLabel: "أنت",
    adminSupportLabel: "دعم elloll",
    ticketClosedNotice: "تم إغلاق هذه التذكرة. يمكنك بدء محادثة جديدة في أي وقت.",
    ticketSavedHint: "احتفظ برقم التذكرة للرجوع للمحادثة في أي وقت:",
    liveConnected: "متصل مباشرة مع الإدارة",
    // Admin Navigation & Support
    adminBadge: "الإدارة",
    adminDashboard: "لوحة التحكم",
    adminCategories: "الأقسام",
    adminProducts: "المنتجات",
    adminOrders: "الطلبات",
    adminShipping: "أسعار الشحن",
    adminCustomers: "العملاء",
    adminSupport: "دعم العملاء",
    adminAiBot: "شات بوت AI",
    logout: "تسجيل الخروج",
    logoutConfirmTitle: "تسجيل الخروج؟",
    logoutConfirmMsg: "هل أنت متأكد من تسجيل الخروج من لوحة التحكم؟",
    loginTitle: "تسجيل دخول الإدارة",
    loginSubtitle: "أدخل بيانات المسؤول للوصول إلى لوحة التحكم",
    emailOrUsername: "البريد الإلكتروني أو اسم المستخدم",
    password: "كلمة المرور",
    loginBtn: "دخول",
    loggingIn: "جاري الدخول...",
    // Admin Support Manager
    adminSupportTitle: "رسائل ودعم العملاء",
    adminSupportSubtitle: "تواصل مباشر ولحظي مع العملاء ومتابعة التذاكر والاستفسارات.",
    filterAll: "الكل",
    searchTicketsPlaceholder: "ابحث بالاسم، الإيميل، رقم التذكرة أو الطلب...",
    noTicketsFound: "لا توجد رسائل دعم مطابقة حالياً.",
    selectTicketPrompt: "اختر محادثة من القائمة لعرض الرسائل والرد على العميل.",
    adminReplyPlaceholder: "اكتب رد الإدارة للعميل...",
    sendAdminReply: "إرسال الرد",
    linkedOrder: "الطلب المرتبط",
    unreadBadge: "جديد",
    openTicketsCount: "تذاكر مفتوحة",
    // Smart filters & catalog localization
    allFilter: "الكل",
    inStockOnly: "المتوفر فقط",
    priceAll: "كل الأسعار",
    priceUnder500: "أقل من 500",
    price500to1500: "500 - 1,500",
    priceOver1500: "أكثر من 1,500",
    sortNewest: "الأحدث",
    clearFilters: "إعادة ضبط الفلاتر",
    noMatchingProducts: "لا توجد منتجات مطابقة للفلاتر المختارة.",
    tryAnotherFilter: "جرّب تغيير كلمة البحث أو القسم أو نطاق السعر.",
    resultsCount: "منتج",
    previous: "السابق",
    next: "التالي",
    smartFilterTitle: "استكشف المنتجات",
    // Product detail
    backToProducts: "العودة للمنتجات",
    freeShippingOver: "شحن مجاني للطلبات فوق 2,500 ج.م لجميع محافظات مصر",
    readyToShip: "جاهز للشحن خلال 1–2 يوم عمل",
    relatedProducts: "منتجات مشابهة",
    inStockLabel: "متوفر في المخزون",
    onlyLeftLabel: "متبقي فقط",
    // Cart
    yourCart: "سلة التسوق",
    emptyCartTitle: "سلة التسوق فارغة",
    emptyCartDesc: "أضف بعض المنتجات من المتجر وستظهر هنا.",
    browseProducts: "تصفح المنتجات",
    orderSummary: "ملخص الطلب",
    itemsLabel: "المنتجات",
    shippingLabel: "الشحن",
    freeLabel: "مجاني",
    calculatedAtCheckout: "يُحسب عند الدفع",
    totalLabel: "الإجمالي",
    proceedCheckout: "إتمام الطلب",
    stockReservedHint: "يتم حجز المخزون عند تأكيد الطلب.",
    eachLabel: "للوحدة",
    removeUnavailable: "إزالة غير المتوفر",
    cartUpdatedNotice: "تم تحديث السلة لتطابق الأسعار والمخزون الحالي.",
    unavailableRemove: "لم يعد متوفراً — يُرجى الإزالة",
    outOfStockAdjust: "نفد المخزون — عدّل الكمية أو احذفه",
    // Track order
    trackOrderNumberPh: "رقم الطلب (مثال: ORD-20260810-0001)",
    trackEmailPh: "البريد الإلكتروني المستخدم عند الطلب",
    trackBtn: "تتبع الطلب",
    searching: "جاري البحث...",
    trackNotFound: "لم يتم العثور على طلب بهذه البيانات. تأكد من رقم الطلب والبريد الإلكتروني.",
    orderStatusLabel: "الحالة",
    downloadReceipt: "تحميل الفاتورة PDF",
    statusUpdatedLive: "تم تحديث حالة الطلب!",
  },
  en: {
    home: "Home",
    collections: "Collections",
    products: "Products",
    trackOrder: "Track Order",
    support: "Support",
    cart: "Cart",
    checkout: "Checkout",
    lightMode: "Light",
    darkMode: "Dark",
    toggleTheme: "Toggle theme",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    loading: "Loading...",
    heroTitleLead: "Wear your style,",
    heroTitleHighlight: "crafted for Egypt",
    heroSubtitle:
      "Your destination for modern clothing & everyday fashion in Egypt — curated fabrics, great fits, and fast delivery across all governorates.",
    heroCtaPrimary: "Shop the collection",
    heroCtaSupport: "Customer Support",
    slide1Title: "New Collection",
    slide1Desc: "Fresh seasonal styles and everyday essentials just landed.",
    slide2Title: "Season Offers",
    slide2Desc: "Exclusive deals on selected apparel — limited time only.",
    slide3Title: "Premium Fabrics",
    slide3Desc: "Fast shipping across Egypt with real-time order tracking.",
    shopByCategory: "Shop by category",
    featuredProducts: "Featured products",
    viewAll: "View all",
    allProducts: "All Products",
    searchPlaceholder: "Search products…",
    allCategories: "All categories",
    sortByPrice: "Sort by price",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    viewDetails: "View Details",
    addToCart: "Add to Cart",
    added: "Added",
    outOfStock: "Out of stock",
    noProductsYet: "No products yet.",
    // Smart filters & catalog localization
    allFilter: "All",
    inStockOnly: "In stock only",
    priceAll: "Any price",
    priceUnder500: "Under 500",
    price500to1500: "500 - 1,500",
    priceOver1500: "Over 1,500",
    sortNewest: "Newest",
    clearFilters: "Reset filters",
    noMatchingProducts: "No products match those filters.",
    tryAnotherFilter: "Try a different search term, category, or price range.",
    resultsCount: "products",
    previous: "Previous",
    next: "Next",
    smartFilterTitle: "Explore Products",
    backToProducts: "Back to products",
    freeShippingOver: "Free shipping on orders over EGP 2,500 across Egypt",
    readyToShip: "Ready to ship within 1–2 business days",
    relatedProducts: "Related products",
    inStockLabel: "in stock",
    onlyLeftLabel: "left",
    yourCart: "Your cart",
    emptyCartTitle: "Your cart is empty",
    emptyCartDesc: "Add a few items from the catalog and they will appear here.",
    browseProducts: "Browse products",
    orderSummary: "Order summary",
    itemsLabel: "Items",
    shippingLabel: "Shipping",
    freeLabel: "Free",
    calculatedAtCheckout: "Calculated at checkout",
    totalLabel: "Total",
    proceedCheckout: "Checkout",
    stockReservedHint: "Stock is reserved when you place your order.",
    eachLabel: "each",
    removeUnavailable: "Remove unavailable",
    cartUpdatedNotice: "Cart updated to match the current catalog.",
    unavailableRemove: "No longer available — remove",
    outOfStockAdjust: "Out of stock — adjust or remove",
    trackOrderNumberPh: "Order number (e.g., ORD-20260810-0001)",
    trackEmailPh: "Email used at checkout",
    trackBtn: "Track order",
    searching: "Searching…",
    trackNotFound: "No order found with those details. Please check your order number and email.",
    orderStatusLabel: "Status",
    downloadReceipt: "Download receipt",
    statusUpdatedLive: "Order status updated!",
    footerTagline:
      "elloll — Modern clothing & fashion in Egypt, with quality fabrics, nationwide delivery, and live customer support.",
    footerShopHeading: "Shop & Services",
    footerSupportHeading: "Customer Care",
    footerSupportDesc: "Have a question or need help with an order? Our team replies directly.",
    contactSupportBtn: "Contact Customer Support",
    copyright: "© 2026 elloll. All rights reserved.",
    trackPageTitle: "Track your order",
    trackPageSubtitle: "Enter your order number and email to view real-time status and details.",
    supportTitle: "Customer Support",
    supportSubtitle: "We're here to help — start a conversation or follow up directly with our team.",
    newTicketTab: "New Request",
    existingTicketTab: "Continue Chat",
    yourName: "Full Name",
    yourEmail: "Email Address",
    orderNumberOptional: "Order Number (optional)",
    subjectLabel: "Subject",
    subjectPlaceholder: "e.g. Question about my order delivery",
    messageLabel: "Message",
    messagePlaceholder: "Tell us how we can help you...",
    sendSupportBtn: "Send to Support",
    sending: "Sending...",
    ticketNumberLabel: "Ticket Number",
    ticketNumberPlaceholder: "e.g. SUP-20261125-ABCD",
    openTicketBtn: "Open Conversation",
    ticketNotFound: "No conversation found with those details. Check your ticket number and email.",
    statusOpen: "Open",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    statusClosed: "Closed",
    replyPlaceholder: "Write your reply...",
    sendReply: "Send",
    startNewConversation: "Start new conversation",
    customerLabel: "You",
    adminSupportLabel: "elloll Support",
    ticketClosedNotice: "This ticket is closed. Feel free to start a new conversation anytime.",
    ticketSavedHint: "Keep your ticket number to return anytime:",
    liveConnected: "Connected live with Admin",
    adminBadge: "Admin",
    adminDashboard: "Dashboard",
    adminCategories: "Categories",
    adminProducts: "Products",
    adminOrders: "Orders",
    adminShipping: "Shipping Rates",
    adminCustomers: "Customers",
    adminSupport: "Support",
    adminAiBot: "AI Bot",
    logout: "Logout",
    logoutConfirmTitle: "Logout?",
    logoutConfirmMsg: "Are you sure you want to logout from the admin dashboard?",
    loginTitle: "Admin Login",
    loginSubtitle: "Enter your admin credentials to access the dashboard",
    emailOrUsername: "Email or Username",
    password: "Password",
    loginBtn: "Login",
    loggingIn: "Logging in...",
    adminSupportTitle: "Customer Support",
    adminSupportSubtitle: "Real-time customer conversations, inquiries, and ticket management.",
    filterAll: "All",
    searchTicketsPlaceholder: "Search by name, email, ticket # or order #...",
    noTicketsFound: "No support conversations found.",
    selectTicketPrompt: "Select a conversation from the list to view messages and reply.",
    adminReplyPlaceholder: "Write a reply to the customer...",
    sendAdminReply: "Send Reply",
    linkedOrder: "Linked Order",
    unreadBadge: "New",
    openTicketsCount: "Open Tickets",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

interface LanguageContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "ar",
  dir: "rtl",
  setLocale: () => {},
  t: (key) => translations.ar[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "ar") {
        setLocaleState(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }

  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = (key: TranslationKey): string => translations[locale][key];

  return (
    <LanguageContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
