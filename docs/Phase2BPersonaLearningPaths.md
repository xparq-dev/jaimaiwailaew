# Phase 2B — Persona Learning Paths

ตรวจสอบล่าสุด: 2026-09-27 (Asia/Bangkok)

## เป้าหมาย

ปิดข้อกำหนด “อ่านต่อ ตาม persona” ของ Phase 2 โดยใช้ประเภทผู้ใช้งานจาก Workspace ปัจจุบัน
เพื่อจัดลำดับบทความที่ควรอ่านต่อ ทั้งในหน้าศูนย์ความรู้และหน้าบทความ โดยไม่ส่งข้อมูลผู้ใช้หรือคำค้นออก network

## In scope

- เส้นทางบทความสำหรับผู้ขายออนไลน์/ธุรกิจ ฟรีแลนซ์ พนักงานประจำ ผู้มีรายได้หลายทาง และผู้ที่ยังไม่แน่ใจ
- ใช้ `workspace.persona` ที่มีอยู่แล้วเป็นค่าเริ่มต้นหลัง Zustand hydration
- ให้ผู้ใช้เปลี่ยนสถานการณ์สำหรับการอ่านในหน้านั้นได้ โดยไม่แก้ข้อมูล Workspace
- แสดงคำแนะนำบน `/learn` และ “อ่านต่อให้ตรงกับคุณ” ในหน้าบทความ
- คำแนะนำเป็นเพียงการจัดลำดับเนื้อหา ไม่ตัดสินหน้าที่หรือสิทธิทางภาษี
- รองรับ keyboard, screen reader, mobile, dark mode และ local-first behavior เดิม

## Out of scope

- ไม่สร้าง user profiling, analytics, recommendation API หรือ machine learning
- ไม่ส่ง persona, Workspace, คำค้น หรือประวัติการอ่านออก network
- ไม่แก้ tax calculation, Auth, Cloud Sync, Worker/R2, OAuth หรือ `supabase/`
- ไม่ซ่อนบทความหรือจำกัดสิทธิการเข้าถึงตาม persona
- ไม่เพิ่ม CMS, admin editor หรือเนื้อหาภาษีใหม่
- ไม่เปิด search indexing; `noindex, nofollow` ยังคงเดิม

## Recommendation policy

- mapping ต้องเป็น deterministic และ version-control ได้
- slug ทุกตัวในทุกเส้นทางต้องอ้างถึงบทความที่เผยแพร่จริง
- หน้า article ต้องไม่แนะนำบทความปัจจุบันซ้ำ
- ผู้ใช้เปลี่ยนเส้นทางชั่วคราวได้ และต้องมีข้อความชัดเจนว่าไม่แก้ Workspace
- หากไม่มี Workspace ให้ใช้เส้นทาง “ยังไม่แน่ใจ” โดยไม่สร้างข้อมูลใหม่

## Acceptance criteria

- `/learn` แสดงเส้นทางตาม persona ของ Workspace หลัง hydration
- ผู้ใช้เปลี่ยนสถานการณ์ได้ด้วย keyboard และผลลัพธ์เปลี่ยนทันที
- การเปลี่ยนสถานการณ์ไม่เปลี่ยน `workspace.persona`
- หน้าบทความแสดงบทความถัดไปตาม persona และไม่แสดงบทความปัจจุบันซ้ำ
- ผู้ที่ไม่มี Workspace ได้เส้นทางเริ่มต้นที่ไม่ฟันธง
- ไม่มี request ใหม่สำหรับ recommendation และไม่มีข้อมูลการเงิน/ผู้ใช้ใน URL
- unit tests, browser tests, lint, typecheck และ production build ผ่าน
