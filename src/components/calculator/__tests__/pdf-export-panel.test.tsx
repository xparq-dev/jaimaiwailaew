import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";

import { PdfExportPanel } from "../pdf-export-panel";

const createLocalPdfArtifactMock = vi.hoisted(() => vi.fn());
const downloadLocalPdfArtifactMock = vi.hoisted(() => vi.fn());
const createObjectUrlMock = vi.hoisted(() =>
  vi.fn(() => "blob:local-pdf-preview"),
);
const revokeObjectUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@/pdf/download-local-pdf", () => ({
  createLocalPdfArtifact: createLocalPdfArtifactMock,
  downloadLocalPdfArtifact: downloadLocalPdfArtifactMock,
}));

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectUrlMock,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectUrlMock,
  });
});

beforeEach(() => {
  createLocalPdfArtifactMock.mockReset();
  downloadLocalPdfArtifactMock.mockReset();
  createObjectUrlMock.mockClear();
  revokeObjectUrlMock.mockClear();
});

describe("PdfExportPanel", () => {
  it("previews the local report before downloading without network, storage, or URL changes", async () => {
    const user = userEvent.setup();
    const artifact = {
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
      fileName: "รายงาน.pdf",
    };
    createLocalPdfArtifactMock.mockResolvedValue(artifact);
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
      screen.getByText(/ไม่รวมหมายเหตุส่วนตัว ข้อมูลระบบภายใน หรือผลคำนวณภาษี/),
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
    await user.click(screen.getByRole("button", { name: "ดูตัวอย่าง PDF" }));

    await waitFor(() =>
      expect(createLocalPdfArtifactMock).toHaveBeenCalledOnce(),
    );
    expect(createLocalPdfArtifactMock.mock.calls[0]?.[0]).toMatchObject({
      title: "รายงานสำหรับประชุม",
      displayName: "ผู้ใช้ตัวอย่าง",
      taxYearBE: 2569,
    });
    expect(downloadLocalPdfArtifactMock).not.toHaveBeenCalled();
    expect(createObjectUrlMock).toHaveBeenCalledWith(artifact.blob);

    const previewDialog = await screen.findByRole("dialog", {
      name: "ตัวอย่างรายงาน PDF",
    });
    expect(previewDialog).toBeVisible();
    expect(
      screen.getByTitle<HTMLIFrameElement>("ตัวอย่างรายงาน PDF"),
    ).toHaveAttribute("src", "blob:local-pdf-preview");

    await user.click(screen.getByRole("button", { name: "ดาวน์โหลด PDF" }));
    expect(downloadLocalPdfArtifactMock).toHaveBeenCalledWith(artifact);
    expect(
      screen.getAllByText("ดาวน์โหลดรายงานเรียบร้อยแล้ว"),
    ).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "ปิดตัวอย่าง" }));
    await waitFor(() =>
      expect(revokeObjectUrlMock).toHaveBeenCalledWith(
        "blob:local-pdf-preview",
      ),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
  });
});
