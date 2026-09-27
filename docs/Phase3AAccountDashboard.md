# Phase 3A — Account Dashboard Foundation

ตรวจสอบล่าสุด: 2026-09-27 (Asia/Bangkok)

## เป้าหมาย

ทำให้สมาชิกเห็นภาพรวมบัญชี ตำแหน่งข้อมูล สถานะ Cloud Sync และ Workspace ในอุปกรณ์ปัจจุบันจากหน้าเดียว
พร้อมกลับไปทำงานหรือเปิดรายงานได้ โดยใช้ Auth, Sync และ Local Storage state ที่มีอยู่แล้ว

## In scope

- ปรับ `/profile` เป็น User Dashboard ที่ใช้ภาษาของผู้ใช้ ไม่แสดงสถานะเทคนิคเป็นข้อมูลหลัก
- แสดงช่องทางเข้าสู่ระบบและอีเมล โดยไม่แสดง user ID หรือ token
- แยกสถานะ “ข้อมูลในอุปกรณ์นี้” และ “สำเนาบน Cloud” ให้ชัดเจน
- แสดงจำนวน Workspace, เวลาที่แก้ไขล่าสุด, sync state และ pending cloud deletion แบบไม่เปิดเผย ID
- แสดง Workspace ในอุปกรณ์ พร้อมทางลัดเปิดเครื่องคำนวณและรายงาน
- มี empty/loading/error/offline/anonymous state และ recovery action
- รองรับ mobile, dark mode, keyboard และ screen reader

## Out of scope

- Account deletion และ retention 30 วัน
- Email login, email verification และ password reset
- Server-side audit log, consent ledger หรือ security-event dashboard
- การอ่านรายการไฟล์จาก R2 โดยตรงหรือการแสดง cloud object/path
- API, Worker/R2, OAuth, Cloud Sync protocol, tax calculation หรือ `supabase/` changes
- Export history, quota, payment หรือ admin features

## Privacy and safety policy

- Dashboard อ่านเฉพาะ state ที่มีอยู่ใน browser/provider เดิม
- ไม่เพิ่ม network request หรือ analytics สำหรับ dashboard
- ไม่แสดง workspace ID, user ID, access token, bucket name หรือ internal error code
- ปุ่มเปิด Workspace เปลี่ยน active workspace ผ่าน store เดิมเท่านั้น
- การออกจากระบบไม่ลบ Local Storage ของเครื่องคำนวณ

## Acceptance criteria

- สมาชิกเห็นบัญชี แหล่งเก็บข้อมูล สถานะ Sync และ Workspace จาก `/profile`
- เปิด Workspace หรือหน้ารายงานที่เลือกได้ทั้ง Desktop/Mobile
- ผู้ใช้ที่ยังไม่มี Workspace ได้ empty state พร้อมทางเลือกสร้างใหม่หรือตรวจ Cloud Sync
- ผู้ใช้ที่ยังไม่ login ได้ข้อความ local-first และทางเข้าสู่ระบบ
- dashboard ไม่แสดง internal IDs และไม่มี horizontal overflow
- logout ยังเก็บ local calculator data ตามนโยบายเดิม
- lint, typecheck, unit tests, browser tests และ production build ผ่าน
