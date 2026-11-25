"use client";

import Link from "next/link";
import { MapPin, Mail, Phone, StickyNote } from "lucide-react";
import {
  getPaymentMethodLabel,
  type OrderDetail,
} from "@/features/admin/lib/orders/orders";
import { OrderStatusActions } from "@/features/admin/components/order-status-actions";
import { OrderStatusBadge } from "@/features/admin/components/order-status-badge";
import { useLanguage } from "@/lib/i18n";

export function AdminOrderDetailView({
  order,
  from,
  customerId,
}: {
  order: OrderDetail | null;
  from?: string;
  customerId?: string;
}) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";

  const priceFormatter = new Intl.NumberFormat(isAr ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  });
  const dateFormatter = new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  if (!order) {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="rounded-xl border border-dashed border-border p-10">
          <h1 className="text-xl font-semibold">
            {isAr ? "الطلب غير موجود" : "Order not found"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "ربما تم حذفه أو أن الرابط غير صحيح."
              : "It may have been removed, or the link is out of date."}
          </p>
          <Link
            href={
              from === "customer" && customerId
                ? `/admin/customers/${customerId}`
                : "/admin/orders"
            }
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {from === "customer"
              ? isAr
                ? "العودة للعميل ←"
                : "← Back to customer"
              : isAr
                ? "العودة للطلبات ←"
                : "← Back to orders"}
          </Link>
        </div>
      </div>
    );
  }

  const lineTotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const backHref =
    from === "customer" && customerId
      ? `/admin/customers/${customerId}`
      : `/admin/orders?status=${order.status}`;
  const backLabel =
    from === "customer"
      ? isAr
        ? "العودة لملف العميل"
        : "Back to customer"
      : isAr
        ? "الطلبات"
        : "Orders";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {isAr ? `${backLabel} ←` : `← ${backLabel}`}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight" dir="ltr">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-muted-foreground">
              {isAr ? "تاريخ الطلب: " : "Placed "}
              {dateFormatter.format(new Date(order.createdAt))}
            </p>
          </div>
          <OrderStatusActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isAr ? "بيانات العميل" : "Customer"}
            </h2>
            <p className="mt-3 font-medium">{order.customer.fullName}</p>
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2" dir="ltr">
                <Mail className="h-4 w-4 shrink-0" />
                {order.customer.email}
              </p>
              <p className="flex items-center gap-2" dir="ltr">
                <Phone className="h-4 w-4 shrink-0" />
                {order.customer.contactNumber}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isAr ? "التوصيل والدفع" : "Delivery"}
            </h2>
            <p className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="whitespace-pre-line">{order.deliveryAddress}</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {isAr ? "طريقة الدفع: " : "Payment: "}
              <span className="font-medium text-foreground">
                {getPaymentMethodLabel(order.paymentMethod, locale)}
              </span>
            </p>
            {order.notes && (
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-line">{order.notes}</span>
              </p>
            )}
          </section>
        </div>

        <section className="rounded-xl border border-border bg-background lg:col-span-2">
          <h2 className="border-b border-border px-5 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isAr ? "المنتجات المطلوبة" : "Items"}
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                      {isAr ? "محذوف" : "Deleted"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "الكمية" : "Qty"}: {item.quantity} ×{" "}
                    {priceFormatter.format(item.unitPrice)}
                  </p>
                  {!item.imageUrl && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {isAr
                        ? "تم حذف المنتج لاحقاً — الاسم والسعر محفوظان من وقت الشراء"
                        : "Product deleted — name and ID preserved from order snapshot"}
                    </p>
                  )}
                </div>
                <p className="shrink-0 tabular-nums font-medium">
                  {priceFormatter.format(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isAr ? "المجموع الفرعي" : "Subtotal"}
              </span>
              <span className="tabular-nums font-medium">
                {priceFormatter.format(lineTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{isAr ? "الإجمالي النهائي" : "Total"}</span>
              <span className="tabular-nums">
                {priceFormatter.format(order.totalAmount)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
