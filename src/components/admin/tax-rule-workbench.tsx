"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileJson2,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { adminErrorCopy } from "@/admin/error-copy";
import {
  AdminApiError,
  type AdminGovernanceClient,
  type AdminRole,
  type TaxRuleArtifactResponse,
} from "@/admin/governance-client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  type TaxGovernanceAction,
  type TaxGovernanceEvent,
  type TaxGovernanceStatus,
} from "@/tax/governance";
import type { TaxRuleSet } from "@/tax/types";

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "เจ้าของระบบ",
  auditor: "ผู้ตรวจสอบประวัติ",
  author: "ผู้จัดทำ",
  reviewer: "ผู้ทบทวน",
  approver: "ผู้อนุมัติ",
  publisher: "ผู้เผยแพร่",
};

const STATUS_LABELS: Record<TaxGovernanceStatus, string> = {
  draft: "ฉบับร่าง",
  in_review: "รอตรวจ",
  approved: "อนุมัติแล้ว",
  published: "เผยแพร่แล้ว",
  retired: "ยุติการใช้",
};

const ACTIONS: readonly {
  readonly action: TaxGovernanceAction;
  readonly label: string;
  readonly role: AdminRole;
  readonly statuses: readonly TaxGovernanceStatus[];
}[] = [
  {
    action: "submit_for_review",
    label: "ส่งให้ตรวจ",
    role: "author",
    statuses: ["draft"],
  },
  {
    action: "request_changes",
    label: "ส่งกลับแก้ไข",
    role: "reviewer",
    statuses: ["in_review", "approved"],
  },
  {
    action: "approve",
    label: "อนุมัติ",
    role: "approver",
    statuses: ["in_review"],
  },
  {
    action: "publish",
    label: "เผยแพร่ artifact",
    role: "publisher",
    statuses: ["approved"],
  },
  {
    action: "retire",
    label: "ยุติการใช้",
    role: "publisher",
    statuses: ["published"],
  },
];

function currentStatus(
  events: readonly TaxGovernanceEvent[],
): TaxGovernanceStatus {
  return events.at(-1)?.toStatus ?? "draft";
}

function nextSeed(seed: TaxRuleSet, version: string): TaxRuleSet {
  const clone = structuredClone(seed) as TaxRuleSet;
  return {
    ...clone,
    metadata: {
      ...clone.metadata,
      version,
      canonicalChecksum: undefined,
    },
    manifests: clone.manifests.map((manifest) => ({ ...manifest, version })),
  };
}

