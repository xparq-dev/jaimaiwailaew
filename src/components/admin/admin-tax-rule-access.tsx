"use client";

import { KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AdminApiError,
  AdminGovernanceClient,
  type AdminRole,
} from "@/admin/governance-client";
import { useAuth } from "@/auth/auth-provider";
import { PageHeader } from "@/components/page-header";
import { TaxRuleWorkbench } from "@/components/admin/tax-rule-workbench";
import { Button } from "@/components/ui/button";
import { getSupabaseClient, isSupabaseTestMode } from "@/lib/supabase";
import type { TaxRuleSet } from "@/tax/types";

type GateState =
  | { readonly kind: "checking" }
  | { readonly kind: "anonymous" }
  | { readonly kind: "unconfigured" }
  | { readonly kind: "unavailable" }
  | {
      readonly kind: "mfa";
      readonly verifiedFactorId: string | null;
    }
  | { readonly kind: "denied" }
  | { readonly kind: "ready"; readonly roles: readonly AdminRole[] };

interface Enrollment {
  readonly factorId: string;
  readonly qrCode: string;
  readonly secret: string;
}

export function AdminTaxRuleAccess({
  seeds,
}: {
  readonly seeds: readonly TaxRuleSet[];
}) {
  return (
    <AdminAccessGate
      description="พื้นที่สำหรับตรวจและเผยแพร่ชุดกฎโดยผู้ดูแลที่ได้รับสิทธิ์เท่านั้น"
      eyebrow="การดูแลกฎภาษี"
      title="ยืนยันสิทธิ์ก่อนเริ่มงาน"
    >
      {({ api, roles }) => (
        <TaxRuleWorkbench api={api} roles={roles} seeds={seeds} />
      )}
    </AdminAccessGate>
  );
}

export interface AdminAccessContext {
  readonly api: AdminGovernanceClient;
  readonly roles: readonly AdminRole[];
}

