"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { AuthProvider } from "@/auth/auth-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { CloudSyncProvider } from "@/sync/sync-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <LocaleProvider>
        <AuthProvider>
          <CloudSyncProvider>{children}</CloudSyncProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
