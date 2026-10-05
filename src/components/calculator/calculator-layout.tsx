"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useCalculatorStore } from "@/calculator/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

import {
  CalculatorHydrationGate,
  useCalculatorHydrated,
} from "./calculator-hydration";
import { CalculatorSubNav } from "./calculator-sub-nav";
import { LocalDataIndicator, PersistErrorBanner } from "./local-data-indicator";

export function CalculatorLayout({
  title,
  description,
  eyebrow = "เครื่องคำนวณ",
  actions,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <CalculatorHydrationGate
      fallback={
        <div className="text-muted-foreground py-12 text-center text-sm">
          กำลังโหลดข้อมูลจากอุปกรณ์...
        </div>
      }
    >
      <CalculatorWorkspaceShell
        actions={actions}
        description={description}
        eyebrow={eyebrow}
        title={title}
      >
        {children}
      </CalculatorWorkspaceShell>
    </CalculatorHydrationGate>
  );
}

function CalculatorWorkspaceShell({
  title,
  description,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  description: string;
  eyebrow: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const hydrated = useCalculatorHydrated();
  const workspace = useCalculatorStore((state) => state.workspace);
  const router = useRouter();

  if (!hydrated) {
    return null;
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="สร้างชุดข้อมูลแรกเพื่อเริ่มบันทึกรายรับและรายจ่าย"
          eyebrow={eyebrow}
          title="ยังไม่มีชุดข้อมูล"
        />
        <Button asChild>
          <Link href="/start">เริ่มตั้งค่า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7 lg:space-y-8">
      <PageHeader
        actions={actions}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <LocalDataIndicator />
        <CalculatorSubNav />
      </div>
      <PersistErrorBanner />
      {children}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/start">จัดการชุดข้อมูล</Link>
        </Button>
        <Button
          onClick={() => router.push("/calculator/summary")}
          type="button"
          variant="secondary"
        >
          ไปหน้าสรุป
        </Button>
      </div>
    </div>
  );
}
