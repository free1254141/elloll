import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import AdminGate from "@/features/admin/components/admin-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-50 duration-500">
            <BrandLogo variant="icon" size="md" animated priority />
            <p className="text-sm text-muted-foreground animate-in fade-in duration-500 delay-300">
              جاري تحميل لوحة التحكم…
            </p>
          </div>
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
