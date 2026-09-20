"use client";

import { Download, FileArchive, FileSpreadsheet, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import { createLocalCsvBundleArtifact } from "@/export/create-local-csv-bundle";
import { createLocalXlsxArtifact } from "@/export/create-local-xlsx";
import {
  downloadLocalArtifact,
  type LocalDownloadArtifact,
} from "@/export/download-local-artifact";
import {
  buildLocalTabularReportModel,
  type LocalTabularReportModel,
} from "@/export/local-tabular-report";

import { Button } from "../ui/button";

type ExportFormat = "excel" | "csv";
type PreviewCell = string | number;

interface PreviewState {
  readonly format: ExportFormat;
  readonly report: LocalTabularReportModel;
  readonly artifact: LocalDownloadArtifact;
}

interface PreviewSection {
  readonly id: string;
  readonly title: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly PreviewCell[])[];
}

const amountFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPreviewCell(value: PreviewCell, header: string): string {
  if (typeof value !== "number") {
    return value;
  }

  if (header.includes("จำนวนเงิน") || header.includes("ยอดรวม")) {
    return amountFormatter.format(value);
  }

  if (header.includes("สัดส่วน")) {
    return value.toFixed(2);
  }

  return String(value);
}

function buildPreviewSections(
  report: LocalTabularReportModel,
): readonly PreviewSection[] {
  const sections: PreviewSection[] = [
    {
      id: "summary",
      title: "Summary",
      headers: ["รายการ", "จำนวนเงิน (บาท)"],
      rows: report.summaryRows.map((row) => [row.label, row.amountBaht]),
    },
    {
      id: "income",
      title: "Income",
      headers: ["วันที่", "แหล่งที่มา", "หมวดหมู่", "จำนวนเงิน (บาท)"],
      rows: report.incomeRows.map((row) => [
        row.period,
        row.source,
        row.category,
        row.amountBaht,
      ]),
    },
    {
      id: "expense",
      title: "Expense",
      headers: ["วันที่", "หมวดหมู่", "จำนวนเงิน (บาท)"],
      rows: report.expenseRows.map((row) => [
        row.period,
        row.category,
        row.amountBaht,
      ]),
    },
  ];

  if (report.withholdingRows.length > 0) {
    sections.push({
      id: "withholding",
      title: "Withholding Tax",
      headers: ["วันที่", "แหล่งที่มา", "จำนวนเงิน (บาท)"],
      rows: report.withholdingRows.map((row) => [
        row.period,
        row.source,
        row.amountBaht,
      ]),
    });
  }

  if (report.deductionRows.length > 0) {
    sections.push({
      id: "deductions",
      title: "Deductions",
      headers: ["ประเภท", "จำนวนเงิน (บาท)"],
      rows: report.deductionRows.map((row) => [row.type, row.amountBaht]),
    });
  }

  sections.push({
    id: "breakdown",
    title: "Breakdown",
    headers: ["ประเภท", "กลุ่ม", "จำนวนรายการ", "ยอดรวม (บาท)", "สัดส่วน (%)"],
    rows: report.breakdownRows.map((row) => [
      row.type,
      row.group,
      row.entryCount,
      row.totalBaht,
      row.percentage,
    ]),
  });

  return sections;
}

