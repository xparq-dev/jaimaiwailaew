"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { isSupabaseTestMode } from "@/lib/supabase";

export function AuthForm({ mode }: { readonly mode: "login" | "signup" }) {
  const router = useRouter();
  const {
    configured,
    signInWithOAuth,
    signInWithPassword,
    signUpWithPassword,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const authError = isSignup
      ? await signUpWithPassword(email, password)
      : await signInWithPassword(email, password);
    setPending(false);
    if (authError) {
      setError(authError);
      return;
    }
    if (isSignup) {
      setMessage(
        "สร้างบัญชีแล้ว กรุณาตรวจอีเมลยืนยัน หากโครงการกำหนดให้ยืนยันอีเมล",
      );
    } else {
      router.push("/profile");
    }
  }

  async function oauth(provider: "google" | "github") {
    setPending(true);
    setError(null);
    const authError = await signInWithOAuth(provider);
    setPending(false);
    if (authError) setError(authError);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {!configured ? (
        <div className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-4 text-sm leading-6">
          ยังไม่ได้ตั้งค่า Supabase ใน environment จึงยังเข้าสู่ระบบจริงไม่ได้
          การใช้งาน Local-only เดิมยังทำงานตามปกติ
        </div>
      ) : null}

      {isSupabaseTestMode ? (
        <form
          className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm"
          onSubmit={submit}
        >
          <label className="block text-sm font-semibold" htmlFor="auth-email">
            อีเมล
          </label>
          <input
            autoComplete="email"
            className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
            disabled={!configured || pending}
            id="auth-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <label
            className="block text-sm font-semibold"
            htmlFor="auth-password"
          >
            รหัสผ่าน
          </label>
          <input
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
            disabled={!configured || pending}
            id="auth-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button
            className="w-full"
            disabled={!configured || pending}
            type="submit"
          >
            {pending
              ? "กำลังดำเนินการ…"
              : isSignup
                ? "สร้างบัญชี"
                : "เข้าสู่ระบบ"}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-center text-sm leading-6">
          ขณะนี้รองรับการเข้าสู่ระบบด้วย Google และ GitHub
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          disabled={!configured || pending}
          onClick={() => void oauth("google")}
          type="button"
          variant="secondary"
        >
          ดำเนินการด้วย Google
        </Button>
        <Button
          disabled={!configured || pending}
          onClick={() => void oauth("github")}
          type="button"
          variant="secondary"
        >
          ดำเนินการด้วย GitHub
        </Button>
      </div>

      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-success-strong text-sm" role="status">
          {message}
        </p>
      ) : null}

      <p className="text-muted-foreground text-center text-sm">
        {isSignup ? "มีบัญชีแล้ว?" : "ยังไม่มีบัญชี?"}{" "}
        <Link
          className="text-primary font-semibold underline"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
        </Link>
      </p>
    </div>
  );
}
