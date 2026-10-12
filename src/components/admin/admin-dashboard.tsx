"use client";

import {
  ArrowRight,
  BookCheck,
  CheckCircle2,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminErrorCopy } from "@/admin/error-copy";
import type {
  AdminAuditRecord,
  AdminGovernanceClient,
  AdminRole,
} from "@/admin/governance-client";
import { AdminAccessGate } from "@/components/admin/admin-tax-rule-access";
import { UserAnalyticsPanel } from "@/components/admin/user-analytics-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "เจ้าของระบบ",
  auditor: "ผู้ตรวจประวัติ",
  author: "ผู้จัดทำ",
  reviewer: "ผู้ทบทวน",
  approver: "ผู้อนุมัติ",
  publisher: "ผู้เผยแพร่",
};

const ACTION_LABELS: Readonly<Record<string, string>> = {
  "authority.assigned": "มอบหมายสิทธิ์",
  "authority.updated": "ปรับสิทธิ์",
  "authority.revoked": "ถอนสิทธิ์",
  "tax_rule.artifact_stored": "บันทึกฉบับกฎ",
  "tax_rule.current_candidate_changed": "เปลี่ยนฉบับที่กำลังดำเนินการ",
  "tax_rule.artifact_published": "เผยแพร่ฉบับกฎ",
  "tax_rule.submit_for_review": "ส่งให้ตรวจ",
  "tax_rule.request_changes": "ส่งกลับแก้ไข",
  "tax_rule.approve": "อนุมัติ",
  "tax_rule.publish": "เผยแพร่",
  "tax_rule.retire": "ยุติการใช้",
};

interface DashboardSnapshot {
  readonly events: readonly AdminAuditRecord[] | null;
}

export function AdminDashboardAccess() {
  return (
    <AdminAccessGate description="ตรวจสถานะและเลือกงานดูแลระบบจากจุดเดียว">
      {({ api, roles }) => <AdminDashboard api={api} roles={roles} />}
    </AdminAccessGate>
  );
}

