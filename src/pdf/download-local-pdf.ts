import type { LocalPdfReportModel } from "@/pdf/local-pdf-report";

import {
  buildProfessionalPdfDocument,
  buildProfessionalPdfFileName,
} from "./professional-pdf-document";
import { sarabunVfs } from "./fonts/sarabun-vfs";

export async function downloadLocalPdf(
  report: LocalPdfReportModel,
): Promise<void> {
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

  await pdfMake
    .createPdf(buildProfessionalPdfDocument(report))
    .download(buildProfessionalPdfFileName(report));
}
