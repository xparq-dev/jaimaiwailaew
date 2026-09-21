const SYNC_ENABLED_PREFIX = "jaimaiwailaew:cloud-sync:enabled:";
const NOTIFICATION_ENABLED_PREFIX = "jaimaiwailaew:notifications:enabled:";
const LEGACY_FCM_TOKEN_PREFIX = "jaimaiwailaew:notifications:token:";
export const NOTIFICATION_PREFERENCE_EVENT =
  "jaimaiwailaew:notification-preference-change";

// In-memory session store for active FCM tokens. Never persisted to localStorage.
const sessionFcmTokens = new Map<string, string>();

/**
 * Migration-safe helper to clean up legacy FCM tokens that may have been stored in localStorage.
 */
export function cleanupLegacyFcmTokens(userId?: string) {
  if (typeof localStorage === "undefined") return;
  try {
    if (userId) {
      localStorage.removeItem(`${LEGACY_FCM_TOKEN_PREFIX}${userId}`);
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(LEGACY_FCM_TOKEN_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

// Clean up any legacy persisted tokens on initial evaluation in browser
if (typeof window !== "undefined") {
  cleanupLegacyFcmTokens();
}

function readBoolean(key: string) {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function writeBoolean(key: string, value: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, String(value));
}

export function isCloudSyncEnabled(userId: string) {
  return readBoolean(`${SYNC_ENABLED_PREFIX}${userId}`);
}

export function setCloudSyncEnabled(userId: string, enabled: boolean) {
  writeBoolean(`${SYNC_ENABLED_PREFIX}${userId}`, enabled);
}

export function isNotificationEnabled(userId: string) {
  return readBoolean(`${NOTIFICATION_ENABLED_PREFIX}${userId}`);
}

export function setNotificationEnabled(userId: string, enabled: boolean) {
  writeBoolean(`${NOTIFICATION_ENABLED_PREFIX}${userId}`, enabled);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_PREFERENCE_EVENT));
  }
}

export function getStoredFcmToken(userId: string): string | null {
  cleanupLegacyFcmTokens(userId);
  return sessionFcmTokens.get(userId) ?? null;
}

export function setStoredFcmToken(userId: string, token: string | null) {
  cleanupLegacyFcmTokens(userId);
  if (token) {
    sessionFcmTokens.set(userId, token);
  } else {
    sessionFcmTokens.delete(userId);
  }
}
