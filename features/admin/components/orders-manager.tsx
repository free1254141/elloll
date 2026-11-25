"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Ban, Download, Eye, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  listOrders,
  availableTransitions,
  ordersToCsv,
  LIFECYCLE,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  type OrderListItem,
  type OrderStatus,
} from "@/features/admin/lib/orders/orders";
import { type PaymentMethod } from "@/features/checkout/lib/checkout";
import { transitionOrderStatusAction } from "@/features/admin/actions/orders";
import { OrderStatusBadge } from "@/features/admin/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/ui/column-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { StatusDropdown } from "@/components/ui/status-dropdown";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

type ToastState = {
  message: string;
  tone: "success" | "error";
  id: number;
};

export function OrdersManager({
  initialOrders,
  initialStatus,
}: {
  initialOrders: OrderListItem[];
  initialStatus?: OrderStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const priceFormatter = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  });
  const dateFormatter = new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(
    initialStatus ?? "all",
  );
  const [searchDraft, setSearchDraft] = useState("");
  const [itemsSort, setItemsSort] = useState<"asc" | "desc" | "">("");
  const [totalSort, setTotalSort] = useState<"asc" | "desc" | "">("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    order: OrderListItem;
    newStatus: OrderStatus;
  } | null>(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function handleItemsSortChange(value: "asc" | "desc" | "") {
    setItemsSort(value);
    if (value) setTotalSort("");
  }

  function handleTotalSortChange(value: "asc" | "desc" | "") {
    setTotalSort(value);
    if (value) setItemsSort("");
  }

  function clearFilters() {
    setSearchDraft("");
    setStatusFilter("all");
    setPaymentFilter("");
    setItemsSort("");
    setTotalSort("");
  }

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  function showToast(message: string, tone: ToastState["tone"]) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function refresh() {
    const supabase = createClient();
    setOrders(await listOrders(supabase));
  }

  function handleStatusFilterChange(status: OrderStatus | "all") {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    const qs = params.toString();
    router.replace(qs ? `/admin/orders?${qs}` : "/admin/orders");
  }

  const filtered = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    let result = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (paymentFilter && order.paymentMethod !== paymentFilter) return false;
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q)
      );
    });

    if (itemsSort) {
      result = [...result].sort((a, b) =>
        itemsSort === "asc" ? a.itemsCount - b.itemsCount : b.itemsCount - a.itemsCount,
      );
    }

    if (totalSort) {
      result = [...result].sort((a, b) =>
        totalSort === "asc" ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount,
      );
    }

    return result;
  }, [orders, statusFilter, paymentFilter, searchDraft, itemsSort, totalSort]);

  async function handleTransition(order: OrderListItem, next: OrderStatus) {
    if (inFlightRef.current) return;
    const label = getOrderStatusLabel(next, locale);
    const message =
      next === "cancelled"
        ? isAr
          ? `تم إلغاء الطلب ${order.orderNumber} واسترجاع المخزون.`
          : `Order ${order.orderNumber} cancelled. Stock restored.`
        : isAr
          ? `حالة الطلب ${order.orderNumber} الآن: ${label}`
          : `Order ${order.orderNumber} is now ${label}`;
    inFlightRef.current = true;
    setBusyId(order.id);
    try {
      const result = await transitionOrderStatusAction(order.id, next);
      if (result.ok) {
        showToast(message, "success");
        await refresh();
      } else {
        showToast(result.message, "error");
      }
    } finally {
      inFlightRef.current = false;
      setBusyId(null);
      setStatusModal(null);
    }
  }

  function handleExport() {
    const blob = new Blob([ordersToCsv(filtered)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elloll-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const chipCount = (status: OrderStatus | "all") =>
    status === "all"
      ? orders.length
      : orders.filter((order) => order.status === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "الطلبات" : "Orders"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAr
            ? "متابعة مراحل تنفيذ الطلبات، إلغاؤها مع استرجاع المخزون، وتصديرها إلى ملف CSV."
            : "Move orders through fulfillment, cancel to restore stock, and export the current view to CSV."}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={isAr ? "ابحث برقم الطلب أو اسم العميل…" : "Search by order number, customer…"}
            aria-label={isAr ? "البحث في الطلبات" : "Search orders"}
            className="ps-8"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowExportConfirm(true)}
          disabled={filtered.length === 0}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </Button>
      </div>

      {/* Status filter chips */}
      <div
        aria-label={isAr ? "فلترة الطلبات حسب الحالة" : "Filter orders by status"}
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {(["all", ...ORDER_STATUSES] as (OrderStatus | "all")[]).map((status) => {
          const active = statusFilter === status;
          const count = chipCount(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => handleStatusFilterChange(status)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {status === "all" ? (isAr ? "الكل" : "All") : getOrderStatusLabel(status, locale)}
              <span
                className={cn(
                  "ms-1.5 tabular-nums",
                  active ? "text-primary-foreground/70" : "text-muted-foreground/70",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="min-h-[400px] max-h-[600px] overflow-x-auto overflow-y-auto rounded-xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 text-start font-medium">{isAr ? "الطلب" : "Order"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "العميل" : "Customer"}</th>
              <ColumnHeader
                label={isAr ? "القطع" : "Items"}
                className="px-4 py-3 text-start font-medium"
                sortValue={itemsSort}
                onSortChange={handleItemsSortChange}
              />
              <ColumnHeader
                label={isAr ? "الإجمالي" : "Total"}
                className="px-4 py-3 text-start font-medium"
                sortValue={totalSort}
                onSortChange={handleTotalSortChange}
              />
              <ColumnHeader
                label={isAr ? "الدفع" : "Payment"}
                className="px-4 py-3 text-start font-medium"
                filterValue={paymentFilter}
                filterOptions={Object.keys(PAYMENT_METHOD_LABELS).map((value) => ({
                  value,
                  label: getPaymentMethodLabel(value as PaymentMethod, locale),
                }))}
                onFilterChange={setPaymentFilter}
              />
              <ColumnHeader
                label={isAr ? "الحالة" : "Status"}
                className="px-4 py-3 text-start font-medium"
                filterValue={statusFilter !== "all" ? statusFilter : ""}
                filterOptions={ORDER_STATUSES.map((s) => ({
                  value: s,
                  label: getOrderStatusLabel(s, locale),
                }))}
                onFilterChange={(v) => handleStatusFilterChange((v || "all") as OrderStatus | "all")}
              />
              <th className="px-4 py-3 text-end font-medium">{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    {orders.length === 0
                      ? isAr
                        ? "لا توجد طلبات بعد — ستظهر هنا فور قيام العملاء بالشراء."
                        : "No orders yet — they'll appear here as customers check out."
                      : isAr
                        ? "لا توجد طلبات مطابقة لهذا العرض."
                        : "No orders match this view. Try a different status or search."}
                  </p>
                  {orders.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      {isAr ? "مسح الفلاتر" : "Clear filters"}
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const moves = availableTransitions(order.status);
                const isTerminal = moves.length === 0;
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate font-medium">{order.customerName}</p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {order.itemsCount}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {priceFormatter.format(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getPaymentMethodLabel(order.paymentMethod, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={isAr ? `عرض تفاصيل ${order.orderNumber}` : `View details for ${order.orderNumber}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden text-xs font-medium sm:inline">
                            {isAr ? "عرض" : "View"}
                          </span>
                        </Link>
                        {!isTerminal &&
                          (() => {
                            const fromIndex = LIFECYCLE.indexOf(
                              order.status as (typeof LIFECYCLE)[number],
                            );
                            const statusOptions = [];
                            if (fromIndex > 0) {
                              statusOptions.push({
                                value: LIFECYCLE[fromIndex - 1],
                                label: getOrderStatusLabel(LIFECYCLE[fromIndex - 1], locale),
                                hint: isAr ? "السابق" : "previous",
                              });
                            }
                            statusOptions.push({
                              value: order.status,
                              label: getOrderStatusLabel(order.status, locale),
                              hint: isAr ? "الحالي" : "current",
                              disabled: true,
                            });
                            if (fromIndex < LIFECYCLE.length - 1) {
                              statusOptions.push({
                                value: LIFECYCLE[fromIndex + 1],
                                label: getOrderStatusLabel(LIFECYCLE[fromIndex + 1], locale),
                                hint: isAr ? "التالي" : "next",
                              });
                            }
                            statusOptions.push({
                              value: "cancelled",
                              label: isAr ? "إلغاء الطلب" : "Cancel order",
                            });
                            return (
                              <StatusDropdown
                                label={isAr ? "تحديث الحالة" : "Update status"}
                                options={statusOptions}
                                busy={busyId !== null}
                                onSelect={(v) =>
                                  setStatusModal({ order, newStatus: v as OrderStatus })
                                }
                              />
                            );
                          })()}
                        {isTerminal && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {statusModal &&
        (() => {
          const isCancel = statusModal.newStatus === "cancelled";
          return (
            <ConfirmModal
              title={
                isCancel
                  ? isAr
                    ? "إلغاء الطلب؟"
                    : "Cancel order?"
                  : isAr
                    ? "تحديث حالة الطلب؟"
                    : "Update order status?"
              }
              message={
                isCancel
                  ? isAr
                    ? `هل أنت متأكد من إلغاء الطلب ${statusModal.order.orderNumber}؟`
                    : `Are you sure you want to cancel order ${statusModal.order.orderNumber}?`
                  : isAr
                    ? `تغيير حالة الطلب ${statusModal.order.orderNumber} من "${getOrderStatusLabel(statusModal.order.status, locale)}" إلى "${getOrderStatusLabel(statusModal.newStatus, locale)}"؟`
                    : `Change order ${statusModal.order.orderNumber} from "${getOrderStatusLabel(statusModal.order.status, locale)}" to "${getOrderStatusLabel(statusModal.newStatus, locale)}"?`
              }
              warning={
                isCancel
                  ? isAr
                    ? "سيتم استرجاع كميات المخزون تلقائياً."
                    : "Stock will be restored automatically."
                  : undefined
              }
              confirmLabel={
                isCancel
                  ? isAr
                    ? "إلغاء الطلب"
                    : "Cancel order"
                  : isAr
                    ? "تحديث الحالة"
                    : "Update status"
              }
              confirmVariant={isCancel ? "destructive" : "default"}
              confirmIcon={isCancel ? Ban : ArrowRight}
              busy={busyId === statusModal.order.id}
              onConfirm={() => void handleTransition(statusModal.order, statusModal.newStatus)}
              onCancel={() => setStatusModal(null)}
            />
          );
        })()}

      {showExportConfirm && (
        <ConfirmModal
          title={isAr ? "تصدير الطلبات؟" : "Export orders?"}
          message={
            isAr
              ? `تصدير الطلبات الظاهرة حالياً (${filtered.length} طلب) إلى ملف CSV؟`
              : `Export the current filtered view (${filtered.length} orders) to CSV?`
          }
          confirmLabel={isAr ? "تصدير CSV" : "Export CSV"}
          confirmIcon={Download}
          busy={false}
          onConfirm={() => {
            handleExport();
            setShowExportConfirm(false);
          }}
          onCancel={() => setShowExportConfirm(false)}
        />
      )}

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
