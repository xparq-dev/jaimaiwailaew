# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-10-06 (Asia/Bangkok)

เอกสารนี้เป็น source of truth สำหรับสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์ระยะยาวให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) โดยต้องอ่านหมายเหตุการ re-scope
ของ Account/Cloud architecture ในเอกสารนั้นร่วมด้วย

## Production baseline

- Production baseline: `1b5a860` — Merge PR #39
- Branch: `main`
- PR #15: เพิ่ม Supabase Auth และ Local-first Cloud Sync
- PR #16: ถอด Firebase Web Push และ notification infrastructure ออกจาก runtime
- PR #17: ลบข้อความ Push/Notification ที่ค้างใน Settings/Profile
- PR #18: reconcile เอกสารหลัง Phase 1E
- PR #19: Phase 1F PWA and Offline Completion
- PR #20: member multi-workspace, cross-device sync และ safe workspace deletion
- PR #21: Phase 1G release closeout (docs/governance เท่านั้น ไม่มี runtime change)
- PR #22: mobile header refresh, account avatar, Thai OAuth on PWA/mobile/embedded
- PR #23: อัปเดตเอกสาร production baseline หลัง PR #22
- PR #14: อัปเดต `@types/node` เป็น 26.6.2
- PR #13: อัปเดต `jsdom` เป็น 30.1.1
- PR #24: Phase 2A Knowledge Center Foundation
- PR #25: Phase 2B Persona Learning Paths
- PR #26: Phase 3A Account Dashboard Foundation
- PR #27: Phase 3B Cloud Data Controls
- PR #33: Phase 4A Report Periods
- PR #34: Phase 4B Report Templates
- PR #35: Phase 4C Report Document Identity
- PR #36: Phase 4D Local Export History
- PR #37: Phase 5A Tax Rule Transparency & Governance Readiness
- PR #38: Phase 5B Tax Calendar
- PR #39: Calm Thai Finance Workspace และการปรับสีข้อความ Light/Dark Mode
- GitHub Actions CI และ Browser tests: ผ่านบน release baseline
- Vercel Production: Ready ที่ <https://jaimaiwailaew.vercel.app>
- Search indexing: ปิดด้วย `noindex, nofollow`
- `supabase/`: local untracked directory ที่สงวนไว้และยังไม่อยู่ใน version-control scope

## Phase ที่ปิดแล้ว

- Phase 0 — Project Foundation
- Phase 1A — Tax Rule Engine
- Phase 1B — Calculator UX และ UX hotfix
- Summary Breakdown และ Income Month Grouping
- Phase 1C — Local-only PDF Export พร้อม Preview
- Phase 1D — Local-only Excel/CSV Export พร้อม Preview
- Tax Rules Verification ปี 2568/2569: rule set `1.0.0` เป็น
  `verified / published`, `validationStatus: valid` และ `notForCalculation: false`
- Phase 1E — Supabase Google/GitHub Auth และ Local-first Cloud Sync แบบ opt-in ผ่าน
  Cloudflare Worker กับ private R2
- Phase 1F implementation และ automated Production gate — PWA install metadata, public offline shell,
  offline Calculator/PDF, cache privacy และ online recovery เป็น `PASS`; manual device certification
  ยังติดตามแยกด้านล่าง
