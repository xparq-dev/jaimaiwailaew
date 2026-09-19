import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";

import { PdfExportPanel } from "../pdf-export-panel";

const downloadLocalPdfMock = vi.hoisted(() =>
  vi.fn<(report: unknown) => Promise<void>>().mockResolvedValue(undefined),
);

vi.mock("@/pdf/download-local-pdf", () => ({
  downloadLocalPdf: downloadLocalPdfMock,
}));

describe("PdfExportPanel", () => {
  it("downloads a local report without network, storage, or URL changes", async () => {
    const user = userEvent.setup();
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const initialUrl = window.location.href;

    render(<PdfExportPanel workspace={workspace} />);

    expect(
      screen.getByRole("heading", { name: "ดาวน์โหลดรายงาน PDF" }),
    ).toBeVisible();
    expect(
      screen.getByText(/ไม่รวมหมายเหตุส่วนตัว ข้อมูลระบบภายใน/),
    ).toBeVisible();

    await user.clear(
      screen.getByRole("textbox", { name: "ชื่อรายงาน (ไม่บังคับ)" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "ชื่อรายงาน (ไม่บังคับ)" }),
      "รายงานสำหรับประชุม",
    );
    await user.type(
      screen.getByRole("textbox", { name: "ชื่อผู้จัดทำ (ไม่บังคับ)" }),
      "ผู้ใช้ตัวอย่าง",
    );
    await user.click(screen.getByRole("button", { name: "ดาวน์โหลด PDF" }));

    await waitFor(() => expect(downloadLocalPdfMock).toHaveBeenCalledOnce());
    expect(downloadLocalPdfMock.mock.calls[0]?.[0]).toMatchObject({
      title: "รายงานสำหรับประชุม",
      displayName: "ผู้ใช้ตัวอย่าง",
      taxYearBE: 2569,
    });
    expect(screen.getByText("ดาวน์โหลดรายงานเรียบร้อยแล้ว")).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
  });
});
