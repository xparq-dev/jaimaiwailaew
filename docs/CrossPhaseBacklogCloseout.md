# Cross-phase Backlog Closeout

ตรวจสอบล่าสุด: 2026-10-06 (Asia/Bangkok)

เอกสารนี้จัดสถานะงานที่ถูกส่งต่อข้าม Phase เพื่อไม่ให้รายการเดิมถูกตีความว่าเป็นงานค้างที่ต้อง
นำไปรวมใน Phase ถัดไปโดยอัตโนมัติ การจัดสถานะยึด Production baseline, architecture ปัจจุบัน
และข้อกำหนดด้าน local-first/privacy เป็นหลัก

## ปิดแล้วจาก implementation ปัจจุบัน

- Google/GitHub OAuth, Profile, Logout และ Account dashboard ปิดแล้วใน Phase 1E/3A
- Data export, report period/template, document reference, tax-rule version และประวัติการดาวน์โหลด
  แบบ metadata-only ในอุปกรณ์ ปิดแล้วใน Phase 1C–1D และ Phase 4A–4D
- Cloud-copy deletion ปิดแล้วใน Phase 3B โดยลบเฉพาะสำเนาใน private R2 หลังตรวจ JWT/ownership
  และไม่ลบข้อมูล local
- การแยกข้อมูลบัญชีใช้ JWT subject และ R2 owner prefix แบบ fail closed แทน Supabase table RLS
  เพราะข้อมูล Workspace ไม่ได้เก็บใน Supabase Database

## ปิดการประเมินและบันทึก decision แล้ว

### Nonce-based CSP

ยังไม่เปลี่ยน Production ไปใช้ nonce-based CSP ใน baseline ปัจจุบัน คู่มือของ Next.js รุ่นที่ติดตั้ง
ระบุว่า nonce ต้องสร้างใหม่ทุก request และทุกหน้าต้องใช้ dynamic rendering ซึ่งทำให้เสีย static
optimization, CDN caching และไม่เข้ากับ static/offline app shell ของ PWA ส่วน hash-based SRI
ยังเป็น experimental

มติปัจจุบันคือคง CSP allow-list ใน `next.config.ts`, ไม่เพิ่ม third-party script และทบทวน nonce
อีกครั้งเมื่อมีข้อบังคับด้าน compliance, เปลี่ยน rendering architecture หรือ SRI กลายเป็น stable
การตัดสินใจนี้ปิดงาน **evaluation** แต่ไม่อ้างว่า `'unsafe-inline'` ถูกกำจัดแล้ว

### Email verification และ password reset

Production เปิดเฉพาะ Google/GitHub OAuth และไม่เปิด email/password UI ดังนั้น email verification
กับ password reset ไม่ใช่ lifecycle ของบัญชีที่ใช้งานจริง และไม่เป็น release blocker
หากจะเปิด password-based account ต้องทำเป็น identity-expansion scope แยก พร้อม enumeration
protection, redirect allow-list, recovery policy และ end-to-end security tests

### Export quota และ server-side download audit

ไฟล์ถูกสร้างใน browser โดยผู้ใช้กดเอง ไม่มี export API, artifact storage หรือ paid plan จึงไม่มี
จุดบังคับ quota ฝั่ง server และไม่ควรส่ง event การดาวน์โหลดที่อาจเผยพฤติกรรมผู้ใช้ขึ้น Cloud
ประวัติแบบ metadata-only ในอุปกรณ์จาก Phase 4D เพียงพอกับผลิตภัณฑ์ปัจจุบัน Export quota
ย้ายไปพิจารณาพร้อม plan/payment ใน Phase 6 ส่วน server-side download audit จะทำได้ต่อเมื่อมี
วัตถุประสงค์ ฐานกฎหมาย retention และ access policy ที่อนุมัติแล้วเท่านั้น

## งานภายนอกที่ยังต้องมีหลักฐาน แต่ไม่ขวางการเริ่ม Phase ถัดไป

| รายการ | เจ้าของงาน/สิ่งที่ต้องให้ | สถานะ |
| --- | --- | --- |
| PWA manual device certification | Product Owner บันทึก device, browser/version และผล Android/iOS/Desktop ตาม `Phase1FManualAcceptance.md` | HOLD — ห้ามแทนด้วย automation |
| Privacy/Terms/Disclaimer legal sign-off | Product Owner ระบุชื่อผู้ควบคุมข้อมูลและช่องทางติดต่อ แล้วให้ผู้เชี่ยวชาญกฎหมายตรวจ | EXTERNAL HOLD |
| Custom domain และ Cloudflare DNS/WAF/Analytics | Product Owner อนุมัติโดเมน, account/zone และ release policy ก่อนเปลี่ยน routing | DEFERRED — optional infrastructure |

สามรายการนี้ต้องไม่ถูกทำเครื่องหมายว่า PASS โดยไม่มีหลักฐานจริง แต่ไม่ใช่เหตุผลให้รวมการแก้
Auth, Worker/R2, reporting หรือ UI เข้า Phase ใหม่โดยไม่มี scope

## งานที่ต้องเป็น Phase/PR ใหม่ ไม่ใช่ cleanup

- การลบบัญชี Supabase/OAuth identity พร้อม grace period 30 วันและ retention policy
- Consent ledger, security/audit events และสิทธิ์ผู้ดูแลในการเข้าถึง log
- Admin Role, Tax Rule Editor, Tax Source Registry และ Review/Approve/Publish workflow
- Content/feedback moderation, aggregate analytics และ emergency-access workflow
- Plan/payment/usage quota, LINE และ OCR

งานเหล่านี้เปลี่ยน data model, authority หรือ privacy posture จึงต้องมี threat model, acceptance
criteria, rollout/rollback และการอนุมัติ scope ของตัวเอง ห้ามถือว่าได้รับอนุมัติจากเอกสาร closeout นี้

## เกณฑ์ก่อนเริ่ม Phase ถัดไป

- Production baseline และเอกสารสถานะต้องตรงกับ `main`
- ไม่มี PR runtime ที่ค้างโดยไม่ทราบ ownership
- รายการ external HOLD มี owner และหลักฐานที่ต้องส่งชัดเจน
- `supabase/` ยังคง untracked/untouched จนกว่าจะมี migration policy ที่อนุมัติ
- Phase ถัดไปต้องไม่รื้อฟื้น Firebase/Web Push และต้องรักษา local-first, opt-in sync,
  JWT ownership isolation, CORS allow-list, `noindex` และ fail-closed tax-rule resolver
