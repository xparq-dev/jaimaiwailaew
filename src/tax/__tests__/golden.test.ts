/**
 * Golden Test Suite — Thai PIT Calculator (Step 3 of Tax Rules Verification)
 *
 * Each test case is a "Golden Record": a Persona with known inputs and
 * manually-verified expected outputs cross-checked against the Thai Revenue
 * Department's official PIT calculation sheets.
 *
 * IMPORTANT: These tests verify the pure PITCalculator engine directly.
 * They do NOT call the TaxRuleResolver or check notForCalculation.
 * The resolver gate is tested separately in resolver.test.ts.
 *
 * All monetary comparisons are at satang precision (integer × 100).
 *
 * References:
 *  - ประมวลรัษฎากร มาตรา 40, 47, 48
 *  - พ.ร.ฎ. (ฉบับที่ 629) พ.ศ. 2560 (ค่าใช้จ่ายเหมา)
 *  - พ.ร.บ. แก้ไข ป.รัษฎากร (ฉบับที่ 44) พ.ศ. 2560 (อัตราภาษีขั้นบันได)
 *  - กฎกระทรวง ฉบับที่ 126 (ค่าลดหย่อน)
 */

import { describe, expect, it } from "vitest";

import {
  type PITCalculationInput,
  calculatePIT,
} from "../engine/pitCalculator";
import { bahtToSatang } from "../money";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { toMoneySatang } from "../money";

/** Convert integer baht to satang for assertion clarity. Supports negative values (refund). */
function b(baht: number) {
  if (baht < 0) {
    return toMoneySatang(baht * 100, { allowNegative: true });
  }
  return bahtToSatang(baht);
}

// ---------------------------------------------------------------------------
// Persona 1: พนักงานเงินเดือน 40(1)
// เงินเดือน 480,000 บาท | ประกันสังคม 9,000 | ประกันชีวิต 24,000
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 1: พนักงานเงินเดือน 40(1)", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_1", grossIncomeBaht: 480000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 9000,
      lifeInsuranceBaht: 24000,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 0,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("คำนวณเงินได้รวมถูกต้อง", () => {
    expect(result.grossIncomeSatang).toBe(b(480000));
  });

  it("หักค่าใช้จ่ายเหมา 50% ไม่เกิน 100,000 บาท (cap)", () => {
    // 480,000 × 50% = 240,000 > 100,000 → cap = 100,000
    expect(result.expenseDeductionSatang).toBe(b(100000));
    expect(result.incomeAfterExpensesSatang).toBe(b(380000));
  });

  it("รวมค่าลดหย่อนถูกต้อง: ส่วนตัว 60,000 + SSO 9,000 + ประกันชีวิต 24,000", () => {
    expect(result.totalAllowancesSatang).toBe(b(93000));
  });

  it("คำนวณเงินได้สุทธิ 287,000 บาท", () => {
    // 380,000 - 93,000 = 287,000
    expect(result.netTaxableIncomeSatang).toBe(b(287000));
  });

  it("คำนวณภาษีตามขั้นบันได: 287,000 บาท → ภาษี 6,850 บาท", () => {
    // ขั้นที่ 1: 0-150,000 @ 0% = 0
    // ขั้นที่ 2: 150,001-287,000 = 137,000 @ 5% = 6,850
    expect(result.grossTaxSatang).toBe(b(6850));
  });

  it("ผลลัพธ์: ต้องชำระภาษี 6,850 บาท (outcome = pay)", () => {
    expect(result.taxDueOrRefundSatang).toBe(b(6850));
    expect(result.outcome).toBe("pay");
  });
});

// ---------------------------------------------------------------------------
// Persona 2: Freelancer 40(2) — เงินได้สุทธิต่ำกว่าเกณฑ์ (ภาษี 0 บาท)
// รายได้ 300,000 | ประกันสังคม 9,000
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 2: Freelancer 40(2) ภาษี 0 บาท", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_2", grossIncomeBaht: 300000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 9000,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 0,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("หักค่าใช้จ่าย 40(2) เหมา 50% cap 100,000 บาท", () => {
    // 300,000 × 50% = 150,000 > 100,000 → cap = 100,000
    expect(result.expenseDeductionSatang).toBe(b(100000));
  });

  it("เงินได้สุทธิ 131,000 บาท (ต่ำกว่าเกณฑ์ 150,000 บาทที่ยกเว้น)", () => {
    expect(result.netTaxableIncomeSatang).toBe(b(131000));
  });

  it("ภาษีสุทธิ 0 บาท (อยู่ในขั้นยกเว้น 0%)", () => {
    expect(result.grossTaxSatang).toBe(b(0));
  });

  it("ผลลัพธ์: ภาษี 0 บาท (outcome = zero)", () => {
    expect(result.taxDueOrRefundSatang).toBe(b(0));
    expect(result.outcome).toBe("zero");
  });
});