export function AdminAccessGate({
  children,
  description = "เข้าสู่พื้นที่ทำงานสำหรับผู้ดูแลที่ได้รับสิทธิ์",
  eyebrow = "พื้นที่ผู้ดูแล",
  title = "ยืนยันสิทธิ์ก่อนเริ่มงาน",
}: {
  readonly children: (context: AdminAccessContext) => ReactNode;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly title?: string;
}) {
  const { getAccessToken, status } = useAuth();
  const [gate, setGate] = useState<GateState>({ kind: "checking" });
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const api = useMemo(
    () => new AdminGovernanceClient(getAccessToken),
    [getAccessToken],
  );

  const checkAccess = useCallback(async () => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setGate({
        kind: status === "unconfigured" ? "unconfigured" : "anonymous",
      });
      return;
    }
    setGate({ kind: "checking" });
    setError(null);
    try {
      const { eligible } = await api.getEligibility();
      if (!eligible) {
        setGate({ kind: "denied" });
        return;
      }
    } catch (accessError) {
      if (
        accessError instanceof AdminApiError &&
        accessError.code === "authentication_required"
      ) {
        setGate({ kind: "anonymous" });
        return;
      }
      setGate({ kind: "unavailable" });
      return;
    }

    if (isSupabaseTestMode) {
      const me = await api.getMe();
      setGate({ kind: "ready", roles: me.roles });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setGate({ kind: "unconfigured" });
      return;
    }
    const [
      { data: assurance, error: assuranceError },
      { data: factors, error: factorError },
    ] = await Promise.all([
      client.auth.mfa.getAuthenticatorAssuranceLevel(),
      client.auth.mfa.listFactors(),
    ]);
    if (assuranceError || factorError) {
      setError("ตรวจสอบการยืนยันตัวตนไม่ได้ กรุณาลองอีกครั้ง");
      setGate({ kind: "mfa", verifiedFactorId: null });
      return;
    }
    if (assurance.currentLevel !== "aal2") {
      setGate({
        kind: "mfa",
        verifiedFactorId: factors.totp[0]?.id ?? null,
      });
      return;
    }
    try {
      const me = await api.getMe();
      setGate({ kind: "ready", roles: me.roles });
    } catch (accessError) {
      if (
        accessError instanceof AdminApiError &&
        accessError.code === "admin_authority_required"
      ) {
        setGate({ kind: "denied" });
        return;
      }
      if (
        accessError instanceof AdminApiError &&
        accessError.code === "mfa_required"
      ) {
        setGate({
          kind: "mfa",
          verifiedFactorId: factors.totp[0]?.id ?? null,
        });
        return;
      }
      setError("เชื่อมต่อพื้นที่ผู้ดูแลไม่ได้ กรุณาลองอีกครั้ง");
      setGate({ kind: "mfa", verifiedFactorId: factors.totp[0]?.id ?? null });
    }
  }, [api, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkAccess(), 0);
    return () => window.clearTimeout(timer);
  }, [checkAccess]);

  async function beginEnrollment() {
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    const { data, error: enrollError } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Jai Mai Wai Laew Admin",
    });
    setBusy(false);
    if (enrollError) {
      setError("ตั้งค่าแอปยืนยันตัวตนไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function verifyCode() {
    const client = getSupabaseClient();
    if (!client || gate.kind !== "mfa") return;
    const factorId = enrollment?.factorId ?? gate.verifiedFactorId;
    if (!factorId || !/^\d{6}$/u.test(code)) {
      setError("กรุณากรอกรหัส 6 หลักจากแอปยืนยันตัวตน");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError("รหัสไม่ถูกต้องหรือหมดเวลา กรุณาใช้รหัสล่าสุดแล้วลองอีกครั้ง");
      return;
    }
    setCode("");
    setEnrollment(null);
    await checkAccess();
  }

  if (gate.kind === "ready") {
    return children({ api, roles: gate.roles });
  }

  return (
    <div className="space-y-8">
      <PageHeader description={description} eyebrow={eyebrow} title={title} />

      <section className="surface-card mx-auto max-w-2xl p-5 sm:p-7">
        {gate.kind === "checking" ? (
          <div className="flex min-h-40 items-center justify-center gap-3 text-sm">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            กำลังตรวจสิทธิ์และระดับการยืนยันตัวตน
          </div>
        ) : null}

        {gate.kind === "anonymous" ? (
          <GateMessage
            action={
              <Button asChild>
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
            }
            icon={LockKeyhole}
            text="เข้าสู่ระบบด้วยบัญชีผู้ดูแลก่อนเปิดพื้นที่นี้"
            title="ยังไม่ได้เข้าสู่ระบบ"
          />
        ) : null}

        {gate.kind === "unconfigured" ? (
          <GateMessage
            icon={LockKeyhole}
            text="ยังไม่ได้ตั้งค่า Supabase Auth สำหรับสภาพแวดล้อมนี้"
            title="ไม่พร้อมใช้งาน"
          />
        ) : null}

        {gate.kind === "unavailable" ? (
          <GateMessage
            action={
              <Button onClick={() => void checkAccess()} variant="secondary">
                ลองอีกครั้ง
              </Button>
            }
            icon={LockKeyhole}
            text="ยังตรวจสิทธิ์ผู้ดูแลไม่ได้ จึงยังไม่เปิดขั้นตอนยืนยันตัวตน กรุณาลองอีกครั้ง"
            title="ตรวจสิทธิ์ไม่สำเร็จ"
          />
        ) : null}

        {gate.kind === "denied" ? (
          <GateMessage
            action={
              <Button asChild variant="secondary">
                <Link href="/profile">กลับไปที่บัญชี</Link>
              </Button>
            }
            icon={ShieldCheck}
            text="บัญชีนี้ไม่ได้รับสิทธิ์ผู้ดูแล คุณยังใช้งานส่วนบันทึกและสรุปข้อมูลได้ตามปกติ"
            title="ไม่มีสิทธิ์เข้าถึง"
          />
        ) : null}

        {gate.kind === "mfa" ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="bg-warning-soft text-warning-strong rounded-xl p-2.5">
                <KeyRound aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">ยืนยันตัวตนขั้นที่สอง</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  ใช้รหัสจากแอป Authenticator ก่อนอ่านหรือแก้ไขกฎภาษี
                </p>
              </div>
            </div>

            {!gate.verifiedFactorId && !enrollment ? (
              <Button disabled={busy} onClick={() => void beginEnrollment()}>
                {busy ? "กำลังเตรียม..." : "ตั้งค่าแอป Authenticator"}
              </Button>
            ) : null}

            {enrollment ? (
              <div className="border-border bg-muted/40 grid gap-5 rounded-2xl border p-4 sm:grid-cols-[12rem_1fr]">
                {/* Supabase returns a trusted, session-bound SVG data URL. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="QR code สำหรับตั้งค่าแอป Authenticator"
                  className="aspect-square w-48 rounded-xl bg-white p-2"
                  height="192"
                  src={enrollment.qrCode}
                  width="192"
                />
                <div className="min-w-0 text-sm leading-6">
                  <p className="font-semibold">
                    สแกน QR code ด้วยแอป Authenticator
                  </p>
                  <p className="text-muted-foreground mt-2">
                    หากสแกนไม่ได้ ให้กรอกรหัสตั้งค่าด้านล่างในแอป แล้วใช้รหัส 6
                    หลักเพื่อยืนยัน
                  </p>
                  <code className="border-border bg-card mt-3 block rounded-lg border p-3 text-xs break-all">
                    {enrollment.secret}
                  </code>
                </div>
              </div>
            ) : null}

            {gate.verifiedFactorId || enrollment ? (
              <div className="max-w-sm space-y-2">
                <label
                  className="text-sm font-semibold"
                  htmlFor="admin-mfa-code"
                >
                  รหัส 6 หลัก
                </label>
                <input
                  autoComplete="one-time-code"
                  className="border-border bg-card focus:border-focus focus:ring-focus/20 h-12 w-full rounded-xl border px-3 font-mono tracking-[0.28em] outline-none focus:ring-3"
                  id="admin-mfa-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/gu, ""))
                  }
                  value={code}
                />
                <Button
                  disabled={busy || code.length !== 6}
                  onClick={() => void verifyCode()}
                >
                  {busy ? "กำลังตรวจ..." : "ยืนยันและเปิดพื้นที่ผู้ดูแล"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p
            className="border-danger/30 bg-danger/10 text-danger mt-5 rounded-xl border p-3 text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function GateMessage({
  action,
  icon: Icon,
  text,
  title,
}: {
  readonly action?: React.ReactNode;
  readonly icon: typeof LockKeyhole;
  readonly text: string;
  readonly title: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-start justify-center">
      <span className="bg-muted rounded-xl p-3">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
