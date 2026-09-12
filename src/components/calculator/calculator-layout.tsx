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
          description="ยังไม่มี workspace ในอุปกรณ์นี้ เริ่มจาก wizard เพื่อสร้างข้อมูล local-only"
          eyebrow={eyebrow}
          title="ยังไม่ได้เริ่มจัดข้อมูล"
        />
        <Button asChild>
          <Link href="/start">ไปหน้าเริ่มต้น</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={actions}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <PersistErrorBanner />
      <LocalDataIndicator />
      <CalculatorSubNav />
      {children}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/start">เปลี่ยนโหมด / เริ่มใหม่</Link>
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
