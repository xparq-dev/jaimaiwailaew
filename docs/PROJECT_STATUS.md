# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-12 (Asia/Bangkok)

เอกสารนี้บันทึกสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์และขอบเขตหลักให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) และ
[`00_ProjectMasterPrompt.md`](./00_ProjectMasterPrompt.md)

## สถานะปัจจุบัน

โครงการดำเนินงานถึง **Phase 1A — Tax Rule Engine** สำเร็จบน branch `feat/tax-rule-engine` โดยพัฒนา engine, Zod schemas, Money utilities, Calculation contracts, Resolver และ Unit tests ครบถ้วน และคงกฎภาษีปี 2568/2569 เป็น unverified placeholders บล็อกการคำนวณจริงตาม policy

- Phase 0 foundation: เสร็จสมบูรณ์
- Phase 1A Tax Rule Engine: **พัฒนาและทดสอบผ่านครบ 100% (PASS)** (รออนุมัติ commit/push จาก Owner)
- Search indexing: ปิดด้วย `noindex`
- Tax rule data: มีเฉพาะ placeholder ที่ยังไม่ผ่านการตรวจสอบ (`unverified`, `notForCalculation: true`)
- Tax calculation execution: ยังไม่สร้าง (สร้างเฉพาะ contract และ deterministic unavailable helper)
- User accounts และ cloud persistence: ยังไม่สร้างและอยู่นอกขอบเขต MVP 1
- PDF/Excel export: ยังไม่สร้าง; Excel อยู่นอกขอบเขต MVP 1
- Next gated implementation: `03_CalculatorUX.md` (รออนุมัติก่อนเริ่ม)

| รายการ | สถานะ | หลักฐานหรือหมายเหตุ |
| --- | --- | --- |
| GitHub repository | ผ่าน | <https://github.com/xparq-dev/jaimaiwailaew> |
| Vercel Production | ผ่าน | <https://jaimaiwailaew.vercel.app> |
| Vercel Preview | ผ่าน | บล็อกคำนวณและไม่มี commit ใหม่บน Preview จนกว่าจะอนุมัติ push |
| Git integration | ผ่าน | Branch `feat/tax-rule-engine` ตั้ง upstream เรียบร้อย |
| Runtime | ผ่าน | Node.js 22.x (`^22.12.0`) |
| Phase 1A Tax Rule Engine | ผ่าน | Domain types, Zod schemas, Money satang utilities, Resolver, Contracts & Unit tests ผ่าน 100% |
| Secret hygiene | ผ่าน | ไม่พบ secret ใน source code |

## รายการที่ยังไม่ปิด (External / Legal Gates)

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse audit อย่างเป็นทางการสำหรับ mobile/desktop
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชียืนยันแหล่งข้อมูล กฎ และ test cases ปี 2568/2569 ก่อนเปิดผลคำนวณจริง

## Gate ก่อนเริ่มงานถัดไป

1. Owner ตรวจรายงาน Phase 1A และอนุมัติ commit/push
2. ห้ามเริ่ม Phase 1B (`03_CalculatorUX.md`) จนกว่าจะได้รับอนุมัติขอบเขตใหม่
