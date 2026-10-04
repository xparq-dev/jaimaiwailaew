# Phase 4D — Local Export History

สถานะ: กำลังดำเนินการบน branch `feat/phase-4d-local-export-history`

## เป้าหมาย

ช่วยให้ผู้ใช้ตรวจย้อนหลังได้ว่าเคยเริ่มดาวน์โหลดรายงานใดจาก browser นี้ โดยเก็บเฉพาะ metadata
ที่จำเป็นใน Local Storage และไม่สร้างระบบติดตามฝั่ง server

## ข้อมูลที่เก็บ

- รูปแบบไฟล์: PDF, Excel หรือ CSV
- เลขอ้างอิงรายงานที่สร้างในเครื่อง
- ช่วงรายงาน
- แม่แบบรายงาน
- เวลาที่เริ่มดาวน์โหลด

ไม่เก็บยอดเงิน รายการทางการเงิน ชื่อผู้จัดทำ filename/path, Workspace ID, entry ID, user ID
หรือ rule ID

## In scope

- บันทึกประวัติเมื่อผู้ใช้กดดาวน์โหลดจริงเท่านั้น ไม่บันทึกตอนเปิด Preview
- เก็บล่าสุดไม่เกิน 20 รายการใน browser ปัจจุบัน
- การดาวน์โหลด artifact เดิมซ้ำจะอัปเดตเวลาล่าสุดโดยไม่สร้างแถวซ้ำ
- แสดงประวัติแบบพับได้ใต้ชุดปุ่ม Export เพื่อไม่รบกวนงานหลัก
- มี empty, loading และ storage-error state
- ล้างประวัติทั้งหมดได้หลังยืนยัน และไม่ลบไฟล์หรือข้อมูล Workspace
- ปุ่มล้างข้อมูลทั้งหมดของ Calculator ต้องล้างประวัติ local นี้ด้วย
- storage failure ต้องไม่ขวางการดาวน์โหลดไฟล์

## Out of scope

- Cloud Sync หรือ R2 storage สำหรับประวัติ
- ประวัติข้าม browser, อุปกรณ์ หรือบัญชี
- Server-side download audit log, security audit หรือ admin access
- Export quota, plan/payment หรือ usage billing
- เปิดไฟล์เดิม ดาวน์โหลดซ้ำจาก history หรือเก็บ artifact blob
- Auth, OAuth, Worker/R2, tax rules และ `supabase/`

## Security และ Privacy

- ใช้ storage key แยกจาก Calculator และไม่อยู่ใน Cloud Sync payload
- parse storage แบบ fail closed และจำกัดชนิด/ความยาวของทุก field
- ไม่เก็บจำนวนเงิน ข้อมูลผู้จัดทำ หรือ internal identifiers
- ไม่มี network request หรือ URL mutation จากการอ่าน/เขียน/ล้าง history
- ข้อความ UI ระบุชัดว่าเป็นประวัติในอุปกรณ์นี้ ไม่ใช่ audit log จาก server

## Acceptance criteria

- Preview อย่างเดียวไม่สร้าง history
- PDF/Excel/CSV สร้าง history หลังเริ่ม download
- ประวัติเรียงล่าสุดก่อน จำกัด 20 รายการ และ deduplicate ตาม format + reference
- refresh แล้วยังอ่าน history ได้จาก browser เดิม
- storage unavailable/corrupt ไม่ทำให้ Export ล้มเหลว
- clear confirmation ทำงานด้วย keyboard และอธิบายผลกระทบชัดเจน
- ข้อมูล history ไม่ถูก sync หรือออก network
- desktop/mobile/dark mode, unit/component/browser tests, lint, typecheck และ build ผ่าน
