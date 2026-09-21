export interface FirebasePublicConfig {
  apiKey?: string | undefined;
  authDomain?: string | undefined;
  projectId?: string | undefined;
  storageBucket?: string | undefined;
  messagingSenderId?: string | undefined;
  appId?: string | undefined;
  vapidKey?: string | undefined;
}

const firebaseConfig: FirebasePublicConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim(),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId &&
  firebaseConfig.vapidKey,
);

export type FcmErrorKind =
  | "configuration_required"
  | "permission_denied"
  | "push_service_unavailable"
  | "network_or_csp_error"
  | "service_worker_error"
  | "unsupported_browser"
  | "unknown";

export class FcmRegistrationError extends Error {
  readonly kind: FcmErrorKind;

  constructor(kind: FcmErrorKind, message: string) {
    super(message);
    this.name = "FcmRegistrationError";
    this.kind = kind;
  }
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const decoded = atob(
      `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/"),
    );
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export function isValidVapidPublicKey(value: string) {
  const bytes = decodeBase64Url(value);
  return bytes?.length === 65 && bytes[0] === 4;
}

function equalBytes(left: ArrayBuffer, right: Uint8Array) {
  const leftBytes = new Uint8Array(left);
  return (
    leftBytes.length === right.length &&
    leftBytes.every((value, index) => value === right[index])
  );
}

export async function clearMismatchedPushSubscription(
  registration: ServiceWorkerRegistration,
  vapidKey: string,
) {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;

  const expectedKey = decodeBase64Url(vapidKey);
  const currentKey = subscription.options.applicationServerKey;
  if (expectedKey && currentKey && equalBytes(currentKey, expectedKey)) {
    return false;
  }

  await subscription.unsubscribe();
  return true;
}

function isRecoverableSubscriptionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("push service error") ||
    message.includes("AbortError") ||
    message.includes("messaging/token-subscribe-failed") ||
    message.includes("messaging/token-update-failed")
  );
}

export function sanitizeAndClassifyError(error: unknown): FcmRegistrationError {
  if (error instanceof FcmRegistrationError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);

  if (
    rawMessage.includes("push service error") ||
    rawMessage.includes("AbortError") ||
    rawMessage.includes("messaging/token-subscribe-failed")
  ) {
    return new FcmRegistrationError(
      "push_service_unavailable",
      "ไม่สามารถลงทะเบียนกับ Push Service ได้ กรุณาตรวจสอบ VAPID Key และการเปิดใช้งาน Firebase Cloud Messaging API ใน Google Cloud Console",
    );
  }

  if (
    rawMessage.includes("Failed to fetch") ||
    rawMessage.includes("NetworkError") ||
    rawMessage.includes("CSP") ||
    rawMessage.includes("Content Security Policy") ||
    rawMessage.includes("fcmregistrations.googleapis.com") ||
    rawMessage.includes("firebaseinstallations.googleapis.com")
  ) {
    return new FcmRegistrationError(
      "network_or_csp_error",
      "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือนโยบายความปลอดภัยของเครือข่าย",
    );
  }

  if (
    rawMessage.includes("permission") ||
    rawMessage.includes("denied") ||
    rawMessage.includes("blocked")
  ) {
    return new FcmRegistrationError(
      "permission_denied",
      "ผู้ใช้ยังไม่ได้อนุญาตการแจ้งเตือน กรุณาเปิดสิทธิ์ Notification ในการตั้งค่าเบราว์เซอร์",
    );
  }

  if (rawMessage.includes("Service Worker") || rawMessage.includes("sw.js")) {
    return new FcmRegistrationError(
      "service_worker_error",
      "Service Worker สำหรับการแจ้งเตือนยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง",
    );
  }

  return new FcmRegistrationError(
    "unknown",
    "เกิดข้อผิดพลาดในการลงทะเบียนการแจ้งเตือน กรุณาลองใหม่อีกครั้ง",
  );
}

export async function getActiveServiceWorkerRegistration(
  timeoutMs = 10000,
): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    throw new FcmRegistrationError(
      "unsupported_browser",
      "เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับ Service Worker",
    );
  }

  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
  }

  if (registration.active?.state === "activated") {
    return registration;
  }

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        if (registration?.active) {
          resolve(registration);
        } else {
          reject(
            new FcmRegistrationError(
              "service_worker_error",
              "Service Worker ไม่สามารถ activate ได้ภายในเวลาที่กำหนด",
            ),
          );
        }
      }
    }, timeoutMs);

    const checkState = () => {
      if (!settled && registration?.active?.state === "activated") {
        settled = true;
        clearTimeout(timer);
        resolve(registration);
      }
    };

    const worker =
      registration.installing || registration.waiting || registration.active;
    if (worker) {
      worker.addEventListener("statechange", checkState);
    }

    navigator.serviceWorker.ready
      .then((readyReg) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(readyReg);
        }
      })
      .catch(() => undefined);
  });
}

async function getFirebaseMessaging() {
  if (!isFirebaseConfigured) {
    throw new FcmRegistrationError(
      "configuration_required",
      "ยังไม่ได้ตั้งค่า Push Notification",
    );
  }

  const [{ getApp, getApps, initializeApp }, messagingModule] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);

  if (!(await messagingModule.isSupported())) {
    throw new FcmRegistrationError(
      "unsupported_browser",
      "เบราว์เซอร์นี้ไม่รองรับ Push Notification",
    );
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: firebaseConfig.apiKey!,
          ...(firebaseConfig.authDomain
            ? { authDomain: firebaseConfig.authDomain }
            : {}),
          projectId: firebaseConfig.projectId!,
          ...(firebaseConfig.storageBucket
            ? { storageBucket: firebaseConfig.storageBucket }
            : {}),
          messagingSenderId: firebaseConfig.messagingSenderId!,
          appId: firebaseConfig.appId!,
        });

  return {
    messaging: messagingModule.getMessaging(app),
    messagingModule,
  };
}

export async function requestFcmToken(): Promise<string> {
  if (!isFirebaseConfigured) {
    throw new FcmRegistrationError(
      "configuration_required",
      "ยังไม่ได้ตั้งค่า Push Notification",
    );
  }

  if (typeof Notification === "undefined") {
    throw new FcmRegistrationError(
      "unsupported_browser",
      "อุปกรณ์นี้ไม่รองรับการแจ้งเตือน (Notification)",
    );
  }

  if (!isValidVapidPublicKey(firebaseConfig.vapidKey!)) {
    throw new FcmRegistrationError(
      "configuration_required",
      "รูปแบบ Web Push Certificate ไม่ถูกต้อง กรุณาตรวจสอบ VAPID Public Key",
    );
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new FcmRegistrationError(
      "permission_denied",
      "ผู้ใช้ยังไม่ได้อนุญาตการแจ้งเตือน กรุณาเปิดสิทธิ์ Notification ในการตั้งค่าเบราว์เซอร์",
    );
  }

  try {
    const activeRegistration = await getActiveServiceWorkerRegistration();
    const { messaging, messagingModule } = await getFirebaseMessaging();

    await clearMismatchedPushSubscription(
      activeRegistration,
      firebaseConfig.vapidKey!,
    );

    const tokenOptions = {
      serviceWorkerRegistration: activeRegistration,
      vapidKey: firebaseConfig.vapidKey!,
    };

    let token: string;
    try {
      token = await messagingModule.getToken(messaging, tokenOptions);
    } catch (error) {
      if (!isRecoverableSubscriptionError(error)) throw error;

      // A rotated VAPID key or an interrupted browser registration can leave a
      // stale PushSubscription behind. Clear it and retry once; never loop or
      // persist either the VAPID key or the resulting FCM token.
      await messagingModule.deleteToken(messaging).catch(() => false);
      const staleSubscription =
        await activeRegistration.pushManager.getSubscription();
      await staleSubscription?.unsubscribe().catch(() => false);
      token = await messagingModule.getToken(messaging, tokenOptions);
    }

    if (!token) {
      throw new FcmRegistrationError(
        "unknown",
        "ไม่สามารถรับ FCM Registration Token จากเซิร์ฟเวอร์ได้",
      );
    }
    return token;
  } catch (error) {
    throw sanitizeAndClassifyError(error);
  }
}

export async function deleteFcmToken(): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const { messaging, messagingModule } = await getFirebaseMessaging();
    await messagingModule.deleteToken(messaging);
  } catch {
    // Best effort cleanup without throwing
  }
}

export async function subscribeToForegroundMessages(
  listener: (payload: { title: string; body: string }) => void,
) {
  if (!isFirebaseConfigured) return () => undefined;
  try {
    const { messaging, messagingModule } = await getFirebaseMessaging();
    return messagingModule.onMessage(messaging, (payload) => {
      listener({
        title:
          payload.notification?.title ??
          payload.data?.title ??
          "จ่ายไม่ไหวแล้ว",
        body:
          payload.notification?.body ?? payload.data?.body ?? "มีข้อมูลใหม่",
      });
    });
  } catch {
    return () => undefined;
  }
}
