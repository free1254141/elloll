"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  LogIn,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { cartCount, cartSubtotal, useCartStore, type CartItem } from "@/features/cart/lib/cart";
import { useCartReconcile } from "@/features/cart/lib/use-cart-reconcile";
import { type PaymentMethod } from "@/features/checkout/lib/checkout";
import { submitCheckout, type CheckoutActionResponse } from "@/features/checkout/actions";
import { downloadReceipt } from "@/features/tracking/lib/download-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useCustomerAuth } from "@/features/auth/components/customer-auth-provider";
import { useLanguage } from "@/lib/i18n";
import {
  calculateShippingFee,
  DEFAULT_SHIPPING_SETTINGS,
  EGYPT_GOVERNORATES,
  getGovernorateLabel,
  getGovernorateRate,
  type ShippingSettings,
} from "@/features/shipping/lib/shipping";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const priceFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

type FormFields = {
  fullName: string;
  email: string;
  contactNumber: string;
  governorate: string;
  deliveryAddress: string;
  notes: string;
};

const EMPTY_FORM: FormFields = {
  fullName: "",
  email: "",
  contactNumber: "",
  governorate: "cairo",
  deliveryAddress: "",
  notes: "",
};

export function CheckoutView({
  initialShippingSettings = DEFAULT_SHIPPING_SETTINGS,
}: {
  initialShippingSettings?: ShippingSettings;
}) {
  const { locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const BackArrow = dir === "rtl" ? ChevronRight : ChevronLeft;

  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const clearCart = useCartStore((state) => state.clearCart);
  useCartReconcile();
  const unavailableCount = items.filter((item) => item.unavailable).length;

  const [shippingSettings] = useState<ShippingSettings>(initialShippingSettings);
  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const {
    user: signedInUser,
    loading: authLoading,
    openAuthModal,
  } = useCustomerAuth();
  const promptedAuthRef = useRef(false);

  useEffect(() => {
    if (!signedInUser) return;
    setFields((prev) => ({
      ...prev,
      fullName: prev.fullName || signedInUser.name || "",
      email: prev.email || signedInUser.email || "",
    }));
  }, [signedInUser]);

  useEffect(() => {
    if (
      hasHydrated &&
      !authLoading &&
      !signedInUser &&
      items.length > 0 &&
      !promptedAuthRef.current
    ) {
      promptedAuthRef.current = true;
      openAuthModal("login");
    }
  }, [hasHydrated, authLoading, signedInUser, items.length, openAuthModal]);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutActionResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    orderNumber: string;
    totalAmount: number;
    shippingFee: number;
    governorate: string;
    count: number;
    lines: CartItem[];
    fullName: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
  } | null>(null);

  const subtotal = cartSubtotal(items);
  const count = cartCount(items);
  const shippingFee = calculateShippingFee(
    shippingSettings,
    fields.governorate,
    subtotal,
  );
  const finalTotal = subtotal + shippingFee;
  const freeThreshold = shippingSettings.free_shipping_threshold;

  const set = (key: keyof FormFields) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  function validateForm(): boolean {
    const errors: Partial<Record<keyof FormFields, string>> = {};
    if (!fields.fullName.trim()) {
      errors.fullName = isAr ? "الاسم الكامل مطلوب." : "Full name is required.";
    }
    if (!EMAIL_RE.test(fields.email.trim())) {
      errors.email = isAr ? "أدخل بريداً إلكترونياً صحيحاً." : "Enter a valid email address.";
    }
    if (!fields.contactNumber.trim()) {
      errors.contactNumber = isAr ? "رقم الموبايل مطلوب." : "Contact number is required.";
    }
    if (!fields.governorate.trim()) {
      errors.governorate = isAr ? "اختر المحافظة." : "Select your governorate.";
    }
    if (!fields.deliveryAddress.trim()) {
      errors.deliveryAddress = isAr ? "عنوان التوصيل مطلوب." : "Delivery address is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!signedInUser) {
      openAuthModal("login");
      return;
    }
    if (!validateForm()) return;

    const lines = items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    setSubmitting(true);
    setResult(null);
    try {
      const govLabel = getGovernorateLabel(fields.governorate, "ar");
      const fullAddress = govLabel
        ? `${govLabel} — ${fields.deliveryAddress.trim()}`
        : fields.deliveryAddress.trim();

      const response = await submitCheckout({
        details: {
          fullName: fields.fullName.trim(),
          email: fields.email.trim(),
          contactNumber: fields.contactNumber.trim(),
          governorate: fields.governorate,
          deliveryAddress: fullAddress,
          paymentMethod: "cod",
          notes: fields.notes.trim() || undefined,
        },
        items: lines,
      });

      if (response.ok) {
        const snapshot = [...items];
        setConfirmation({
          orderNumber: response.orderNumber,
          totalAmount: response.totalAmount,
          shippingFee: response.shippingFee ?? shippingFee,
          governorate: fields.governorate,
          count,
          lines: snapshot,
          fullName: fields.fullName.trim(),
          deliveryAddress: fullAddress,
          paymentMethod: "cod",
        });
        clearCart();
        return;
      }

      if (response.code === "VALIDATION" && response.field) {
        setFieldErrors((prev) => ({ ...prev, [response.field!]: response.message }));
      }
      setResult(response);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5">
        <div className="h-8 w-40 animate-shimmer rounded-md" />
        <div className="mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-shimmer rounded-xl" />
          <div className="h-64 animate-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-5">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <BackArrow className="h-4 w-4" />
        {isAr ? "العودة إلى السلة" : "Back to cart"}
      </Link>

      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
        {isAr ? "إتمام الطلب" : "Checkout"}
      </h1>

      {items.length === 0 ? (
        <EmptyCheckout isAr={isAr} />
      ) : (
        <div className="mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-6">
            {!authLoading && !signedInUser && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {isAr
                      ? "تسجيل الدخول مطلوب لإتمام الدفع وتأكيد الطلب"
                      : "Sign in required to complete checkout"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? "سجّل دخولك الآن بحساب Google أو البريد الإلكتروني لحفظ بياناتك ومتابعة طلبك."
                      : "Sign in with Google or email to save your details and track your order."}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="shrink-0 gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  {isAr ? "تسجيل الدخول / إنشاء حساب" : "Sign in / Sign up"}
                </Button>
              </div>
            )}

            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {isAr ? "بيانات التوصيل" : "Delivery details"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {signedInUser
                  ? isAr
                    ? `مسجل الدخول بحساب: ${signedInUser.email}`
                    : `Signed in as ${signedInUser.email}`
                  : isAr
                    ? "سجّل الدخول بحساب Google أو الإيميل لإكمال بيانات الشحن وتأكيد الطلب."
                    : "Sign in with Google or email to complete delivery details."}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  label={isAr ? "الاسم الكامل" : "Full name"}
                  htmlFor="checkout-full-name"
                  error={fieldErrors.fullName}
                >
                  <Input
                    id="checkout-full-name"
                    name="fullName"
                    autoComplete="name"
                    placeholder={isAr ? "مثال: أحمد محمد" : "Ada Lovelace"}
                    value={fields.fullName}
                    onChange={(e) => set("fullName")(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                  />
                </Field>

                <Field
                  label={isAr ? "البريد الإلكتروني" : "Email"}
                  htmlFor="checkout-email"
                  error={fieldErrors.email}
                >
                  <Input
                    id="checkout-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={fields.email}
                    onChange={(e) => set("email")(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </Field>

                <Field
                  label={isAr ? "رقم الموبايل" : "Contact number"}
                  htmlFor="checkout-contact"
                  error={fieldErrors.contactNumber}
                >
                  <Input
                    id="checkout-contact"
                    name="contactNumber"
                    type="tel"
                    autoComplete="tel"
                    placeholder="01012345678"
                    value={fields.contactNumber}
                    onChange={(e) => set("contactNumber")(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.contactNumber)}
                  />
                </Field>

                <Field
                  className="sm:col-span-2"
                  label={isAr ? "المحافظة" : "Governorate"}
                  htmlFor="checkout-governorate"
                  error={fieldErrors.governorate}
                >
                  <select
                    id="checkout-governorate"
                    name="governorate"
                    value={fields.governorate}
                    onChange={(e) => set("governorate")(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.governorate)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">
                      {isAr ? "— اختر المحافظة —" : "— Select governorate —"}
                    </option>
                    {EGYPT_GOVERNORATES.map((gov) => {
                      const govRate = getGovernorateRate(shippingSettings, gov.code);
                      const isFree = freeThreshold > 0 && subtotal >= freeThreshold;
                      return (
                        <option key={gov.code} value={gov.code}>
                          {isAr ? gov.nameAr : gov.nameEn} (
                          {isFree
                            ? isAr
                              ? "شحن مجاني"
                              : "Free shipping"
                            : isAr
                              ? `الشحن: ${govRate} ج.م`
                              : `Shipping: EGP ${govRate}`}
                          )
                        </option>
                      );
                    })}
                  </select>
                </Field>

                <Field
                  className="sm:col-span-2"
                  label={isAr ? "العنوان بالتفصيل" : "Delivery address"}
                  htmlFor="checkout-address"
                  error={fieldErrors.deliveryAddress}
                >
                  <textarea
                    id="checkout-address"
                    name="deliveryAddress"
                    rows={3}
                    autoComplete="street-address"
                    placeholder={
                      isAr
                        ? "المدينة / المنطقة، اسم الشارع، رقم العقار، الدور، علامة مميزة..."
                        : "City, street, building, floor, landmark..."
                    }
                    value={fields.deliveryAddress}
                    onChange={(e) => set("deliveryAddress")(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </Field>

                <Field
                  className="sm:col-span-2"
                  label={isAr ? "ملاحظات إضافية (اختياري)" : "Notes (optional)"}
                  htmlFor="checkout-notes"
                >
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    rows={2}
                    placeholder={
                      isAr
                        ? "مواعيد التوصيل المفضلة أو أي تعليمات للمندوب..."
                        : "Delivery instructions or preferred time..."
                    }
                    value={fields.notes}
                    onChange={(e) => set("notes")(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </Field>
              </div>
            </section>

            {/* COD-only Payment Method */}
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {isAr ? "طريقة الدفع" : "Payment method"}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {isAr
                  ? "الدفع متاح عند الاستلام فقط — لا يتم سحب أي مبالغ أونلاين."
                  : "Cash on Delivery only — no online payment is charged."}
              </p>
              <div className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-3.5">
                <div className="flex items-center gap-2.5 text-sm font-bold">
                  <Banknote className="h-5 w-5 text-amber-500" />
                  <span>{isAr ? "الدفع عند الاستلام (كاش)" : "Cash on Delivery (COD)"}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAr
                    ? "ادفع نقداً للمندوب بعد معاينة واستلام طلبك."
                    : "Pay cash to the courier upon receiving your order."}
                </p>
              </div>
            </section>

            <ErrorBanner result={result} isAr={isAr} onDismiss={() => setResult(null)} />

            <Button
              type="button"
              size="lg"
              disabled={submitting || unavailableCount > 0}
              className="w-full sm:w-auto"
              onClick={() => {
                if (!signedInUser) {
                  openAuthModal("login");
                  return;
                }
                if (!validateForm()) return;
                setConfirmOpen(true);
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? "جاري تأكيد الطلب…" : "Placing order…"}
                </>
              ) : isAr ? (
                `تأكيد الطلب · ${priceFormatter.format(finalTotal)}`
              ) : (
                `Place order · ${priceFormatter.format(finalTotal)}`
              )}
            </Button>

            {confirmOpen && (
              <ConfirmModal
                title={isAr ? "تأكيد إرسال الطلب؟" : "Place order?"}
                message={
                  isAr
                    ? `أنت على وشك تأكيد طلب بمبلغ إجمالي ${priceFormatter.format(finalTotal)} (${count} منتج + الشحن: ${shippingFee === 0 ? "مجاني" : priceFormatter.format(shippingFee)}).`
                    : `You're about to place an order totaling ${priceFormatter.format(finalTotal)} (${count} ${count === 1 ? "item" : "items"} + shipping ${shippingFee === 0 ? "Free" : priceFormatter.format(shippingFee)}).`
                }
                confirmLabel={isAr ? "تأكيد الطلب" : "Place order"}
                busy={submitting}
                onConfirm={() => {
                  setConfirmOpen(false);
                  const form = document.querySelector("form");
                  if (form) {
                    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }}
                onCancel={() => setConfirmOpen(false)}
              />
            )}

            {unavailableCount > 0 && (
              <p className="mt-3 text-sm font-medium text-destructive">
                {isAr ? "بعض المنتجات لم تعد متوفرة — " : "Some items are no longer available — "}
                <Link
                  href="/cart"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {isAr ? "راجع السلة" : "review your cart"}
                </Link>{" "}
                {isAr ? "لإزالتها." : "to remove them."}
              </p>
            )}
          </form>

          {/* Order Summary */}
          <aside className="h-fit min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isAr ? "ملخص الطلب" : "Order summary"}
            </h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:h-14 sm:w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote images from seed/Storage */}
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 rounded-tl-md bg-background/90 px-1 text-[10px] font-semibold tabular-nums">
                      ×{item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {priceFormatter.format(item.price)} {isAr ? "للوحدة" : "each"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {priceFormatter.format(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {isAr ? `المنتجات (${count})` : `Items (${count})`}
                </dt>
                <dd className="font-medium tabular-nums">{priceFormatter.format(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  {isAr ? "مصاريف الشحن" : "Shipping"}
                  {fields.governorate
                    ? ` (${getGovernorateLabel(fields.governorate, isAr ? "ar" : "en")})`
                    : ""}
                </dt>
                <dd className="font-medium tabular-nums">
                  {!fields.governorate
                    ? isAr
                      ? "اختر المحافظة"
                      : "Select gov"
                    : shippingFee === 0
                      ? isAr
                        ? "مجاني"
                        : "Free"
                      : priceFormatter.format(shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <dt>{isAr ? "الإجمالي النهائي" : "Total"}</dt>
                <dd className="tabular-nums text-amber-500">
                  {priceFormatter.format(finalTotal)}
                </dd>
              </div>
            </dl>
            {freeThreshold > 0 && subtotal < freeThreshold && (
              <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-600 dark:text-amber-400">
                {isAr
                  ? `أضف ${priceFormatter.format(freeThreshold - subtotal)} للحصول على شحن مجاني`
                  : `Add ${priceFormatter.format(freeThreshold - subtotal)} more for free shipping`}
              </p>
            )}
          </aside>
        </div>
      )}

      {confirmation && (
        <ConfirmationModal
          isAr={isAr}
          dir={dir}
          confirmation={confirmation}
          onClose={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ErrorBanner({
  result,
  isAr,
  onDismiss,
}: {
  result: CheckoutActionResponse | null;
  isAr: boolean;
  onDismiss: () => void;
}) {
  if (!result || result.ok) return null;

  if (result.code === "INSUFFICIENT_STOCK") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm" role="alert">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-destructive">
            {isAr ? "المخزون غير كافٍ" : "Not enough stock"}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={isAr ? "إغلاق" : "Dismiss"}
            className="rounded p-1 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {result.items.map((issue) => (
            <li key={issue.productId} className="text-muted-foreground">
              <span className="font-medium text-foreground">{issue.name}</span> —{" "}
              {isAr
                ? `متوفر ${issue.available ?? 0} فقط، المطلوب ${issue.requested}`
                : `only ${issue.available ?? 0} left, requested ${issue.requested}`}
              .
            </li>
          ))}
        </ul>
        <Link
          href="/cart"
          className="mt-3 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          {isAr ? "تعديل الكميات في السلة" : "Adjust quantities in cart"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm" role="alert">
      <p className="font-medium text-destructive">
        {result.message}
        {result.code === "PRODUCT_UNAVAILABLE" && (
          <span className="mt-1 block font-normal text-muted-foreground">
            {isAr
              ? "أحد المنتجات في سلتك لم يعد متوفراً. راجع السلة وحاول مرة أخرى."
              : "A product in your cart was removed or retired. Review your cart and try again."}
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={isAr ? "إغلاق" : "Dismiss"}
        className="rounded p-1 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ConfirmationModal({
  isAr,
  dir,
  confirmation,
  onClose,
}: {
  isAr: boolean;
  dir: "rtl" | "ltr";
  confirmation: {
    orderNumber: string;
    totalAmount: number;
    shippingFee: number;
    governorate: string;
    count: number;
    lines: CartItem[];
    fullName: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
  };
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleDownloadReceipt() {
    setDownloading(true);
    try {
      await downloadReceipt({
        orderNumber: confirmation.orderNumber,
        totalAmount: confirmation.totalAmount,
        paymentMethod: confirmation.paymentMethod,
        deliveryAddress: confirmation.deliveryAddress,
        customerName: confirmation.fullName,
        items: confirmation.lines.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.price,
        })),
      });
    } finally {
      setDownloading(false);
    }
  }

  return createPortal(
    <div dir={dir} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={isAr ? "إغلاق" : "Close confirmation"}
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-2xl outline-none"
      >
        <div className="border-b border-border p-4 text-center sm:p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-700 dark:text-emerald-400" />
          </div>
          <h2 id="confirmation-title" className="mt-4 text-xl font-bold tracking-tight">
            {isAr ? "تم تأكيد طلبك بنجاح!" : "Order placed!"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "شكراً لتسوقك من elloll — طلبك قيد التجهيز وسيتم التواصل معك قريباً."
              : "Thanks for shopping with elloll — your order is being prepared."}
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isAr ? "رقم الطلب" : "Order number"}
            </p>
            <p className="mt-0.5 break-all font-mono text-lg font-bold tracking-tight" dir="ltr">
              {confirmation.orderNumber}
            </p>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isAr ? "عدد القطع" : "Items"}</dt>
              <dd className="font-medium tabular-nums">{confirmation.count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isAr ? "مصاريف الشحن" : "Shipping"}</dt>
              <dd className="font-medium tabular-nums">
                {confirmation.shippingFee === 0
                  ? isAr
                    ? "مجاني"
                    : "Free"
                  : priceFormatter.format(confirmation.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isAr ? "الإجمالي النهائي" : "Total"}</dt>
              <dd className="font-semibold tabular-nums">
                {priceFormatter.format(confirmation.totalAmount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{isAr ? "طريقة الدفع" : "Payment"}</dt>
              <dd className="font-medium">
                {isAr ? "الدفع عند الاستلام" : "Cash on Delivery"}
              </dd>
            </div>
          </dl>

          <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto border-t border-border pt-4">
            {confirmation.lines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {line.name}{" "}
                  <span className="text-muted-foreground">× {line.quantity}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {priceFormatter.format(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/products">{isAr ? "متابعة التسوق" : "Continue shopping"}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-2 w-full"
            onClick={handleDownloadReceipt}
            disabled={downloading}
          >
            <Download className="h-4 w-4" />
            {downloading
              ? isAr
                ? "جاري إنشاء الفاتورة…"
                : "Generating receipt…"
              : isAr
                ? "تحميل الفاتورة PDF"
                : "Download receipt"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EmptyCheckout({ isAr }: { isAr: boolean }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ShoppingCart className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">
        {isAr ? "لا توجد منتجات لإتمام الطلب" : "Nothing to check out"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {isAr
          ? "سلة التسوق فارغة حالياً. أضف بعض المنتجات من المتجر أولاً."
          : "Your cart is empty. Add a few items from the catalog first."}
      </p>
      <Button asChild className="mt-6">
        <Link href="/products">{isAr ? "تصفح المنتجات" : "Browse products"}</Link>
      </Button>
    </div>
  );
}
