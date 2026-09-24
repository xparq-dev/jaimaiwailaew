# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-24 (Asia/Bangkok)

เอกสารนี้เป็น source of truth สำหรับสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์ระยะยาวให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) โดยต้องอ่านหมายเหตุการ re-scope
ของ Account/Cloud architecture ในเอกสารนั้นร่วมด้วย

## Production baseline

- Phase 1E Release Gate: **PASS / Closed**
- Branch: `main`
- Baseline commit: `56b1192` — Merge PR #17
- PR #15: เพิ่ม Supabase Auth และ Local-first Cloud Sync
- PR #16: ถอด Firebase Web Push และ notification infrastructure ออกจาก runtime
- PR #17: ลบข้อความ Push/Notification ที่ค้างใน Settings/Profile
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

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse accessibility/performance audit สำหรับ mobile และ desktop
- [ ] ตัดสินใจเรื่อง custom domain และ Cloudflare DNS/WAF/Analytics แยกจาก Worker/R2 ที่ใช้อยู่
- [ ] เติมข้อมูลผู้ควบคุมข้อมูล/ช่องทางติดต่อ และตรวจ Privacy/Terms/Disclaimer ด้านกฎหมาย
- [ ] ประเมิน nonce-based CSP ก่อนเปลี่ยนนโยบายการเปิดใช้งานจริง

### PWA / Offline Completion

ระบบมี manifest, service-worker baseline, versioned public cache และ offline fallback แล้ว แต่ยังไม่ถือว่า
PWA/Offline Completion เสร็จจนกว่าจะผ่าน installability และ offline acceptance บนอุปกรณ์เป้าหมาย:

- [ ] เพิ่ม PNG icons หลายขนาดและตรวจ maskable icon
- [ ] ตรวจติดตั้งบนอุปกรณ์จริงและ browser ใน product matrix
- [ ] รองรับ Calculator และ versioned tax-rule bundle หลัง first online visit
- [ ] แสดง Offline banner พร้อม tax-rule version และ cached timestamp
- [ ] ตรวจ offline PDF โดยไม่มี user data หรือไฟล์ export ใน Cache Storage
- [ ] ตรวจ recovery เมื่อกลับ online โดยไม่ทำให้ local data สูญหาย

## Proposed next phase

Phase 1F **ยังไม่เริ่มและยังไม่มี branch** ข้อเสนอที่มี specification พร้อมที่สุดคือ
**PWA and Offline Completion** แต่ต้องได้รับ scope และ acceptance criteria ที่อนุมัติอย่างชัดเจนก่อน
สร้าง branch หรือแก้ runtime code

Release Hardening, Knowledge Center, account-roadmap follow-ups, reports, admin, payment/LINE และ OCR
ต้องแยก scope/PR ตาม ownership ไม่ควรรวมกับ PWA/Offline feature PR
