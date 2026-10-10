"use client";

import {
  ArrowRight,
  BookCheck,
  History,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";

import type { AdminRole } from "@/admin/governance-client";
import { AdminAccessGate } from "@/components/admin/admin-tax-rule-access";
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

export function AdminDashboardAccess() {
  return (
    <AdminAccessGate description="ตรวจสถานะและเลือกงานดูแลระบบจากจุดเดียว">
      {({ roles }) => <AdminDashboard roles={roles} />}
    </AdminAccessGate>
  );
}

function AdminDashboard({ roles }: { readonly roles: readonly AdminRole[] }) {
  const canWorkWithRules = roles.some((role) =>
    ["owner", "author", "reviewer", "approver", "publisher"].includes(role),
  );
  const canManageTeam = roles.includes("owner");
  const canReadAudit = roles.includes("owner") || roles.includes("auditor");

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/profile">กลับบัญชีของฉัน</Link>
          </Button>
        }
        description="ตรวจสถานะ เลือกงาน และติดตามการเปลี่ยนแปลงที่เกี่ยวกับการดูแลระบบ"
        eyebrow="พื้นที่ผู้ดูแล"
        title="ศูนย์จัดการระบบ"
      />

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-success-strong text-sm font-bold">
                ยืนยันตัวตนแล้ว
              </p>
              <h2 className="mt-1 text-xl font-bold">
                พร้อมทำงานในบทบาทของคุณ
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                ทุกการเปลี่ยนแปลงสำคัญจะบันทึกผู้ดำเนินการและเวลาไว้ตรวจสอบย้อนหลัง
              </p>
            </div>
          </div>
          <div aria-label="บทบาทที่ได้รับ" className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-bold"
                key={role}
              >
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="admin-tasks-title">
        <div>
          <p className="text-success-strong text-sm font-bold">งานที่ทำได้</p>
          <h2 className="mt-1 text-2xl font-bold" id="admin-tasks-title">
            เลือกพื้นที่ทำงาน
          </h2>
        </div>

        <div className="surface-card mt-4 divide-y overflow-hidden">
          {canWorkWithRules ? (
            <AdminTaskLink
              description="จัดทำ ตรวจ อนุมัติ และเผยแพร่ชุดกฎโดยแยกหน้าที่อย่างชัดเจน"
              href="/admin/tax-rules"
              icon={BookCheck}
              title="ชุดกฎภาษี"
            />
          ) : null}
          {canManageTeam ? (
            <AdminTaskLink
              description="มอบหมายหรือถอนบทบาทของทีมที่ร่วมดูแลชุดกฎภาษี"
              href="/admin/access"
              icon={UserRoundCog}
              title="ทีมและสิทธิ์"
            />
          ) : null}
          {canReadAudit ? (
            <AdminTaskLink
              description="ตรวจลำดับเหตุการณ์สำคัญและผู้ดำเนินการย้อนหลัง"
              href="/admin/audit"
              icon={History}
              title="ประวัติการดำเนินการ"
            />
          ) : null}
        </div>
      </section>

      <aside className="border-border bg-muted/40 rounded-2xl border p-5 text-sm leading-6">
        การเผยแพร่ชุดกฎในพื้นที่นี้เป็นการเก็บฉบับที่ผ่านขั้นตอนกำกับดูแล
        ยังไม่เปลี่ยนชุดกฎที่หน้าเครื่องคำนวณใช้งานโดยอัตโนมัติ
      </aside>
    </div>
  );
}

function AdminTaskLink({
  description,
  href,
  icon: Icon,
  title,
}: {
  readonly description: string;
  readonly href: string;
  readonly icon: typeof BookCheck;
  readonly title: string;
}) {
  return (
    <Link
      className="group focus-visible:ring-focus/35 hover:bg-muted/50 flex min-h-24 items-center gap-4 px-5 py-4 transition-colors focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset sm:px-6"
      href={href}
    >
      <span className="bg-success-soft text-success-strong grid size-11 shrink-0 place-items-center rounded-xl">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
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
