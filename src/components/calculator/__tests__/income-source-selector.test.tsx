import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { IncomeCategoryCode } from "@/calculator/types";

import { IncomeSourceSelector } from "../income-source-selector";

function SelectorHarness({
  categoryCode,
  initialValue,
}: {
  readonly categoryCode: IncomeCategoryCode;
  readonly initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <IncomeSourceSelector
      categoryCode={categoryCode}
      onChange={setValue}
      value={value}
    />
  );
}

describe("IncomeSourceSelector", () => {
  it("allows the matched option to be unchecked, replaced, or typed", async () => {
    const user = userEvent.setup();
    render(
      <SelectorHarness
        categoryCode="salary"
        initialValue="เงินเดือน / ค่าจ้างประจำ"
      />,
    );

    const matchedOption = screen.getByRole("checkbox", {
      name: "เลือกแหล่งรายได้ เงินเดือน / ค่าจ้างประจำ",
    });
    expect(matchedOption).toBeChecked();

    await user.click(matchedOption);
    expect(matchedOption).not.toBeChecked();

    const customInput = screen.getByRole("textbox", {
      name: "แหล่งรายได้ (ไม่บังคับ)",
    });
    await user.type(customInput, "บริษัทตัวอย่าง");
    expect(customInput).toHaveValue("บริษัทตัวอย่าง");

    await user.click(
      screen.getByRole("checkbox", {
        name: "เลือกแหล่งรายได้ นายจ้าง / บริษัท",
      }),
    );
    expect(customInput).toHaveValue("");
  });
});
