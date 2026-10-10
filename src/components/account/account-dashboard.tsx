"use client";

import {
  ArrowRight,
  Cloud,
  FileDown,
  FolderOpen,
  HardDrive,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { useAdminEligibility } from "@/admin/use-admin-eligibility";
import { getPersonaLabel } from "@/calculator/categories";
import { useCalculatorStore } from "@/calculator/store";
import type { CalculatorWorkspace } from "@/calculator/types";
import { formatThaiDate } from "@/calculator/utils";
import { useCalculatorHydrated } from "@/components/calculator/calculator-hydration";
import { Button } from "@/components/ui/button";
import { useCloudSync } from "@/sync/sync-provider";
import type { CloudSyncStatus } from "@/sync/types";

const syncLabels: Readonly<Record<CloudSyncStatus, string>> = {
  disabled: "เก็บในอุปกรณ์นี้เท่านั้น",
  auth_required: "ต้องเข้าสู่ระบบอีกครั้ง",
  config_missing: "การสำรองข้อมูลยังไม่พร้อมใช้งาน",
  offline: "ออฟไลน์ — ข้อมูลในอุปกรณ์ยังใช้งานได้",
  idle: "พร้อมซิงก์",
  syncing: "กำลังซิงก์…",
  synced: "ซิงก์แล้ว",
  error: "ซิงก์ไม่สำเร็จ",
};

function formatProvider(provider: string | null | undefined) {
  switch (provider) {
    case "google":
      return "Google";
    case "github":
      return "GitHub";
    case "email":
      return "อีเมล";
    default:
      return "บัญชีสมาชิก";
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function getWorkspaceTitle(workspace: CalculatorWorkspace) {
  return (
    workspace.reportName?.trim() ||
    `${getPersonaLabel(workspace.persona)} · ปีภาษี ${workspace.taxYearBE}`
  );
}

function getWorkspaceEntryCount(workspace: CalculatorWorkspace) {
  return (
    workspace.incomeEntries.length +
    workspace.expenseEntries.length +
    workspace.withholdingEntries.length +
    workspace.allowanceDraftEntries.length
  );
}

export function AccountDashboard() {
  const router = useRouter();
  const hydrated = useCalculatorHydrated();
  const { status: authStatus, user, logout } = useAuth();
  const adminEligibility = useAdminEligibility();
  const { enabled, error, lastSyncedAt, status: syncStatus } = useCloudSync();
  const workspace = useCalculatorStore((state) => state.workspace);
  const otherWorkspaces = useCalculatorStore((state) => state.otherWorkspaces);
  const pendingDeletionCount = useCalculatorStore(
    (state) => state.pendingWorkspaceDeletionIds.length,
  );
  const selectWorkspace = useCalculatorStore((state) => state.selectWorkspace);
  const [logoutPending, setLogoutPending] = useState(false);

  if (authStatus === "loading") {
    return <p role="status">กำลังโหลดข้อมูลบัญชี…</p>;
  }

  if (!user) {
    return (
      <section className="surface-card p-6">
        <h2 className="text-xl font-bold">เข้าสู่ระบบเพื่อดูภาพรวมบัญชี</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-7">
          ข้อมูลเครื่องคำนวณในอุปกรณ์นี้ยังอยู่ตามเดิม เมื่อลงชื่อเข้าใช้
          คุณจะสร้างชุดข้อมูลได้หลายชุดและเลือกสำรองข้อมูล
          เพื่อใช้กับอุปกรณ์อื่นได้
        </p>
        <Button asChild className="mt-5">
          <Link href="/login">เข้าสู่ระบบ</Link>
        </Button>
      </section>
    );
  }

  if (!hydrated) {
    return (
      <div className="space-y-4" role="status">
        <span className="sr-only">กำลังเตรียมภาพรวมข้อมูล…</span>
        <div className="bg-muted h-32 animate-pulse rounded-2xl" />
        <div className="bg-muted h-52 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const allWorkspaces = [...(workspace ? [workspace] : []), ...otherWorkspaces];
  const latestLocalUpdate = allWorkspaces
    .map((item) => item.updatedAt)
    .sort()
    .at(-1);

  function openWorkspace(workspaceId: string, target: string) {
    selectWorkspace(workspaceId);
    router.push(target);
  }

  async function handleLogout() {
    setLogoutPending(true);
    await logout();
    router.replace("/");
  }

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-muted-foreground text-sm">
                เข้าสู่ระบบด้วย {formatProvider(user.provider)}
              </p>
              <h2 className="mt-1 text-lg font-bold break-all">
                {user.email ?? "บัญชีของคุณ"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                ข้อมูลในเครื่องยังใช้งานได้เมื่อออกจากระบบ
                การสำรองข้อมูลจะทำงานเฉพาะอุปกรณ์ที่คุณเปิดไว้
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {adminEligibility === "eligible" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  พื้นที่ผู้ดูแล
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings">
                <Settings aria-hidden="true" className="size-4" />
                การตั้งค่า
              </Link>
            </Button>
            <Button
              disabled={logoutPending}
              onClick={() => void handleLogout()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {logoutPending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
            </Button>
          </div>
        </div>

        <dl className="border-border bg-muted/40 grid border-t sm:grid-cols-2">
          <div className="border-border flex gap-3 p-5 sm:border-r">
            <HardDrive
              aria-hidden="true"
              className="text-primary mt-0.5 size-5"
            />
            <div>
              <dt className="font-bold">ข้อมูลในอุปกรณ์นี้</dt>
              <dd className="text-muted-foreground mt-1 text-sm leading-6">
                {allWorkspaces.length} ชุดข้อมูล
                {latestLocalUpdate
                  ? ` · แก้ไขล่าสุด ${formatDateTime(latestLocalUpdate)}`
                  : " · ยังไม่มีข้อมูล"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3 p-5">
            <Cloud aria-hidden="true" className="text-primary mt-0.5 size-5" />
            <div>
              <dt className="font-bold">สำเนาบน Cloud</dt>
              <dd className="text-muted-foreground mt-1 text-sm leading-6">
                {enabled ? syncLabels[syncStatus] : syncLabels.disabled}
                {lastSyncedAt
                  ? ` · ล่าสุด ${formatDateTime(lastSyncedAt)}`
                  : null}
              </dd>
              {error ? (
                <dd className="text-danger mt-1 text-sm">
                  ซิงก์ไม่สำเร็จ ไปที่การตั้งค่าเพื่อลองอีกครั้ง
                </dd>
              ) : null}
              {pendingDeletionCount > 0 ? (
                <dd className="text-warning-strong mt-1 text-sm">
                  รอลบ {pendingDeletionCount} ชุดข้อมูลเมื่อออนไลน์
                </dd>
              ) : null}
            </div>
          </div>
        </dl>
      </section>

      <section aria-labelledby="account-workspaces-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-success-strong text-sm font-bold">
              งานของคุณในอุปกรณ์นี้
            </p>
            <h2
              className="mt-1 text-2xl font-bold"
              id="account-workspaces-title"
            >
              ชุดข้อมูลของฉัน
            </h2>
          </div>
          <Button asChild variant="secondary">
            <Link href="/start/income-type">
              <Plus aria-hidden="true" className="size-4" />
              เพิ่มชุดข้อมูล
            </Link>
          </Button>
        </div>

        {allWorkspaces.length ? (
          <ul className="surface-card mt-4 divide-y overflow-hidden">
            {allWorkspaces.map((item) => (
              <li
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                key={item.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="bg-success-soft text-success-strong grid size-10 shrink-0 place-items-center rounded-xl">
                    <FolderOpen aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold break-words">
                        {getWorkspaceTitle(item)}
                      </h3>
                      {item.id === workspace?.id ? (
                        <span className="bg-success-soft text-success-strong rounded-full px-2 py-0.5 text-xs font-bold">
                          กำลังใช้งาน
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                      {formatThaiDate(item.periodStart)} –{" "}
                      {formatThaiDate(item.periodEnd)}
                      {` · ${getWorkspaceEntryCount(item)} รายการ`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    onClick={() => openWorkspace(item.id, "/calculator")}
                    size="sm"
                    type="button"
                    variant={
                      item.id === workspace?.id ? "default" : "secondary"
                    }
                  >
                    เปิดชุดข้อมูล
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    aria-label={`เปิดรายงาน ${getWorkspaceTitle(item)}`}
                    onClick={() =>
                      openWorkspace(item.id, "/calculator/summary")
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <FileDown aria-hidden="true" className="size-4" />
                    รายงาน
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface-card mt-4 p-6">
            <h3 className="text-lg font-bold">ยังไม่มีชุดข้อมูลในอุปกรณ์นี้</h3>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              สร้างชุดข้อมูลใหม่ หรือเปิดการสำรองข้อมูลเพื่อดึงข้อมูลของบัญชีนี้
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/start/income-type">สร้างชุดข้อมูล</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/settings">เปิดการตั้งค่า</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <aside className="border-border bg-muted/40 rounded-2xl border p-5 text-sm leading-6">
        หน้านี้แสดงเฉพาะอีเมล บัญชีที่ใช้เข้าสู่ระบบ และชุดข้อมูลในอุปกรณ์นี้
      </aside>
    </div>
  );
}
