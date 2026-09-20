import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { WorkspacePersonaEditor } from "../workspace-persona-editor";

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

describe("WorkspacePersonaEditor", () => {
  it("updates the persona without asking the user to clear the workspace", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <WorkspacePersonaEditor
        onSave={onSave}
        persona="online_seller_business"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "แก้ไขประเภทผู้ใช้งาน" }),
    );
    await user.click(screen.getByRole("radio", { name: /ฟรีแลนซ์/ }));
    await user.click(
      screen.getByRole("button", { name: "บันทึกประเภทผู้ใช้งาน" }),
    );

    expect(onSave).toHaveBeenCalledWith("freelancer");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
