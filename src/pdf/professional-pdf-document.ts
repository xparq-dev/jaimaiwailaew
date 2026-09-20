import type {
  Content,
  ContentTable,
  StyleDictionary,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

import type {
  LocalPdfBreakdownSection,
  LocalPdfEntryRow,
  LocalPdfReportModel,
} from "@/pdf/local-pdf-report";
import type { MoneySatang } from "@/tax/money";
import { toMoneySatang } from "@/tax/money";
import type { PITCalculationResult } from "@/tax/engine/pitCalculator";

const COLORS = {
  black: "#000000",
  darkGray: "#333333",
  lightGray: "#E6E6E6",
  white: "#FFFFFF",
} as const;

const POINTS_PER_MILLIMETER = 72 / 25.4;
const POINTS_PER_INCH = 72;
const HORIZONTAL_MARGIN = 20 * POINTS_PER_MILLIMETER;
const VERTICAL_MARGIN = 25 * POINTS_PER_MILLIMETER;
const SECTION_SPACING = 6 * POINTS_PER_MILLIMETER;
const CONTENT_WIDTH = 595.28 - HORIZONTAL_MARGIN * 2;

const TYPE_SCALE = {
  appName: 16,
  documentTitle: 18,
  section: 14,
  tableHeader: 12,
  body: 11,
  taxStatus: 10,
  footer: 9,
} as const;

const TAX_RULE_STATUS = "Tax Rules 2568/2569: unverified / not for calculation";
const WATERMARK_TEXT = [
  "JAI MAI WAI LAEW",
  "รายงานเพื่อการจัดระเบียบข้อมูลส่วนตัว",
  "ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ",
].join("\n");
const DISCLAIMER_TEXT = [
  "เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น",
  "ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ",
  "ไม่มีการคำนวณภาษี",
].join("\n");

function formatAmount(amountSatang: MoneySatang): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountSatang / 100);
}

function tableLayout(columnCount: number): ContentTable["layout"] {
  return {
    hLineWidth: (rowIndex, node) =>
      rowIndex === 0 || rowIndex === node.table.body.length ? 1 : 0.5,
    vLineWidth: (columnIndex) =>
      columnIndex === 0 || columnIndex === columnCount ? 1 : 0.5,
    hLineColor: (rowIndex, node) =>
      rowIndex === 0 || rowIndex === node.table.body.length
        ? COLORS.black
        : COLORS.darkGray,
    vLineColor: (columnIndex) =>
      columnIndex === 0 || columnIndex === columnCount
        ? COLORS.black
        : COLORS.darkGray,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
    fillColor: (rowIndex) => (rowIndex === 0 ? COLORS.lightGray : COLORS.white),
  };
}

function headerCell(text: string): Content {
  return {
    text,
    alignment: "center",
    bold: true,
    color: COLORS.black,
    fontSize: TYPE_SCALE.tableHeader,
  };
}

function bodyCell(text: string, alignment: "left" | "right" = "left"): Content {
  return {
    text,
    alignment,
    bold: false,
    color: COLORS.black,
    fontSize: TYPE_SCALE.body,
  };
}

function sectionHeading(
  number: number,
  title: string,
  startOnNewPage: boolean,
): Content {
  return {
    stack: [
      {
        text: `${number}. ${title}`,
        bold: true,
        color: COLORS.black,
        fontSize: TYPE_SCALE.section,
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: CONTENT_WIDTH,
            y2: 0,
            lineWidth: 0.5,
            lineColor: COLORS.darkGray,
          },
        ],
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 0, 0, SECTION_SPACING],
    unbreakable: true,
    headlineLevel: 1,
    pageBreak: startOnNewPage ? "before" : undefined,
  };
}

function allRows(reportRows: readonly { rows: readonly LocalPdfEntryRow[] }[]) {
  return reportRows.flatMap((group) => group.rows);
}

function overviewTable(report: LocalPdfReportModel): Content {
  const rows: readonly (readonly [string, MoneySatang])[] = [
    ["รายรับรวม", report.totals.totalIncomeSatang],
    ["รายจ่ายรวม", report.totals.totalExpenseSatang],
    ["ภาษีหัก ณ ที่จ่ายรวม", report.totals.totalWithholdingSatang],
    ["ค่าลดหย่อน / ค่าลดภาษีรวม", report.totals.totalDeclaredAllowanceSatang],
  ];

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: ["*", 145],
      body: [
        [headerCell("รายการ"), headerCell("จำนวนเงิน (บาท)")],
        ...rows.map(([label, amount]) => [
          bodyCell(label),
          bodyCell(formatAmount(amount), "right"),
        ]),
      ],
    },
    layout: tableLayout(2),
    unbreakable: true,
  };
}