// ---------------------------------------------------------------------------
// Persona 3: วิชาชีพอิสระ 40(6) ไม่ใช่แพทย์ — หักเหมา 30%
// รายได้ 800,000 | ประกันสังคม 9,000
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 3: วิชาชีพอิสระ 40(6) หักเหมา 30%", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_6_other", grossIncomeBaht: 800000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 9000,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 0,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("หักค่าใช้จ่าย 40(6) อื่นๆ เหมา 30% (ไม่มีเพดานบาท)", () => {
    // 800,000 × 30% = 240,000
    expect(result.expenseDeductionSatang).toBe(b(240000));
    expect(result.incomeAfterExpensesSatang).toBe(b(560000));
  });

  it("เงินได้สุทธิ 491,000 บาท", () => {
    // 560,000 - 60,000 - 9,000 = 491,000
    expect(result.netTaxableIncomeSatang).toBe(b(491000));
  });

  it("คำนวณภาษีถูกต้อง 3 ขั้น: 0 + 7,500 + 19,100 = 26,600 บาท", () => {
    // ขั้น1: 150,000 @ 0% = 0
    // ขั้น2: 150,000 @ 5% = 7,500
    // ขั้น3: 191,000 @ 10% = 19,100
    expect(result.grossTaxSatang).toBe(b(26600));
  });

  it("ผลลัพธ์: ต้องชำระภาษี 26,600 บาท", () => {
    expect(result.taxDueOrRefundSatang).toBe(b(26600));
    expect(result.outcome).toBe("pay");
  });
});

// ---------------------------------------------------------------------------
// Persona 4: ผู้รับเหมา 40(7) — หักเหมา 60%, ขอคืนภาษี
// รายได้ 1,200,000 | หัก ณ ที่จ่าย 36,000 บาท
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 4: ผู้รับเหมา 40(7) ขอคืนภาษี", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_7", grossIncomeBaht: 1200000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 9000,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 0,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 36000,
  };

  const result = calculatePIT(input);

  it("หักค่าใช้จ่าย 40(7) เหมา 60% (ไม่มีเพดานบาท)", () => {
    // 1,200,000 × 60% = 720,000
    expect(result.expenseDeductionSatang).toBe(b(720000));
    expect(result.incomeAfterExpensesSatang).toBe(b(480000));
  });

  it("เงินได้สุทธิ 411,000 บาท", () => {
    // 480,000 - 60,000 - 9,000 = 411,000
    expect(result.netTaxableIncomeSatang).toBe(b(411000));
  });

  it("คำนวณภาษีถูกต้อง: 0 + 7,500 + 11,100 = 18,600 บาท", () => {
    // ขั้น1: 150,000 @ 0% = 0
    // ขั้น2: 150,000 @ 5% = 7,500
    // ขั้น3: 111,000 @ 10% = 11,100
    expect(result.grossTaxSatang).toBe(b(18600));
  });

  it("หักภาษี ณ ที่จ่าย 36,000 บาท แล้วคืนภาษี 17,400 บาท", () => {
    expect(result.withholdingTaxPaidSatang).toBe(b(36000));
    expect(result.taxDueOrRefundSatang).toBe(b(-17400));
    expect(result.outcome).toBe("refund");
  });
});

// ---------------------------------------------------------------------------
// Persona 5: ธุรกิจ/ขายของออนไลน์ 40(8) — หักเหมา 60%, ลดหย่อน SSF
// รายได้ 2,000,000 | SSF 200,000 บาท
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 5: ธุรกิจ/ขายของออนไลน์ 40(8) + SSF", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_8", grossIncomeBaht: 2000000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 0,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 200000,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("หักค่าใช้จ่าย 40(8) เหมา 60%", () => {
    // 2,000,000 × 60% = 1,200,000
    expect(result.expenseDeductionSatang).toBe(b(1200000));
    expect(result.incomeAfterExpensesSatang).toBe(b(800000));
  });

  it("รวมค่าลดหย่อนถูกต้อง: ส่วนตัว 60,000 + SSF 200,000 = 260,000 บาท", () => {
    expect(result.totalAllowancesSatang).toBe(b(260000));
  });

  it("เงินได้สุทธิ 540,000 บาท", () => {
    // 800,000 - 260,000 = 540,000
    expect(result.netTaxableIncomeSatang).toBe(b(540000));
  });

  it("คำนวณภาษีถูกต้อง 4 ขั้น: 0 + 7,500 + 20,000 + 6,000 = 33,500 บาท", () => {
    // ขั้น1: 150,000 @ 0% = 0
    // ขั้น2: 150,000 @ 5% = 7,500
    // ขั้น3: 200,000 @ 10% = 20,000
    // ขั้น4: 40,000 @ 15% = 6,000
    expect(result.grossTaxSatang).toBe(b(33500));
    expect(result.outcome).toBe("pay");
  });
});