function AdminDashboard({
  api,
  roles,
}: {
  readonly api: AdminGovernanceClient;
  readonly roles: readonly AdminRole[];
}) {
  const canWorkWithRules = roles.some((role) =>
    ["owner", "author", "reviewer", "approver", "publisher"].includes(role),
  );
  const canManageTeam = roles.includes("owner");
  const canReadAudit = roles.includes("owner") || roles.includes("auditor");
  const availableTaskCount = [
    canWorkWithRules,
    canManageTeam,
    canReadAudit,
  ].filter(Boolean).length;
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({
    events: null,
  });
  const [loading, setLoading] = useState(canReadAudit);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!canReadAudit) return;
    setLoading(true);
    setError(null);
    try {
      const auditResult = await api.getAuditEvents(6);
      setSnapshot({
        events: auditResult?.events ?? null,
      });
    } catch (loadError) {
      setError(adminErrorCopy(loadError));
    } finally {
      setLoading(false);
    }
  }, [api, canReadAudit]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSnapshot(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSnapshot]);

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/profile">กลับบัญชีของฉัน</Link>
          </Button>
        }
        description="ดูแนวโน้มผู้ใช้งาน ติดตามการเปลี่ยนแปลง และเข้าสู่งานดูแลระบบ"
        eyebrow="พื้นที่ผู้ดูแล"
        title="ศูนย์จัดการระบบ"
      />

      <section aria-labelledby="admin-readiness-title" className="surface-card">
        <div className="bg-success-soft/55 grid gap-5 rounded-[inherit] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-3.5">
            <span className="bg-success-strong text-background grid size-11 shrink-0 place-items-center rounded-xl shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-success-strong text-sm font-bold">
                พร้อมดำเนินการ
              </p>
              <h2
                className="mt-1 text-xl font-bold sm:text-2xl"
                id="admin-readiness-title"
              >
                ยืนยันตัวตน 2 ขั้นแล้ว
              </h2>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
                ระบบจะแสดงเฉพาะงานตามสิทธิ์ของบัญชีนี้
                และบันทึกการเปลี่ยนแปลงสำคัญไว้ตรวจสอบย้อนหลัง
              </p>
            </div>
          </div>
          <div aria-label="บทบาทที่ได้รับ" className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                className="border-success-strong/25 bg-background/80 text-foreground rounded-full border px-3 py-1.5 text-xs font-bold"
                key={role}
              >
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {canManageTeam ? <UserAnalyticsPanel api={api} /> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <section aria-labelledby="admin-tasks-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-success-strong text-sm font-bold">งานของคุณ</p>
              <h2 className="mt-1 text-2xl font-bold" id="admin-tasks-title">
                งานที่คุณเข้าถึงได้
              </h2>
            </div>
            <p className="text-muted-foreground hidden text-sm sm:block">
              {availableTaskCount} พื้นที่
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            {canWorkWithRules ? (
              <AdminTaskLink
                description="จัดทำ ทบทวน อนุมัติ หรือเผยแพร่ฉบับกฎตามบทบาทของคุณ"
                href="/admin/tax-rules"
                icon={BookCheck}
                primary
                title="ชุดกฎภาษี"
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {canManageTeam ? (
                <AdminTaskLink
                  description="มอบหมายหรือถอนสิทธิ์ พร้อมบันทึกเหตุผล"
                  href="/admin/access"
                  icon={UserRoundCog}
                  title="ทีมและสิทธิ์"
                />
              ) : null}
              {canReadAudit ? (
                <AdminTaskLink
                  description="ตรวจเหตุการณ์และการเปลี่ยนแปลงย้อนหลัง"
                  href="/admin/audit"
                  icon={History}
                  title="ประวัติการดำเนินการ"
                />
              ) : null}
            </div>
          </div>
        </section>

        {canReadAudit ? (
          <RecentActivityPanel
            error={error}
            events={snapshot.events ?? []}
            loading={loading}
            onRetry={loadSnapshot}
          />
        ) : (
          <aside className="surface-card p-5 sm:p-6">
            <CheckCircle2
              aria-hidden="true"
              className="text-success-strong size-6"
            />
            <h2 className="mt-4 text-lg font-bold">ทำงานตามบทบาท</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              เมนูและขั้นตอนที่เห็นถูกจำกัดตามสิทธิ์ของบัญชีนี้
              หากต้องการสิทธิ์เพิ่มเติม ให้ติดต่อเจ้าของระบบ
            </p>
          </aside>
        )}
      </div>

      <aside className="border-border bg-muted/35 flex gap-3 rounded-2xl border p-4 text-sm leading-6 sm:items-center sm:px-5">
        <ShieldCheck
          aria-hidden="true"
          className="text-success-strong mt-0.5 size-5 shrink-0 sm:mt-0"
        />
        <p>
          การเผยแพร่ในพื้นที่นี้เก็บฉบับที่ผ่านขั้นตอนกำกับดูแล
          แต่ไม่เปลี่ยนกฎที่เครื่องคำนวณใช้อยู่โดยอัตโนมัติ
        </p>
      </aside>
    </div>
  );
}

function AdminTaskLink({
  description,
  href,
  icon: Icon,
  primary = false,
  title,
}: {
  readonly description: string;
  readonly href: string;
  readonly icon: typeof BookCheck;
  readonly primary?: boolean;
  readonly title: string;
}) {
  return (
    <Link
      className={`group focus-visible:ring-focus/35 flex min-h-32 items-center gap-4 rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] focus-visible:ring-3 focus-visible:outline-none sm:p-6 ${
        primary
          ? "border-success-strong/30 bg-success-soft/35 hover:border-success-strong/50 hover:shadow-sm"
          : "border-border bg-card hover:bg-muted/40 hover:shadow-sm"
      }`}
      href={href}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-xl ${
          primary
            ? "bg-success-strong text-background"
            : "bg-muted text-foreground"
        }`}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">{title}</span>
        <span className="text-muted-foreground mt-1 block text-sm leading-6">
          {description}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="text-muted-foreground size-5 shrink-0 transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}

function RecentActivityPanel({
  error,
  events,
  loading,
  onRetry,
}: {
  readonly error: string | null;
  readonly events: readonly AdminAuditRecord[];
  readonly loading: boolean;
  readonly onRetry: () => Promise<void>;
}) {
  return (
    <section
      aria-labelledby="dashboard-activity-title"
      className="surface-card overflow-hidden"
    >
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <p className="text-success-strong text-xs font-bold">ติดตามงาน</p>
          <h2 className="mt-0.5 font-bold" id="dashboard-activity-title">
            กิจกรรมล่าสุด
          </h2>
        </div>
        <Button
          aria-label="โหลดกิจกรรมล่าสุด"
          disabled={loading}
          onClick={() => void onRetry()}
          size="icon"
          variant="ghost"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4 p-5" role="status">
          <span className="sr-only">กำลังโหลดกิจกรรมล่าสุด</span>
          {[0, 1, 2].map((item) => (
            <div className="flex gap-3" key={item}>
              <div className="bg-muted size-9 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2 py-1">
                <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5" role="alert">
          <p className="text-danger text-sm leading-6">{error}</p>
          <Button
            className="mt-4"
            onClick={() => void onRetry()}
            size="sm"
            variant="secondary"
          >
            ลองอีกครั้ง
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="p-5">
          <span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">
            <History aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-4 font-bold">ยังไม่มีกิจกรรมล่าสุด</p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            เมื่อมีการจัดการสิทธิ์หรือชุดกฎ รายการจะปรากฏที่นี่
          </p>
        </div>
      ) : (
        <ol className="divide-border divide-y">
          {events.map((event) => (
            <li className="flex gap-3 px-5 py-4" key={event.eventId}>
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full">
                {event.category === "authority" ? (
                  <UserRoundCog aria-hidden="true" className="size-4" />
                ) : (
                  <BookCheck aria-hidden="true" className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {ACTION_LABELS[event.action] ?? "ดำเนินการในระบบ"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {event.category === "authority" ? "สิทธิ์ทีม" : "ชุดกฎภาษี"}
                </p>
                <time
                  className="text-muted-foreground mt-1.5 block text-xs"
                  dateTime={event.occurredAt}
                >
                  {new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Bangkok",
                  }).format(new Date(event.occurredAt))}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="border-border border-t p-3">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href="/admin/audit">
            ดูประวัติทั้งหมด
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
