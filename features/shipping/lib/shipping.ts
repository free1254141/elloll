export type ShippingZoneId =
  | "cairo_giza"
  | "alex_delta_canal"
  | "upper_egypt"
  | "frontier";

export type GovernorateInfo = {
  code: string;
  nameAr: string;
  nameEn: string;
  zone: ShippingZoneId;
};

export type ShippingZoneInfo = {
  id: ShippingZoneId;
  nameAr: string;
  nameEn: string;
  defaultRate: number;
};

export const SHIPPING_ZONES: ShippingZoneInfo[] = [
  {
    id: "cairo_giza",
    nameAr: "القاهرة الكبرى",
    nameEn: "Greater Cairo",
    defaultRate: 50,
  },
  {
    id: "alex_delta_canal",
    nameAr: "الإسكندرية والدلتا والقناة",
    nameEn: "Alexandria, Delta & Canal",
    defaultRate: 65,
  },
  {
    id: "upper_egypt",
    nameAr: "محافظات الصعيد",
    nameEn: "Upper Egypt",
    defaultRate: 85,
  },
  {
    id: "frontier",
    nameAr: "البحر الأحمر والمحافظات الحدودية",
    nameEn: "Red Sea & Border Governorates",
    defaultRate: 110,
  },
];

export const EGYPT_GOVERNORATES: GovernorateInfo[] = [
  { code: "cairo", nameAr: "القاهرة", nameEn: "Cairo", zone: "cairo_giza" },
  { code: "giza", nameAr: "الجيزة", nameEn: "Giza", zone: "cairo_giza" },
  { code: "qalyubia", nameAr: "القليوبية", nameEn: "Qalyubia", zone: "cairo_giza" },

  { code: "alexandria", nameAr: "الإسكندرية", nameEn: "Alexandria", zone: "alex_delta_canal" },
  { code: "dakahlia", nameAr: "الدقهلية", nameEn: "Dakahlia", zone: "alex_delta_canal" },
  { code: "sharqia", nameAr: "الشرقية", nameEn: "Sharqia", zone: "alex_delta_canal" },
  { code: "gharbia", nameAr: "الغربية", nameEn: "Gharbia", zone: "alex_delta_canal" },
  { code: "monufia", nameAr: "المنوفية", nameEn: "Monufia", zone: "alex_delta_canal" },
  { code: "beheira", nameAr: "البحيرة", nameEn: "Beheira", zone: "alex_delta_canal" },
  { code: "kafr_el_sheikh", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", zone: "alex_delta_canal" },
  { code: "damietta", nameAr: "دمياط", nameEn: "Damietta", zone: "alex_delta_canal" },
  { code: "port_said", nameAr: "بورسعيد", nameEn: "Port Said", zone: "alex_delta_canal" },
  { code: "ismailia", nameAr: "الإسماعيلية", nameEn: "Ismailia", zone: "alex_delta_canal" },
  { code: "suez", nameAr: "السويس", nameEn: "Suez", zone: "alex_delta_canal" },

  { code: "fayoum", nameAr: "الفيوم", nameEn: "Fayoum", zone: "upper_egypt" },
  { code: "beni_suef", nameAr: "بني سويف", nameEn: "Beni Suef", zone: "upper_egypt" },
  { code: "minya", nameAr: "المنيا", nameEn: "Minya", zone: "upper_egypt" },
  { code: "asyut", nameAr: "أسيوط", nameEn: "Asyut", zone: "upper_egypt" },
  { code: "sohag", nameAr: "سوهاج", nameEn: "Sohag", zone: "upper_egypt" },
  { code: "qena", nameAr: "قنا", nameEn: "Qena", zone: "upper_egypt" },
  { code: "luxor", nameAr: "الأقصر", nameEn: "Luxor", zone: "upper_egypt" },
  { code: "aswan", nameAr: "أسوان", nameEn: "Aswan", zone: "upper_egypt" },

  { code: "red_sea", nameAr: "البحر الأحمر", nameEn: "Red Sea", zone: "frontier" },
  { code: "matrouh", nameAr: "مطروح", nameEn: "Matrouh", zone: "frontier" },
  { code: "new_valley", nameAr: "الوادي الجديد", nameEn: "New Valley", zone: "frontier" },
  { code: "north_sinai", nameAr: "شمال سيناء", nameEn: "North Sinai", zone: "frontier" },
  { code: "south_sinai", nameAr: "جنوب سيناء", nameEn: "South Sinai", zone: "frontier" },
];

export type ShippingSettings = {
  free_shipping_threshold: number;
  zone_rates: Record<ShippingZoneId, number>;
  governorate_rates: Record<string, number>;
};

const DEFAULT_ZONE_RATES: Record<ShippingZoneId, number> = {
  cairo_giza: 50,
  alex_delta_canal: 65,
  upper_egypt: 85,
  frontier: 110,
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  free_shipping_threshold: 2500,
  zone_rates: DEFAULT_ZONE_RATES,
  governorate_rates: Object.fromEntries(
    EGYPT_GOVERNORATES.map((g) => [g.code, DEFAULT_ZONE_RATES[g.zone]]),
  ),
};

export function getGovernorateLabel(
  code: string | null | undefined,
  locale: "ar" | "en" = "ar",
): string {
  if (!code) return "";
  const match = EGYPT_GOVERNORATES.find((g) => g.code === code);
  if (!match) return code;
  return locale === "ar" ? match.nameAr : match.nameEn;
}

export function getGovernorateRate(
  settings: ShippingSettings,
  governorateCode: string | null | undefined,
): number {
  if (!governorateCode) return 0;
  const raw = settings.governorate_rates?.[governorateCode];
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  const gov = EGYPT_GOVERNORATES.find((g) => g.code === governorateCode);
  if (!gov) return 0;
  return settings.zone_rates?.[gov.zone] ?? DEFAULT_ZONE_RATES[gov.zone];
}

export function calculateShippingFee(
  settings: ShippingSettings,
  governorateCode: string | null | undefined,
  subtotal: number,
): number {
  if (!governorateCode) return 0;
  if (
    settings.free_shipping_threshold > 0 &&
    subtotal >= settings.free_shipping_threshold
  ) {
    return 0;
  }
  return getGovernorateRate(settings, governorateCode);
}