export function TabularExportButtons({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("summary");
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sections = useMemo(
    () => (preview ? buildPreviewSections(preview.report) : []),
    [preview],
  );
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  useEffect(() => {
    if (!preview) {
      return;
    }

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [preview]);

  function handlePreview(format: ExportFormat) {
    setDownloaded(false);
    setError(false);

    try {
      const report = buildLocalTabularReportModel(workspace, {
        generatedAt: new Date(),
      });
      const artifact =
        format === "excel"
          ? createLocalXlsxArtifact(report)
          : createLocalCsvBundleArtifact(report);

      setActiveSectionId("summary");
      setPreview({ format, report, artifact });
    } catch {
      setError(true);
    }
  }

  function handleDownload() {
    if (!preview) {
      return;
    }

    try {
      downloadLocalArtifact(preview.artifact);
      setDownloaded(true);
    } catch {
      setError(true);
    }
  }

  function closePreview() {
    dialogRef.current?.close();
  }

  const previewFormatLabel = preview?.format === "csv" ? "CSV" : "Excel";

  return (
    <div className="contents">
      <Button
        onClick={() => handlePreview("excel")}
        type="button"
        variant="secondary"
      >
        <FileSpreadsheet aria-hidden="true" className="size-4" />
        ส่งออก Excel
      </Button>
      <Button
        onClick={() => handlePreview("csv")}
        type="button"
        variant="secondary"
      >
        <FileArchive aria-hidden="true" className="size-4" />
        ส่งออก CSV
      </Button>
      <span aria-live="polite" className="text-muted-foreground text-sm">
        {error ? "ไม่สามารถสร้างตัวอย่างไฟล์ได้ โปรดลองอีกครั้ง" : null}
      </span>

      <dialog
        aria-labelledby="tabular-preview-title"
        aria-modal="true"
        className="border-border bg-card text-foreground m-auto h-[min(92vh,64rem)] w-[min(96vw,72rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/60"
        onCancel={(event) => {
          event.preventDefault();
          closePreview();
        }}
        onClose={() => setPreview(null)}
        ref={dialogRef}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-bold" id="tabular-preview-title">
                ตัวอย่างรายงาน {previewFormatLabel}
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                ตรวจข้อมูลแต่ละ {preview?.format === "csv" ? "ไฟล์" : "Sheet"}
                ก่อนดาวน์โหลด ไฟล์ยังอยู่ในอุปกรณ์นี้เท่านั้น
              </p>
            </div>
            <Button
              aria-label={`ปิดตัวอย่าง ${previewFormatLabel}`}
              onClick={closePreview}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div
            className="border-border flex gap-2 overflow-x-auto border-b px-4 py-3 sm:px-5"
            role="tablist"
          >
            {sections.map((section) => (
              <button
                aria-controls={`tabular-panel-${section.id}`}
                aria-selected={activeSection?.id === section.id}
                className={`min-h-10 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  activeSection?.id === section.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
                id={`tabular-tab-${section.id}`}
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                role="tab"
                type="button"
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="bg-muted/40 min-h-0 flex-1 overflow-auto p-3 sm:p-5">
            {activeSection ? (
              <section
                aria-labelledby={`tabular-tab-${activeSection.id}`}
                className="border-border bg-background min-w-max rounded-xl border"
                id={`tabular-panel-${activeSection.id}`}
                role="tabpanel"
              >
                <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <h3 className="font-semibold">{activeSection.title}</h3>
                  <span className="text-muted-foreground text-xs">
                    {activeSection.rows.length} รายการ
                  </span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {activeSection.headers.map((header) => (
                        <th
                          className="border-border border-b px-4 py-3 text-left font-semibold whitespace-nowrap"
                          key={header}
                          scope="col"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSection.rows.length > 0 ? (
                      activeSection.rows.map((row, rowIndex) => (
                        <tr
                          className="border-border border-b last:border-b-0"
                          key={rowIndex}
                        >
                          {row.map((cell, cellIndex) => {
                            const header =
                              activeSection.headers[cellIndex] ?? "";
                            const numeric = typeof cell === "number";
                            return (
                              <td
                                className={`px-4 py-3 ${numeric ? "text-right tabular-nums" : "text-left"}`}
                                key={cellIndex}
                              >
                                {formatPreviewCell(cell, header)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="text-muted-foreground px-4 py-8 text-center"
                          colSpan={activeSection.headers.length}
                        >
                          ไม่มีรายการในช่วงเวลานี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {activeSection.id === "summary" && preview ? (
                  <dl className="border-border grid gap-2 border-t px-4 py-3 text-xs sm:grid-cols-[max-content_1fr]">
                    <dt className="font-semibold">วันที่/เวลาที่ส่งออก</dt>
                    <dd>{preview.report.generatedAtLabel}</dd>
                    <dt className="font-semibold">Tax Rule Status</dt>
                    <dd>{preview.report.taxRuleStatus}</dd>
                    <dt className="font-semibold">หมายเหตุ</dt>
                    <dd>{preview.report.disclaimer}</dd>
                  </dl>
                ) : null}
              </section>
            ) : null}
          </div>

          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
            <p aria-live="polite" className="text-muted-foreground text-xs">
              {downloaded
                ? `ดาวน์โหลดไฟล์ ${previewFormatLabel} เรียบร้อยแล้ว`
                : preview?.format === "csv"
                  ? "เมื่อดาวน์โหลดจะได้รับ ZIP ที่มี CSV แยกตามประเภท"
                  : "เมื่อดาวน์โหลดจะได้รับ Excel ที่แยกข้อมูลเป็นหลาย Sheet"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={closePreview} type="button" variant="secondary">
                ปิดตัวอย่าง
              </Button>
              <Button onClick={handleDownload} type="button">
                <Download aria-hidden="true" className="size-4" />
                ดาวน์โหลด {previewFormatLabel}
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
