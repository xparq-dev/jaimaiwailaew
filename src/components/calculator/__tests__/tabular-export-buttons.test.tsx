import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCalculatorWorkspace,
  getDefaultWorkspaceInput,
} from "@/calculator/workspace";

import { TabularExportButtons } from "../tabular-export-buttons";

const createLocalXlsxArtifactMock = vi.hoisted(() => vi.fn());
const createLocalCsvBundleArtifactMock = vi.hoisted(() => vi.fn());
const downloadLocalArtifactMock = vi.hoisted(() => vi.fn());

vi.mock("@/export/create-local-xlsx", () => ({
  createLocalXlsxArtifact: createLocalXlsxArtifactMock,
}));
vi.mock("@/export/create-local-csv-bundle", () => ({
  createLocalCsvBundleArtifact: createLocalCsvBundleArtifactMock,
}));
vi.mock("@/export/download-local-artifact", () => ({
  downloadLocalArtifact: downloadLocalArtifactMock,
}));

beforeEach(() => {
  createLocalXlsxArtifactMock.mockReset();
  createLocalCsvBundleArtifactMock.mockReset();
  downloadLocalArtifactMock.mockReset();
});

describe("TabularExportButtons", () => {
  it("exports Excel and CSV only after user actions without network, storage, or URL changes", async () => {
    const user = userEvent.setup();
    const workspace = createCalculatorWorkspace(
      getDefaultWorkspaceInput("multiple_income", 2569, "first_half"),
    );
    const excelArtifact = {
      blob: new Blob(["xlsx"]),
      fileName: "report.xlsx",
    };
    const csvArtifact = {
      blob: new Blob(["zip"]),
      fileName: "report-csv.zip",
    };
    createLocalXlsxArtifactMock.mockReturnValue(excelArtifact);
    createLocalCsvBundleArtifactMock.mockReturnValue(csvArtifact);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const initialUrl = window.location.href;

    render(<TabularExportButtons workspace={workspace} />);

    expect(screen.getByRole("button", { name: "ส่งออก Excel" })).toBeVisible();
    expect(screen.getByRole("button", { name: "ส่งออก CSV" })).toBeVisible();
    expect(createLocalXlsxArtifactMock).not.toHaveBeenCalled();
    expect(createLocalCsvBundleArtifactMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ส่งออก Excel" }));
    await waitFor(() =>
      expect(createLocalXlsxArtifactMock).toHaveBeenCalledOnce(),
    );
    expect(downloadLocalArtifactMock).toHaveBeenCalledWith(excelArtifact);
    expect(screen.getByText("ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "ส่งออก CSV" }));
    await waitFor(() =>
      expect(createLocalCsvBundleArtifactMock).toHaveBeenCalledOnce(),
    );
    expect(downloadLocalArtifactMock).toHaveBeenCalledWith(csvArtifact);
    expect(
      screen.getByText("ดาวน์โหลดชุดไฟล์ CSV เรียบร้อยแล้ว"),
    ).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
  });
});