function taxEstimateSection(
  estimate: PITCalculationResult,
  sectionNumber: number,
): Content[] {
  const finalLabel =
    estimate.outcome === "refund"
      ? "ภาษีที่ขอคืนได้ (Refund)"
      : estimate.outcome === "pay"
        ? "ภาษีที่ต้องชำระเพิ่ม (Tax Due)"
        : "ภาษีที่ต้องชำระเพิ่ม / (ขอคืน)";

  const finalAmount =
    estimate.outcome === "refund"
      ? formatAmount(toMoneySatang(Math.abs(estimate.taxDueOrRefundSatang)))
      : formatAmount(estimate.taxDueOrRefundSatang);

  const rows: readonly (readonly [string, string])[] = [
    ["เงินได้พึงประเมินรวม", formatAmount(estimate.grossIncomeSatang)],
    ["หัก ค่าใช้จ่ายตามกฎหมาย", formatAmount(estimate.expenseDeductionSatang)],
    ["เงินได้หลังหักค่าใช้จ่าย", formatAmount(estimate.incomeAfterExpensesSatang)],
    ["หัก ค่าลดหย่อนรวม", formatAmount(estimate.totalAllowancesSatang)],
    [
      "เงินได้สุทธิเพื่อคำนวณภาษี (Net Taxable Income)",
      formatAmount(estimate.netTaxableIncomeSatang),
    ],
    ["ภาษีคำนวณตามขั้นบันได (Gross Tax)", formatAmount(estimate.grossTaxSatang)],
    [
      "หัก ภาษีหัก ณ ที่จ่ายที่ชำระไว้",
      formatAmount(estimate.withholdingTaxPaidSatang),
    ],
    [finalLabel, finalAmount],
  ];

  return [
    sectionHeading(
      sectionNumber,
      "ประมาณการภาษีเงินได้บุคคลธรรมดา (เบื้องต้น)",
      false,
    ),
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        keepWithHeaderRows: 1,
        widths: ["*", 145],
        body: [
          [headerCell("รายการคำนวณภาษี"), headerCell("จำนวนเงิน (บาท)")],
          ...rows.map(([label, formattedAmount]) => [
            bodyCell(label),
            bodyCell(formattedAmount, "right"),
          ]),
        ],
      },
      layout: tableLayout(2),
      unbreakable: true,
    },
    {
      text: "1. เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น 2. การคำนวณภาษีเป็นเพียงประมาณการเบื้องต้น 3. โปรดปรึกษาผู้เชี่ยวชาญหรือกรมสรรพากรก่อนยื่นภาษีจริง",
      italics: true,
      fontSize: TYPE_SCALE.footer,
      color: COLORS.darkGray,
      margin: [0, 4, 0, SECTION_SPACING],
    },
  ];
}

function breakdownTable(section: LocalPdfBreakdownSection): Content {
  const groupHeading =
    section.key === "income-source"
      ? "แหล่งที่มา"
      : section.key === "expense-status"
        ? "สถานะ"
        : "หมวดหมู่";

  return {
    stack: [
      {
        text: section.title,
        bold: true,
        fontSize: TYPE_SCALE.body,
        margin: [0, 0, 0, 5],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: ["*", 80, 130],
          body: [
            [
              headerCell(groupHeading),
              headerCell("จำนวนรายการ"),
              headerCell("จำนวนเงิน (บาท)"),
            ],
            ...section.details.map(({ group }) => [
              bodyCell(group.label),
              bodyCell(String(group.entryCount), "right"),
              bodyCell(formatAmount(group.totalSatang), "right"),
            ]),
          ],
        },
        layout: tableLayout(3),
      },
    ],
    margin: [0, 0, 0, SECTION_SPACING],
    unbreakable: section.details.length <= 7,
  };
}

function incomeTable(report: LocalPdfReportModel): Content {
  const rows = allRows(report.incomeGroups);

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: [82, "*", "*", 118],
      body: [
        [
          headerCell("วันที่"),
          headerCell("แหล่งที่มา"),
          headerCell("หมวดหมู่"),
          headerCell("จำนวนเงิน (บาท)"),
        ],
        ...rows.map((row) => [
          bodyCell(row.periodLabel),
          bodyCell(row.secondaryLabel ?? ""),
          bodyCell(row.primaryLabel),
          bodyCell(formatAmount(row.amountSatang), "right"),
        ]),
      ],
    },
    layout: tableLayout(4),
    unbreakable: rows.length <= 7,
  };
}

