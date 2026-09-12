"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { dictionary, locale, setLocale } = useLocale();
  const nextLocaleLabel = locale === "th" ? "EN" : "ไทย";

  return (
    <Button
      aria-label={`${dictionary.common.switchLanguage} ${nextLocaleLabel}`}
      lang={locale}
      onClick={() => setLocale(locale === "th" ? "en" : "th")}
      type="button"
      variant="ghost"
    >
      <Languages aria-hidden="true" className="size-4" />
      <span lang={locale === "th" ? "en" : "th"}>{nextLocaleLabel}</span>
    </Button>
  );
}