// ---------------------------------------------------------------------------
// Persona 6: ผู้มีรายได้หลายทาง — 40(1) + 40(2) + 40(8)
// 40(1): 360,000 + 40(2): 240,000 + 40(8): 500,000 | ประกันสังคม 9,000
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 6: รายได้หลายทาง 40(1)+40(2)+40(8)", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [
      { type: "40_1", grossIncomeBaht: 360000 },
      { type: "40_2", grossIncomeBaht: 240000 },
      { type: "40_8", grossIncomeBaht: 500000 },
    ],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 9000,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 0,
      rmfBaht: 0,
      ssfBaht: 0,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("เงินได้รวมทุกแหล่ง 1,100,000 บาท", () => {
    expect(result.grossIncomeSatang).toBe(b(1100000));
  });

  it("ค่าใช้จ่าย: 40(1)+40(2) รวม cap 100,000 + 40(8) 300,000 = 400,000 บาท", () => {
    // 40(1)+40(2) = (360,000+240,000)*50% = 300,000 → cap = 100,000
    // 40(8) = 500,000*60% = 300,000 (ไม่มีเพดาน)
    expect(result.expenseDeductionSatang).toBe(b(400000));
    expect(result.incomeAfterExpensesSatang).toBe(b(700000));
  });

  it("เงินได้สุทธิ 631,000 บาท", () => {
    // 700,000 - 60,000 - 9,000 = 631,000
    expect(result.netTaxableIncomeSatang).toBe(b(631000));
  });

  it("คำนวณภาษีถูกต้อง 4 ขั้น: 0 + 7,500 + 20,000 + 19,650 = 47,150 บาท", () => {
    // ขั้น1: 150,000 @ 0% = 0
    // ขั้น2: 150,000 @ 5% = 7,500
    // ขั้น3: 200,000 @ 10% = 20,000
    // ขั้น4: 131,000 @ 15% = 19,650
    expect(result.grossTaxSatang).toBe(b(47150));
    expect(result.outcome).toBe("pay");
  });
});

// ---------------------------------------------------------------------------
// Persona 7: ผู้มีรายได้สูง 40(8) — เกิน 5 ล้านบาท (ขั้น 35%)
// รายได้ 15,000,000 | PVD 300,000 + SSF 200,000 (กลุ่มเกษียณ 500,000)
// ---------------------------------------------------------------------------