function expenseTable(report: LocalPdfReportModel): Content {
  const rows = allRows(report.expenseGroups);

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: [100, "*", 135],
      body: [
        [
          headerCell("วันที่"),
          headerCell("หมวดหมู่"),
          headerCell("จำนวนเงิน (บาท)"),
        ],
        ...rows.map((row) => [
          bodyCell(row.periodLabel),
          bodyCell(row.primaryLabel),
          bodyCell(formatAmount(row.amountSatang), "right"),
        ]),
      ],
    },
    layout: tableLayout(3),
    unbreakable: rows.length <= 8,
  };
}

function withholdingTable(report: LocalPdfReportModel): Content {
  const rows = allRows(report.withholdingGroups);
  const hasCertificateReference = rows.some((row) => row.secondaryLabel);

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: hasCertificateReference ? [82, "*", "*", 118] : [100, "*", 135],
      body: [
        hasCertificateReference
          ? [
              headerCell("วันที่"),
              headerCell("ผู้จ่าย"),
              headerCell("เลขอ้างอิงหนังสือรับรอง"),
              headerCell("จำนวนเงิน (บาท)"),
            ]
          : [
              headerCell("วันที่"),
              headerCell("ผู้จ่าย"),
              headerCell("จำนวนเงิน (บาท)"),
            ],
        ...rows.map((row) =>
          hasCertificateReference
            ? [
                bodyCell(row.periodLabel),
                bodyCell(row.primaryLabel),
                bodyCell(row.secondaryLabel ?? ""),
                bodyCell(formatAmount(row.amountSatang), "right"),
              ]
            : [
                bodyCell(row.periodLabel),
                bodyCell(row.primaryLabel),
                bodyCell(formatAmount(row.amountSatang), "right"),
              ],
        ),
      ],
    },
    layout: tableLayout(hasCertificateReference ? 4 : 3),
    unbreakable: rows.length <= 7,
  };
}

function allowanceTable(report: LocalPdfReportModel): Content {
  const rows = report.allowanceRows.filter(
    (row) => row.amountSatang !== undefined,
  );

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: ["*", 145],
      body: [
        [headerCell("หมวดหมู่"), headerCell("จำนวนเงิน (บาท)")],
        ...rows.map((row) => [
          bodyCell(row.label),
          bodyCell(formatAmount(row.amountSatang!), "right"),
        ]),
      ],
    },
    layout: tableLayout(2),
    unbreakable: rows.length <= 9,
  };
}

const styles: StyleDictionary = {
  firstParagraph: {
    fontSize: TYPE_SCALE.body,
    lineHeight: 1.5,
    margin: [0, 0, 0, 0],
  },
  subsequentParagraph: {
    fontSize: TYPE_SCALE.body,
    lineHeight: 1.5,
    margin: [POINTS_PER_INCH / 2, 0, 0, 0],
  },
};

