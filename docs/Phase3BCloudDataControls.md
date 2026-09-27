# Phase 3B — Cloud Data Controls

ตรวจสอบล่าสุด: 2026-09-27 (Asia/Bangkok)

## เป้าหมาย

ให้สมาชิกควบคุมสำเนา Workspace ที่เคยส่งขึ้น Cloud ได้จากหน้า Settings โดยสามารถลบสำเนา
ทั้งหมดของบัญชีออกจาก private R2 ได้อย่างชัดเจน ขณะที่ข้อมูลในอุปกรณ์และบัญชี Supabase
ยังคงอยู่ตามเดิม

## In scope

- อธิบายให้ชัดว่า “ปิด Cloud Sync” เป็นการหยุดส่ง/ดึงข้อมูลและไม่ใช่การลบสำเนาเดิม
- เพิ่มคำสั่งลบ Workspace และ tombstone ทั้งหมดภายใต้ R2 prefix ของผู้ใช้ที่ยืนยันตัวตนแล้ว
- ตรวจ owner จาก Supabase JWT และ path user ID ก่อนลบทุกครั้ง
- ลบวัตถุ R2 เป็นชุดไม่เกิน 1,000 keys และทำต่อจน prefix ของผู้ใช้ว่าง
- ปิด Cloud Sync บนอุปกรณ์ปัจจุบันหลังลบสำเร็จ เพื่อไม่ให้อัปโหลดข้อมูล local กลับทันที
- ยืนยันสองจังหวะ พร้อม success/error/offline state ที่ใช้ภาษาของผู้ใช้
- รักษา Workspace ใน Local Storage และเปิด Sync ใหม่ภายหลังได้

## Out of scope

- การลบบัญชี Supabase, OAuth identity หรือ provider account
- retention/grace period 30 วัน และ scheduled deletion
- audit log, consent ledger, email notification หรือ admin workflow
- การลบข้อมูลในอุปกรณ์อื่นจากระยะไกล
- การเปลี่ยน Last-Write-Wins, OAuth, tax calculation, export หรือ `supabase/`

## Security and privacy policy

- endpoint ต้องรับ Bearer token และใช้ subject จาก JWT เป็น owner เท่านั้น
- user ID ใน URL ต้องตรงกับ JWT subject มิฉะนั้นตอบ 403 โดยไม่แตะ R2
- ลบได้เฉพาะ prefix `users/<authenticated-user>/` และห้ามรับ R2 key จาก request body
- R2 ยังคง private และทุก response ใช้ CORS allow-list เดิม
- frontend ไม่แสดง user ID, object key/path, token หรือ raw Worker error
- หากลบไม่สำเร็จ ต้องไม่ปิด Sync หรืออ้างว่าข้อมูลถูกลบแล้ว

## Acceptance criteria

- ผู้ใช้เข้าใจความต่างระหว่างปิด Sync และลบสำเนา Cloud
- dialog ระบุชัดว่าข้อมูล local และบัญชีสมาชิกจะไม่ถูกลบ
- ลบทั้ง Workspace และ tombstone ของ owner ได้ รวมกรณีมีหลายหน้าใน R2 listing
- request ของ user A ลบข้อมูล user B ไม่ได้
- หลังลบสำเร็จ Cloud Sync ปิด, timestamp ถูกล้าง และข้อมูล local ยังอยู่
- เปิด Cloud Sync ใหม่แล้วสามารถสร้างสำเนาใหม่จาก local data ได้
- UI ใช้งานได้บน Desktop/Mobile, Dark Mode, keyboard และ screen reader
- lint, typecheck, Worker tests, unit tests, browser tests และ production build ผ่าน
