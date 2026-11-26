import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/login",
  title: "تسجيل الدخول — elloll",
  description: "سجّل الدخول إلى حسابك في متجر elloll لمتابعة محادثاتك وطلباتك.",
  noIndex: true,
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
