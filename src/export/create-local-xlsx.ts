import { strToU8, zipSync } from "fflate";

import type { LocalDownloadArtifact } from "./download-local-artifact";
import type { LocalTabularReportModel } from "./local-tabular-report";

type CellValue = string | number;

interface SheetDefinition {
  readonly name: string;
  readonly rows: readonly (readonly CellValue[])[];
  readonly columnWidths: readonly number[];
  readonly amountColumns?: readonly number[];
  readonly percentageColumns?: readonly number[];
  readonly metadataStartRow?: number;
}

const CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function protectSpreadsheetText(value: string): string {
  return /^[=+\-@\t\r]/u.test(value) ? `'${value}` : value;
}

function columnName(index: number): string {
  let current = index + 1;
  let result = "";

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }

  return result;
}

function cellXml(
  value: CellValue,
  rowIndex: number,
  columnIndex: number,
  sheet: SheetDefinition,
): string {
  const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
  const isHeader = rowIndex === 0;
  const isMetadataLabel =
    sheet.metadataStartRow !== undefined &&
    rowIndex >= sheet.metadataStartRow &&
    columnIndex === 0;
  const isAmount = sheet.amountColumns?.includes(columnIndex) ?? false;
  const isPercentage = sheet.percentageColumns?.includes(columnIndex) ?? false;
  const style = isHeader
    ? 1
    : isMetadataLabel
      ? 4
      : isPercentage
        ? 3
        : isAmount
          ? 2
          : 0;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("XLSX export only supports finite numeric values.");
    }
    return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
  }

  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(protectSpreadsheetText(value))}</t></is></c>`;
}

function worksheetXml(sheet: SheetDefinition): string {
  const lastColumn = columnName(
    Math.max(0, ...sheet.rows.map((row) => row.length - 1)),
  );
  const lastRow = Math.max(1, sheet.rows.length);
  const columns = sheet.columnWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("");
  const rows = sheet.rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndex) =>
            cellXml(value, rowIndex, columnIndex, sheet),
          )
          .join("")}</row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${columns}</cols>
  <sheetData>${rows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

function buildSheets(
  report: LocalTabularReportModel,
): readonly SheetDefinition[] {
  const sheets: SheetDefinition[] = [
    {
      name: "Summary",
      rows: [
        ["รายการ", "จำนวนเงิน (บาท)"],
        ...report.summaryRows.map(
          (row) => [row.label, row.amountBaht] as const,
        ),
        ["", ""],
        ["วันที่/เวลาที่ส่งออก", report.generatedAtLabel],
        ["Tax Rule Status", report.taxRuleStatus],
        ["หมายเหตุ", report.disclaimer],
      ],
      columnWidths: [34, 66],
      amountColumns: [1],
      metadataStartRow: report.summaryRows.length + 2,
    },
    {
      name: "Income",
      rows: [
        ["วันที่", "แหล่งที่มา", "หมวดหมู่", "จำนวนเงิน (บาท)"],
        ...report.incomeRows.map((row) => [
          row.period,
          row.source,
          row.category,
          row.amountBaht,
        ]),
      ],
      columnWidths: [16, 28, 28, 20],
      amountColumns: [3],
    },
    {
      name: "Expense",
      rows: [
        ["วันที่", "หมวดหมู่", "จำนวนเงิน (บาท)"],
        ...report.expenseRows.map((row) => [
          row.period,
          row.category,
          row.amountBaht,
        ]),
      ],
      columnWidths: [16, 34, 20],
      amountColumns: [2],
    },
  ];

  if (report.withholdingRows.length > 0) {
    sheets.push({
      name: "Withholding Tax",
      rows: [
        ["วันที่", "แหล่งที่มา", "จำนวนเงิน (บาท)"],
        ...report.withholdingRows.map((row) => [
          row.period,
          row.source,
          row.amountBaht,
        ]),
      ],
      columnWidths: [16, 36, 20],
      amountColumns: [2],
    });
  }

  if (report.deductionRows.length > 0) {
    sheets.push({
      name: "Deductions",
      rows: [
        ["ประเภท", "จำนวนเงิน (บาท)"],
        ...report.deductionRows.map((row) => [row.type, row.amountBaht]),
      ],
      columnWidths: [42, 20],
      amountColumns: [1],
    });
  }

  sheets.push({
    name: "Breakdown",
    rows: [
      ["ประเภท", "กลุ่ม", "จำนวนรายการ", "ยอดรวม (บาท)", "สัดส่วน (%)"],
      ...report.breakdownRows.map((row) => [
        row.type,
        row.group,
        row.entryCount,
        row.totalBaht,
        row.percentage,
      ]),
    ],
    columnWidths: [34, 34, 16, 20, 16],
    amountColumns: [3],
    percentageColumns: [4],
  });

  if (report.taxEstimateRows && report.taxEstimateRows.length > 0) {
    sheets.push({
      name: "Tax Estimate",
      rows: [
        ["รายการ", "จำนวนเงิน (บาท)"],
        ...report.taxEstimateRows.map(
          (row) => [row.label, row.amountBaht] as const,
        ),
        ["", ""],
        [
          "หมายเหตุ",
          report.taxEstimateDisclaimer ??
            "การคำนวณภาษีเป็นเพียงประมาณการเบื้องต้น โปรดปรึกษาผู้เชี่ยวชาญหรือกรมสรรพากรก่อนยื่นภาษีจริง",
        ],
      ],
      columnWidths: [44, 22],
      amountColumns: [1],
      metadataStartRow: report.taxEstimateRows.length + 2,
    });
  }

  return sheets;
}

function workbookXml(sheets: readonly SheetDefinition[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("")}</sheets>
  <calcPr calcId="0" fullCalcOnLoad="1"/>
</workbook>`;
}

