"use client";

import {
  BookOpenText,
  ChartNoAxesCombined,
  CircleDollarSign,
  Cloud,
  CloudAlert,
  CloudOff,
  ClipboardList,
  Home,
  LoaderCircle,
  LogIn,
  ReceiptText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/auth/auth-provider";
import { AccountControls } from "@/components/account-controls";
import { OfflineBanner } from "@/components/network-status";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { useCloudSync } from "@/sync/sync-provider";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

const navigation: NavigationItem[] = [
  { href: "/", icon: Home, label: "หน้าหลัก", exact: true },
  {
    href: "/calculator",
    icon: ChartNoAxesCombined,
    label: "ภาพรวมข้อมูล",
    exact: true,
  },
  { href: "/calculator/income", icon: CircleDollarSign, label: "รายรับ" },
  { href: "/calculator/expenses", icon: ReceiptText, label: "รายจ่าย" },
  { href: "/calculator/summary", icon: ClipboardList, label: "สรุปและส่งออก" },
  { href: "/learn", icon: BookOpenText, label: "เรียนรู้" },
];

const mobileNavigation: NavigationItem[] = [
  { href: "/", icon: Home, label: "หน้าหลัก", exact: true },
  { href: "/calculator", icon: ChartNoAxesCombined, label: "บันทึก" },
  { href: "/calculator/summary", icon: ClipboardList, label: "สรุป" },
  { href: "/learn", icon: BookOpenText, label: "เรียนรู้" },
];

function isCurrentRoute(pathname: string, item: NavigationItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { dictionary, locale } = useLocale();

  return (
    <Link
      aria-label="จ่ายไม่ไหวแล้ว"
      className={cn(
        "focus-visible:ring-focus/35 flex min-w-0 items-center rounded-xl focus-visible:ring-3 focus-visible:outline-none",
        compact ? "gap-0" : "gap-3 py-1",
      )}
      href="/"
      lang={locale}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-bold",
            compact
              ? "text-foreground text-sm whitespace-nowrap sm:text-base"
              : "text-sidebar-foreground",
          )}
        >
          จ่ายไม่ไหวแล้ว
        </span>
        {!compact ? (
          <span className="text-sidebar-muted block truncate text-xs">
            {dictionary.brand.subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 hidden w-64 overflow-hidden border-r lg:flex lg:flex-col">
      <div className="border-sidebar-border border-b px-5 py-5">
        <Brand />
      </div>
      <nav aria-label="เมนูหลัก" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const { href, icon: Icon, label } = item;
            const current = isCurrentRoute(pathname, item);
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-focus/35 group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
                  current
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                )}
                href={href}
                key={href}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 transition-colors",
                    current
                      ? "text-sidebar-active-foreground"
                      : "text-sidebar-muted group-hover:text-sidebar-foreground",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <SidebarAccountArea />
    </aside>
  );
}

const syncLabels = {
  disabled: "เฉพาะเครื่องนี้",
  auth_required: "รอเข้าสู่ระบบ",
  config_missing: "สำรองข้อมูลยังไม่พร้อม",
  offline: "ออฟไลน์",
  idle: "พร้อมสำรองข้อมูล",
  syncing: "กำลังสำรองข้อมูล",
  synced: "สำรองข้อมูลแล้ว",
  error: "สำรองข้อมูลไม่สำเร็จ",
} as const;

function SidebarAccountArea() {
  const pathname = usePathname();
  const { status: authStatus, user } = useAuth();
  const { status: syncStatus } = useCloudSync();
  const SyncIcon =
    syncStatus === "syncing"
      ? LoaderCircle
      : syncStatus === "error"
        ? CloudAlert
        : syncStatus === "offline" || syncStatus === "disabled"
          ? CloudOff
          : Cloud;

  return (
    <div className="border-sidebar-border border-t p-3">
      <div className="flex items-center gap-2">
        <Link
          aria-label={user ? "เปิดบัญชีของฉัน" : "เข้าสู่ระบบ"}
          aria-current={
            pathname === (user ? "/profile" : "/login") ? "page" : undefined
          }
          className={cn(
            "focus-visible:ring-focus/35 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 transition-colors focus-visible:ring-3 focus-visible:outline-none",
            pathname === (user ? "/profile" : "/login")
              ? "bg-sidebar-active text-sidebar-active-foreground"
              : "hover:bg-sidebar-hover",
          )}
          href={user ? "/profile" : "/login"}
        >
          <span className="border-sidebar-border bg-sidebar-hover grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border">
            {user ? (
              <UserAvatar
                avatarUrl={user.avatarUrl}
                className="size-9"
                fallback="JM"
              />
            ) : (
              <LogIn aria-hidden="true" className="size-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {user?.email ?? "เข้าสู่ระบบ"}
            </span>
            <span className="text-sidebar-muted mt-0.5 flex items-center gap-1.5 text-[0.6875rem]">
              {authStatus === "loading" ? (
                "กำลังตรวจสอบบัญชี"
              ) : user ? (
                <>
                  <SyncIcon
                    aria-hidden="true"
                    className={cn(
                      "size-3 shrink-0",
                      syncStatus === "syncing" && "animate-spin",
                      syncStatus === "error" && "text-danger",
                    )}
                  />
                  <span className="truncate">{syncLabels[syncStatus]}</span>
                </>
              ) : (
                "สำรองข้อมูลข้ามอุปกรณ์"
              )}
            </span>
          </span>
        </Link>
        <Link
          aria-label="เปิดการตั้งค่า"
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={cn(
            "focus-visible:ring-focus/35 grid size-11 shrink-0 place-items-center rounded-xl transition-colors focus-visible:ring-3 focus-visible:outline-none",
            pathname === "/settings"
              ? "bg-sidebar-active text-sidebar-active-foreground"
              : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
          )}
          href="/settings"
        >
          <Settings aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </div>
  );
}

function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลักบนมือถือ"
      className="border-border bg-card/94 fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-40 grid grid-cols-4 rounded-[1.35rem] border p-1.5 shadow-[0_16px_45px_rgb(7_35_30/22%)] backdrop-blur-xl lg:hidden"
    >
      {mobileNavigation.map((item) => {
        const { href, icon: Icon, label } = item;
        const current =
          href === "/calculator"
            ? pathname.startsWith(href) &&
              !pathname.startsWith("/calculator/summary")
            : isCurrentRoute(pathname, item);
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={cn(
              "focus-visible:ring-focus/35 flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[0.6875rem] font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset",
              current
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span className="max-w-full truncate">{label}</span>
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
    <footer className="border-border bg-card/70 mt-auto border-t px-4 pt-6 pb-28 backdrop-blur sm:px-6 lg:pb-6">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} จ่ายไม่ไหวแล้ว</p>
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
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-64">
        <header
          className="border-border/80 bg-background/82 sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden"
          data-testid="app-header"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="min-w-0">
              <Brand compact />
            </div>
            <div className="flex shrink-0 items-center">
              <AccountControls />
            </div>
          </div>
        </header>
        <OfflineBanner />
        <main
          className="w-full flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-9 lg:pb-10"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <Footer />
      </div>
      <MobileNavigation />
    </div>
  );
}
