const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId &&
  vapidKey,
);

async function getFirebaseMessaging() {
  if (!isFirebaseConfigured) {
    throw new Error("ยังไม่ได้ตั้งค่า Firebase FCM");
  }

  const [{ getApp, getApps, initializeApp }, messagingModule] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  if (!(await messagingModule.isSupported())) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับ Push Notification");
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

export async function requestFcmToken() {
  if (typeof Notification === "undefined") {
    throw new Error("อุปกรณ์นี้ไม่รองรับ Notification");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("ผู้ใช้ยังไม่ได้อนุญาต Notification");
  }
  if (!("serviceWorker" in navigator)) {
    throw new Error("อุปกรณ์นี้ไม่รองรับ Service Worker");
  }

  const registration = await navigator.serviceWorker.ready;
  const { messaging, messagingModule } = await getFirebaseMessaging();
  const token = await messagingModule.getToken(messaging, {
    serviceWorkerRegistration: registration,
    vapidKey: vapidKey!,
  });
  if (!token) throw new Error("Firebase ไม่ได้ส่ง registration token กลับมา");
  return token;
}

export async function deleteFcmToken() {
  if (!isFirebaseConfigured) return;
  const { messaging, messagingModule } = await getFirebaseMessaging();
  await messagingModule.deleteToken(messaging);
}

export async function subscribeToForegroundMessages(
  listener: (payload: { title: string; body: string }) => void,
) {
  if (!isFirebaseConfigured) return () => undefined;
  const { messaging, messagingModule } = await getFirebaseMessaging();
  return messagingModule.onMessage(messaging, (payload) => {
    listener({
      title:
        payload.notification?.title ?? payload.data?.title ?? "จ่ายไม่ไหวแล้ว",
      body: payload.notification?.body ?? payload.data?.body ?? "มีข้อมูลใหม่",
    });
  });
}
