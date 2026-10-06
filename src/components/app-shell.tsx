"use client";

import {
  BookOpenText,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Home,
  ReceiptText,
  ShieldCheck,
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

const desktopNavigationGroups = [
  {
    label: "ภาพรวม",
    items: navigation.slice(0, 2),
  },
  {
    label: "ข้อมูลการเงิน",
    items: navigation.slice(2, 5),
  },
  {
    label: "คู่มือ",
    items: navigation.slice(5),
  },
] as const;

function isCurrentRoute(pathname: string, item: NavigationItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function getCurrentPageLabel(pathname: string) {
  const current = [...navigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isCurrentRoute(pathname, item));

  return current?.label ?? "พื้นที่จัดการข้อมูล";
}

function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
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
            "block truncate font-bold",
            inverse ? "text-white" : "text-foreground",
            compact && "text-sm whitespace-nowrap sm:text-base",
          )}
        >
          จ่ายไม่ไหวแล้ว
        </span>
        {!compact ? (
          <span
            className={cn(
              "block truncate text-xs",
              inverse ? "text-white/62" : "text-muted-foreground",
            )}
          >
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
    <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-[17rem] overflow-hidden border-r border-white/8 text-white before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-72 before:bg-[radial-gradient(circle_at_top_left,rgba(71,217,172,0.16),transparent_68%)] lg:flex lg:flex-col">
      <div className="relative p-4 pb-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[0_14px_35px_rgb(0_0_0/12%)]">
          <Brand inverse />
          <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3 text-[0.6875rem] font-medium text-emerald-100/70">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            <span>พื้นที่ข้อมูลส่วนตัวของคุณ</span>
          </div>
        </div>
      </div>
      <nav
        aria-label="เมนูหลัก"
        className="relative flex-1 space-y-5 overflow-y-auto px-3 py-4"
      >
        {desktopNavigationGroups.map((group) => (
          <section aria-label={group.label} key={group.label}>
            <p className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-white/38">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const { href, icon: Icon, label } = item;
                const current = isCurrentRoute(pathname, item);
                return (
                  <Link
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "focus-visible:ring-focus/35 group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-2.5 text-sm font-medium transition duration-200 focus-visible:ring-3 focus-visible:outline-none",
                      current
                        ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/8%)]"
                        : "text-white/62 hover:bg-white/[0.055] hover:text-white",
                    )}
                    href={href}
                    key={href}
                  >
                    {current ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-emerald-300"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                        current
                          ? "bg-emerald-300 text-[#073d31]"
                          : "bg-white/[0.055] text-white/55 group-hover:bg-white/10 group-hover:text-white",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 shrink-0 transition duration-200",
                        current
                          ? "text-emerald-200"
                          : "-translate-x-1 text-white/0 group-hover:translate-x-0 group-hover:text-white/45",
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
      <div className="relative p-4 pt-2">
        <div className="rounded-2xl border border-white/8 bg-black/10 p-3.5 text-xs leading-5 text-white/52">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-emerald-300"
            />
            <div>
              <p className="font-semibold text-white/82">เก็บข้อมูลในเครื่อง</p>
              <p className="mt-0.5" lang={locale}>
                {dictionary.footer.localProcessing}
              </p>
            </div>
          </div>
        </div>
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
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-[17rem]">
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
