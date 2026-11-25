"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useCustomerAuth } from "@/features/auth/components/customer-auth-provider";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerAuthCard({
  initialMode = "login",
  onSuccess,
  onClose,
}: {
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const { locale, dir } = useLanguage();
  const isAr = locale === "ar";
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useCustomerAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setError(
            res.error ||
              (isAr
                ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
                : "Invalid email or password."),
          );
        } else {
          onSuccess?.();
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (!res.success) {
          setError(
            res.error ||
              (isAr ? "تعذر إنشاء الحساب، تأكد من البيانات." : "Sign-up failed."),
          );
        } else if (res.requireVerification) {
          setSuccessMsg(
            isAr
              ? "تم إنشاء الحساب! افحص بريدك الإلكتروني لتأكيد التسجيل."
              : "Account created! Please check your email to verify.",
          );
        } else {
          onSuccess?.();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(
          res.error ||
            (isAr
              ? "تعذر تسجيل الدخول عبر Google."
              : "Failed to sign in with Google."),
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      dir={dir}
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-2xl sm:p-8"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? "إغلاق" : "Close"}
          className="absolute end-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isAr ? "حساب عميل elloll" : "elloll Customer Account"}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === "login"
            ? isAr
              ? "تسجيل الدخول"
              : "Sign In"
            : isAr
              ? "إنشاء حساب جديد"
              : "Create Account"}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {isAr
            ? "سجّل دخولك لربط محادثاتك وطلباتك ومتابعة مشترياتك بسهولة"
            : "Sign in to link your orders, chats, and daily AI quota across devices"}
        </p>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => void handleGoogleAuth()}
        disabled={googleLoading || loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{isAr ? "المتابعة بواسطة Google" : "Continue with Google"}</span>
      </button>

      {/* Divider */}
      <div className="relative my-5 select-none text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-3 text-[11px] font-semibold text-muted-foreground">
          {isAr ? "أو بالبريد الإلكتروني" : "Or with email"}
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="cust-name" className="text-xs font-semibold">
              {isAr ? "الاسم الكامل" : "Full Name"}
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cust-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? "مثال: أحمد علي" : "Ahmed Ali"}
                className="ps-9"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="cust-email" className="text-xs font-semibold">
            {isAr ? "البريد الإلكتروني" : "Email Address"}
          </Label>
          <div className="relative" dir="ltr">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cust-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-password" className="text-xs font-semibold">
            {isAr ? "كلمة المرور" : "Password"}
          </Label>
          <div className="relative" dir="ltr">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cust-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading || googleLoading} className="mt-2 w-full">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "login" ? (
            isAr ? (
              "تسجيل الدخول"
            ) : (
              "Sign In"
            )
          ) : isAr ? (
            "إنشاء حساب"
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-5 text-center text-xs text-muted-foreground">
        {mode === "login" ? (
          <p>
            {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-amber-500 hover:underline"
            >
              {isAr ? "إنشاء حساب جديد" : "Sign up"}
            </button>
          </p>
        ) : (
          <p>
            {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-bold text-amber-500 hover:underline"
            >
              {isAr ? "تسجيل الدخول" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export function CustomerAuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal } = useCustomerAuth();

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={closeAuthModal}
        className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md">
        <CustomerAuthCard
          initialMode={authModalMode}
          onClose={closeAuthModal}
          onSuccess={closeAuthModal}
        />
      </div>
    </div>
  );
}
