"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && theme !== "light" && theme !== "dark") {
      setTheme("dark");
    }
  }, [mounted, theme, setTheme]);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const activeTheme = theme === "light" ? "light" : "dark";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={t("toggleTheme")}
      title={activeTheme === "dark" ? t("lightMode") : t("darkMode")}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {activeTheme === "dark" ? (
        <Sun size={16} className="transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Moon size={16} className="transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
};

export { ThemeSwitcher };
