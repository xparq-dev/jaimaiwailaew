"use client";

import { FileDown } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import { buildLocalPdfReportModel } from "@/pdf/local-pdf-report";

import { Button } from "../ui/button";

const DEFAULT_REPORT_TITLE = "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย";

type ExportStatus = "idle" | "preparing" | "ready" | "error";

export function PdfExportPanel({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [reportName, setReportName] = useState(
    workspace.reportName ?? DEFAULT_REPORT_TITLE,
  );
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<ExportStatus>("idle");

  async function handleExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("preparing");

    try {
      const report = buildLocalPdfReportModel(workspace, {
        generatedAt: new Date(),
        reportName,
        displayName,
      });
      const { downloadLocalPdf } = await import("@/pdf/download-local-pdf");
      await downloadLocalPdf(report);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
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
            ภาษาไทยที่จัดหน้าเรียบร้อยและดาวน์โหลดลงอุปกรณ์นี้โดยตรง
            ไม่มีหัวกระดาษหรือ URL จากเบราว์เซอร์
            และไม่ส่งข้อมูลการเงินออกภายนอก
          </p>
        </div>
        <span className="bg-success-soft text-success-strong inline-flex rounded-full px-3 py-1 text-xs font-medium">
          สร้างในอุปกรณ์นี้
        </span>
      </div>

      <form className="mt-4 grid gap-4" onSubmit={handleExport}>
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
            <FileDown aria-hidden="true" className="size-4" />
            {status === "preparing" ? "กำลังสร้างเอกสาร…" : "ดาวน์โหลด PDF"}
          </Button>
          <p aria-live="polite" className="text-muted-foreground text-sm">
            {status === "ready"
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
    </section>
  );
}
