"use client";

import { Download, FileSearch, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import {
  clearLocalExportHistory,
  readLocalExportHistory,
  recordLocalExportHistory,
  type LocalExportHistoryCandidate,
  type LocalExportHistoryRecord,
} from "@/export/local-export-history";
import type { LocalPdfArtifact } from "@/pdf/download-local-pdf";
import { buildLocalPdfReportModel } from "@/pdf/local-pdf-report";
import {
  buildReportPeriodOptions,
  createReportWorkspace,
} from "@/report/report-period";
import {
  getReportTemplate,
  REPORT_TEMPLATE_OPTIONS,
  type ReportTemplateId,
} from "@/report/report-template";

import { Button } from "../ui/button";
import { LocalExportHistoryPanel } from "./local-export-history-panel";
import { TabularExportButtons } from "./tabular-export-buttons";

const DEFAULT_REPORT_TITLE = "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย";

type ExportStatus =
  "idle" | "preparing" | "preview-ready" | "downloaded" | "error";

interface PdfPreview {
  readonly artifact: LocalPdfArtifact;
  readonly periodLabel: string;
  readonly reportReference: string;
  readonly templateLabel: string;
  readonly url: string;
}

export function PdfExportPanel({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [reportName, setReportName] = useState(
    workspace.reportName ?? DEFAULT_REPORT_TITLE,
  );
  const [displayName, setDisplayName] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("workspace");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<ReportTemplateId>("full");
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [preview, setPreview] = useState<PdfPreview | null>(null);
  const [exportHistory, setExportHistory] = useState<
    readonly LocalExportHistoryRecord[]
  >([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyStorageError, setHistoryStorageError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const periodOptions = useMemo(
    () => buildReportPeriodOptions(workspace),
    [workspace],
  );
  const selectedPeriod =
    periodOptions.find((period) => period.id === selectedPeriodId) ??
    periodOptions[0]!;
  const reportWorkspace = useMemo(
    () => createReportWorkspace(workspace, selectedPeriod),
    [selectedPeriod, workspace],
  );
  const selectedTemplate = getReportTemplate(selectedTemplateId);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) {
        return;
      }
      const result = readLocalExportHistory(window.localStorage);
      setExportHistory(result.records);
      setHistoryStorageError(!result.persisted);
      setHistoryLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!preview) {
      return;
    }

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("preparing");

    try {
      const report = buildLocalPdfReportModel(reportWorkspace, {
        generatedAt: new Date(),
        reportName,
        displayName,
        includeTaxEstimate: selectedPeriod.isWorkspacePeriod,
        reportTemplate: selectedTemplate,
      });
      const { createLocalPdfArtifact } =
        await import("@/pdf/download-local-pdf");
      const artifact = await createLocalPdfArtifact(report);
      setPreview({
        artifact,
        periodLabel: report.periodLabel,
        reportReference: report.reportReference,
        templateLabel: report.templateLabel,
        url: URL.createObjectURL(artifact.blob),
      });
      setStatus("preview-ready");
    } catch {
      setStatus("error");
    }
  }

  async function handleDownload() {
    if (!preview) {
      return;
    }

    try {
      const { downloadLocalPdfArtifact } =
        await import("@/pdf/download-local-pdf");
      downloadLocalPdfArtifact(preview.artifact);
      recordDownload({
        format: "pdf",
        reportReference: preview.reportReference,
        periodLabel: preview.periodLabel,
        templateLabel: preview.templateLabel,
      });
      setStatus("downloaded");
    } catch {
      setStatus("error");
    }
  }

  function closePreview() {
    dialogRef.current?.close();
  }

  function recordDownload(candidate: LocalExportHistoryCandidate) {
    const result = recordLocalExportHistory(
      window.localStorage,
      candidate,
      new Date(),
    );
    setExportHistory(result.records);
    setHistoryStorageError(!result.persisted);
  }

  function clearExportHistory() {
    const cleared = clearLocalExportHistory(window.localStorage);
    if (cleared) {
      setExportHistory([]);
    }
    setHistoryStorageError(!cleared);
  }

  return (
    <section
      aria-labelledby="pdf-export-title"
      className="border-border bg-card rounded-2xl border p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold" id="pdf-export-title">
            ดาวน์โหลดรายงาน PDF
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            สร้างเอกสาร A4
            ภาษาไทยที่จัดหน้าเรียบร้อยให้ตรวจสอบตัวอย่างก่อนดาวน์โหลดลงอุปกรณ์นี้
            ไม่มีหัวกระดาษหรือ URL จากเบราว์เซอร์
            และไม่ส่งข้อมูลการเงินออกภายนอก
          </p>
        </div>
        <span className="bg-success-soft text-success-strong inline-flex rounded-full px-3 py-1 text-xs font-medium">
          สร้างในอุปกรณ์นี้
        </span>
      </div>

      <form className="mt-4 grid gap-4" onSubmit={handlePreview}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            ช่วงรายงาน
            <select
              className="border-border bg-background focus-visible:ring-focus/35 min-h-11 w-full min-w-0 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
              onChange={(event) => setSelectedPeriodId(event.target.value)}
              value={selectedPeriod.id}
            >
              {periodOptions.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs leading-5 font-normal">
              PDF, Excel และ CSV จะใช้ช่วงเดียวกัน
            </span>
          </label>

          <label className="grid min-w-0 gap-2 text-sm font-medium">
            รูปแบบรายงาน
            <select
              className="border-border bg-background focus-visible:ring-focus/35 min-h-11 w-full min-w-0 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
              onChange={(event) =>
                setSelectedTemplateId(event.target.value as ReportTemplateId)
              }
              value={selectedTemplate.id}
            >
              {REPORT_TEMPLATE_OPTIONS.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs leading-5 font-normal">
              {selectedTemplate.description}
            </span>
          </label>
        </div>

        {!selectedPeriod.isWorkspacePeriod ? (
          <div className="border-border bg-muted/50 rounded-xl border px-4 py-3 text-sm leading-6">
            รายงานช่วงย่อยจะแสดงเฉพาะรายการและยอดรวมในช่วงที่เลือก
            โดยไม่แสดงค่าลดหย่อนรวมและประมาณการภาษีของชุดข้อมูลทั้งหมด
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            ชื่อรายงาน (ไม่บังคับ)
            <input
              className="border-border bg-background focus-visible:ring-focus/35 min-h-11 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
              maxLength={100}
              onChange={(event) => setReportName(event.target.value)}
              value={reportName}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            ชื่อผู้จัดทำ (ไม่บังคับ)
            <input
              autoComplete="off"
              className="border-border bg-background focus-visible:ring-focus/35 min-h-11 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
              maxLength={100}
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={status === "preparing"} type="submit">
            <FileSearch aria-hidden="true" className="size-4" />
            {status === "preparing" ? "กำลังสร้างตัวอย่าง…" : "ดูตัวอย่าง PDF"}
          </Button>
          <TabularExportButtons
            includeTaxEstimate={selectedPeriod.isWorkspacePeriod}
            onDownload={recordDownload}
            reportTemplate={selectedTemplate}
            workspace={reportWorkspace}
          />
          <p aria-live="polite" className="text-muted-foreground text-sm">
            {status === "preview-ready"
              ? "สร้างตัวอย่าง PDF เรียบร้อยแล้ว"
              : status === "downloaded"
                ? "ดาวน์โหลดรายงานเรียบร้อยแล้ว"
                : status === "error"
                  ? "ไม่สามารถสร้างรายงานได้ โปรดลองอีกครั้ง"
                  : null}
          </p>
        </div>
      </form>

      <p className="text-muted-foreground mt-4 text-xs leading-5">
        เอกสารประกอบด้วยข้อมูลที่ใช้ตรวจสอบรายการและยอดรวมเท่านั้น
        ไม่รวมหมายเหตุส่วนตัว ข้อมูลระบบภายใน หรือผลคำนวณภาษี
        และไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ
      </p>
      <p className="text-muted-foreground mt-2 text-xs leading-5">
        ไฟล์ Excel แยกข้อมูลเป็นหลาย Sheet ส่วน CSV จะดาวน์โหลดเป็น ZIP
        ที่มีไฟล์ CSV แยกตามประเภท ข้อมูลทั้งหมดสร้างจาก Local Storage
        ภายในอุปกรณ์นี้โดยไม่ส่งออกเครือข่าย
      </p>

      <LocalExportHistoryPanel
        loaded={historyLoaded}
        onClear={clearExportHistory}
        records={exportHistory}
        storageError={historyStorageError}
      />

      <dialog
        aria-labelledby="pdf-preview-title"
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
              <h2 className="font-bold" id="pdf-preview-title">
                ตัวอย่างรายงาน PDF
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                ตรวจสอบเอกสารจริงก่อนดาวน์โหลด ไฟล์ยังอยู่ในอุปกรณ์นี้เท่านั้น
              </p>
              {preview ? (
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  เลขอ้างอิงรายงาน: {preview.reportReference}
                </p>
              ) : null}
            </div>
            <Button
              aria-label="ปิดตัวอย่าง PDF"
              onClick={closePreview}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div className="bg-muted min-h-0 flex-1 p-2 sm:p-4">
            {preview ? (
              <iframe
                className="h-full min-h-80 w-full rounded-lg bg-white"
                src={preview.url}
                title="ตัวอย่างรายงาน PDF"
              />
            ) : null}
          </div>

          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
            <p aria-live="polite" className="text-muted-foreground text-xs">
              {status === "downloaded"
                ? "ดาวน์โหลดรายงานเรียบร้อยแล้ว"
                : "หากข้อมูลถูกต้อง สามารถดาวน์โหลดไฟล์ PDF ได้"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={closePreview} type="button" variant="secondary">
                ปิดตัวอย่าง
              </Button>
              <Button onClick={handleDownload} type="button">
                <Download aria-hidden="true" className="size-4" />
                ดาวน์โหลด PDF
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
