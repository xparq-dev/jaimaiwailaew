"use client";

import { createContext, type ReactNode, useContext, useEffect } from "react";

import { dictionaries, type Dictionary } from "@/i18n/dictionaries";

interface LocaleContextValue {
  dictionary: Dictionary;
  locale: "th";
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const thaiLocale: LocaleContextValue = {
  dictionary: dictionaries.th,
  locale: "th",
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.localStorage.removeItem("jmwl-locale");
    document.documentElement.lang = "th";
    document.documentElement.dataset.localeReady = "true";

    return () => {
      delete document.documentElement.dataset.localeReady;
    };
  }, []);

  return (
    <LocaleContext.Provider value={thaiLocale}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }

  return context;
}
