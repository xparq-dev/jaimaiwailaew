# Checklist ก่อน Deploy

อัปเดตสถานะล่าสุด: 2026-09-25 (Asia/Bangkok)

เอกสารนี้มีสองระดับ:

- **Foundation deployment checkpoint** ใช้ยืนยันว่า Phase 0 ขึ้น Preview/Production ได้อย่างปลอดภัย
- **Current release checklist** ใช้ทบทวน Production baseline หลัง PR #20 และ Phase 1F automated gate

สถานะรายละเอียดและหลักฐาน deployment อยู่ใน
[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)

## 1. คุณภาพโค้ดและระบบส่งมอบ

- [x] `npm run lint` ผ่าน
- [x] `npm run typecheck` ผ่าน
- [x] `npm run test` ผ่าน
- [x] `npm run build` ผ่าน
- [x] `npm run format:check` ผ่าน
- [x] GitHub Actions สำหรับ lint, formatting, typecheck, unit tests, build และ browser tests ผ่าน
- [x] ไม่มี TypeScript error
- [x] ไม่พบ secret ใน source code ที่ Git ติดตาม
- [x] ไม่มี `.env` หรือ `.env.local` ถูก commit; ติดตามเฉพาะ `.env.example`
- [x] เปิด ruleset `Protect main` สำหรับ `main` พร้อม required CI/Browser checks
- [x] เปิด Dependabot สำหรับตรวจ dependency
- [x] มี README สำหรับ onboarding นักพัฒนา
- [x] Vercel Preview และ Production deployment ทำงาน
- [x] Production ใช้ HTTPS ที่ <https://jaimaiwailaew.vercel.app>
- [x] Vercel และ GitHub Actions ใช้ Node.js 22.x
- [x] บันทึก Lighthouse 13.5.0 audit สำหรับ 4 routes ทั้ง mobile และ desktop
- [ ] ตัดสินใจว่าจะ defer Cloudflare จนมี custom domain หรือเชื่อม DNS/WAF/Analytics ใน Phase 0

## 2. Tax Safety

- [x] Tax Rules foundation แยกจาก UI
- [x] Placeholder rule ทุกชุดระบุปีภาษี, rule-set ID และ version
- [x] Placeholder rule มี source metadata ที่บังคับให้เติมแหล่งทางการก่อนใช้จริง
- [x] Rule ที่ไม่ผ่านการตรวจสอบถูกบล็อกไม่ให้คำนวณหรือ publish
- [x] Schema และ safety-contract tests ของ Foundation ผ่าน
- [x] สร้าง Calculation Engine และ unit tests ของสูตรสำคัญตาม `02_TaxRuleEngine.md`
- [x] เติมกฎและแหล่งข้อมูลปี 2568/2569 ตาม Tax Rules Verification record
- [x] ปิด Tax Rules Verification/Legal Sign-off release gate และ Golden Test Suite
- [x] PDF มี disclaimer, rule version, period และลายน้ำตามข้อกำหนด
- [x] หน้า Summary มี disclaimer, warnings และ assumptions
- [x] หน้า Foundation ไม่ยืนยันว่าผลลัพธ์เป็นทางการ
- [x] ไม่มีข้อความอ้างว่า “ยื่นแทน”, “รับรอง” หรือ “การันตี” ผลภาษี

## 3. Privacy และ Security

- [x] Local-only mode ไม่ส่งข้อมูลการเงิน; Cloud Sync ส่งสำเนาเฉพาะเมื่อบัญชีเปิด opt-in
- [x] PDF generate ใน browser
- [x] Foundation ไม่มีการ log รายการการเงิน
- [x] Foundation ไม่มี query parameter ที่มีข้อมูลการเงิน
- [x] ยังไม่เปิด analytics หรือ tracking ของเนื้อหาฟอร์ม
- [x] มี Clear Local Data พร้อม confirmation
- [x] Privacy Notice อธิบาย Local-first และ opt-in Cloud Sync
- [x] Terms และ Disclaimer เข้าถึงได้จาก navigation/footer
- [x] CSP และ security headers ทำงานบน Production
- [x] HTTPS ผ่าน Vercel
- [ ] เติมข้อมูลผู้ควบคุมข้อมูล ช่องทางติดต่อ และตรวจ Privacy/Terms/Disclaimer ด้านกฎหมาย
- [ ] ประเมิน nonce-based CSP ก่อนเปิดรับข้อมูลจริง
- [x] Worker บังคับ JWT, ownership isolation และ CORS allow-list แบบ fail closed
- [ ] ประเมิน rate limiting/abuse controls สำหรับ authenticated Cloud Sync endpoint แยกจาก Foundation

