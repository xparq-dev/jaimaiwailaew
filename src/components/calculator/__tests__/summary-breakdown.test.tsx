import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ExpenseEntry, IncomeEntry } from "@/calculator/types";
import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";
import { toMoneySatang } from "@/tax/money";

import { SummaryBreakdown } from "../summary-breakdown";

const timestamp = "2026-01-01T00:00:00.000Z";

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
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createWorkspaceFixture() {
  const workspace = createCalculatorWorkspace(
    getDefaultWorkspaceInput("multiple_income", 2569, "full_year"),
  );
  const incomeEntries: readonly IncomeEntry[] = [
    {
      id: "income-missing-source",
      entryFrequency: "one_time",
      occurredOn: "2026-02-10",
      occurredMonth: null,
      categoryCode: "freelance_service",
      amountSatang: toMoneySatang(25_000_00),
      note: "งานออกแบบ",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "income-monthly",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-03",
      categoryCode: "salary",
      sourceName: "บริษัทตัวอย่าง",
      amountSatang: toMoneySatang(40_000_00),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const expenseEntries: readonly ExpenseEntry[] = [
    {
      id: "expense-monthly",
      entryFrequency: "monthly",
      occurredOn: null,
      occurredMonth: "2026-03",
      categoryCode: "utilities",
      taxRelevanceStatus: "needs_review",
      amountSatang: toMoneySatang(5_000_00),
      note: "ค่าอินเทอร์เน็ต",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  return { ...workspace, incomeEntries, expenseEntries };
}

describe("SummaryBreakdown", () => {
  it("renders all four sections, percentages, disclaimers, and the missing-source group", () => {
    render(<SummaryBreakdown workspace={createWorkspaceFixture()} />);

    for (const heading of [
      "รายรับตามแหล่งที่มา",
      "รายรับตามหมวดบันทึก",
      "รายจ่ายตามหมวดบันทึก",
      "รายจ่ายตามสถานะการจัดกลุ่ม",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }

    expect(screen.getByText("ไม่ระบุแหล่งที่มา")).toBeVisible();
    expect(screen.getAllByText(/%/).length).toBeGreaterThanOrEqual(4);
    expect(
      screen.getByText(
        "หมวดบันทึกนี้ใช้เพื่อจัดระเบียบข้อมูลส่วนตัวเท่านั้น ไม่ใช่การจัดประเภทเงินได้หรือคำวินิจฉัยภาษีตามกฎหมาย",
      ),
    ).toBeVisible();
    expect(
      screen.getAllByText(
        "สถานะการจัดกลุ่มรายการเป็นเพียงเครื่องช่วยทบทวนข้อมูล ไม่ได้ยืนยันว่ารายจ่ายรายการใดหักภาษีได้",
      ),
    ).toHaveLength(2);
  });

  it("opens matching local details by keyboard and closes on cancel while restoring focus", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const initialUrl = window.location.href;
    render(<SummaryBreakdown workspace={createWorkspaceFixture()} />);

    const trigger = screen.getByRole("button", {
      name: /ดูรายละเอียดรายรับตามแหล่งที่มา ไม่ระบุแหล่งที่มา จำนวน 1 รายการ/,
    });
    trigger.focus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("dialog", {
      name: "รายรับตามแหล่งที่มา: ไม่ระบุแหล่งที่มา",
    });
    await waitFor(() => expect(dialog).toHaveAttribute("open"));
    expect(within(dialog).getByText("1 รายการ")).toBeVisible();
    expect(within(dialog).getAllByText("25,000.00 ฿")).toHaveLength(2);
    expect(within(dialog).getByText("งานออกแบบ")).toBeVisible();
    expect(
      within(dialog).queryByText("บริษัทตัวอย่าง"),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);

    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows clear empty states without opening a dialog", () => {
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "full_year"),
    );
    render(<SummaryBreakdown workspace={workspace} />);

    expect(screen.getByText("ยังไม่มีรายรับในช่วงเวลาที่เลือก")).toBeVisible();
    expect(
      screen.getByText("ยังไม่มีรายรับตามหมวดในช่วงเวลาที่เลือก"),
    ).toBeVisible();
    expect(
      screen.getByText("ยังไม่มีรายจ่ายตามหมวดในช่วงเวลาที่เลือก"),
    ).toBeVisible();
    expect(
      screen.getByText("ยังไม่มีรายจ่ายตามสถานะในช่วงเวลาที่เลือก"),
    ).toBeVisible();
  });
});
