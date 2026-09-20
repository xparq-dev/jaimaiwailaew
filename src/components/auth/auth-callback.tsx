"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";

export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    const code = new URL(window.location.href).searchParams.get("code");
    if (!client || !code) {
      queueMicrotask(() => setError("ไม่พบข้อมูลยืนยันการเข้าสู่ระบบ"));
      return;
    }
    void client.auth
      .exchangeCodeForSession(code)
      .then(({ error: authError }) => {
        if (authError) setError(authError.message);
        else router.replace("/profile");
      });
  }, [router]);

  return error ? (
    <p className="text-danger" role="alert">
      {error}
    </p>
  ) : (
    <p role="status">กำลังยืนยันการเข้าสู่ระบบ…</p>
  );
}