export function TaxRuleWorkbench({
  api,
  roles,
  seeds,
}: {
  readonly api: AdminGovernanceClient;
  readonly roles: readonly AdminRole[];
  readonly seeds: readonly TaxRuleSet[];
}) {
  const defaultSeed = seeds.at(-1)!;
  const [ruleSetId, setRuleSetId] = useState(defaultSeed.metadata.ruleSetId);
  const [version, setVersion] = useState("1.1.0");
  const [json, setJson] = useState(() =>
    JSON.stringify(nextSeed(defaultSeed, "1.1.0"), null, 2),
  );
  const [artifact, setArtifact] = useState<TaxRuleArtifactResponse>({
    ruleSet: null,
    version: null,
  });
  const [events, setEvents] = useState<readonly TaxGovernanceEvent[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<readonly string[]>([]);
  const [confirmAction, setConfirmAction] =
    useState<TaxGovernanceAction | null>(null);
  const status = currentStatus(events);
  const canEdit =
    (roles.includes("owner") || roles.includes("author")) && status === "draft";
  const availableActions = useMemo(
    () =>
      ACTIONS.filter(
        (item) =>
          item.statuses.includes(status) &&
          (roles.includes("owner") || roles.includes(item.role)),
      ),
    [roles, status],
  );

  function clearFeedback() {
    setError(null);
    setIssues([]);
    setMessage(null);
  }

  function applySeed(seed: TaxRuleSet) {
    clearFeedback();
    setRuleSetId(seed.metadata.ruleSetId);
    setVersion("1.1.0");
    setJson(JSON.stringify(nextSeed(seed, "1.1.0"), null, 2));
    setArtifact({ ruleSet: null, version: null });
    setEvents([]);
  }

  async function load() {
    clearFeedback();
    setBusy("load");
    try {
      const [nextArtifact, history] = await Promise.all([
        api.getArtifact(ruleSetId, version),
        api.getHistory(ruleSetId, version),
      ]);
      setArtifact(nextArtifact);
      setEvents(history.events);
      if (nextArtifact.ruleSet) {
        setJson(JSON.stringify(nextArtifact.ruleSet, null, 2));
      }
      setMessage(
        nextArtifact.ruleSet
          ? "โหลด candidate ล่าสุดแล้ว"
          : "ยังไม่มี candidate สำหรับรหัสและเวอร์ชันนี้",
      );
    } catch (loadError) {
      setError(adminErrorCopy(loadError));
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    clearFeedback();
    let ruleSet: unknown;
    try {
      ruleSet = JSON.parse(json) as unknown;
    } catch {
      setError("JSON ไม่ถูกต้อง กรุณาตรวจวงเล็บ เครื่องหมายคำพูด และ comma");
      return;
    }
    setBusy("save");
    try {
      const saved = await api.saveArtifact({
        expectedRevision: artifact.version?.revision ?? 0,
        ruleSet,
        ruleSetId,
        version,
      });
      setArtifact({ ruleSet: saved.ruleSet, version: saved.version });
      setJson(JSON.stringify(saved.ruleSet, null, 2));
      setMessage(`บันทึก candidate รุ่น ${saved.version.revision} แล้ว`);
    } catch (saveError) {
      setError(adminErrorCopy(saveError));
    } finally {
      setBusy(null);
    }
  }

  async function runAction(action: TaxGovernanceAction) {
    clearFeedback();
    if (note.trim().length < 10) {
      setError("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร");
      return;
    }
    if (["publish", "retire"].includes(action) && confirmAction !== action) {
      setConfirmAction(action);
      return;
    }
    setBusy(action);
    try {
      const result = await api.appendEvent({
        action,
        expectedEventId: events.at(-1)?.eventId ?? null,
        note: note.trim(),
        ruleSetId,
        version,
        ...(["submit_for_review", "publish"].includes(action) &&
        artifact.version?.currentChecksum
          ? { snapshotChecksum: artifact.version.currentChecksum }
          : {}),
      });
      setEvents((current) => [...current, result.event]);
      setNote("");
      setConfirmAction(null);
      setMessage(
        `${ACTIONS.find((item) => item.action === action)?.label}สำเร็จ`,
      );
      if (action === "publish") await load();
    } catch (actionError) {
      setError(adminErrorCopy(actionError));
      if (actionError instanceof AdminApiError) {
        setIssues(
          actionError.issues
            .map((issue) => issue.message ?? issue.code ?? "")
            .filter(Boolean),
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/admin">
                <ArrowLeft aria-hidden="true" className="size-4" />
                ศูนย์ผู้ดูแล
              </Link>
            </Button>
            <Button
              disabled={Boolean(busy)}
              onClick={() => void load()}
              variant="secondary"
            >
              {busy === "load" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <RefreshCw aria-hidden="true" className="size-4" />
              )}
              โหลดข้อมูล
            </Button>
          </div>
        }
        description="จัดทำ ตรวจ อนุมัติ และเผยแพร่ฉบับกฎ โดยบันทึกประวัติทุกขั้นตอน"
        eyebrow="พื้นที่ผู้ดูแล"
        title="จัดการชุดกฎภาษี"
      />

      <section className="surface-card p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
          <Field label="รหัสชุดกฎ" name="rule-set-id">
            <input
              className="admin-input"
              id="rule-set-id"
              onChange={(event) => setRuleSetId(event.target.value)}
              value={ruleSetId}
            />
          </Field>
          <Field label="เวอร์ชันใหม่" name="rule-version">
            <input
              className="admin-input font-mono"
              id="rule-version"
              onChange={(event) => setVersion(event.target.value)}
              value={version}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {seeds.map((seed) => (
              <Button
                key={seed.metadata.taxYearBE}
                onClick={() => applySeed(seed)}
                size="sm"
                variant="secondary"
              >
                เริ่มจากปี {seed.metadata.taxYearBE}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
        <section className="surface-card min-w-0 overflow-hidden">
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold">
                <FileJson2 aria-hidden="true" className="size-5" />
                ข้อมูลฉบับกฎ (JSON)
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                ระบบตรวจ schema และคำนวณ checksum ฝั่งเซิร์ฟเวอร์
              </p>
            </div>
            <Button
              disabled={!canEdit || Boolean(busy)}
              onClick={() => void save()}
            >
              {busy === "save" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              บันทึก Candidate
            </Button>
          </div>
          <label className="sr-only" htmlFor="tax-rule-json">
            เนื้อหา candidate JSON
          </label>
          <textarea
            aria-describedby="editor-help"
            className="bg-card text-card-foreground focus:ring-focus/25 min-h-[34rem] w-full resize-y p-4 font-mono text-xs leading-6 outline-none focus:ring-3 sm:p-5"
            disabled={!canEdit}
            id="tax-rule-json"
            onChange={(event) => setJson(event.target.value)}
            spellCheck={false}
            value={json}
          />
          <p
            className="border-border text-muted-foreground border-t px-4 py-3 text-xs"
            id="editor-help"
          >
            แก้ไขได้เฉพาะสถานะฉบับร่าง หลังเผยแพร่ต้องสร้างเวอร์ชันใหม่
          </p>
        </section>

        <aside className="space-y-5">
          <section className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-semibold">
                  สถานะปัจจุบัน
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {STATUS_LABELS[status]}
                </h2>
              </div>
              <span className="bg-success-soft text-success-strong rounded-xl p-2">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
            </div>
            <dl className="border-border mt-4 space-y-3 border-t pt-4 text-sm">
              <InfoRow
                label="รุ่นบันทึก"
                value={artifact.version?.revision?.toString() ?? "ยังไม่บันทึก"}
              />
              <InfoRow
                label="Checksum"
                value={
                  artifact.version?.currentChecksum
                    ? `${artifact.version.currentChecksum.slice(0, 12)}…`
                    : "—"
                }
              />
              <InfoRow
                label="เผยแพร่"
                value={artifact.version?.publishedChecksum ? "แล้ว" : "ยัง"}
              />
            </dl>
          </section>

          <section className="surface-card p-5">
            <h2 className="font-bold">ดำเนินขั้นตอน</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              ระบุเหตุผลให้ผู้ตรวจสอบย้อนหลังเข้าใจการตัดสินใจ
            </p>
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="governance-note"
            >
              เหตุผลหรือบันทึก
            </label>
            <textarea
              className="admin-input mt-2 min-h-28 resize-y py-3"
              id="governance-note"
              onChange={(event) => setNote(event.target.value)}
              value={note}
            />
            <div className="mt-4 grid gap-2">
              {availableActions.length === 0 ? (
                <p className="bg-muted text-muted-foreground rounded-xl p-3 text-sm leading-6">
                  ไม่มีขั้นตอนที่บทบาทนี้ทำได้ในสถานะปัจจุบัน
                </p>
              ) : null}
              {availableActions.map((item) => (
                <Button
                  disabled={Boolean(busy)}
                  key={item.action}
                  onClick={() => void runAction(item.action)}
                  variant={item.action === "retire" ? "danger" : "secondary"}
                >
                  {busy === item.action ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : item.action === "publish" ? (
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                  ) : (
                    <Send aria-hidden="true" className="size-4" />
                  )}
                  {confirmAction === item.action
                    ? `ยืนยัน${item.label}`
                    : item.label}
                </Button>
              ))}
            </div>
            {confirmAction ? (
              <p className="border-warning/30 bg-warning-soft text-warning-strong mt-3 rounded-xl border p-3 text-sm leading-6">
                การดำเนินการนี้ย้อนกลับด้วยการแก้ event เดิมไม่ได้
                กดปุ่มเดิมอีกครั้งเพื่อยืนยัน
              </p>
            ) : null}
          </section>

          <section className="surface-card p-5">
            <h2 className="font-bold">บทบาทของคุณ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  className="bg-muted rounded-full px-3 py-1 text-xs font-semibold"
                  key={role}
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {message ? (
        <p
          className="border-success-strong/20 bg-success-soft text-success-strong rounded-xl border p-4 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <div
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-4 text-sm"
          role="alert"
        >
          <p className="font-semibold">{error}</p>
          {issues.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-border border-b px-5 py-4">
          <h2 className="font-bold">ประวัติการตรวจและเผยแพร่</h2>
        </div>
        {events.length === 0 ? (
          <p className="text-muted-foreground p-5 text-sm">
            ยังไม่มีประวัติสำหรับเวอร์ชันนี้
          </p>
        ) : (
          <ol className="divide-border divide-y">
            {events.map((event) => (
              <li
                className="grid gap-2 px-5 py-4 sm:grid-cols-[10rem_1fr_auto]"
                key={event.eventId}
              >
                <span className="text-sm font-semibold">
                  {STATUS_LABELS[event.toStatus]}
                </span>
                <span className="text-muted-foreground text-sm leading-6">
                  {event.note}
                </span>
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
    </div>
  );
}

function Field({
  children,
  label,
  name,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly name: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[12rem] text-right font-semibold break-all">
        {value}
      </dd>
    </div>
  );
}
