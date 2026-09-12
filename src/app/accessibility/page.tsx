import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "การเข้าถึง" };

export default function AccessibilityPage() {
  return (
    <LegalPage
      description="แนวทางการออกแบบให้ผู้ใช้หลากหลายกลุ่มเข้าถึงเนื้อหาและการควบคุมได้"
      eyebrow="การเข้าถึง · Placeholder"
      notice="เรายังไม่ได้ทำ accessibility audit โดยผู้ตรวจอิสระ ช่องทางแจ้งปัญหาจะเพิ่มก่อนเปิด production"
      sections={[
        {
          title: "สิ่งที่รองรับใน Foundation",
          content: (
            <p>
              โครงสร้างใช้ semantic HTML, skip link, keyboard focus
              ที่มองเห็นได้, ปุ่มขนาดเหมาะกับการสัมผัส, responsive navigation
              และเคารพการตั้งค่าลดการเคลื่อนไหว
            </p>
          ),
        },
        {
          title: "สีและการแสดงผล",
          content: (
            <p>
              ระบบรองรับ light/dark mode และวางคู่สีให้มี contrast ชัดเจน
              ข้อมูลสำคัญจะไม่สื่อด้วยสีหรือกราฟเพียงอย่างเดียว
            </p>
          ),
        },
        {
          title: "งานที่ต้องตรวจต่อ",
          content: (
            <p>
              ก่อน production ต้องตรวจด้วย keyboard, screen reader, zoom, mobile
              viewport และ automated accessibility tooling
              พร้อมแก้ข้อบกพร่องที่พบ
            </p>
          ),
        },
      ]}
      title="การเข้าถึงสำหรับทุกคน"
    />
  );
}
