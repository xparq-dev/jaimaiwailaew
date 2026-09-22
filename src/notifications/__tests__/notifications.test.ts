import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  clearMismatchedPushSubscription,
  FcmRegistrationError,
  isValidVapidPublicKey,
  sanitizeAndClassifyError,
  requestFcmToken,
} from "@/lib/firebase";
import {
  cleanupLegacyFcmTokens,
  getStoredFcmToken,
  setStoredFcmToken,
  isCloudSyncEnabled,
  setCloudSyncEnabled,
  isNotificationEnabled,
  setNotificationEnabled,
} from "@/sync/preferences";
import { CloudSyncApi } from "@/sync/cloud-api";
import { buildFirebaseMessage } from "../../../workers/firebase";

describe("Firebase Web Push & Notification Security", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Error Classification and Sanitization", () => {
    it("classifies push service error with sanitized human-readable guidance", () => {
      const rawError = new Error(
        "AbortError: Registration failed - push service error (token=secret_abc123)",
      );
      const classified = sanitizeAndClassifyError(rawError);

      expect(classified).toBeInstanceOf(FcmRegistrationError);
      expect(classified.kind).toBe("push_service_unavailable");
      expect(classified.message).toContain(
        "ไม่สามารถลงทะเบียนกับ Push Service ได้",
      );
      expect(classified.message).toContain("VAPID Key");
      expect(classified.message).toContain("Firebase Cloud Messaging API");
      expect(classified.message).not.toContain("secret_abc123");
      expect(classified.message).not.toContain("token=");
    });

    it("classifies network or CSP blockage without leaking internals", () => {
      const rawError = new Error(
        "Failed to fetch https://fcmregistrations.googleapis.com/v1/projects/my-app/registrations",
      );
      const classified = sanitizeAndClassifyError(rawError);

      expect(classified.kind).toBe("network_or_csp_error");
      expect(classified.message).toContain(
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนได้",
      );
      expect(classified.message).not.toContain("my-app");
    });

    it("classifies permission denial clearly", () => {
      const rawError = new Error(
        "Messaging: The notification permission was not granted and blocked.",
      );
      const classified = sanitizeAndClassifyError(rawError);

      expect(classified.kind).toBe("permission_denied");
      expect(classified.message).toContain("ผู้ใช้ยังไม่ได้อนุญาตการแจ้งเตือน");
    });

    it("handles unknown errors generically without exposing stack traces or tokens", () => {
      const rawError = new Error(
        "Internal Firebase error with secret token=999xyz",
      );
      const classified = sanitizeAndClassifyError(rawError);

      expect(classified.kind).toBe("unknown");
      expect(classified.message).toContain(
        "เกิดข้อผิดพลาดในการลงทะเบียนการแจ้งเตือน",
      );
      expect(classified.message).not.toContain("secret");
      expect(classified.message).not.toContain("999xyz");
    });
  });

  describe("VAPID and stale PushSubscription recovery", () => {
    function encodeVapidKey(fill: number) {
      const bytes = Uint8Array.from({ length: 65 }, (_, index) =>
        index === 0 ? 4 : fill,
      );
      return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }

    const currentVapidKey = encodeVapidKey(1);

    function decode(value: string) {
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
      return Uint8Array.from(atob(normalized), (character) =>
        character.charCodeAt(0),
      ).buffer;
    }

    it("accepts a valid uncompressed P-256 VAPID public key", () => {
      expect(isValidVapidPublicKey(currentVapidKey)).toBe(true);
      expect(isValidVapidPublicKey("not-a-vapid-key")).toBe(false);
    });

    it("keeps a PushSubscription that already uses the current VAPID key", async () => {
      const unsubscribe = vi.fn();
      const registration = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue({
            options: { applicationServerKey: decode(currentVapidKey) },
            unsubscribe,
          }),
        },
      } as unknown as ServiceWorkerRegistration;

      await expect(
        clearMismatchedPushSubscription(registration, currentVapidKey),
      ).resolves.toBe(false);
      expect(unsubscribe).not.toHaveBeenCalled();
    });

    it("unsubscribes a PushSubscription created with another VAPID key", async () => {
      const otherKey = encodeVapidKey(2);
      const unsubscribe = vi.fn().mockResolvedValue(true);
      const registration = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue({
            options: { applicationServerKey: decode(otherKey) },
            unsubscribe,
          }),
        },
      } as unknown as ServiceWorkerRegistration;

      await expect(
        clearMismatchedPushSubscription(registration, currentVapidKey),
      ).resolves.toBe(true);
      expect(unsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe("Local Storage & Token Persistence Security", () => {
    it("does not write FCM token or VAPID key to Local Storage", () => {
      const userId = "test-user-123";
      const tokenValue = "fcm-device-token-secret-value-456";

      setStoredFcmToken(userId, tokenValue);

      // In-memory getter should retrieve it during session
      expect(getStoredFcmToken(userId)).toBe(tokenValue);

      // Persistent localStorage must NOT have the token
      expect(
        localStorage.getItem(`jaimaiwailaew:notifications:token:${userId}`),
      ).toBeNull();

      // Check all keys in localStorage to ensure zero token or VAPID key leakage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) ?? "";
        expect(key).not.toContain("token");
        expect(key).not.toContain("vapid");
        expect(localStorage.getItem(key)).not.toContain(tokenValue);
      }
    });

    it("purges legacy FCM token keys from Local Storage", () => {
      const legacyKey = "jaimaiwailaew:notifications:token:legacy-user";
      const legacyToken = "old-stored-token-789";
      localStorage.setItem(legacyKey, legacyToken);
      expect(localStorage.getItem(legacyKey)).toBe(legacyToken);

      // Run cleanup
      cleanupLegacyFcmTokens();

      expect(localStorage.getItem(legacyKey)).toBeNull();
    });

    it("preserves calculator, cloud-sync, and boolean notification preferences in Local Storage", () => {
      const userId = "user-pref-check";

      setCloudSyncEnabled(userId, true);
      setNotificationEnabled(userId, true);

      expect(isCloudSyncEnabled(userId)).toBe(true);
      expect(isNotificationEnabled(userId)).toBe(true);

      // Verify booleans are safely stored
      expect(
        localStorage.getItem(`jaimaiwailaew:cloud-sync:enabled:${userId}`),
      ).toBe("true");
      expect(
        localStorage.getItem(`jaimaiwailaew:notifications:enabled:${userId}`),
      ).toBe("true");
    });
  });

  describe("Token Registration Transport Security", () => {
    it("sends registration token only to authenticated Worker endpoint with Bearer token", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      });
      global.fetch = mockFetch;

      const getAccessToken = vi.fn().mockResolvedValue("jwt-auth-token-xyz");
      const transport = new CloudSyncApi(
        getAccessToken,
        "https://sync.example.com",
      );

      await transport.registerNotificationToken("fcm-device-token-abc");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call).toBeDefined();
      const [url, options] = call!;

      expect(url).toBe(
        "https://sync.example.com/api/notifications/subscriptions",
      );
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer jwt-auth-token-xyz");
      expect(JSON.parse(options.body)).toEqual({
        token: "fcm-device-token-abc",
      });
    });
  });

  describe("FCM delivery payload privacy", () => {
    it("uses a full HTTPS same-site link and a generic notification body", () => {
      const payload = buildFirebaseMessage("device-token", {
        title: "จ่ายไม่ไหวแล้ว",
        body: "การซิงก์ข้อมูลเสร็จสมบูรณ์",
        url: "https://jaimaiwailaew.vercel.app/calculator/summary",
      });

      expect(payload.message.webpush?.fcm_options.link).toBe(
        "https://jaimaiwailaew.vercel.app/calculator/summary",
      );
      expect(payload.message.data.url).not.toMatch(/[?#]/);
      expect(JSON.stringify(payload)).not.toMatch(
        /amount|category|note|income|expense|รายรับ|รายจ่าย|จำนวนเงิน/i,
      );
    });

    it("does not emit fcm_options.link for relative or insecure URLs", () => {
      for (const url of ["/calculator/summary", "http://localhost:3000/"]) {
        const payload = buildFirebaseMessage("device-token", {
          title: "จ่ายไม่ไหวแล้ว",
          body: "การซิงก์ข้อมูลเสร็จสมบูรณ์",
          url,
        });
        expect(payload.message.webpush).toBeUndefined();
        expect(payload.message.data.url).toBe("/calculator");
      }
    });
  });

  describe("Repository Credential Audit", () => {
    it("ensures no Firebase private keys or service account JSON exist in source code or .env.example", () => {
      const forbiddenPatterns = [
        ["-----BEGIN", "RSA", "PRIVATE KEY-----"].join(" "),
        ["-----BEGIN", "PRIVATE KEY-----"].join(" "),
        ['"type"', '"service_account"'].join(": "),
        '"private_key_id"',
      ];

      function checkDir(dir: string) {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          if (
            entry === "node_modules" ||
            entry === ".git" ||
            entry === ".next" ||
            entry === "dist" ||
            entry === "__tests__"
          ) {
            continue;
          }
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            checkDir(fullPath);
          } else if (
            entry.endsWith(".ts") ||
            entry.endsWith(".tsx") ||
            entry.endsWith(".js") ||
            entry.endsWith(".json") ||
            entry.endsWith(".example") ||
            entry.endsWith(".md")
          ) {
            const content = readFileSync(fullPath, "utf-8");
            for (const pattern of forbiddenPatterns) {
              expect(
                content.includes(pattern),
                `Forbidden pattern '${pattern}' found in ${fullPath}`,
              ).toBe(false);
            }
          }
        }
      }

      checkDir(join(process.cwd(), "src"));
      checkDir(join(process.cwd(), "public"));

      const envExample = readFileSync(
        join(process.cwd(), ".env.example"),
        "utf-8",
      );
      for (const pattern of forbiddenPatterns) {
        expect(envExample.includes(pattern)).toBe(false);
      }
    });
  });

  describe("requestFcmToken lifecycle and validation", () => {
    it("rejects with configuration_required when Firebase config is missing", async () => {
      await expect(requestFcmToken()).rejects.toMatchObject({
        kind: "configuration_required",
        message: expect.stringContaining("ยังไม่ได้ตั้งค่า Push Notification"),
      });
    });
  });
});
