"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSupabaseClient,
  isSupabaseConfigured,
  isSupabaseTestMode,
} from "@/lib/supabase";
import { resolveAuthAvatarUrl } from "@/auth/user-profile";

const MOCK_AUTH_KEY = "jaimaiwailaew:e2e:auth-user";

export interface AuthUser {
  readonly id: string;
  readonly email: string | null;
  readonly provider: string | null;
  readonly avatarUrl: string | null;
}

type AuthStatus = "loading" | "anonymous" | "authenticated" | "unconfigured";
type OAuthProvider = "google" | "github";

interface AuthContextValue {
  readonly status: AuthStatus;
  readonly user: AuthUser | null;
  readonly configured: boolean;
  signInWithPassword(email: string, password: string): Promise<string | null>;
  signUpWithPassword(email: string, password: string): Promise<string | null>;
  signInWithOAuth(
    provider: OAuthProvider,
    targetWindow?: Window | null,
  ): Promise<string | null>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    provider:
      typeof user.app_metadata.provider === "string"
        ? user.app_metadata.provider
        : null,
    avatarUrl: resolveAuthAvatarUrl(user.user_metadata),
  };
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (isSupabaseTestMode) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        const raw = localStorage.getItem(MOCK_AUTH_KEY);
        if (raw) {
          try {
            const mockUser = JSON.parse(raw) as AuthUser;
            setUser(mockUser);
            accessTokenRef.current = "e2e-access-token";
            setStatus("authenticated");
          } catch {
            localStorage.removeItem(MOCK_AUTH_KEY);
            setStatus("anonymous");
          }
        } else {
          setStatus("anonymous");
        }
      });
      return () => {
        active = false;
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      queueMicrotask(() => setStatus("unconfigured"));
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      accessTokenRef.current = data.session?.access_token ?? null;
      setUser(data.session?.user ? toAuthUser(data.session.user) : null);
      setStatus(data.session ? "authenticated" : "anonymous");
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      accessTokenRef.current = session?.access_token ?? null;
      setUser(session?.user ? toAuthUser(session.user) : null);
      setStatus(session ? "authenticated" : "anonymous");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (isSupabaseTestMode) {
        if (!email || password.length < 8) {
          return "กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร";
        }
        const mockUser: AuthUser = {
          id: "e2e-user",
          email,
          provider: "email",
          avatarUrl: null,
        };
        localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockUser));
        accessTokenRef.current = "e2e-access-token";
        setUser(mockUser);
        setStatus("authenticated");
        return null;
      }

      const client = getSupabaseClient();
      if (!client) return "ยังไม่ได้ตั้งค่า Supabase Auth";
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      return error?.message ?? null;
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      if (isSupabaseTestMode) {
        return signInWithPassword(email, password);
      }

      const client = getSupabaseClient();
      if (!client) return "ยังไม่ได้ตั้งค่า Supabase Auth";
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return error?.message ?? null;
    },
    [signInWithPassword],
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider, targetWindow?: Window | null) => {
      if (isSupabaseTestMode) {
        return "โหมดทดสอบรองรับการเข้าสู่ระบบด้วยอีเมลเท่านั้น";
      }
      const client = getSupabaseClient();
      if (!client) return "ยังไม่ได้ตั้งค่า Supabase Auth";
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) return error.message;
      if (!data.url) return "ไม่พบ URL สำหรับเข้าสู่ระบบ กรุณาลองอีกครั้ง";

      try {
        if (targetWindow && !targetWindow.closed) {
          targetWindow.opener = null;
          targetWindow.location.replace(data.url);
        } else {
          window.location.assign(data.url);
        }
        return null;
      } catch {
        targetWindow?.close();
        return "เบราว์เซอร์ไม่อนุญาตให้เปิดหน้าลงชื่อเข้าใช้ กรุณาเปิดเว็บไซต์นี้ใน Safari หรือ Chrome แล้วลองอีกครั้ง";
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (isSupabaseTestMode) {
      localStorage.removeItem(MOCK_AUTH_KEY);
    } else {
      await getSupabaseClient()?.auth.signOut();
    }
    accessTokenRef.current = null;
    setUser(null);
    setStatus("anonymous");
  }, []);

  const getAccessToken = useCallback(async () => {
    if (isSupabaseTestMode) return accessTokenRef.current;
    const client = getSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    accessTokenRef.current = data.session?.access_token ?? null;
    return accessTokenRef.current;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configured: isSupabaseConfigured,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      logout,
      getAccessToken,
    }),
    [
      getAccessToken,
      logout,
      signInWithOAuth,
      signInWithPassword,
      signUpWithPassword,
      status,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
