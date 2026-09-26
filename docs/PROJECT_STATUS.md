# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-26 (Asia/Bangkok)

เอกสารนี้เป็น source of truth สำหรับสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์ระยะยาวให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) โดยต้องอ่านหมายเหตุการ re-scope
ของ Account/Cloud architecture ในเอกสารนั้นร่วมด้วย

## Production baseline

- Production baseline: `9ec6287` — Merge PR #13
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

## Phase ที่กำลังดำเนินการ

Phase 2A — Knowledge Center Foundation เริ่มบน branch `feat/phase-2a-knowledge-center`:

- เปลี่ยน `/learn` จาก placeholder เป็นคลังบทความ static/local-first 9 หัวข้อ
- เพิ่ม typed content model, client-side search/filter, review metadata, disclaimer, official source links
  และ related content
- ไม่มี CMS, analytics, runtime content fetch หรือการเปลี่ยน tax calculation
- ขอบเขตและ acceptance criteria อยู่ที่
  [`Phase2AKnowledgeCenter.md`](./Phase2AKnowledgeCenter.md)

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

Phase 2A Knowledge Center Foundation เริ่มแล้ว ส่วน content expansion, account-roadmap follow-ups,
reports, admin, payment/LINE และ OCR ยังไม่เริ่ม และต้องแยก scope/PR ตาม ownership
