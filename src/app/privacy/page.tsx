import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "ความเป็นส่วนตัว" };

export default function PrivacyPage() {
  return (
    <LegalPage
      description="คำอธิบายการจัดเก็บและส่งข้อมูลของโหมด Local-only และ Cloud Sync แบบสมัครใจ"
      eyebrow="ข้อมูลทางกฎหมาย · ร่างสำหรับตรวจสอบ"
      notice="หน้านี้เป็นร่างก่อนเปิดบริการ Cloud จริง ต้องเพิ่มข้อมูลผู้ควบคุมข้อมูล ช่องทางติดต่อ ระยะเวลาเก็บรักษา และผ่านการตรวจด้านกฎหมายก่อน Production"
      sections={[
        {
          title: "ค่าเริ่มต้นเป็น Local-only",
          content: (
            <p>
              ผู้ใช้สามารถบันทึก คำนวณ
              และส่งออกรายงานบนอุปกรณ์ได้โดยไม่สมัครสมาชิก ข้อมูลการเงินอยู่ใน
              Local Storage และจะไม่ถูกส่งไป Cloud
              จนกว่าผู้ใช้จะเข้าสู่ระบบและเปิด Cloud Sync ด้วยตนเอง
            </p>
          ),
        },
        {
          title: "บริการภายนอกเมื่อผู้ใช้เปิดใช้งาน",
          content: (
            <p>
              Supabase ใช้ยืนยันตัวตนด้วยอีเมล Google หรือ GitHub, Cloudflare
              Worker ตรวจสิทธิ์ก่อนอ่านหรือเขียนสำเนา Workspace แบบ JSON ใน R2
              เฉพาะเมื่อผู้ใช้เปิด Cloud Sync ผู้ให้บริการโฮสติ้งอาจมี access
              log ตามการทำงานปกติ
            </p>
          ),
        },
        {
          title: "การซิงก์และสิทธิ์ควบคุม",
          content: (
            <p>
              การซิงก์ใช้หลัก Last-Write-Wins จากเวลาที่แก้ไข Workspace ล่าสุด
              ผู้ใช้ปิด Cloud Sync ได้ทุกเมื่อ การปิด Sync หยุดการส่งข้อมูลใหม่
              แต่ยังไม่ใช่คำสั่งลบสำเนาที่มีอยู่ใน R2
              จึงต้องจัดทำขั้นตอนลบบัญชีและข้อมูลก่อนเปิดบริการจริง
            </p>
          ),
        },
        {
          title: "Service worker และไฟล์ส่งออก",
          content: (
            <p>
              Service worker เก็บเฉพาะ offline fallback และ static asset
              ที่กำหนดไว้ ไม่ cache ข้อมูลการเงิน, API response, PDF, Excel หรือ
              CSV ไฟล์รายงานยังสร้างในเบราว์เซอร์และดาวน์โหลดลงอุปกรณ์โดยตรง
            </p>
          ),
        },
      ]}
      title="ความเป็นส่วนตัว"
    />
  );
}
