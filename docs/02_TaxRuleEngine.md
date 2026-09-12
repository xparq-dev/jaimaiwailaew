เพิ่ม Tax Rules Architecture และ Calculation Engine ของ Jai Mai Wai Laew โดยยังไม่ใส่ค่ากฎหมายจริงที่ไม่ได้รับการยืนยัน

ต้องสร้าง:
- src/tax/types.ts
- src/tax/schemas.ts ด้วย Zod
- src/tax/rules/2568 และ src/tax/rules/2569
- meta.json, sources.json, tax-brackets.json, income-types.json, expense-deductions.json, allowances.json, pnd94.json
- ใช้ placeholder ที่มีสถานะ unverified และห้ามใช้เป็นผลผลิตจริง
- src/tax/engine/taxRuleResolver.ts
- src/tax/engine/validateTaxInput.ts
- src/tax/engine/calculateProgressiveTax.ts
- src/tax/engine/calculatePnd94Estimate.ts
- src/tax/engine/calculatePnd91Estimate.ts
- src/tax/engine/calculateAnnualEstimate.ts
- src/tax/tests/*.test.ts

ข้อกำหนด:
- Tax rates, allowances, thresholds ห้ามอยู่ใน React component
- เงินต้องจัดการด้วย integer satang หรือ fixed-point integer
- ผลลัพธ์ต้องคืน taxYearBE, ruleSetId, assumptions, warnings และ disclaimer
- รองรับ expense relevance status: likely_related, needs_review, personal, uncategorized
- ห้ามอ้างว่าผลลัพธ์เป็นทางการ
- เขียน unit tests ที่พิสูจน์ bracket calculation, validation errors และ deterministic result
- หากไม่ทราบตัวเลขตามกฎหมาย ให้สร้าง schema และ fixtures unverified เท่านั้น