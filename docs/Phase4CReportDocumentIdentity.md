# Phase 4C — Report Document Identity

สถานะ: กำลังดำเนินการบน branch `feat/phase-4c-report-document-identity`

## เป้าหมาย

ให้ผู้ใช้เทียบ Preview กับไฟล์ที่ดาวน์โหลดได้จากเลขอ้างอิงรายงานเดียวกัน โดยสร้างเลขอ้างอิง
ภายในอุปกรณ์และไม่เปิดเผย ID ภายในของ Workspace หรือรายการทางการเงิน

เลขอ้างอิงมีรูปแบบ `JMWL-YYYYMMDD-HHmmss-SSS` ตามเวลา Asia/Bangkok ที่สร้างรายงาน
และเป็นเพียงเลขอ้างอิงสำหรับจัดระเบียบไฟล์ส่วนตัว ไม่ใช่เลขแบบยื่นภาษี เลขรับรอง หรือหลักฐานจาก
หน่วยงานราชการ

## In scope

- สร้างเลขอ้างอิงใหม่เมื่อผู้ใช้สร้าง Preview ของ PDF, Excel หรือ CSV
- ใช้เลขอ้างอิงเดิมตั้งแต่ Preview จนดาวน์โหลด artifact นั้น
- แสดงเลขอ้างอิงในเอกสาร PDF และ footer ทุกหน้า
- แสดงเลขอ้างอิงใน Summary metadata ของ Excel และ CSV
- แสดงเลขอ้างอิงใน Preview โดยใช้ข้อความภาษาไทยที่บอกว่าสร้างในเครื่อง
- ใช้เวลา Asia/Bangkok และ millisecond เพื่อลดโอกาสเลขซ้ำจากการสร้างติดกัน
- รองรับ mobile, dark mode, keyboard และ screen reader ตามโครง UI เดิม

## Out of scope

- Export history, download audit log หรือการ persist เลขอ้างอิง
- Export quota, plan/payment หรือ usage tracking
- ลายเซ็นดิจิทัล, cryptographic proof, QR verification หรือ server verification
- การอัปโหลดไฟล์หรือเลขอ้างอิงขึ้น Cloud/R2
- Auth, OAuth, Worker/R2, Cloud Sync, tax rules และ `supabase/`

## Security และ Privacy

- เลขอ้างอิงต้องไม่ประกอบด้วย Workspace ID, entry ID, user ID หรือ rule ID
- การสร้างเลขอ้างอิงต้องไม่มี network request, Local Storage write หรือ URL mutation
- Preview/Download ยังสร้างในอุปกรณ์เท่านั้น
- UI และเอกสารต้องไม่สื่อว่าเลขอ้างอิงนี้ออกโดยหน่วยงานราชการ

## Acceptance criteria

- PDF, Excel และ CSV แสดงเลขอ้างอิงรูปแบบเดียวกัน
- Preview และไฟล์ที่ดาวน์โหลดจาก Preview นั้นใช้เลขอ้างอิงเดียวกัน
- การสร้าง Preview ใหม่ได้เลขอ้างอิงจากเวลาสร้างใหม่
- เลขอ้างอิงแสดงใน PDF header/footer และ tabular Summary metadata
- ไม่พบ internal ID หรือข้อมูล technical เพิ่มในรายงาน
- ไม่มีการ persist, sync หรือส่งเลขอ้างอิงออก network
- unit/component/browser tests, lint, typecheck และ build ผ่าน
