> สถานะ: Phase 1A Implementation เสร็จสมบูรณ์ (2026-09-12) — รอผู้ใช้อนุมัติ commit/push ก่อนเริ่ม Phase 1B (Calculator UX)

Tax Rules Architecture และ Engine ของ Jai Mai Wai Laew

สร้างและผ่านการทดสอบแล้ว:
- `src/tax/types.ts` (Domain models & Zod-derived types)
- `src/tax/schemas.ts` (Zod schemas with runtime validation, strict date formats, machine IDs, valid URLs)
- `src/tax/money.ts` (Safe MoneySatang integer satang utilities, explicit rounding policies, safe arithmetic)
- `src/tax/engine/contracts.ts` (TaxCalculationInput & TaxCalculationResult contracts, deterministic unavailable result factory)
- `src/tax/engine/taxRuleResolver.ts` (Local tax rule resolver, fail-closed policy, feature gates)
- `src/tax/rules/2568/` และ `src/tax/rules/2569/` (Schema-valid unverified placeholders for BE 2568 & 2569)
- `src/tax/fixtures/structural-sample-family.json` (Structural test fixture with `exampleOnly: true`)
- `src/tax/__tests__/` (Unit tests covering schema validation, money precision, fail-closed policies, resolver feature gates)
- `docs/TaxRuleSourceReviewWorkflow.md` (Tax Rule versioning, review workflow, rounding policy, fail-closed policies)

ข้อกำหนดความปลอดภัยที่บังคับใช้:
- Tax rates, allowances, thresholds ห้ามอยู่ใน React component
- เงินจัดการด้วย integer satang (MoneySatang branded type) เท่านั้น
- ผลลัพธ์ resolver คืน availability status, ruleSetId, featureGates, assumptions, warnings และ disclaimer
- ไม่เปิดเผยยอดภาษีตัวเลข (`taxDue`, `refundAmount`, `finalTax`, `officialTaxPayable`) เมื่อกฎอยู่ในสถานะ unverified/invalid/blocked
- กฎภาษีจริงปี 2568/2569 ยังคงเป็น `unverified` และ `notForCalculation: true`
