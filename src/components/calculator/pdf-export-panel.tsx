"use client";

import { Download, FileSearch, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import type { LocalPdfArtifact } from "@/pdf/download-local-pdf";
import { buildLocalPdfReportModel } from "@/pdf/local-pdf-report";

import { Button } from "../ui/button";

const DEFAULT_REPORT_TITLE = "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย";

type ExportStatus =
  "idle" | "preparing" | "preview-ready" | "downloaded" | "error";

interface PdfPreview {
  readonly artifact: LocalPdfArtifact;
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
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [preview, setPreview] = useState<PdfPreview | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      const report = buildLocalPdfReportModel(workspace, {
        generatedAt: new Date(),
        reportName,
        displayName,
      });
      const { createLocalPdfArtifact } =
        await import("@/pdf/download-local-pdf");
      const artifact = await createLocalPdfArtifact(report);
      setPreview({ artifact, url: URL.createObjectURL(artifact.blob) });
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
      setStatus("downloaded");
    } catch {
      setStatus("error");
    }
  }

  function closePreview() {
    dialogRef.current?.close();
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
