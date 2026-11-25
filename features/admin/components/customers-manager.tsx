"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Search, Users } from "lucide-react";
import {
  listCustomers,
  type CustomerSort,
  type CustomerSummary,
} from "@/features/admin/lib/customers/customers";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/ui/column-header";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";

export function CustomersManager({
  initialCustomers,
  initialSort,
}: {
  initialCustomers: CustomerSummary[];
  initialSort: CustomerSort;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const priceFormatter = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  });

  const [customers, setCustomers] = useState(initialCustomers);
  const [searchDraft, setSearchDraft] = useState("");
  const [sort, setSort] = useState<CustomerSort>(initialSort);
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (sort !== initialSort) {
      const supabase = createClient();
      void listCustomers(supabase, { sort }).then((rows) => setCustomers(rows));
    } else {
      setCustomers(initialCustomers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCustomers]);

  async function handleSortChange(next: CustomerSort) {
    if (next === sort || inFlightRef.current) return;
    inFlightRef.current = true;
    setSort(next);
    setRefreshing(true);
    try {
      const supabase = createClient();
      setCustomers(await listCustomers(supabase, { sort: next }));
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.contactNumber.replace(/\s+/g, "").includes(q.replace(/\s+/g, "")),
    );
  }, [customers, searchDraft]);

  function clearFilters() {
    setSearchDraft("");
    void handleSortChange("name");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "العملاء" : "Customers"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAr
            ? "تُحسب أعداد الطلبات وإجمالي الإنفاق تلقائياً باستبعاد الطلبات الملغاة."
            : "Order counts and total spend are computed live — cancelled orders are excluded from both."}
        </p>
      </div>

      {/* Toolbar: search */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={
              isAr ? "ابحث بالاسم أو البريد أو رقم الهاتف…" : "Search by name, email, or number…"
            }
            aria-label={isAr ? "البحث في العملاء" : "Search customers"}
            className="ps-8"
          />
        </div>
        {refreshing && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Table */}
      <div className="min-h-[400px] max-h-[600px] overflow-x-auto overflow-y-auto rounded-xl border border-border bg-background">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 text-start font-medium">{isAr ? "العميل" : "Customer"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "التواصل" : "Contact"}</th>
              <ColumnHeader
                label={isAr ? "الطلبات" : "Orders"}
                className="px-4 py-3 text-start font-medium"
                sortValue={sort === "orders-asc" ? "asc" : sort === "orders-desc" ? "desc" : ""}
                onSortChange={(v) =>
                  void handleSortChange(v ? (`orders-${v}` as CustomerSort) : "name")
                }
              />
              <ColumnHeader
                label={isAr ? "إجمالي الإنفاق" : "Total spent"}
                className="px-4 py-3 text-start font-medium"
                sortValue={sort === "spent-asc" ? "asc" : sort === "spent-desc" ? "desc" : ""}
                onSortChange={(v) =>
                  void handleSortChange(v ? (`spent-${v}` as CustomerSort) : "name")
                }
              />
              <th className="px-4 py-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
              <th className="px-4 py-3 text-end font-medium">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  {customers.length === 0 ? (
                    <>
                      <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        {isAr
                          ? "لا يوجد عملاء بعد — يتم إنشاؤهم تلقائياً عند إتمام أول طلب."
                          : "No customers yet — they're created at checkout when guests place their first order."}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {isAr ? "لا يوجد عملاء مطابقون للبحث." : "No customers match this search."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-4"
                      >
                        {isAr ? "مسح الفلاتر" : "Clear filters"}
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.fullName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                      {customer.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {customer.contactNumber}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{customer.orderCount}</td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {priceFormatter.format(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        customer.accountStatus === "active"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          customer.accountStatus === "active"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground"
                        }`}
                      />
                      {customer.accountStatus === "active"
                        ? isAr
                          ? "نشط"
                          : "Active"
                        : isAr
                          ? "غير نشط"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={
                          isAr
                            ? `عرض سجل طلبات ${customer.fullName}`
                            : `View order history for ${customer.fullName}`
                        }
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden text-xs font-medium sm:inline">
                          {isAr ? "عرض" : "View"}
                        </span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {isAr
          ? "عدد الطلبات وإجمالي الإنفاق يستبعدان الطلبات الملغاة تلقائياً."
          : "Order counts and totals exclude cancelled orders (computed live, never stored)."}
      </p>
    </div>
  );
}
