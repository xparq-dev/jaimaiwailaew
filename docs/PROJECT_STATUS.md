# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-12 (Asia/Bangkok)

เอกสารนี้บันทึกสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์และขอบเขตหลักให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) และ
[`00_ProjectMasterPrompt.md`](./00_ProjectMasterPrompt.md)

## สถานะปัจจุบัน

โครงการยังอยู่ที่ **Phase 0 — Project Foundation** โค้ด Foundation และการเชื่อมต่อ
GitHub/Vercel เสร็จแล้ว แต่ยังไม่ปิด Phase 0 อย่างสมบูรณ์จนกว่า Owner จะตรวจหรืออนุมัติ
รายการคงค้างด้านล่าง

- Phase 0 implementation baseline: เสร็จและบันทึกบน `main`
- Phase 0 release gate: ยังรอรายการภายนอกในหัวข้อ “รายการที่ยังไม่ปิด”
- Search indexing: ปิดด้วย `noindex`
- Tax rule data: มีเฉพาะ placeholder ที่ยังไม่ผ่านการตรวจสอบ
- Tax calculation: ยังไม่สร้าง
- User accounts และ cloud persistence: ยังไม่สร้างและอยู่นอกขอบเขต MVP 1
- PDF/Excel export: ยังไม่สร้าง; Excel อยู่นอกขอบเขต MVP 1
- Next gated implementation: `02_TaxRuleEngine.md`

| รายการ | สถานะ | หลักฐานหรือหมายเหตุ |
| --- | --- | --- |
| GitHub repository | ผ่าน | <https://github.com/xparq-dev/jaimaiwailaew> |
| Vercel Production | ผ่าน | <https://jaimaiwailaew.vercel.app> |
| Vercel Preview | ผ่าน | สร้าง Preview แยกและตรวจผ่าน Vercel Authentication แล้ว |
| Git integration | ผ่าน | การ push เข้า `main` สร้าง Production deployment อัตโนมัติ |
| Runtime | ผ่าน | Vercel และ GitHub Actions ใช้ Node.js 22.x; `package.json` กำหนด `^22.12.0` |
| CI | ผ่าน | lint, formatting, typecheck, unit tests, build และ browser tests ผ่านที่ commit `7232114` |
| HTTPS และ security headers | ผ่าน | Production ตอบ 200 พร้อม HSTS, CSP และ `X-Content-Type-Options: nosniff` |
| PWA foundation | ผ่านตามขอบเขต Foundation | manifest และ service-worker skeleton ตอบ 200; ยังไม่ใช่ offline calculator ของ MVP 1 |
| Tax Rule foundation | ผ่านตามขอบเขต Foundation | schema และ placeholder ปี 2568/2569 ถูก validate และบล็อกการคำนวณ/เผยแพร่ |
| Secret hygiene | ผ่านสำหรับ Git | `.env.local` และ `.vercel` ถูก ignore; ไม่พบ secret ในไฟล์ที่ Git ติดตาม |

Preview URL เปลี่ยนตาม deployment และอาจต้องเข้าสู่ระบบ Vercel เนื่องจาก Deployment
Protection ส่วน Production URL ด้านบนเปิดแบบสาธารณะ

## รายการที่ยังไม่ปิด

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse audit อย่างเป็นทางการและยืนยันเกณฑ์ mobile/desktop
- [ ] ตัดสินใจว่าจะเลื่อน Cloudflare DNS/WAF/Analytics จนมี custom domain หรือให้ Owner
      จัดหาโดเมนและบัญชี Cloudflare
- [ ] เพิ่มและทดสอบ PWA PNG icons หลายขนาดกับอุปกรณ์จริงก่อนเปิด Public Beta
- [ ] เติมข้อมูลผู้ควบคุมข้อมูลและช่องทางติดต่อ แล้วให้ผู้เกี่ยวข้องตรวจ Privacy, Terms และ
      Disclaimer
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชียืนยันแหล่งข้อมูล กฎ และ test cases ปี 2568/2569
      ก่อนเปิดผลคำนวณจริง

Turnstile ยังเป็นเพียง environment placeholder และยังไม่จำเป็นใน Phase 0 เพราะไม่มี public
endpoint ที่รับข้อมูลการเงินหรือข้อมูลจากฟอร์ม การใช้ Cloudflare ต้องไม่ทำให้ขอบเขต MVP 1
ขยายไปเป็น backend รับข้อมูลการเงิน

## Gate ก่อนเริ่มงานถัดไป

1. Owner รับทราบสถานะและตัดสินใจรายการ Phase 0 ที่จะทำทันทีหรืออนุมัติให้ defer
2. หากเริ่มงานถัดไป ให้ทำเฉพาะ [`02_TaxRuleEngine.md`](./02_TaxRuleEngine.md)
3. สร้าง engine, schema, fixtures และ tests โดยคงกฎที่ยังไม่ตรวจสอบเป็น `draft` และ
   `requires_professional_verification`; ห้ามเปิดการคำนวณหรือ publish
4. หยุดรายงานผลก่อนเริ่ม [`03_CalculatorUX.md`](./03_CalculatorUX.md)

ห้ามข้ามไป Calculator UX, PDF Export, PWA/Offline ของ MVP 1, Auth, Supabase, OCR, LINE,
Payment หรือฟีเจอร์ Phase หลังจากนั้นโดยไม่มีการอนุมัติขอบเขตใหม่
