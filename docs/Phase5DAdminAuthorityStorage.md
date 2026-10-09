# Phase 5D — Server-side Admin Authority & Governance Storage

สถานะ: ปิดงานแล้วผ่าน PR #44 และ rollout สู่ Production สำเร็จ

หลักฐานหลัง merge:

- merge commit: `298f08256cc69c50b83fdf165e916024c73f8592`
- GitHub Actions CI และ Browser tests ผ่าน
- Production D1 migration ถูก apply และแยกจาก Preview
- Production Worker deploy สำเร็จ โดย CORS อนุญาตเฉพาะ Production origin
- preflight จาก Production origin ได้ `204`; origin อื่นได้ `403`
- request ที่ไม่มีหรือใช้ token ไม่ถูกต้องได้ `401`
- governance tables ยังไม่มีข้อมูลทดสอบปะปนหลัง rollout
- Vercel Production พร้อมใช้งานจาก merge commit เดียวกัน

## เป้าหมาย

ทำให้ role contract จาก Phase 5C มี authority ฝั่งเซิร์ฟเวอร์และ storage ที่ตรวจสอบย้อนหลังได้
โดยยังไม่เปิด Admin UI หรือให้ client กำหนดสิทธิ์/ตัวตนของ actor เอง

## Architecture decision

- Supabase JWT ยังคงเป็นหลักฐานยืนยันตัวตน แต่ Worker ใช้เฉพาะ `sub` และ `aal`
- D1 เก็บ role assignment, revocation, tax-rule governance events และ audit index เพราะต้องใช้
  optimistic concurrency, unique constraints และ atomic trigger
- R2 เดิมยังเก็บข้อมูล Workspace และจะใช้กับ immutable tax-rule artifact ใน phase ที่สร้าง editor
- bootstrap owner อ่านจาก Worker secret `GOVERNANCE_BOOTSTRAP_OWNER_SUB` เท่านั้น ไม่ใช้ email,
  frontend environment variable หรือข้อมูลที่ client ส่งมา

## In scope

- role ฝั่งเซิร์ฟเวอร์: owner, auditor, author, reviewer, approver และ publisher
- AAL2/MFA gate สำหรับทุก `/api/admin/*` endpoint
- owner-only role assignment/revocation พร้อม expected version เพื่อป้องกัน stale write
- bootstrap owner เปลี่ยนหรือลบผ่าน API ไม่ได้
- append-only tax-rule governance event storage โดย actor ID/roles มาจาก server
- optimistic head check และ unique sequence ป้องกัน event ชนกัน
- audit event ที่สร้างด้วย D1 trigger ใน transaction เดียวกับ authority/event mutation
- read-only audit endpoint จำกัดครั้งละไม่เกิน 100 รายการ
- D1 แยก Preview และ Production; migration อยู่ใน source control
- Workers Logs/Traces และ structured mutation/error logging

## Out of scope

- Admin UI และ Tax Rule Editor
- การ upload/publish immutable rule artifact เข้า R2
- การเปิด Emergency Access ไปยังข้อมูลการเงินของผู้ใช้
- การกำหนด owner จาก email หรือการให้ frontend ส่ง role
- การ deploy Worker Production หรือ apply Production migration ก่อน merge approval
- การเพิ่ม Firebase/Web Push, payment, LINE หรือ OCR

## Security and privacy decisions

- ไม่มี admin endpoint ใดทำงานเมื่อ secret/database binding หาย (`503`, fail closed)
- JWT ที่ไม่ใช่ AAL2 ถูกปฏิเสธก่อนอ่านหรือเขียน governance storage
- client ส่งได้เฉพาะ action/note/head/checksum; actor, role, from/to status ถูกสร้างฝั่ง Worker
- ไม่มี API ลบ audit event หรือ governance event
- audit ไม่บันทึก email, access token, ข้อมูลการเงิน หรือ request body ทั้งก้อน
- Emergency Access ยังปิดอยู่ การเพิ่มในอนาคตต้องมี ticket, reason, consent/MFA, time limit
  และ user-visible audit ตาม PRD
- audit retention ยังไม่กำหนดวันลบจนกว่าจะผ่าน privacy/legal review จึงไม่มี automated deletion

## Rollout and rollback

1. สร้าง D1 แยก Preview/Production แต่ apply migration และ deploy เฉพาะ Preview ก่อน
2. ตั้ง bootstrap owner ด้วย secret แยกแต่ละ environment โดยไม่ commit ค่า
3. ทดสอบ AAL2, owner bootstrap, assignment/revocation, separation of duties และ audit
4. merge หลัง CI/Preview ผ่าน แล้วจึง apply Production migration และ deploy Production
5. Worker code rollback ใช้ Workers deployment rollback; D1 migration เป็น forward-only และข้อมูล
   ไม่ย้อนตาม code rollback ต้องสำรอง/ใช้ D1 Time Travel ตาม runbook ก่อน migration ถัดไป

## Acceptance criteria

- role จาก request body/JWT custom field ไม่มีอำนาจ สิทธิ์ต้องมาจาก secret หรือ D1 เท่านั้น
- session ที่ไม่ใช่ AAL2, user ไม่มี authority และ role ผิดหน้าที่ถูกปฏิเสธ
- stale authority version และ stale governance head ได้ `409`
- author อนุมัติงานตัวเองและ approver publish เองไม่ได้ตาม Phase 5C
- mutation สร้าง audit record และไม่มี delete endpoint
- Preview/Production ใช้คนละ D1 database
- Worker typecheck, local migration, unit tests, bundle dry-run, CI และ Browser tests ผ่าน

## ขั้นต่อไปหลัง Phase 5D

Phase 5E จึงค่อยกำหนด Admin Tax Rule Editor และ immutable artifact workflow โดยใช้ authority,
history และ audit contract นี้ ห้ามสร้าง UI ที่อ้าง role จาก client หรือข้าม AAL2 gate
