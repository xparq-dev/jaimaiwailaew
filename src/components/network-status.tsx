"use client";

import { CloudOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import {
  getOfflineCacheMetadata,
  type OfflineCacheMetadata,
} from "@/pwa/service-worker-client";

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
  const [metadata, setMetadata] = useState<OfflineCacheMetadata | null>(null);

  useEffect(() => {
    if (isOnline) return;
    let active = true;
    void getOfflineCacheMetadata().then((value) => {
      if (active) setMetadata(value);
    });
    return () => {
      active = false;
    };
  }, [isOnline]);

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
        <p className="leading-relaxed">
          คุณกำลังใช้งานแบบออฟไลน์
          เครื่องคำนวณใช้ข้อมูลในอุปกรณ์และกฎภาษีที่แคชไว้
          {metadata
            ? ` เวอร์ชัน ${metadata.taxRuleVersion}`
            : " (ไม่ทราบเวอร์ชัน)"}
          {metadata?.cachedAt
            ? ` เมื่อ ${new Intl.DateTimeFormat("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Bangkok",
              }).format(new Date(metadata.cachedAt))} น.`
            : " โดยไม่พบเวลาที่แคช"}
          {metadata && !metadata.ready
            ? " ชุดออฟไลน์อาจยังเตรียมไม่ครบ กรุณากลับมาออนไลน์ก่อนใช้งานครั้งถัดไป"
            : " โปรดตรวจข้อมูลล่าสุดอีกครั้งเมื่อกลับมาออนไลน์"}{" "}
          <a className="font-semibold underline" href="/offline">
            ดูรายละเอียด
          </a>
        </p>
      </div>
    </div>
  );
}
