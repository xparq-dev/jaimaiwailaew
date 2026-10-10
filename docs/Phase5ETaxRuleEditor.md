# Phase 5E — Admin Tax Rule Editor & Immutable Artifact Workflow

สถานะ: กำลังดำเนินการบน branch `feat/phase-5e-tax-rule-editor`

## เป้าหมาย

สร้างพื้นที่ทำงานสำหรับผู้ดูแลกฎภาษีที่ผ่าน MFA/AAL2 เพื่อบันทึก candidate,
ตรวจ validation, ดำเนิน workflow แบบแยกหน้าที่ และ publish artifact แบบ immutable
โดยไม่เปลี่ยนกฎที่ Calculator Production ใช้อยู่โดยอัตโนมัติ

## User journey

1. ผู้ดูแลเข้าสู่ระบบ แล้วเปิด “พื้นที่ผู้ดูแล” จากหน้าบัญชี
2. ระบบยืนยันตัวตนขั้นที่สองด้วย TOTP ก่อนเปิด Admin Dashboard
3. Worker ตรวจ AAL2 และ authority ฝั่ง server
4. Admin Dashboard แยกทางไปชุดกฎภาษี ทีมและสิทธิ์ และประวัติ ตามบทบาท
5. ผู้มีบทบาท author เลือกหรือวาง JSON ของ rule set แล้วบันทึก candidate
6. Worker parse schema, ตรวจ identity, canonicalize และคำนวณ SHA-256
7. R2 เก็บ snapshot แบบ content-addressed; key และ checksum ไม่มาจาก client
8. ผู้ดูแลส่งตรวจ ขอแก้ไข อนุมัติ publish หรือ retire ตาม role และ separation of duties
9. การ publish ต้องอ้าง snapshot ที่มีอยู่ ตรวจ publication gate ผ่าน และบันทึก audit/history

## In scope

- หน้า `/admin` สำหรับเลือกงาน และทางเข้าจากหน้าบัญชี/เมนูบัญชี
- หน้า `/admin/tax-rules`, `/admin/access` และ `/admin/audit` ภาษาไทย พร้อม loading, empty, permission, validation,
  conflict, success และ mobile review states
- TOTP enrollment/challenge สำหรับยกระดับ session เป็น AAL2
- API สำหรับบันทึกและอ่าน candidate artifact ตาม `ruleSetId` และ `version`
- canonical JSON และ SHA-256 ที่คำนวณฝั่ง Worker
- R2 content-addressed object ที่เขียนแบบ immutable และไม่เปิด public access
- D1 catalog สำหรับ current/published checksum และ optimistic revision
- publication gate จาก Phase 5C ก่อน append publish event
- authority, history และ audit contract จาก Phase 5D
- unit tests, Worker tests และ browser regression

## Out of scope

- การ activate artifact ให้ Calculator Production ใช้โดยอัตโนมัติ
- การแก้กฎ 2568/2569 ที่ bundled อยู่ใน repository
- public artifact endpoint หรือ public R2 access
- emergency access, account impersonation หรือการอ่านข้อมูลการเงินผู้ใช้
- การลบ artifact, governance event หรือ audit event
- payment, LINE, OCR, Firebase, Web Push และ Notification API

## Security และ privacy

- ทุก `/api/admin/*` endpoint ต้องใช้ JWT ที่ verify แล้วและ `aal2`
- role มาจาก bootstrap owner secret หรือ D1 เท่านั้น
- client ส่ง rule set, action, note และ expected head/revision ได้ แต่ส่ง actor/role/object key ไม่ได้
- published artifact แก้ไข/เขียนทับ/ลบผ่าน API ไม่ได้
- checksum คำนวณจาก canonical content โดยตัด `metadata.canonicalChecksum` ก่อน hash
- publish ต้อง pin checksum เดียวกับ candidate ที่ผ่าน validation และเป็น current revision
- UI ไม่แสดง token, R2 key, Supabase user UUID หรือ raw secret
- error หลักใช้ภาษาคน; code เชิงเทคนิคแสดงเฉพาะรายละเอียดเพื่อวินิจฉัย

## UX acceptance

- หน้าเป็น ops workbench: สถานะและ action มาก่อนคำอธิบายหรือการตกแต่ง
- แยก browse/inspect/edit/commit ไม่ยัด input ทั้งหมดไว้ในตาราง
- destructive/high-risk action มี summary และ confirmation ที่ระบุผลกระทบ
- mobile ให้ตรวจสถานะและ workflow ก่อน ส่วน JSON editor อยู่หลังการเปิดแก้ไข
- keyboard focus, label, error association และ touch target ใช้งานได้

## Release gate

- lint, formatting, app/Worker typecheck, unit tests, build และ browser tests ผ่าน
- local D1 migration และ Worker dry-run ผ่าน
- deploy เฉพาะ Preview ก่อน merge
- Preview ทดสอบ CORS, AAL2, authority, validation, stale revision และ immutable write
- Production migration/deploy ทำหลัง merge approval เท่านั้น
- runtime tax-rule activation ต้องเป็น phase/release แยก
