"use client";

import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useLanguage } from "@/lib/i18n";

export function ConfirmDeleteModal({
  title,
  message,
  warning,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  warning?: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { locale } = useLanguage();
  return (
    <ConfirmModal
      title={title}
      message={message}
      warning={warning}
      confirmLabel={locale === "ar" ? "حذف" : "Delete"}
      confirmVariant="destructive"
      confirmIcon={Trash2}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
