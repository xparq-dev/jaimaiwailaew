"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/providers/locale-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
