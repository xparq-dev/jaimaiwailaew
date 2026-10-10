"use client";

import { LoaderCircle, ShieldPlus, UserRoundCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { adminErrorCopy } from "@/admin/error-copy";
import type {
  AdminGovernanceClient,
  AdminRole,
} from "@/admin/governance-client";
import { Button } from "@/components/ui/button";

type DelegatedRole = Exclude<AdminRole, "owner">;

const ROLE_OPTIONS: readonly {
  readonly role: DelegatedRole;
  readonly label: string;
}[] = [
  { role: "author", label: "จัดทำ" },
  { role: "reviewer", label: "ทบทวน" },
  { role: "approver", label: "อนุมัติ" },
  { role: "publisher", label: "เผยแพร่" },
  { role: "auditor", label: "ตรวจประวัติ" },
];

type Authority = Awaited<
  ReturnType<AdminGovernanceClient["listAuthorities"]>
>["authorities"][number];

export function AuthorityPanel({
  api,
}: {
  readonly api: AdminGovernanceClient;
}) {
  const [authorities, setAuthorities] = useState<readonly Authority[]>([]);
  const [userId, setUserId] = useState("");
  const [roles, setRoles] = useState<readonly DelegatedRole[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setAuthorities((await api.listAuthorities()).authorities);
    } catch (loadError) {
      setError(adminErrorCopy(loadError));
    } finally {
      setBusy(false);
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function toggleRole(role: DelegatedRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  async function save() {
    const existing = authorities.find((item) => item.userId === userId.trim());
    if (!userId.trim() || roles.length === 0 || reason.trim().length < 10) {
      setError(
        "กรอกรหัสบัญชี เลือกอย่างน้อยหนึ่งบทบาท และระบุเหตุผลอย่างน้อย 10 ตัวอักษร",
      );
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.setAuthority({
        expectedVersion: existing?.version ?? 0,
        reason: reason.trim(),
        roles,
        userId: userId.trim(),
      });
      setMessage("บันทึกสิทธิ์แล้ว");
      setReason("");
      setRoles([]);
      setUserId("");
      await load();
    } catch (saveError) {
      setError(adminErrorCopy(saveError));
      setBusy(false);
    }
  }

  async function revoke(authority: Authority) {
    const revocationReason = window.prompt(
      "ระบุเหตุผลการถอนสิทธิ์อย่างน้อย 10 ตัวอักษร",
    );
    if (!revocationReason || revocationReason.trim().length < 10) return;
    setBusy(true);
    setError(null);
    try {
      await api.revokeAuthority({
        expectedVersion: authority.version,
        reason: revocationReason.trim(),
        userId: authority.userId,
      });
      setMessage("ถอนสิทธิ์แล้ว");
      await load();
    } catch (revokeError) {
      setError(adminErrorCopy(revokeError));
      setBusy(false);
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <UserRoundCog aria-hidden="true" className="size-5" />
            ทีมดูแลกฎภาษี
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            กำหนดสิทธิ์ด้วยรหัสบัญชีจาก Supabase เฉพาะผู้ที่ต้องร่วม workflow
          </p>
        </div>
        <Button
          disabled={busy}
          onClick={() => void load()}
          size="sm"
          variant="secondary"
        >
          {busy ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          โหลดล่าสุด
        </Button>
      </div>

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        <div className="min-w-0">
          <h3 className="text-sm font-bold">บัญชีที่ได้รับสิทธิ์</h3>
          {authorities.length === 0 ? (
            <p className="text-muted-foreground bg-muted/60 mt-3 rounded-xl p-4 text-sm">
              ยังไม่มีบัญชีที่ได้รับมอบหมาย บัญชีเจ้าของระบบมาจาก secret
              และไม่แสดงในรายการนี้
            </p>
          ) : (
            <ul className="divide-border border-border mt-3 divide-y rounded-xl border">
              {authorities.map((authority) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                  key={authority.userId}
                >
                  <div className="min-w-0">
                    <code className="block truncate text-xs">
                      {authority.userId}
                    </code>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {authority.roles
                        .map(
                          (role) =>
                            ROLE_OPTIONS.find((item) => item.role === role)
                              ?.label ?? role,
                        )
                        .join(" · ")}
                      {!authority.active ? " · ถอนสิทธิ์แล้ว" : ""}
                    </p>
                  </div>
                  {authority.active ? (
                    <Button
                      disabled={busy}
                      onClick={() => void revoke(authority)}
                      size="sm"
                      variant="danger"
                    >
                      ถอนสิทธิ์
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border rounded-2xl border p-4">
          <h3 className="flex items-center gap-2 font-bold">
            <ShieldPlus aria-hidden="true" className="size-4" />
            มอบหมายสิทธิ์
          </h3>
          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="authority-user-id"
          >
            รหัสบัญชี Supabase
          </label>
          <input
            className="admin-input mt-2 font-mono text-xs"
            id="authority-user-id"
            onChange={(event) => setUserId(event.target.value)}
            value={userId}
          />
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">บทบาท</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  className="border-border has-checked:border-selected-border has-checked:bg-selected flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm"
                  key={option.role}
                >
                  <input
                    checked={roles.includes(option.role)}
                    onChange={() => toggleRole(option.role)}
                    type="checkbox"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="authority-reason"
          >
            เหตุผล
          </label>
          <textarea
            className="admin-input mt-2 min-h-24 resize-y py-3"
            id="authority-reason"
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
          <Button
            className="mt-4 w-full"
            disabled={busy}
            onClick={() => void save()}
          >
            บันทึกสิทธิ์
          </Button>
        </div>
      </div>

      {message ? (
        <p className="text-success-strong px-5 pb-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-danger px-5 pb-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