ห้ามถือสถานะ Turnstile/rate limiting ใน Foundation เป็นการอนุมัติถาวรสำหรับ endpoint ปัจจุบันหรืออนาคต

## 4. UX และ Accessibility

- [x] Foundation shell มี responsive desktop/mobile coverage ใน browser tests
- [x] Sidebar Desktop และ Bottom Navigation Mobile ทำงาน
- [x] Dark Mode ทำงาน
- [x] Navigation และปุ่มพื้นฐานใช้ keyboard ได้และมี focus state
- [ ] ตรวจฟอร์มจริงว่ามี label และ error message ที่ระบุจุดแก้ครบ
- [ ] ตรวจจำนวนเงินและตารางจริงบนจอเล็ก
- [ ] ตรวจ Empty, Loading, Error และ Offline states ของ Calculator flow
- [ ] ตรวจ PDF ภาษาไทยบน browser/ระบบปฏิบัติการเป้าหมาย
- [x] บันทึก Lighthouse accessibility/performance lab audit โดย accessibility ได้ 100 ทุก report

## 5. PWA และ Offline

- [x] Manifest และ service-worker skeleton ผ่าน Foundation tests
- [x] Offline fallback ของ Foundation ทำงานหลังเคยเปิดออนไลน์
- [x] Public cache ใช้ allowlist, versioning และล้าง cache รุ่นเก่าได้
- [x] Tests ยืนยันว่า service worker ไม่ cache calculator routes, ข้อมูลการเงิน หรือ PDF
- [x] เพิ่ม PNG icons 192/512, Apple touch icon และ maskable icon พร้อม automated dimension tests
- [ ] ทดสอบการติดตั้ง PWA บนอุปกรณ์จริงและ browser เป้าหมาย
- [x] Cache เฉพาะ Calculator public shell และ versioned tax-rule runtime; Learn content ยัง network-only ตาม policy
- [x] Calculator ทำงาน offline หลังเปิด online สำเร็จใน automated Production browser test
- [x] Offline Banner แสดงสถานะ, rule version และ cached timestamp
- [x] ทดสอบ offline PDF โดยไม่มี PDF/ข้อมูลผู้ใช้ใน public cache

## 6. Auth และ Local-first Cloud Sync

- [x] Google OAuth end-to-end ผ่านบน Production
- [x] GitHub OAuth end-to-end ผ่านบน Production
- [x] Cloud Sync เป็น opt-in และ Local-only mode ใช้งานได้โดยไม่เข้าสู่ระบบ
- [x] Local → R2 → Local restore ผ่าน
- [x] Cross-account isolation A/B ผ่าน
- [x] Offline → reconnect → sync ผ่าน
- [x] R2 เป็น private และ Worker ตรวจ JWT/ownership
- [x] Firebase, FCM, VAPID, Web Push และ Notification permission ถูกถอดออก

## 7. Handoff และลำดับงานถัดไป

ดำเนินการแล้ว:

1. สร้าง GitHub repository `jaimaiwailaew`
2. สร้างและตรวจ Foundation ตาม Master Prompt/Prompt 1
3. เชื่อม GitHub กับ Vercel และยืนยัน Preview, Production และ HTTPS
4. ปิด Phase 1A–1D, Tax Rules Verification และ Phase 1E
5. Merge PR #19/#20 และตรวจ Production baseline `main @ 2009799`
6. เปิด ruleset `Protect main` และบันทึก Lighthouse/security baseline ใน Phase 1G

Phase 1F implementation/automated Production gate ผ่านแล้ว แต่ manual device certification ยังต้องบันทึก
ตาม [`Phase1FManualAcceptance.md`](./Phase1FManualAcceptance.md) Phase 2 Knowledge Center และ
account-roadmap follow-ups ยังไม่เริ่มและต้องแยก scope/PR
