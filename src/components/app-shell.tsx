"use client";

import {
  BookOpenText,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Home,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/auth/auth-provider";
import { AccountControls } from "@/components/account-controls";
import { OfflineBanner } from "@/components/network-status";
import { useLocale } from "@/components/providers/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

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

function getCurrentPageLabel(pathname: string) {
  const current = [...navigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isCurrentRoute(pathname, item));

  return current?.label ?? "พื้นที่จัดการข้อมูล";
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { dictionary, locale } = useLocale();
  const { user } = useAuth();

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
          className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold tracking-tight shadow-sm"
        >
          <UserAvatar
            avatarUrl={user?.avatarUrl ?? null}
            className="size-10 rounded-xl"
            fallback="JM"
          />
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
    <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 overflow-hidden text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-6 [&_*]:!text-white">
        <Brand />
      </div>
      <nav aria-label="เมนูหลัก" className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-white/45 uppercase">
          งานของฉัน
        </p>
        {navigation.map((item) => {
          const { href, icon: Icon, label } = item;
          const current = isCurrentRoute(pathname, item);
          return (
            <Link
              aria-current={current ? "page" : undefined}
              className={cn(
                "focus-visible:ring-focus/35 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
                current
                  ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              )}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-5 text-xs leading-5 text-white/55">
        <p lang={locale}>{dictionary.footer.localProcessing}</p>
        <p className="mt-2 font-medium text-emerald-100/70">
          ผลคำนวณเป็นค่าประมาณจากข้อมูลที่บันทึก
        </p>
      </div>
    </aside>
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
  const pathname = usePathname();

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
          className="border-border/80 bg-background/82 sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-xl sm:px-6"
          data-testid="app-header"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="min-w-0 lg:hidden">
              <Brand compact />
            </div>
            <div className="hidden min-w-0 lg:block">
              <p
                className="text-muted-foreground text-sm font-medium"
                lang={locale}
              >
                {getCurrentPageLabel(pathname)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <AccountControls />
              <ThemeToggle />
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
