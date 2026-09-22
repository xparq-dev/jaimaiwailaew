const SYNC_ENABLED_PREFIX = "jaimaiwailaew:cloud-sync:enabled:";

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
