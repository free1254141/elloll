"use client";

import Link from "next/link";
import { Eye, Mail, Phone, ShoppingBag, Wallet } from "lucide-react";
import type { CustomerDetail } from "@/features/admin/lib/customers/customers";
import { OrderStatusBadge } from "@/features/admin/components/order-status-badge";
import { useLanguage } from "@/lib/i18n";

export function AdminCustomerDetailView({
  customer,
}: {
  customer: CustomerDetail | null;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const priceFormatter = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  });
  const dateFormatter = new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
    dateStyle: "full",
  });

  if (!customer) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10">
        <h1 className="text-xl font-semibold">
          {isAr ? "العميل غير موجود" : "Customer not found"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr
            ? "ربما تم حذفه أو أن الرابط غير صحيح."
            : "It may have been removed, or the link is out of date."}
        </p>
        <Link
          href="/admin/customers"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          {isAr ? "العودة للعملاء ←" : "← Back to customers"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/customers"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {isAr ? "العملاء ←" : "← Customers"}
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.fullName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "عميل منذ " : "Customer since "}
            {dateFormatter.format(new Date(customer.createdAt))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-5">
          <ShoppingBag className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-2xl font-bold leading-none tabular-nums">
              {customer.orderCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "الطلبات (باستبعاد الملغاة)" : "Orders (excluding cancelled)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-5">
          <Wallet className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-2xl font-bold leading-none tabular-nums">
              {priceFormatter.format(customer.totalSpent)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "إجمالي الإنفاق (باستبعاد الملغاة)" : "Total spent (excluding cancelled)"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 text-sm sm:flex-row sm:items-center sm:gap-8">
        <p className="flex items-center gap-2 text-muted-foreground" dir="ltr">
          <Mail className="h-4 w-4 shrink-0" />
          {customer.email}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground" dir="ltr">
          <Phone className="h-4 w-4 shrink-0" />
          {customer.contactNumber}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-background">
        <h2 className="border-b border-border px-5 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isAr
            ? `سجل الطلبات (${customer.orders.length})`
            : `Order history (${customer.orders.length})`}
        </h2>
        {customer.orders.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {isAr ? "لا توجد طلبات حتى الآن." : "No orders yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-start text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">{isAr ? "الطلب" : "Order"}</th>
                  <th className="px-5 py-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-5 py-3 text-start font-medium">{isAr ? "التاريخ" : "Placed"}</th>
                  <th className="px-5 py-3 text-end font-medium">{isAr ? "الإجمالي" : "Total"}</th>
                  <th className="px-5 py-3 text-end font-medium">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}?from=customer&customerId=${customer.id}`}
                        className="font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </td>
                    <td className="px-5 py-3 text-end tabular-nums font-medium">
                      {priceFormatter.format(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/orders/${order.id}?from=customer&customerId=${customer.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={
                            isAr
                              ? `عرض تفاصيل ${order.orderNumber}`
                              : `View details for ${order.orderNumber}`
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
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {isAr
            ? "تظهر الطلبات الملغاة في السجل الكامل لكنها لا تُحتسب ضمن الإجماليات أعلاه."
            : "Cancelled orders appear here for the full history but don't count toward the totals above."}
        </p>
      </section>
    </div>
  );
}
