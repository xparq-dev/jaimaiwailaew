import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LocalExportHistoryPanel } from "../local-export-history-panel";

const record = {
  format: "xlsx" as const,
  reportReference: "JMWL-20261004-120000-123",
  periodLabel: "1 ม.ค. 2569 – 31 ธ.ค. 2569",
  templateLabel: "ฉบับเต็ม",
  downloadedAt: "2026-10-04T05:00:01.000Z",
};

describe("LocalExportHistoryPanel", () => {
  it("shows metadata-only history and requires confirmation before clearing", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <LocalExportHistoryPanel
        loaded
        onClear={onClear}
        records={[record]}
        storageError={false}
      />,
    );

    await user.click(screen.getByText("ประวัติการดาวน์โหลดในอุปกรณ์นี้"));
    expect(screen.getByText("JMWL-20261004-120000-123")).toBeVisible();
    expect(screen.getByText("Excel")).toBeVisible();
    expect(
      screen.queryByText(/จำนวนเงิน|ชื่อผู้จัดทำ/u),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ล้างประวัติ" }));
    expect(onClear).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "ยืนยันล้างประวัติ" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("explains empty and storage-error recovery states", async () => {
    const user = userEvent.setup();
    render(
      <LocalExportHistoryPanel
        loaded
        onClear={vi.fn()}
        records={[]}
        storageError
      />,
    );

    await user.click(screen.getByText("ประวัติการดาวน์โหลดในอุปกรณ์นี้"));
    expect(
      screen.getByText(/ยังไม่มีประวัติ ระบบจะบันทึกเมื่อคุณกดดาวน์โหลด/u),
    ).toBeVisible();
    expect(
      screen.getByText(/บันทึกประวัติในอุปกรณ์นี้ไม่สำเร็จ/u),
    ).toBeVisible();
  });
});
