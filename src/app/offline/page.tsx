import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "การใช้งานออฟไลน์" };

export default function OfflinePage() {
  return (
    <PlaceholderPage
      content={{
        eyebrow: "PWA · Offline skeleton",
        title: "โครงสร้างออฟไลน์ที่ไม่ cache ข้อมูลการเงิน",
        description:
          "Phase 0 ติดตั้งเฉพาะ service worker แบบปลอดภัยและ offline fallback ยังไม่ cache เครื่องคำนวณหรือชุดกฎสำหรับใช้งานจริง",
        plannedItems: [
          "แสดงสถานะ online/offline",
          "ไม่ cache PDF หรือข้อมูลผู้ใช้",
          "cache มีชื่อเวอร์ชันและล้างรุ่นเก่า",
          "รอชุดกฎที่ผ่านการตรวจสอบก่อนเปิดคำนวณ",
        ],
      }}
    />
  );
}