export function buildProfessionalPdfDocument(
  report: LocalPdfReportModel,
): TDocumentDefinitions {
  const taxRuleStatus = report.taxEstimate
    ? "Tax Rules 2568/2569: verified / published (v1.0.0)"
    : TAX_RULE_STATUS;
  const disclaimerText = report.taxEstimate
    ? [
        "เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น",
        "การคำนวณภาษีเป็นเพียงประมาณการเบื้องต้น",
        "โปรดปรึกษาผู้เชี่ยวชาญหรือกรมสรรพากรก่อนยื่นภาษีจริง",
      ].join("\n")
    : DISCLAIMER_TEXT;

  let sectionIndex = 1;
  const content: Content[] = [
    {
      text: "JAI MAI WAI LAEW",
      alignment: "center",
      bold: true,
      fontSize: TYPE_SCALE.appName,
      margin: [0, 0, 0, 3],
    },
    {
      text: report.title,
      alignment: "center",
      bold: true,
      fontSize: TYPE_SCALE.documentTitle,
      margin: [0, 0, 0, 3],
    },
    {
      text: report.generatedAtLabel,
      alignment: "center",
      fontSize: TYPE_SCALE.body,
      margin: [0, 0, 0, 2],
    },
    {
      text: taxRuleStatus,
      alignment: "center",
      italics: true,
      fontSize: TYPE_SCALE.taxStatus,
      margin: [0, 0, 0, 5],
    },
    ...(report.displayName
      ? [
          {
            text: `จัดทำโดย ${report.displayName}`,
            alignment: "center" as const,
            fontSize: TYPE_SCALE.body,
            margin: [0, 0, 0, 5] as [number, number, number, number],
          },
        ]
      : []),
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: CONTENT_WIDTH,
          y2: 0,
          lineWidth: 1.5,
          lineColor: COLORS.black,
        },
      ],
      margin: [0, 0, 0, SECTION_SPACING],
    },
    sectionHeading(sectionIndex++, "ภาพรวมทางการเงิน", false),
    overviewTable(report),
  ];

  if (report.taxEstimate) {
    content.push(...taxEstimateSection(report.taxEstimate, sectionIndex++));
  }

  content.push(
    sectionHeading(
      sectionIndex++,
      "Summary Breakdown (แยกตามหมวด / แหล่งที่มา)",
      true,
    ),
    ...report.breakdownSections.map(breakdownTable),
    sectionHeading(sectionIndex++, "รายการรายรับ", true),
    incomeTable(report),
    sectionHeading(sectionIndex++, "รายการรายจ่าย", true),
    expenseTable(report),
    sectionHeading(sectionIndex++, "ภาษีหัก ณ ที่จ่าย", true),
    withholdingTable(report),
    sectionHeading(sectionIndex++, "ค่าลดหย่อน / ค่าลดภาษี", true),
    allowanceTable(report),
  );

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [
      HORIZONTAL_MARGIN,
      VERTICAL_MARGIN,
      HORIZONTAL_MARGIN,
      VERTICAL_MARGIN,
    ],
    defaultStyle: {
      font: "Sarabun",
      fontSize: TYPE_SCALE.body,
      lineHeight: 1.5,
      color: COLORS.black,
    },
    styles,
    info: {
      title: report.title,
      author: "JAI MAI WAI LAEW",
      subject: "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย",
      creationDate: report.generatedAt,
    },
    background: (_currentPage, pageSize) => ({
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: pageSize.width,
          h: pageSize.height,
          color: COLORS.white,
        },
      ],
    }),
    watermark: {
      text: WATERMARK_TEXT,
      color: COLORS.black,
      opacity: 0.06,
      angle: -38,
    },
    header: (currentPage) =>
      currentPage === 1
        ? { text: "" }
        : {
            margin: [HORIZONTAL_MARGIN, 22, HORIZONTAL_MARGIN, 0],
            stack: [
              {
                columns: [
                  {
                    text: "JAI MAI WAI LAEW",
                    bold: true,
                    fontSize: TYPE_SCALE.body,
                  },
                  {
                    text: report.title,
                    alignment: "right",
                    fontSize: TYPE_SCALE.taxStatus,
                  },
                ],
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: CONTENT_WIDTH,
                    y2: 0,
                    lineWidth: 0.5,
                    lineColor: COLORS.darkGray,
                  },
                ],
                margin: [0, 5, 0, 0],
              },
            ],
          },
    footer: (currentPage, pageCount) => ({
      margin: [HORIZONTAL_MARGIN, 3, HORIZONTAL_MARGIN, 0],
      stack: [
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: CONTENT_WIDTH,
              y2: 0,
              lineWidth: 0.5,
              lineColor: COLORS.darkGray,
            },
          ],
          margin: [0, 0, 0, 3],
        },
        {
          text: disclaimerText,
          alignment: "center",
          italics: true,
          fontSize: TYPE_SCALE.footer,
          lineHeight: 1.5,
          margin: [0, 0, 0, 2],
        },
        {
          columns: [
            { text: "", width: 92 },
            {
              text: report.generatedAtLabel,
              alignment: "center",
              fontSize: TYPE_SCALE.footer,
            },
            {
              text: `หน้า ${currentPage} จาก ${pageCount}`,
              width: 92,
              alignment: "right",
              fontSize: TYPE_SCALE.footer,
            },
          ],
        },
      ],
    }),
    content,
  };
}

export function buildProfessionalPdfFileName(
  report: LocalPdfReportModel,
): string {
  return `รายงานสรุปรายรับรายจ่าย-${report.taxYearBE}-${report.generatedAtFileStamp}.pdf`;
}
