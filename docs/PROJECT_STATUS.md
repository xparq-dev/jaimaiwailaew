# สถานะโครงการ

ตรวจสอบล่าสุด: 2026-09-20 (Asia/Bangkok)

เอกสารนี้บันทึกสถานะการดำเนินงานจริง ส่วนข้อกำหนดผลิตภัณฑ์และขอบเขตหลักให้ยึด
[`ProductRequirementsDocument.md`](./ProductRequirementsDocument.md) และ
[`00_ProjectMasterPrompt.md`](./00_ProjectMasterPrompt.md)

## สถานะปัจจุบัน

โครงการดำเนินงานถึง **Phase 1D Local-only Excel/CSV Export** บน branch `feat/local-excel-csv-export` ซึ่งสร้างจาก main หลัง merge PR #9:
1. **Compact Privacy Indicator:** ย้ายตำแหน่งและลดความเด่นของข้อความเป็น inline status control กะทัดรัดใต้ heading พร้อมเปิด dialog รายละเอียดความเป็นส่วนตัวและปุ่มล้างข้อมูลได้อย่างปลอดภัย
2. **Entry Frequency:** เพิ่มตัวเลือกระบุความถี่ของรายการทั้งแบบ `one_time` (ระบุวัน / รายการครั้งเดียว) และ `monthly` (ระบุเดือน / รายการรายเดือน) พร้อมระบบ Atomic-like Local Storage Migration (v1 → v2) แบบ fail-safe
3. **Summary Breakdown:** เพิ่มการรวมกลุ่มเชิงคณิตศาสตร์แบบ local-only สำหรับรายรับตามแหล่งที่มา/หมวดบันทึก และรายจ่ายตามหมวดบันทึก/สถานะ พร้อม Detail Dialog ที่แสดงเฉพาะรายการต้นทางในกลุ่มและใช้ ephemeral UI state
4. **Income Month Grouping:** แยกรายรับตามเดือนและความถี่ พร้อมยอดรวมที่สอดคล้องกับ selected-period Summary
5. **Local-only PDF Export:** เตรียมรายงาน A4 ภาษาไทยด้วย client-side PDF renderer และฟอนต์ Sarabun ที่ฝังในแอป พร้อม Preview ก่อนดาวน์โหลด ตารางที่จัดหน้าแน่นอน หัว/ท้ายทุกหน้า รายการ สรุปตามกลุ่ม ลายน้ำ ข้อควรทราบ และ Bangkok timestamp โดยไม่มีการ upload
6. **Workspace UX Follow-up:** เพิ่มคำแนะนำแหล่งรายได้ตามหมวดหมู่, แสดง Workspace เดิมบนหน้าเริ่มต้น, เตือนก่อนสร้างใหม่ในโหมดไม่สมัครสมาชิก และแก้ไขประเภทผู้ใช้งานได้โดยไม่ล้างข้อมูล
7. **Local-only Excel/CSV Export:** สร้าง `.xlsx` หลาย Sheet และ ZIP ที่มีไฟล์ `.csv` แยกตามประเภทจาก Workspace ใน memory พร้อม Preview แบบแท็บก่อนดาวน์โหลด, Summary Breakdown, Bangkok timestamp, Tax Rule Status และ disclaimer โดยไม่มี API, upload, Auth หรือ Cloud
8. **Income Category Coverage:** เพิ่มหมวดรายรับเป็น 19 รายการใน 5 กลุ่ม พร้อมคำแนะนำแหล่งรายได้ที่สัมพันธ์กันและยังยกเลิกหรือพิมพ์เองได้

- Phase 0 foundation: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1A Tax Rule Engine: เสร็จสมบูรณ์ (merge เข้า main แล้ว)
- Phase 1B Calculator UX: เสร็จสมบูรณ์ (merge เข้า main แล้วผ่าน PR #5)
- Phase 1B UX Hotfix: **เสร็จสมบูรณ์และ merge เข้า main แล้วผ่าน PR #6**
- Summary Breakdown + Income Month Grouping: **merge เข้า main แล้วผ่าน PR #7**
- Phase 1C Local-only PDF Export: **merge เข้า main แล้วผ่าน PR #9**
- Phase 1D Local-only Excel/CSV Export: **เสร็จสมบูรณ์และ merge เข้า main แล้วผ่าน PR #10**
- Tax Rules Verification (2568/2569): **เสร็จสมบูรณ์ ขั้นตอนที่ 1–4 บน branch `feat/tax-rules-verification-2568-2569`** (รวบรวมแหล่งอ้างอิง, โครงสร้างกฎภาษี, Golden Test Suite 36/36 tests, ปลดล็อก Resolver v1.0.0, Tax Estimate Card บน UI, และอัปเดต PDF/Excel/CSV Export)
- Search indexing: ปิดด้วย `noindex`
- Tax rule data: ปลดล็อกและเผยแพร่แล้ว (`1.0.0`, `status: published`, `validationStatus: valid`, `notForCalculation: false`)
- Tax calculation execution: ปลดล็อก Resolver แสดงผลประมาณการภาษีบนหน้าสรุปผล และรวมในรายงานส่งออก PDF/Excel/CSV
- User accounts และ cloud persistence: ไม่มีและอยู่นอกขอบเขต MVP 1

| รายการ | สถานะ | หลักฐานหรือหมายเหตุ |
| --- | --- | --- |
| GitHub repository | ผ่าน | <https://github.com/xparq-dev/jaimaiwailaew> |
| Vercel Production | ผ่าน | <https://jaimaiwailaew.vercel.app> |
| Git branch | ผ่าน | Branch `feat/tax-rules-verification-2568-2569` สร้างจาก main หลัง merge PR #10 |
| Runtime | ผ่าน | Node.js 22.x (`^22.12.0`) |
| Local-only Excel/CSV Export | ผ่าน | merge เข้า main แล้วผ่าน PR #10 |
| Tax Rules Official Sources & Draft | ดำเนินการ | sources.json, manifest.json, placeholder-bundle.json และ docs/06_TaxRulesDraft_2568_2569.md |
| Secret & Privacy hygiene | ผ่าน | ไม่พบ secret, ข้อมูลการเงินเก็บเฉพาะในเครื่องผู้ใช้ ไม่ส่งออกเครือข่าย |

## รายการที่ยังไม่ปิด (External / Legal Gates)

- [ ] ตั้ง GitHub branch protection หรือ ruleset สำหรับ `main`
- [ ] บันทึก Lighthouse audit อย่างเป็นทางการสำหรับ mobile/desktop
- [ ] ให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชียืนยันแหล่งข้อมูล กฎ และ test cases ปี 2568/2569 ก่อนเปิดผลคำนวณจริง

## Gate สำหรับ Tax Rules Verification (ขั้นตอนที่ 1 & 2)

1. Local validation (lint, typecheck, unit tests, build) ต้องผ่าน 100%
2. กฎหมายและอัตราภาษีครอบคลุมครบถ้วน: ขั้นบันได 0-35%, หักค่าใช้จ่าย 40(1)-40(8), และค่าลดหย่อนพื้นฐาน
3. ระบบยังคง fail-closed (`notForCalculation: true`) จนกว่าจะเริ่มขั้นตอนที่ 3 & 4

