import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";

import { PdfExportPanel } from "../pdf-export-panel";

beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
});

describe("PdfExportPanel", () => {
  it("prepares the Thai A4 report locally and opens the print dialog", async () => {
    const user = userEvent.setup();
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const initialUrl = window.location.href;
    const initialTitle = document.title;

    render(<PdfExportPanel workspace={workspace} />);

    expect(
      screen.getByRole("heading", { name: "สร้าง PDF ในอุปกรณ์นี้" }),
    ).toBeVisible();
    await user.clear(
      screen.getByRole("textbox", { name: "ชื่อรายงาน (ไม่บังคับ)" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "ชื่อรายงาน (ไม่บังคับ)" }),
      "รายงานส่วนตัว",
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "ชื่อที่ต้องการแสดงในรายงาน (ไม่บังคับ)",
      }),
      "ผู้ใช้ตัวอย่าง",
    );
    await user.click(screen.getByRole("button", { name: "สร้าง PDF" }));

    await waitFor(() => expect(printSpy).toHaveBeenCalledOnce());
    expect(
      screen.getByText("เปิดหน้าต่างพิมพ์แล้ว โปรดเลือกบันทึกเป็น PDF"),
    ).toBeVisible();
    const report = screen.getByTestId("local-pdf-report");
    expect(report).toHaveTextContent("รายงานส่วนตัว");
    expect(report).toHaveTextContent("ผู้ใช้ตัวอย่าง");
    expect(report).toHaveTextContent("Tax estimate unavailable");
    expect(report).toHaveTextContent("fail-closed");
    expect(report).toHaveTextContent("ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
    expect(document.title).toBe(initialTitle);
  });
});
