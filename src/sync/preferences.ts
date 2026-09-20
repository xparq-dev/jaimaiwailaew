const SYNC_ENABLED_PREFIX = "jaimaiwailaew:cloud-sync:enabled:";
const NOTIFICATION_ENABLED_PREFIX = "jaimaiwailaew:notifications:enabled:";
const FCM_TOKEN_PREFIX = "jaimaiwailaew:notifications:token:";
export const NOTIFICATION_PREFERENCE_EVENT =
  "jaimaiwailaew:notification-preference-change";

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

export function getStoredFcmToken(userId: string) {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(`${FCM_TOKEN_PREFIX}${userId}`);
}

export function setStoredFcmToken(userId: string, token: string | null) {
  if (typeof localStorage === "undefined") return;
  const key = `${FCM_TOKEN_PREFIX}${userId}`;
  if (token) localStorage.setItem(key, token);
  else localStorage.removeItem(key);
}
