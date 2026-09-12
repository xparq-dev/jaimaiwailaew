"use client";

import { CloudOff, Wifi } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(window.navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOnline;
}

export function NetworkStatusBadge() {
  const isOnline = useOnlineStatus();
  const { dictionary, locale } = useLocale();

  return (
    <span
      aria-label={
        isOnline ? dictionary.common.online : dictionary.common.offline
      }
      className={
        isOnline
          ? "bg-success-soft text-success-strong inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          : "bg-warning-soft text-warning-strong inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      }
      lang={locale}
      role="status"
    >
      {isOnline ? (
        <Wifi aria-hidden="true" className="size-3.5" />
      ) : (
        <CloudOff aria-hidden="true" className="size-3.5" />
      )}
      <span className="hidden min-[390px]:inline">
        {isOnline ? dictionary.common.online : dictionary.common.offline}
      </span>
    </span>
  );
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="border-warning/30 bg-warning-soft text-warning-strong border-b px-4 py-3 text-sm"
      role="status"
    >
      <div className="mx-auto flex max-w-screen-2xl items-start gap-2 lg:pl-72">
        <CloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          คุณกำลังใช้งานแบบออฟไลน์ โครงสร้างนี้ยังไม่เปิดใช้การคำนวณ
          และจะไม่อ้างว่าข้อมูลกฎหมายเป็นข้อมูลล่าสุด{" "}
          <Link className="font-semibold underline" href="/offline">
            ดูรายละเอียด
          </Link>
        </p>
      </div>
    </div>
  );
}
