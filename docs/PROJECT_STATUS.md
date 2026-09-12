# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-12 (Asia/Bangkok)

เอกสารนี้บันทึกสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์และขอบเขตหลักให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) และ
[`00_ProjectMasterPrompt.md`](./00_ProjectMasterPrompt.md)

## สถานะปัจจุบัน

โครงการดำเนินงานถึง **Phase 1B — Calculator UX (Local-only)** บน branch `feat/calculator-ux` โดยพัฒนา Wizard, Local workspace, CRUD รายรับ-รายจ่าย-ภาษีหัก ณ ที่จ่าย-ค่าลดหย่อนแบบร่าง, Arithmetic totals, Monthly breakdown, คำเตือน/สมมติฐาน, Summary page และ Offline shell สำเร็จครบถ้วน 100%

- Phase 0 foundation: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1A Tax Rule Engine: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1B Calculator UX: **พัฒนาและทดสอบผ่านครบ 100% (PASS)** (รออนุมัติจาก Owner)
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
| Git branch | ผ่าน | Branch `feat/calculator-ux` พัฒนา Phase 1B เสร็จสิ้น |
| Runtime | ผ่าน | Node.js 22.x (`^22.12.0`) |
| Phase 1B Calculator UX | ผ่าน | Local-only CRUD, Wizard, Arithmetic totals, Offline SW, 51 Unit tests & E2E tests ผ่าน 100% |
| Secret & Privacy hygiene | ผ่าน | ไม่พบ secret, ข้อมูลการเงินเก็บเฉพาะในเครื่องผู้ใช้ ไม่ส่งออกเครือข่าย |

## รายการที่ยังไม่ปิด (External / Legal Gates)

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse audit อย่างเป็นทางการสำหรับ mobile/desktop
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชียืนยันแหล่งข้อมูล กฎ และ test cases ปี 2568/2569 ก่อนเปิดผลคำนวณจริง

## Gate ก่อนเริ่มงานถัดไป

1. Owner ตรวจรายงาน Phase 1B และอนุมัติ commit/push/PR
2. ห้ามเริ่ม Phase 1C (`04_PDFExport.md`) จนกว่าจะได้รับอนุมัติขอบเขตใหม่
