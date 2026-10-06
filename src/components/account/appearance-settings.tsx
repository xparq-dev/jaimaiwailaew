"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const themeOptions: Array<{
  value: "system" | "light" | "dark";
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "system",
    label: "ตามอุปกรณ์",
    description: "ปรับตามการตั้งค่าของเครื่องนี้",
    icon: Monitor,
  },
  {
    value: "light",
    label: "สว่าง",
    description: "พื้นสว่าง อ่านง่ายในเวลากลางวัน",
    icon: Sun,
  },
  {
    value: "dark",
    label: "มืด",
    description: "ลดแสงจ้าในที่แสงน้อย",
    icon: Moon,
  },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const selectedTheme = mounted ? (theme ?? "system") : "system";

  return (
    <section className="surface-card p-6">
      <div>
        <h2 className="text-lg font-bold">การแสดงผล</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          เลือกโทนสีที่สบายตาสำหรับอุปกรณ์เครื่องนี้
        </p>
      </div>
      <div
        aria-label="เลือกโทนสี"
        className="mt-5 grid gap-3 sm:grid-cols-3"
        role="radiogroup"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const selected = selectedTheme === option.value;
          return (
            <button
              aria-checked={selected}
              className={cn(
                "focus-visible:ring-focus/35 flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none",
                selected
                  ? "border-selected-border bg-selected text-selected-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted/70",
              )}
              disabled={!mounted}
              key={option.value}
              onClick={() => setTheme(option.value)}
              role="radio"
              type="button"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  selected ? "bg-selected-icon" : "bg-muted",
                )}
              >
                <Icon aria-hidden="true" className="size-[1.125rem]" />
              </span>
              <span>
                <span className="block text-sm font-bold">{option.label}</span>
                <span
                  className={cn(
                    "mt-1 block text-xs leading-5",
                    selected ? "text-selected-muted" : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
