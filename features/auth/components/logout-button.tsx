"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowConfirm(true)} className="w-full gap-2">
        <LogOut className="h-4 w-4" />
        {t("logout")}
      </Button>
      {showConfirm && (
        <ConfirmModal
          title={t("logoutConfirmTitle")}
          message={t("logoutConfirmMsg")}
          confirmLabel={t("logout")}
          confirmIcon={LogOut}
          busy={busy}
          onConfirm={logout}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
