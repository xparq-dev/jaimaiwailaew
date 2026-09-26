# Phase 2A — Knowledge Center Foundation

ตรวจสอบล่าสุด: 2026-09-26 (Asia/Bangkok)

## เป้าหมาย

เปลี่ยน `/learn` จาก route placeholder ให้เป็นศูนย์ความรู้แบบ static/local-first ที่ค้นหาได้
และทำให้ผู้อ่านตรวจวันทบทวน เวอร์ชัน ข้อจำกัด และแหล่งข้อมูลทางการของทุกบทความได้

## In scope

- content model แบบ typed สำหรับบทความ 9 หัวข้อ
- การค้นหาและกรองหมวดใน browser โดยไม่ส่งคำค้นออก network
- หน้า article ที่มี reading time, version, last-reviewed date, disclaimer, official sources และ related content
- ใช้แหล่งข้อมูลกรมสรรพากรที่ตรวจสอบเมื่อ 2026-09-26
- unit tests และ Playwright coverage สำหรับ search/metadata/source links
- รองรับ mobile, dark mode, keyboard และ offline shell เดิม

## Out of scope

- CMS, admin editor, analytics หรือ search API
- การดึงกำหนดเวลาหรือกฎภาษีแบบ real-time
- การรับรองคำแนะนำทางกฎหมายหรือภาษี
- การเปลี่ยน tax calculation, Auth, Cloud Sync, Worker/R2 หรือ `supabase/`
- การเปิด search indexing; `noindex, nofollow` ยังคงเดิม

## Content policy

- เริ่มจากคำอธิบายและ checklist ที่ช่วยเตรียมข้อมูล ไม่ฟันธงสิทธิหรือหน้าที่ยื่นแบบ
- ไม่เผยแพร่วงเงิน อัตรา หรือวันครบกำหนดโดยไม่มีการตรวจปีภาษีและแหล่งทางการ
- ทุกบทความต้องมี version, review date, disclaimer และ HTTPS source จากหน่วยงานทางการ
- ลิงก์แหล่งข้อมูลเปิดเมื่อผู้ใช้เลือกเอง ไม่มี runtime fetch หรือ tracking

## Acceptance criteria

- `/learn` ค้นหาและกรองบทความได้ด้วย keyboard และแสดง empty state ที่กู้คืนได้
- บทความทั้ง 9 หน้า render แบบ static และมี metadata ครบ
- ทุก source link ระบุหน่วยงานและเปิดแหล่งทางการ
- ไม่มีคำค้น ข้อมูลการเงิน หรือข้อมูลผู้ใช้ถูกส่งออก network
- unit, browser tests, lint, typecheck และ production build ผ่าน
