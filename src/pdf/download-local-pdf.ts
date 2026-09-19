import type { LocalPdfReportModel } from "@/pdf/local-pdf-report";

import {
  buildProfessionalPdfDocument,
  buildProfessionalPdfFileName,
} from "./professional-pdf-document";
import { sarabunVfs } from "./fonts/sarabun-vfs";

export interface LocalPdfArtifact {
  readonly blob: Blob;
  readonly fileName: string;
}

export async function createLocalPdfArtifact(
  report: LocalPdfReportModel,
): Promise<LocalPdfArtifact> {
  const importedPdfMake = await import("pdfmake/build/pdfmake.js");
  const pdfMake = importedPdfMake.default;

  pdfMake.addVirtualFileSystem(sarabunVfs);
  pdfMake.addFonts({
    Sarabun: {
      normal: "Sarabun-Regular.ttf",
      bold: "Sarabun-SemiBold.ttf",
      italics: "Sarabun-Italic.ttf",
      bolditalics: "Sarabun-SemiBoldItalic.ttf",
    },
  });

  const blob = await pdfMake
    .createPdf(buildProfessionalPdfDocument(report))
    .getBlob();

  return {
    blob,
    fileName: buildProfessionalPdfFileName(report),
  };
}

export function downloadLocalPdfArtifact(artifact: LocalPdfArtifact): void {
  const downloadUrl = URL.createObjectURL(artifact.blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = artifact.fileName;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}

export async function downloadLocalPdf(
  report: LocalPdfReportModel,
): Promise<void> {
  downloadLocalPdfArtifact(await createLocalPdfArtifact(report));
}
