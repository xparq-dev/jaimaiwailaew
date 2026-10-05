"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const calculatorSections = [
  ["/calculator", "ภาพรวม"],
  ["/calculator/income", "รายรับ"],
  ["/calculator/expenses", "รายจ่าย"],
  ["/calculator/withholding-tax", "ภาษีหัก ณ ที่จ่าย"],
  ["/calculator/allowances", "ค่าลดหย่อน"],
  ["/calculator/summary", "สรุป"],
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/calculator") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function CalculatorSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูย่อยเครื่องคำนวณ"
      className="border-border bg-card/85 -mx-4 overflow-x-auto border-y px-4 py-2.5 shadow-sm backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-2.5"
    >
      <ul className="flex min-w-max gap-1">
        {calculatorSections.map(([href, label]) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-focus/35 inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition-all focus-visible:ring-3 focus-visible:outline-none",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={href}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
