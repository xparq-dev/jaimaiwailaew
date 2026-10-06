import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "การเข้าถึง" };

export default function AccessibilityPage() {
  return (
    <LegalPage
      description="แนวทางการออกแบบให้ผู้ใช้หลากหลายกลุ่มเข้าถึงเนื้อหาและการควบคุมได้"
      eyebrow="การเข้าถึง"
      notice="ระบบผ่านการตรวจอัตโนมัติและ browser tests ตาม release baseline แล้ว แต่ยังไม่ได้รับการตรวจ accessibility โดยผู้ตรวจอิสระ"
      sections={[
        {
          title: "สิ่งที่รองรับในปัจจุบัน",
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
              ยังต้องทดสอบกับ screen reader, การ zoom
              และอุปกรณ์จริงให้ครอบคลุมมากขึ้น
              เมื่อพบอุปสรรคในการใช้งานจะบันทึกและแก้ไขตามลำดับความสำคัญ
            </p>
          ),
        },
      ]}
      title="การเข้าถึงสำหรับทุกคน"
    />
  );
}
