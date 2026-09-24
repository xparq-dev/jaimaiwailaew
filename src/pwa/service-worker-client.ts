export interface OfflineCacheMetadata {
  readonly cacheVersion: string;
  readonly taxRuleVersion: string;
  readonly cachedAt: string;
  readonly ready: boolean;
  readonly warmedRoutes: number;
}

interface ServiceWorkerReply {
  readonly ok: boolean;
  readonly metadata?: OfflineCacheMetadata | null;
}

function getMessageWorker(registration: ServiceWorkerRegistration) {
  return (
    navigator.serviceWorker.controller ??
    registration.active ??
    registration.waiting ??
    registration.installing
  );
}

async function requestWorker(
  type: "GET_CACHE_METADATA" | "WARM_OFFLINE_SHELL",
  timeoutMs = 15_000,
) {
  if (!("serviceWorker" in navigator)) return null;

  const registration = await navigator.serviceWorker.ready;
  const worker = getMessageWorker(registration);
  if (!worker) return null;

  return new Promise<ServiceWorkerReply | null>((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(null), timeoutMs);

    channel.port1.onmessage = (event: MessageEvent<ServiceWorkerReply>) => {
      window.clearTimeout(timeout);
      resolve(event.data);
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}

export async function warmOfflineShell() {
  const reply = await requestWorker("WARM_OFFLINE_SHELL", 30_000);
  return reply?.ok ? (reply.metadata ?? null) : null;
}

export async function getOfflineCacheMetadata() {
  const reply = await requestWorker("GET_CACHE_METADATA");
  return reply?.ok ? (reply.metadata ?? null) : null;
}