- Phase 1H (PR #22) — Mobile header refresh, `UserAvatar` component, whitelist-only avatar URL resolver,
  Thai OAuth UX บน PWA/embedded/iOS context
- Phase 2A (PR #24) — Knowledge Center Foundation พร้อมบทความ static/local-first 9 หัวข้อ,
  client-side search/filter, review metadata, disclaimer, official sources และ related content
- Phase 2B (PR #25) — Persona Learning Paths ตาม Workspace พร้อม page-local override
  และ “อ่านต่อให้ตรงกับคุณ” โดยไม่มี recommendation API
- Phase 3A (PR #26) — Account Dashboard แสดงบัญชี ตำแหน่งข้อมูล สถานะ Cloud Sync
  และ Workspace ในอุปกรณ์โดยไม่เปิดเผย internal identifiers
- Phase 3B (PR #27) — ลบสำเนา Workspace ทั้งหมดของบัญชีออกจาก private R2 ได้โดย
  เก็บข้อมูล local ไว้ ตรวจ ownership แบบ fail closed และปิด Sync หลังลบสำเร็จ
- Phase 4A (PR #33) — เลือกช่วง Workspace, ทั้งปี, ครึ่งปี หรือรายเดือนร่วมกันสำหรับ
  PDF/Excel/CSV พร้อมป้องกันการนำค่าลดหย่อนและประมาณการภาษีไปแสดงผิดช่วง
- Phase 4B (PR #34) — เลือกฉบับเต็ม สรุปยอด หรือรายการเคลื่อนไหวร่วมกันสำหรับ
  PDF/Excel/CSV โดยไม่สร้าง section, Sheet หรือ CSV file ที่อยู่นอก template
- Phase 4C (PR #35) — เพิ่มเลขอ้างอิงรายงานที่สร้างในเครื่องให้ PDF/Excel/CSV โดยไม่ใช้
  internal ID, ไม่ persist และไม่ sync ขึ้น Cloud
- Phase 4D (PR #36) — เก็บประวัติการดาวน์โหลดแบบ metadata-only ใน browser ปัจจุบันเท่านั้น
  ไม่เก็บยอดเงินหรือ identifier และไม่ sync ขึ้น Cloud
- Phase 5A (PR #37) — แสดงสถานะกฎภาษีและแหล่งอ้างอิงที่ผ่าน local resolver แบบ read-only
  โดยตัด identifiers ภายในออกและคง fail-closed policy เดิม
- Phase 5B (PR #38) — แสดงกำหนด ภ.ง.ด.94 ปีภาษี 2569 และ ภ.ง.ด.90/91
  ปีภาษี 2568 จากแหล่งอ้างอิงกรมสรรพากรแบบ read-only โดยไม่มี reminder, API,
  notification หรือการเปลี่ยนการคำนวณภาษี
- UX/UI redesign (PR #39) — ปรับ app shell, หน้าแรก, onboarding, calculator,
  summary, account และหน้าความรู้ให้ใช้ visual system เดียวกัน พร้อม semantic text colors
  สำหรับ Light/Dark Mode โดยไม่เปลี่ยน business logic หรือ local-first architecture

## Phase ที่กำลังดำเนินการ

ไม่มี Phase implementation ที่กำลังดำเนินการ Phase ถัดไปยังไม่ได้รับอนุมัติ scope และ
acceptance criteria โดยงานด้าน Admin role, Tax Rule Editor และ Review/Approve/Publish
ต้องออกแบบสิทธิ์ การจัดเก็บข้อมูล และ fail-closed policy ก่อนเริ่ม implementation

ผลภาษีที่แสดงเป็น **ค่าประมาณการเพื่อช่วยเตรียมข้อมูล** ไม่ใช่แบบยื่นภาษี คำรับรอง หรือคำปรึกษา
ทางภาษี ชุดกฎที่ไม่ผ่าน validation/review ในอนาคตต้องถูก resolver ปฏิเสธแบบ fail closed ตามเดิม

## Phase 1E acceptance record

- Google OAuth end-to-end: ผ่าน
- GitHub OAuth end-to-end: ผ่าน
- Cloud Sync Local → R2 → Local: ผ่าน
- Cross-account isolation A/B: ผ่าน
- Offline → reconnect → sync: ผ่าน
- Cloud Sync ปิดเป็นค่าเริ่มต้นและเปิดได้จากการกระทำของผู้ใช้เท่านั้น
- Local-only Calculator ยังใช้งานได้โดยไม่เข้าสู่ระบบ
- Worker ตรวจ JWT, ownership และ CORS allow-list แบบ fail closed
- ไม่มี Firebase/FCM/VAPID, Push UI, Notification permission request หรือ Firebase CSP origin

## รายการที่ยังไม่ปิด

### Release / governance

- [x] ตั้ง GitHub ruleset `Protect main` สำหรับ `main` พร้อม required CI/Browser checks
- [x] บันทึก Lighthouse 13.5.0 lab audit สำหรับ 4 routes ทั้ง mobile และ desktop
- [ ] ตัดสินใจเรื่อง custom domain และ Cloudflare DNS/WAF/Analytics แยกจาก Worker/R2 ที่ใช้อยู่
- [ ] เติมข้อมูลผู้ควบคุมข้อมูล/ช่องทางติดต่อ และตรวจ Privacy/Terms/Disclaimer ด้านกฎหมาย
- [ ] ประเมิน nonce-based CSP ก่อนเปลี่ยนนโยบายการเปิดใช้งานจริง

### PWA / Offline Completion

Phase 1F merge ผ่าน PR #19 แล้ว และ automated Production gate ผ่านครบ หลักฐานอยู่ใน
[`Phase1GReleaseHardening.md`](./Phase1GReleaseHardening.md):

- [x] เพิ่ม PNG icons ขนาด 192/512, Apple touch icon และ maskable icon
- [ ] ตรวจติดตั้งบนอุปกรณ์จริงและ browser ใน product matrix (manual certification follow-up)
- [x] รองรับ Calculator และ versioned tax-rule runtime หลัง first online visit ใน automated browser test
- [x] แสดง Offline banner พร้อม tax-rule version และ cached timestamp
- [x] ตรวจ offline PDF โดยไม่มี user data หรือไฟล์ export ใน Cache Storage ด้วย automated browser test
- [x] ตรวจ recovery เมื่อกลับ online โดยไม่ทำให้ local data สูญหายใน automated browser test
- [x] CI, Browser tests, Vercel Preview/Production และ automated Production acceptance ผ่าน
- [ ] manual device acceptance ครบ Android/iOS/Desktop

สถานะ closeout: **implementation/automated Production gate = PASS** และ
**manual device certification = HOLD** ห้ามอ้างว่า automated test แทนการติดตั้งจริง

## Proposed next phase

Phase 1G — Release Hardening and Phase 1F Closeout **ปิดแล้ว** (PR #21)

รายการที่เปิดอยู่ก่อนเริ่ม Phase ใหม่:
- [ ] ตัดสินใจเรื่อง custom domain และ Cloudflare DNS/WAF/Analytics
- [ ] เติมข้อมูลผู้ควบคุมข้อมูล/ช่องทางติดต่อ และตรวจ Privacy/Terms/Disclaimer ด้านกฎหมาย
- [ ] ประเมิน nonce-based CSP
- [ ] manual device acceptance ครบ Android/iOS/Desktop (PWA install)

Phase 2 Knowledge Center ปิดแล้วผ่าน PR #24 และ PR #25 ส่วน Phase 3A Account Dashboard
และ Phase 3B Cloud Data Controls ปิดแล้วผ่าน PR #26 และ PR #27 ตามลำดับ Phase 4A Report
Periods ปิดแล้วผ่าน PR #33, Phase 4B Report Templates ปิดแล้วผ่าน PR #34, Phase 4C
Report Document Identity ปิดแล้วผ่าน PR #35 และ Phase 4D Local Export History ปิดแล้วผ่าน PR #36
Phase 5A Tax Rule Transparency และ Phase 5B Tax Calendar ปิดแล้วผ่าน PR #37 และ PR #38
ตามลำดับ ส่วน PR #39 ปิดงาน UX/UI redesign โดยไม่เปลี่ยน business logic

Phase ถัดไปยังไม่มี scope ที่อนุมัติ งาน account deletion/retention, audit/consent governance,
export quota, document/download audit, admin, payment/LINE และ OCR ยังไม่เริ่มและต้องแยก
scope/PR ตาม ownership ความเสี่ยง และนโยบายข้อมูล
