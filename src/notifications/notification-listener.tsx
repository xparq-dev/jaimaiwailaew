"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/auth/auth-provider";
import { subscribeToForegroundMessages } from "@/lib/firebase";
import {
  isNotificationEnabled,
  NOTIFICATION_PREFERENCE_EVENT,
} from "@/sync/preferences";

export function NotificationListener() {
  const { user } = useAuth();
  const [, setPreferenceRevision] = useState(0);
  const enabled = user ? isNotificationEnabled(user.id) : false;

  useEffect(() => {
    const handlePreferenceChange = () =>
      setPreferenceRevision((current) => current + 1);
    window.addEventListener(
      NOTIFICATION_PREFERENCE_EVENT,
      handlePreferenceChange,
    );
    return () =>
      window.removeEventListener(
        NOTIFICATION_PREFERENCE_EVENT,
        handlePreferenceChange,
      );
  }, []);

  useEffect(() => {
    if (!user || !enabled) return;
    let unsubscribe: (() => void) | undefined;
    void subscribeToForegroundMessages(async ({ title, body }) => {
      if (
        Notification.permission === "granted" &&
        "serviceWorker" in navigator
      ) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: "/icons/icon.svg",
          tag: "jaimaiwailaew-foreground",
        });
      }
    })
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch(() => undefined);
    return () => unsubscribe?.();
  }, [enabled, user]);

  return null;
}
