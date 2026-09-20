"use client";

import { FileArchive, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import { createLocalCsvBundleArtifact } from "@/export/create-local-csv-bundle";
import { createLocalXlsxArtifact } from "@/export/create-local-xlsx";
import { downloadLocalArtifact } from "@/export/download-local-artifact";
import { buildLocalTabularReportModel } from "@/export/local-tabular-report";

import { Button } from "../ui/button";

type ExportStatus =
  | "idle"
  | "preparing-excel"
  | "preparing-csv"
  | "excel-downloaded"
  | "csv-downloaded"
  | "error";

export function TabularExportButtons({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const isPreparing =
    status === "preparing-excel" || status === "preparing-csv";

  function handleExcelExport() {
    setStatus("preparing-excel");

    try {
      const report = buildLocalTabularReportModel(workspace, {
        generatedAt: new Date(),
      });
      downloadLocalArtifact(createLocalXlsxArtifact(report));
      setStatus("excel-downloaded");
    } catch {
      setStatus("error");
    }
  }

  function handleCsvExport() {
    setStatus("preparing-csv");

    try {
      const report = buildLocalTabularReportModel(workspace, {
        generatedAt: new Date(),
      });
      downloadLocalArtifact(createLocalCsvBundleArtifact(report));
      setStatus("csv-downloaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="contents">
      <Button
        disabled={isPreparing}
        onClick={handleExcelExport}
        type="button"
        variant="secondary"
      >
        <FileSpreadsheet aria-hidden="true" className="size-4" />
        {status === "preparing-excel" ? "กำลังสร้าง Excel…" : "ส่งออก Excel"}
      </Button>
      <Button
        disabled={isPreparing}
        onClick={handleCsvExport}
        type="button"
        variant="secondary"
      >
        <FileArchive aria-hidden="true" className="size-4" />
        {status === "preparing-csv" ? "กำลังสร้าง CSV…" : "ส่งออก CSV"}
      </Button>
      <span aria-live="polite" className="text-muted-foreground text-sm">
        {status === "excel-downloaded"
          ? "ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว"
          : status === "csv-downloaded"
            ? "ดาวน์โหลดชุดไฟล์ CSV เรียบร้อยแล้ว"
            : status === "error"
              ? "ไม่สามารถสร้างไฟล์ได้ โปรดลองอีกครั้ง"
              : null}
      </span>
    </div>
  );
}