describe("Golden Suite — Persona 7: รายได้สูง 40(8) ขั้น 35%", () => {
  const input: PITCalculationInput = {
    taxYearBE: 2568,
    incomes: [{ type: "40_8", grossIncomeBaht: 15000000 }],
    allowances: {
      personalBaht: 60000,
      socialSecurityBaht: 0,
      lifeInsuranceBaht: 0,
      healthInsuranceBaht: 0,
      providentFundBaht: 300000,
      rmfBaht: 0,
      ssfBaht: 200000,
      thaiEsgBaht: 0,
    },
    withholdingTaxPaidBaht: 0,
  };

  const result = calculatePIT(input);

  it("หักค่าใช้จ่าย 40(8) เหมา 60% = 9,000,000 บาท", () => {
    expect(result.expenseDeductionSatang).toBe(b(9000000));
    expect(result.incomeAfterExpensesSatang).toBe(b(6000000));
  });

  it("รวมค่าลดหย่อน: ส่วนตัว 60,000 + PVD 300,000 + SSF 200,000 = 560,000 บาท (ไม่เกินเพดานกลุ่มเกษียณ 500,000)", () => {
    expect(result.totalAllowancesSatang).toBe(b(560000));
  });

  it("เงินได้สุทธิ 5,440,000 บาท", () => {
    // 6,000,000 - 560,000 = 5,440,000
    expect(result.netTaxableIncomeSatang).toBe(b(5440000));
  });

  it("ครอบคลุมขั้นภาษีสูงสุด 35% ในขั้นที่ 8", () => {
    const topBracket = result.bracketApplications.find(
      (b) => b.level === 8 && b.ratePercent === 35,
    );
    expect(topBracket).toBeDefined();
    // เงินที่อยู่เหนือ 5,000,000 = 5,440,000 - 5,000,000 = 440,000 บาท
    expect(topBracket?.taxableInBracketSatang).toBe(b(440000));
    // ภาษีขั้น 8 = 440,000 × 35% = 154,000
    expect(topBracket?.taxInBracketSatang).toBe(b(154000));
  });

  it("รวมภาษีทุกขั้น 1,419,000 บาท", () => {
    // ขั้น1:0 + ขั้น2:7,500 + ขั้น3:20,000 + ขั้น4:37,500 + ขั้น5:50,000 + ขั้น6:250,000 + ขั้น7:900,000 + ขั้น8:154,000
    expect(result.grossTaxSatang).toBe(b(1419000));
    expect(result.outcome).toBe("pay");
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: ตรวจสอบ safety guards และ edge cases
// ---------------------------------------------------------------------------

describe("Golden Suite — Edge Cases & Safety Guards", () => {
  it("เงินได้สุทธิ 0 บาท → ภาษี 0 บาท (outcome = zero)", () => {
    const result = calculatePIT({
      taxYearBE: 2568,
      incomes: [{ type: "40_1", grossIncomeBaht: 100000 }],
      allowances: {
        personalBaht: 60000,
        socialSecurityBaht: 9000,
        lifeInsuranceBaht: 24000,
        healthInsuranceBaht: 0,
        providentFundBaht: 0,
        rmfBaht: 0,
        ssfBaht: 0,
        thaiEsgBaht: 0,
      },
      withholdingTaxPaidBaht: 0,
    });
    // 100,000 - 50,000 (cap) - 60,000 - 9,000 - 24,000 = -43,000 → floor at 0
    expect(result.netTaxableIncomeSatang).toBe(b(0));
    expect(result.grossTaxSatang).toBe(b(0));
    expect(result.outcome).toBe("zero");
  });

  it("SSO cap: สมทบประกันสังคมเกิน 9,000 บาท → clamp ที่ 9,000 บาท", () => {
    const result = calculatePIT({
      taxYearBE: 2568,
      incomes: [{ type: "40_1", grossIncomeBaht: 600000 }],
      allowances: {
        personalBaht: 60000,
        socialSecurityBaht: 15000, // เกิน cap
        lifeInsuranceBaht: 0,
        healthInsuranceBaht: 0,
        providentFundBaht: 0,
        rmfBaht: 0,
        ssfBaht: 0,
        thaiEsgBaht: 0,
      },
      withholdingTaxPaidBaht: 0,
    });
    // SSO capped at 9,000 — ค่าลดหย่อนรวม = 60,000 + 9,000 = 69,000
    expect(result.totalAllowancesSatang).toBe(b(69000));
  });

  it("ประกันชีวิต + ประกันสุขภาพ combined cap 100,000 บาท", () => {
    const result = calculatePIT({
      taxYearBE: 2568,
      incomes: [{ type: "40_1", grossIncomeBaht: 1000000 }],
      allowances: {
        personalBaht: 60000,
        socialSecurityBaht: 0,
        lifeInsuranceBaht: 90000,
        healthInsuranceBaht: 25000, // รวมกัน = 115,000 > 100,000 cap → health จะถูก clamp
        providentFundBaht: 0,
        rmfBaht: 0,
        ssfBaht: 0,
        thaiEsgBaht: 0,
      },
      withholdingTaxPaidBaht: 0,
    });
    // life = 90,000; health = min(25,000, 100,000 - 90,000) = 10,000
    // รวมประกัน = 100,000
    expect(result.totalAllowancesSatang).toBe(b(160000)); // 60,000 + 100,000
  });

  it("กลุ่มเกษียณ cap 500,000 บาท: PVD 300,000 + RMF 300,000 → clamp รวมที่ 500,000", () => {
    const result = calculatePIT({
      taxYearBE: 2568,
      incomes: [{ type: "40_8", grossIncomeBaht: 5000000 }],
      allowances: {
        personalBaht: 60000,
        socialSecurityBaht: 0,
        lifeInsuranceBaht: 0,
        healthInsuranceBaht: 0,
        providentFundBaht: 300000,
        rmfBaht: 300000, // รวมกัน = 600,000 > 500,000 cap
        ssfBaht: 0,
        thaiEsgBaht: 0,
      },
      withholdingTaxPaidBaht: 0,
    });
    // PVD = 300,000; RMF clamped to 500,000 - 300,000 = 200,000
    expect(result.totalAllowancesSatang).toBe(b(560000)); // 60,000 + 300,000 + 200,000
  });

  it("40(4) ดอกเบี้ย/เงินปันผล: ไม่อนุญาตหักค่าใช้จ่าย", () => {
    const result = calculatePIT({
      taxYearBE: 2568,
      incomes: [{ type: "40_4", grossIncomeBaht: 500000 }],
      allowances: {
        personalBaht: 60000,
        socialSecurityBaht: 0,
        lifeInsuranceBaht: 0,
        healthInsuranceBaht: 0,
        providentFundBaht: 0,
        rmfBaht: 0,
        ssfBaht: 0,
        thaiEsgBaht: 0,
      },
      withholdingTaxPaidBaht: 0,
    });
    expect(result.expenseDeductionSatang).toBe(b(0));
    // เงินได้สุทธิ = 500,000 - 0 - 60,000 = 440,000
    expect(result.netTaxableIncomeSatang).toBe(b(440000));
  });
});
