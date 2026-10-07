# Phase 5C — Tax Governance Workflow Foundation

สถานะ: กำลังดำเนินการบน branch `feat/phase-5c-tax-governance`

## เป้าหมาย

สร้าง contract และ validation gate สำหรับการเปลี่ยน Tax Rule รุ่นใหม่จาก draft ไปจนถึง publish
ก่อนสร้าง Admin UI หรือ write API เพื่อให้ทุกช่องทางในอนาคตใช้กฎสิทธิ์และ fail-closed policy เดียวกัน

## In scope

- role contract: author, reviewer, approver และ publisher
- transition state machine: draft → in review → approved → published → retired
- request changes กลับ draft โดยไม่แก้ event เดิม
- append-only event history ที่ตรวจ identity, ลำดับเวลา และ status chain
- separation of duties: ผู้ส่ง review ห้ามอนุมัติเอง และผู้อนุมัติห้าม publish เอง
- publish event ต้อง pin SHA-256 checksum ที่ตรงกับ canonical checksum ใน metadata
- publication gate ตรวจ schema, official sources, review status, manifest readiness และ history
- unit tests สำหรับ happy path และ fail-closed cases

## Out of scope

- Admin UI, Tax Rule Editor หรือการแก้ JSON ผ่าน browser
- การกำหนด admin จาก email, OAuth provider หรือ frontend environment variable
- Worker/R2 write endpoint, Supabase table/RLS หรือ secrets ใหม่
- migration ของกฎ 2568/2569 ที่เผยแพร่อยู่ และการเปลี่ยนผลคำนวณ
- Content moderation, analytics, quota, payment, LINE หรือ OCR
- การอ้างว่ามี professional/legal sign-off ใหม่

## Security และ governance decisions

- role ที่ส่งมากับ client ไม่มีอำนาจด้วยตัวเอง; phase นี้เป็น domain contract เท่านั้น
- เมื่อมี backend ในอนาคต ต้อง resolve role จาก server-side authority และบันทึก actor แบบ immutable
- ห้ามแก้หรือลบ event เพื่อทำให้ history ผ่าน ต้อง append event ใหม่เท่านั้น
- validation error ทุกชนิดทำให้ publication gate คืน `isPublishable: false`
- published artifact ต้อง immutable; การเปลี่ยนกฎต้องใช้ version ใหม่

## Acceptance criteria

- history ที่ถูกต้องและมี actor แยกกันครบผ่าน validation
- actor ที่ไม่มี role, author อนุมัติเอง หรือ approver publish เองถูกปฏิเสธ
- transition ข้ามขั้น, เวลาไม่เรียง, event ID ซ้ำ และ identity ไม่ตรงถูกปฏิเสธ
- publish ที่ไม่มี checksum หรือ checksum ไม่ตรง metadata ถูกปฏิเสธ
- changelog/source reference และ manifest version ต้องตรงกับ version ที่ publish
- candidate ที่ schema ไม่ผ่าน, source ไม่เป็นทางการ/ไม่ reviewed หรือ manifest ไม่พร้อมถูกปฏิเสธ
- ไม่มี network, storage, Auth, Worker/R2 หรือ calculator behavior เปลี่ยน
- lint, typecheck, unit tests, production build และ browser regression ผ่าน

## ขั้นต่อไปหลัง Phase 5C

เมื่อ contract นี้ merge แล้ว จึงกำหนด Phase 5D สำหรับ server-side Admin Authority และ storage
โดยต้องระบุ bootstrap owner, role assignment/revocation, audit retention, emergency access,
deployment secrets และ rollback ก่อนสร้าง UI ที่แก้หรือ publish กฎได้จริง
