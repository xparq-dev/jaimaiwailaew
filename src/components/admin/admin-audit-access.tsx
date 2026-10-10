"use client";

import {
  ArrowLeft,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminErrorCopy } from "@/admin/error-copy";
import type {
  AdminAuditRecord,
  AdminGovernanceClient,
} from "@/admin/governance-client";
import { AdminAccessGate } from "@/components/admin/admin-tax-rule-access";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

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

export function AdminAuditAccess() {
  return (
    <AdminAccessGate description="ตรวจเหตุการณ์สำคัญที่เกิดขึ้นในพื้นที่ผู้ดูแล">
      {({ api, roles }) => (
        <div className="space-y-7">
          <PageHeader
            actions={
              <Button asChild variant="secondary">
                <Link href="/admin">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  กลับศูนย์ผู้ดูแล
                </Link>
              </Button>
            }
            description="ดูว่าใครดำเนินการอะไรและเมื่อใด โดยเรียงเหตุการณ์ล่าสุดก่อน"
            eyebrow="พื้นที่ผู้ดูแล"
            title="ประวัติการดำเนินการ"
          />
          {roles.includes("owner") || roles.includes("auditor") ? (
            <AuditPanel api={api} />
          ) : (
            <section className="surface-card p-6">
              <ShieldAlert
                aria-hidden="true"
                className="text-warning-strong size-7"
              />
              <h2 className="mt-4 text-xl font-bold">ไม่มีสิทธิ์ดูประวัติ</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                บัญชีนี้ไม่ได้รับบทบาทเจ้าของระบบหรือผู้ตรวจประวัติ
              </p>
            </section>
          )}
        </div>
      )}
    </AdminAccessGate>
  );
}

function AuditPanel({ api }: { readonly api: AdminGovernanceClient }) {
  const [events, setEvents] = useState<readonly AdminAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents((await api.getAuditEvents()).events);
    } catch (loadError) {
      setError(adminErrorCopy(loadError));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section
      className="surface-card overflow-hidden"
      aria-labelledby="audit-title"
    >
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="flex items-center gap-2 font-bold" id="audit-title">
          <History aria-hidden="true" className="size-5" />
          เหตุการณ์ล่าสุด
        </h2>
        <Button
          disabled={loading}
          onClick={() => void load()}
          size="sm"
          variant="secondary"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          โหลดล่าสุด
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground p-5 text-sm" role="status">
          กำลังโหลดประวัติ…
        </p>
      ) : error ? (
        <div className="p-5" role="alert">
          <p className="text-danger text-sm">{error}</p>
          <Button
            className="mt-4"
            onClick={() => void load()}
            size="sm"
            variant="secondary"
          >
            ลองอีกครั้ง
          </Button>
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground p-5 text-sm">
          ยังไม่มีเหตุการณ์ที่บันทึกไว้
        </p>
      ) : (
        <ol className="divide-border divide-y">
          {events.map((event) => (
            <li
              className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(11rem,0.7fr)_minmax(0,1fr)_auto]"
              key={event.eventId}
            >
              <div>
                <p className="font-bold">
                  {ACTION_LABELS[event.action] ?? "ดำเนินการในระบบ"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {event.category === "authority" ? "สิทธิ์ทีม" : "ชุดกฎภาษี"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm">
                  รายการที่เกี่ยวข้อง
                </p>
                <code
                  className="mt-1 block truncate text-xs"
                  title={event.subjectId}
                >
                  {event.subjectId}
                </code>
              </div>
              <time
                className="text-muted-foreground text-xs"
                dateTime={event.occurredAt}
              >
                {new Intl.DateTimeFormat("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Bangkok",
                }).format(new Date(event.occurredAt))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
