import { describe, expect, it } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { buildLocalPdfReportModel } from "@/pdf/local-pdf-report";
import {
  buildProfessionalPdfDocument,
  buildProfessionalPdfFileName,
} from "@/pdf/professional-pdf-document";

describe("professional PDF document", () => {
  it("uses the formal Thai audit layout and approved section order", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const report = buildLocalPdfReportModel(workspace, {
      generatedAt: new Date("2026-09-13T07:55:00.000Z"),
      reportName: "รายงานสำหรับประชุม",
      displayName: "ผู้ใช้ตัวอย่าง",
    });
    const document = buildProfessionalPdfDocument(report);
    const serialized = JSON.stringify(document.content);

    expect(document.pageSize).toBe("A4");
    expect(document.pageOrientation).toBe("portrait");
    expect(document.pageMargins).toEqual([
      20 * (72 / 25.4),
      25 * (72 / 25.4),
      20 * (72 / 25.4),
      25 * (72 / 25.4),
    ]);
    expect(document.defaultStyle).toMatchObject({
      font: "Sarabun",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#000000",
    });
    expect(document.styles?.subsequentParagraph).toMatchObject({
      margin: [36, 0, 0, 0],
    });
    expect(document.watermark).toMatchObject({
      text: [
        "JAI MAI WAI LAEW",
        "รายงานเพื่อการจัดระเบียบข้อมูลส่วนตัว",
        "ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ",
      ].join("\n"),
      opacity: 0.06,
      angle: -38,
    });
    expect(document.header).toBeTypeOf("function");
    expect(document.footer).toBeTypeOf("function");
    expect(serialized).toContain("รายงานสำหรับประชุม");
    expect(serialized).toContain("ผู้ใช้ตัวอย่าง");
    expect(serialized).toContain("13 กันยายน 2569 14:55 น. (Asia/Bangkok)");
    expect(serialized).toContain(
      "Tax Rules 2568/2569: unverified / not for calculation",
    );
    expect(serialized).toContain('"fontSize":18');
    expect(serialized).toContain('"fontSize":14');
    expect(serialized).toContain('"fontSize":12');
    expect(serialized).toContain('"fontSize":11');

    const sectionTitles = [
      "1. ภาพรวมทางการเงิน",
      "2. Summary Breakdown (แยกตามหมวด / แหล่งที่มา)",
      "3. รายการรายรับ",
      "4. รายการรายจ่าย",
      "5. ภาษีหัก ณ ที่จ่าย",
      "6. ค่าลดหย่อน / ค่าลดภาษี",
    ];
    const sectionPositions = sectionTitles.map((title) =>
      serialized.indexOf(title),
    );
    expect(sectionPositions.every((position) => position >= 0)).toBe(true);
    expect(sectionPositions).toEqual(
      [...sectionPositions].sort((left, right) => left - right),
    );

    expect(serialized).not.toContain("Tax estimate unavailable");
    expect(serialized).not.toContain("fail-closed");
    expect(serialized).not.toContain("ruleSetId");
    expect(serialized).not.toContain("หมายเหตุ");
    expect(serialized).not.toContain("ไม่ได้ระบุ");
    expect(serialized).not.toContain("ไม่ระบุแหล่งที่มา");
    expect(serialized).not.toContain("ไม่ระบุผู้จ่าย");
    expect(serialized).not.toContain("http");
  });

  it("creates a Thai, filesystem-safe download name", () => {
    const report = buildLocalPdfReportModel(
      createCalculatorWorkspace(
        getDefaultWorkspaceInput("salaried_employee", 2569, "full_year"),
      ),
      { generatedAt: new Date("2026-09-13T07:55:00.000Z") },
    );

    expect(buildProfessionalPdfFileName(report)).toBe(
      "รายงานสรุปรายรับรายจ่าย-2569-20260913-1455.pdf",
    );
  });
});
