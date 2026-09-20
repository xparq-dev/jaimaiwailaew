"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function ProfileCard() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [pending, setPending] = useState(false);

  if (status === "loading") {
    return <p role="status">กำลังโหลดข้อมูลบัญชี…</p>;
  }

  if (!user) {
    return (
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <p className="text-muted-foreground leading-7">
          กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์และตั้งค่า Cloud Sync
        </p>
        <Button asChild className="mt-5">
          <Link href="/login">เข้าสู่ระบบ</Link>
        </Button>
      </section>
    );
  }

  async function handleLogout() {
    setPending(true);
    await logout();
    router.replace("/");
  }

  return (
    <section className="border-border bg-card space-y-5 rounded-2xl border p-6 shadow-sm">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-sm">อีเมล</dt>
          <dd className="mt-1 font-semibold break-all">
            {user.email ?? "ไม่ระบุ"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">ช่องทางเข้าสู่ระบบ</dt>
          <dd className="mt-1 font-semibold">{user.provider ?? "อีเมล"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/settings">
            <Settings aria-hidden="true" className="size-4" />
            ตั้งค่า Sync และการแจ้งเตือน
          </Link>
        </Button>
        <Button
          disabled={pending}
          onClick={() => void handleLogout()}
          type="button"
          variant="danger"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {pending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
        </Button>
      </div>
    </section>
  );
}
