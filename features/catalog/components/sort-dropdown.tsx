"use client";

import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n";
import type { CatalogSort } from "@/features/catalog/lib/catalog";

export function SortDropdown({
  value,
  onChange,
}: {
  value: CatalogSort | "";
  onChange: (next: CatalogSort) => void;
}) {
  const { t, dir } = useLanguage();
  const normalized: CatalogSort = value === "" ? "newest" : value;

  const options: {
    value: CatalogSort;
    label: string;
    icon: typeof Sparkles;
  }[] = [
    { value: "newest", label: t("sortNewest"), icon: Sparkles },
    { value: "price-asc", label: t("priceLowHigh"), icon: ArrowUpNarrowWide },
    { value: "price-desc", label: t("priceHighLow"), icon: ArrowDownWideNarrow },
  ];

  const activeOption =
    options.find((opt) => opt.value === normalized) ?? options[0];

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("sortByPrice")}
          className="group inline-flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-amber-500/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-auto sm:min-w-[175px]"
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span className="truncate">{activeOption.label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={dir === "rtl" ? "start" : "end"}
        className="min-w-[200px] rounded-xl border-border/80 p-1.5 shadow-xl"
      >
        {options.map((opt) => {
          const active = opt.value === normalized;
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                active
                  ? "bg-amber-500/15 font-semibold text-amber-500 focus:bg-amber-500/20 focus:text-amber-500"
                  : "text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="flex-1 truncate">{opt.label}</span>
              {active && <Check className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
