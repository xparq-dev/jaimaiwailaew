# Checklist ก่อน Deploy

อัปเดตสถานะล่าสุด: 2026-09-12 (Asia/Bangkok)

เอกสารนี้มีสองระดับ:

- **Foundation deployment checkpoint** ใช้ยืนยันว่า Phase 0 ขึ้น Preview/Production ได้อย่างปลอดภัย
- **MVP 1 launch checklist** ต้องตรวจใหม่ทั้งหมดก่อนเปิดให้ผู้ใช้กรอกและคำนวณภาษีจริง

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
- [ ] เปิด branch protection หรือ ruleset สำหรับ `main` ใน GitHub
- [x] เปิด Dependabot สำหรับตรวจ dependency
- [x] มี README สำหรับ onboarding นักพัฒนา
- [x] Vercel Preview และ Production deployment ทำงาน
- [x] Production ใช้ HTTPS ที่ <https://jaimaiwailaew.vercel.app>
- [x] Vercel และ GitHub Actions ใช้ Node.js 22.x
- [ ] บันทึก Lighthouse audit สำหรับ mobile และ desktop
- [ ] ตัดสินใจว่าจะ defer Cloudflare จนมี custom domain หรือเชื่อม DNS/WAF/Analytics ใน Phase 0

## 2. Tax Safety

- [x] Tax Rules foundation แยกจาก UI
- [x] Placeholder rule ทุกชุดระบุปีภาษี, rule-set ID และ version
- [x] Placeholder rule มี source metadata ที่บังคับให้เติมแหล่งทางการก่อนใช้จริง
- [x] Rule ที่ไม่ผ่านการตรวจสอบถูกบล็อกไม่ให้คำนวณหรือ publish
- [x] Schema และ safety-contract tests ของ Foundation ผ่าน
- [ ] สร้าง Calculation Engine และ unit tests ของสูตรสำคัญตาม `02_TaxRuleEngine.md`
- [ ] เติมกฎและแหล่งข้อมูลจริงที่ผู้เชี่ยวชาญตรวจสอบแล้ว
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชีอนุมัติกฎปี 2568/2569 และ test cases
- [ ] PDF มี disclaimer, rule version, period และลายน้ำตามข้อกำหนด
- [ ] หน้า Summary มี disclaimer, warnings และ assumptions
- [x] หน้า Foundation ไม่ยืนยันว่าผลลัพธ์เป็นทางการ
- [x] ไม่มีข้อความอ้างว่า “ยื่นแทน”, “รับรอง” หรือ “การันตี” ผลภาษี

## 3. Privacy และ Security

- [x] Foundation ไม่มี API รับหรือส่งข้อมูลการเงิน
- [ ] PDF generate ใน browser — งาน Phase PDF Export
- [x] Foundation ไม่มีการ log รายการการเงิน
- [x] Foundation ไม่มี query parameter ที่มีข้อมูลการเงิน
- [x] ยังไม่เปิด analytics หรือ tracking ของเนื้อหาฟอร์ม
- [ ] มี Clear Local Data พร้อม confirmation — งาน Calculator UX
- [x] Privacy Notice อธิบายพฤติกรรมของ Foundation ตามจริง
- [x] Terms และ Disclaimer เข้าถึงได้จาก navigation/footer
- [x] CSP และ security headers ทำงานบน Production
- [x] HTTPS ผ่าน Vercel
- [ ] เติมข้อมูลผู้ควบคุมข้อมูล ช่องทางติดต่อ และตรวจ Privacy/Terms/Disclaimer ด้านกฎหมาย
- [ ] ประเมิน nonce-based CSP ก่อนเปิดรับข้อมูลจริง
- [x] Turnstile/rate limiting ยังไม่จำเป็น เพราะไม่มี public endpoint ที่รับข้อมูลการเงิน

เมื่อเพิ่ม public endpoint ในอนาคต ให้ประเมิน rate limiting และ Turnstile ใหม่ ห้ามถือสถานะ
`ไม่จำเป็น` ใน Foundation เป็นการอนุมัติสำหรับ endpoint ใหม่

## 4. UX และ Accessibility

- [x] Foundation shell มี responsive desktop/mobile coverage ใน browser tests
- [x] Sidebar Desktop และ Bottom Navigation Mobile ทำงาน
- [x] Dark Mode ทำงาน
- [x] Navigation และปุ่มพื้นฐานใช้ keyboard ได้และมี focus state
- [ ] ตรวจฟอร์มจริงว่ามี label และ error message ที่ระบุจุดแก้ครบ
- [ ] ตรวจจำนวนเงินและตารางจริงบนจอเล็ก
- [ ] ตรวจ Empty, Loading, Error และ Offline states ของ Calculator flow
- [ ] ตรวจ PDF ภาษาไทยบน browser/ระบบปฏิบัติการเป้าหมาย
- [ ] บันทึก Lighthouse accessibility/performance audit

## 5. PWA และ Offline

- [x] Manifest และ service-worker skeleton ผ่าน Foundation tests
- [x] Offline fallback ของ Foundation ทำงานหลังเคยเปิดออนไลน์
- [x] Public cache ใช้ allowlist, versioning และล้าง cache รุ่นเก่าได้
- [x] Tests ยืนยันว่า service worker ไม่ cache calculator routes, ข้อมูลการเงิน หรือ PDF
- [ ] เพิ่ม PNG icons หลายขนาดและตรวจ maskable icon
- [ ] ทดสอบการติดตั้ง PWA บนอุปกรณ์จริงและ browser เป้าหมาย
- [ ] Cache calculator shell, public learn content และ last-known tax-rule bundle
- [ ] Calculator ทำงาน offline หลังเปิด online สำเร็จ
- [ ] Offline Banner แสดงสถานะ, rule version และ cached timestamp
- [ ] ทดสอบ offline PDF โดยไม่ให้ PDF/ข้อมูลผู้ใช้เข้า public cache

## 6. Handoff และลำดับงานถัดไป

ดำเนินการแล้ว:

1. สร้าง GitHub repository `jaimaiwailaew`
2. สร้างและตรวจ Foundation ตาม Master Prompt/Prompt 1
3. เชื่อม GitHub กับ Vercel และยืนยัน Preview, Production และ HTTPS
4. หยุดที่ Phase 0 และบันทึกรายการ acceptance gates ที่ยังไม่ปิด

เมื่อ Owner รับทราบหรือกำหนดให้ defer รายการ Phase 0 ที่ค้าง ให้ดำเนินการตามลำดับนี้:

1. ใช้ [`02_TaxRuleEngine.md`](./02_TaxRuleEngine.md) สร้าง Tax Rules Engine โดยไม่เดาตัวเลขกฎหมาย
2. รัน lint, typecheck, tests และ build แล้วหยุดรายงาน Owner
3. เริ่ม [`03_CalculatorUX.md`](./03_CalculatorUX.md) เฉพาะเมื่อ Tax Rule Engine ผ่านและ Owner อนุมัติ
4. ทำ [`04_PDFExport.md`](./04_PDFExport.md) หลัง Calculator UX ผ่าน
5. ทำ [`05_PWAandOffline.md`](./05_PWAandOffline.md) หลัง Calculator/PDF พร้อมสำหรับ offline flow

ก่อนเปิดเว็บให้ผู้ใช้คำนวณจริง ต้องให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชีตรวจสอบ Tax Rules ปี
2568/2569 และ test cases เพราะความถูกต้องขึ้นกับกฎภาษี ข้อเท็จจริง เอกสารประกอบ และการตีความ
ที่อาจเปลี่ยนแปลงได้
