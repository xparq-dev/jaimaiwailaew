# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-13 (Asia/Bangkok)

เอกสารนี้บันทึกสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์และขอบเขตหลักให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) และ
[`00_ProjectMasterPrompt.md`](./00_ProjectMasterPrompt.md)

## สถานะปัจจุบัน

โครงการดำเนินงานถึง **Summary Breakdown UX Improvement** บน branch `feat/summary-breakdown` ซึ่งสร้างจาก main หลัง merge Hotfix PR #6 โดยต่อยอดจากจุดปรับปรุง Phase 1B เดิม:
1. **Compact Privacy Indicator:** ย้ายตำแหน่งและลดความเด่นของข้อความเป็น inline status control กะทัดรัดใต้ heading พร้อมเปิด dialog รายละเอียดความเป็นส่วนตัวและปุ่มล้างข้อมูลได้อย่างปลอดภัย
2. **Entry Frequency:** เพิ่มตัวเลือกระบุความถี่ของรายการทั้งแบบ `one_time` (ระบุวัน / รายการครั้งเดียว) และ `monthly` (ระบุเดือน / รายการรายเดือน) พร้อมระบบ Atomic-like Local Storage Migration (v1 → v2) แบบ fail-safe
3. **Summary Breakdown:** เพิ่มการรวมกลุ่มเชิงคณิตศาสตร์แบบ local-only สำหรับรายรับตามแหล่งที่มา/หมวดบันทึก และรายจ่ายตามหมวดบันทึก/สถานะ พร้อม Detail Dialog ที่แสดงเฉพาะรายการต้นทางในกลุ่มและใช้ ephemeral UI state

- Phase 0 foundation: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1A Tax Rule Engine: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1B Calculator UX: เสร็จสมบูรณ์ (merge เข้า main แล้วผ่าน PR #5)
- Phase 1B UX Hotfix: **เสร็จสมบูรณ์และ merge เข้า main แล้วผ่าน PR #6**
- Summary Breakdown UX Improvement: **พัฒนาและทดสอบบน branch แล้ว** (รอตรวจ Final Report และอนุมัติ commit/push/PR จาก Owner)
- Search indexing: ปิดด้วย `noindex`
- Tax rule data: มีเฉพาะ placeholder ที่ยังไม่ผ่านการตรวจสอบ (`unverified`, `notForCalculation: true`)
- Tax calculation execution: บล็อกตาม fail-closed policy (แสดงเฉพาะผลรวมเลขคณิต)
- User accounts และ cloud persistence: ไม่มีและอยู่นอกขอบเขต MVP 1
- PDF/Excel export: ยังไม่สร้าง (PDF Export อยู่ใน Phase 1C และ Excel อยู่นอกขอบเขต MVP 1)
- Next gated implementation: `04_PDFExport.md` (รออนุมัติก่อนเริ่ม)

| รายการ | สถานะ | หลักฐานหรือหมายเหตุ |
| --- | --- | --- |
| GitHub repository | ผ่าน | <https://github.com/xparq-dev/jaimaiwailaew> |
| Vercel Production | ผ่าน | <https://jaimaiwailaew.vercel.app> |
| Git branch | ผ่าน | Branch `feat/summary-breakdown` สร้างจาก main ที่ merge PR #6 แล้ว |
| Runtime | ผ่าน | Node.js 22.x (`^22.12.0`) |
| UX Hotfix (Privacy & Frequency) | ผ่าน | Compact indicator, monthly/one-time entry, v1→v2 migration, 70 unit tests & E2E tests ผ่าน 100% |
| Summary Breakdown | รอตรวจ Final Report | local-only MoneySatang aggregation, 4 breakdowns, accessible detail dialog, unit/component/E2E coverage |
| Secret & Privacy hygiene | ผ่าน | ไม่พบ secret, ข้อมูลการเงินเก็บเฉพาะในเครื่องผู้ใช้ ไม่ส่งออกเครือข่าย |

## รายการที่ยังไม่ปิด (External / Legal Gates)

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse audit อย่างเป็นทางการสำหรับ mobile/desktop
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชียืนยันแหล่งข้อมูล กฎ และ test cases ปี 2568/2569 ก่อนเปิดผลคำนวณจริง

## Gate ก่อนเริ่มงานถัดไป

1. Owner ตรวจ Final Report ของ Summary Breakdown UX Improvement และอนุมัติ commit/push/PR
2. ห้ามเริ่ม Phase 1C (`04_PDFExport.md`) จนกว่าจะได้รับอนุมัติขอบเขตใหม่
