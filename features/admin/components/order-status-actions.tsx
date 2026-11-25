"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Ban } from "lucide-react";
import {
  availableTransitions,
  LIFECYCLE,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/features/admin/lib/orders/orders";
import { transitionOrderStatusAction } from "@/features/admin/actions/orders";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { StatusDropdown } from "@/components/ui/status-dropdown";
import { Toast } from "@/components/ui/toast";
import { useLanguage } from "@/lib/i18n";

export function OrderStatusActions({
  orderId,
  orderNumber,
  status,
}: {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  const [busy, setBusy] = useState(false);
  const [statusModal, setStatusModal] = useState<OrderStatus | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const inFlightRef = useRef(false);

  const moves = availableTransitions(status);
  const isTerminal = moves.length === 0;

  async function handleTransition(target: OrderStatus) {
    if (inFlightRef.current) return;
    const label = getOrderStatusLabel(target, locale);
    const message =
      target === "cancelled"
        ? isAr
          ? `تم إلغاء الطلب ${orderNumber} واسترجاع المخزون.`
          : `Order ${orderNumber} cancelled. Stock restored.`
        : isAr
          ? `حالة الطلب ${orderNumber} الآن: ${label}`
          : `Order ${orderNumber} is now ${label}`;
    inFlightRef.current = true;
    setBusy(true);
    try {
      const result = await transitionOrderStatusAction(orderId, target);
      if (result.ok) {
        setToast({ message, tone: "success" });
        setStatusModal(null);
        router.refresh();
      } else {
        setToast({ message: result.message, tone: "error" });
      }
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }

  const fromIndex = LIFECYCLE.indexOf(status as (typeof LIFECYCLE)[number]);

  const statusOptions: { value: string; label: string; hint?: string; disabled?: boolean }[] = [];
  if (fromIndex > 0) {
    statusOptions.push({
      value: LIFECYCLE[fromIndex - 1],
      label: getOrderStatusLabel(LIFECYCLE[fromIndex - 1], locale),
      hint: isAr ? "السابق" : "previous",
    });
  }
  statusOptions.push({
    value: status,
    label: getOrderStatusLabel(status, locale),
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
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      {!isTerminal && (
        <StatusDropdown
          label={isAr ? "تحديث الحالة" : "Update status"}
          options={statusOptions}
          busy={busy}
          onSelect={(v) => setStatusModal(v as OrderStatus)}
        />
      )}

      {isTerminal && (
        <span className="text-xs font-medium text-muted-foreground">
          {status === "cancelled"
            ? isAr
              ? "هذا الطلب ملغى ولا يمكن تعديله."
              : "This order is cancelled and cannot be changed."
            : isAr
              ? "هذا الطلب مكتمل ولا يمكن تعديله."
              : "This order is completed and cannot be changed."}
        </span>
      )}

      {statusModal &&
        (() => {
          const isCancel = statusModal === "cancelled";
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
                    ? `هل أنت متأكد من إلغاء الطلب ${orderNumber}؟`
                    : `Are you sure you want to cancel order ${orderNumber}?`
                  : isAr
                    ? `تغيير حالة الطلب ${orderNumber} من "${getOrderStatusLabel(status, locale)}" إلى "${getOrderStatusLabel(statusModal, locale)}"؟`
                    : `Change order ${orderNumber} from "${getOrderStatusLabel(status, locale)}" to "${getOrderStatusLabel(statusModal, locale)}"?`
              }
              warning={
                isCancel
                  ? isAr
                    ? "سيتم استرجاع المخزون تلقائياً."
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
              busy={busy}
              onConfirm={() => void handleTransition(statusModal)}
              onCancel={() => setStatusModal(null)}
            />
          );
        })()}

      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
