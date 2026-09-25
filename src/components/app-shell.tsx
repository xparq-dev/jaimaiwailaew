"use client";

import {
  BookOpenText,
  Calculator,
  Compass,
  Home,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AccountControls } from "@/components/account-controls";
import { LanguageToggle } from "@/components/language-toggle";
import { OfflineBanner } from "@/components/network-status";
import { useLocale } from "@/components/providers/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  labelKey: "home" | "start" | "calculator" | "learn" | "privacy";
}

const navigation: NavigationItem[] = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/start", icon: Compass, labelKey: "start" },
  { href: "/calculator", icon: Calculator, labelKey: "calculator" },
  { href: "/learn", icon: BookOpenText, labelKey: "learn" },
  { href: "/privacy", icon: LockKeyhole, labelKey: "privacy" },
];

function isCurrentRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { dictionary, locale } = useLocale();

  return (
    <Link
      aria-label="จ่ายไม่ไหวแล้ว"
      className={cn(
        "focus-visible:ring-focus/35 flex min-w-0 items-center rounded-xl focus-visible:ring-3 focus-visible:outline-none",
        compact ? "gap-0" : "gap-3",
      )}
      href="/"
      lang={locale}
    >
      {!compact ? (
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold tracking-tight shadow-sm"
        >
          JM
        </span>
      ) : null}
      <span className="min-w-0">
        <span
          className={cn(
            "text-foreground block truncate font-bold",
            compact && "text-sm whitespace-nowrap sm:text-base",
          )}
        >
          จ่ายไม่ไหวแล้ว
        </span>
        {!compact ? (
          <span className="text-muted-foreground block truncate text-xs">
            {dictionary.brand.subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();
  const { dictionary, locale } = useLocale();

  return (
    <aside className="border-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 border-r lg:flex lg:flex-col">
      <div className="border-border border-b p-6">
        <Brand />
      </div>
      <nav aria-label="เมนูหลัก" className="flex-1 space-y-1 p-4">
        {navigation.map(({ href, icon: Icon, labelKey }) => {
          const current = isCurrentRoute(pathname, href);
          return (
            <Link
              aria-current={current ? "page" : undefined}
              className={cn(
                "focus-visible:ring-focus/35 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
                current
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span lang={locale}>{dictionary.navigation[labelKey]}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-border text-muted-foreground border-t p-5 text-xs leading-5">
        <p lang={locale}>{dictionary.footer.localProcessing}</p>
        <p className="text-warning-strong mt-2 font-medium">
          ข้อมูลกฎภาษียังไม่ผ่านการตรวจสอบ
        </p>
      </div>
    </aside>
  );
}

function MobileNavigation() {
  const pathname = usePathname();
  const { dictionary, locale } = useLocale();

  return (
    <nav
      aria-label="เมนูหลักบนมือถือ"
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-[max(0.25rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {navigation.map(({ href, icon: Icon, labelKey }) => {
        const current = isCurrentRoute(pathname, href);
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={cn(
              "focus-visible:ring-focus/35 flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.6875rem] font-medium focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset",
              current ? "text-primary" : "text-muted-foreground",
            )}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span className="max-w-full truncate" lang={locale}>
              {dictionary.navigation[labelKey]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  const { dictionary, locale } = useLocale();
  const links = [
    ["/privacy", dictionary.footer.privacy],
    ["/terms", dictionary.footer.terms],
    ["/disclaimer", dictionary.footer.disclaimer],
    ["/accessibility", dictionary.footer.accessibility],
  ] as const;

  return (
    <footer className="border-border bg-card mt-auto border-t px-4 pt-6 pb-24 sm:px-6 lg:pb-6">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Jai Mai Wai Laew</p>
        <nav
          aria-label="ข้อมูลทางกฎหมาย"
          className="flex flex-wrap gap-x-4 gap-y-2"
        >
          {links.map(([href, label]) => (
            <Link
              className="hover:text-foreground hover:underline"
              href={href}
              key={href}
            >
              <span lang={locale}>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { dictionary, locale } = useLocale();

  return (
    <div className="bg-background min-h-dvh">
      <a
        className="bg-primary text-primary-foreground fixed top-3 left-3 z-50 -translate-y-24 rounded-lg px-4 py-2 text-sm font-semibold focus:translate-y-0"
        href="#main-content"
        lang={locale}
      >
        {dictionary.common.skipToContent}
      </a>
      <DesktopSidebar />
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
        <header
          className="border-border bg-background/90 sticky top-0 z-20 border-b px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3"
          data-testid="app-header"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="min-w-0 lg:hidden">
              <Brand compact />
            </div>
            <div className="hidden min-w-0 lg:block">
              <p
                className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase"
                lang={locale}
              >
                {dictionary.common.foundation}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <AccountControls />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <OfflineBanner />
        <main
          className="w-full flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-8"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <Footer />
      </div>
      <MobileNavigation />
    </div>
  );
}