function workbookRelationshipsXml(sheetCount: number): string {
  const worksheetRelationships = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${worksheetRelationships}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypesXml(sheetCount: number): string {
  const worksheets = Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${worksheets}
</Types>`;
}

const ROOT_RELATIONSHIPS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Noto Sans Thai"/></font><font><b/><sz val="11"/><name val="Noto Sans Thai"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE6E6E6"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border/><border><left style="thin"><color rgb="FF666666"/></left><right style="thin"><color rgb="FF666666"/></right><top style="thin"><color rgb="FF666666"/></top><bottom style="thin"><color rgb="FF666666"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function appPropertiesXml(sheets: readonly SheetDefinition[]): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>JAI MAI WAI LAEW</Application>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets
    .map((sheet) => `<vt:lpstr>${escapeXml(sheet.name)}</vt:lpstr>`)
    .join("")}</vt:vector></TitlesOfParts>
</Properties>`;
}

function corePropertiesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>รายงานข้อมูลรายรับและค่าใช้จ่าย</dc:title><dc:creator>JAI MAI WAI LAEW</dc:creator><dc:description>เอกสารสำหรับจัดระเบียบข้อมูลส่วนตัว สร้างภายในอุปกรณ์</dc:description>
</cp:coreProperties>`;
}

export function createLocalXlsxArtifact(
  report: LocalTabularReportModel,
): LocalDownloadArtifact {
  const sheets = buildSheets(report);
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypesXml(sheets.length)),
    "_rels/.rels": strToU8(ROOT_RELATIONSHIPS_XML),
    "docProps/app.xml": strToU8(appPropertiesXml(sheets)),
    "docProps/core.xml": strToU8(corePropertiesXml()),
    "xl/workbook.xml": strToU8(workbookXml(sheets)),
    "xl/_rels/workbook.xml.rels": strToU8(
      workbookRelationshipsXml(sheets.length),
    ),
    "xl/styles.xml": strToU8(STYLES_XML),
  };

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(worksheetXml(sheet));
  });

  const bytes = zipSync(files, { level: 6 });

  return {
    blob: new Blob([bytes], { type: CONTENT_TYPE }),
    fileName: `รายงานข้อมูลรายรับรายจ่าย-${report.taxYearBE}-${report.generatedAtFileStamp}.xlsx`,
  };
}
