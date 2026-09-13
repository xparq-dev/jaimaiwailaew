"use client";

import { FileDown } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type { CalculatorWorkspace } from "@/calculator/types";
import {
  buildLocalPdfReportModel,
  type LocalPdfEntryGroup,
  type LocalPdfReportModel,
} from "@/pdf/local-pdf-report";
import { formatThaiBaht } from "@/tax/money";

import { Button } from "../ui/button";

const DEFAULT_REPORT_TITLE = "รายงานสรุปข้อมูลรายได้และค่าใช้จ่าย";

type ExportStatus = "idle" | "preparing" | "ready" | "error";

export function PdfExportPanel({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [reportName, setReportName] = useState(
    workspace.reportName ?? DEFAULT_REPORT_TITLE,
  );
  const [displayName, setDisplayName] = useState("");
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [status, setStatus] = useState<ExportStatus>("idle");

  const report = useMemo(
    () =>
      buildLocalPdfReportModel(workspace, {
        generatedAt,
        reportName,
        displayName,
      }),
    [displayName, generatedAt, reportName, workspace],
  );

  async function handleExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("preparing");
    setGeneratedAt(new Date());
    const previousDocumentTitle = document.title;

    try {
      await document.fonts?.ready;
      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => resolve()),
      );
      document.title = `${report.title} - Jai Mai Wai Laew`;
      window.print();
      setStatus("ready");
    } catch {
      setStatus("error");
    } finally {
      document.title = previousDocumentTitle;
    }
  }

  return (
    <>
      <section
        aria-labelledby="pdf-export-title"
        className="border-border bg-card rounded-2xl border p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold" id="pdf-export-title">
              สร้าง PDF ในอุปกรณ์นี้
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              ระบบเตรียมรายงาน A4 ในเบราว์เซอร์โดยไม่ส่งข้อมูลการเงินออกไปภายนอก
              จากนั้นเลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์
            </p>
          </div>
          <span className="bg-success-soft text-success-strong inline-flex rounded-full px-3 py-1 text-xs font-medium">
            Local-only
          </span>
        </div>

        <form className="mt-4 grid gap-4" onSubmit={handleExport}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              ชื่อรายงาน (ไม่บังคับ)
              <input
                className="border-border bg-background focus-visible:ring-focus/35 min-h-11 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
                maxLength={100}
                onChange={(event) => setReportName(event.target.value)}
                value={reportName}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              ชื่อที่ต้องการแสดงในรายงาน (ไม่บังคับ)
              <input
                autoComplete="off"
                className="border-border bg-background focus-visible:ring-focus/35 min-h-11 rounded-xl border px-3 py-2 font-normal focus-visible:ring-3 focus-visible:outline-none"
                maxLength={100}
                onChange={(event) => setDisplayName(event.target.value)}
                value={displayName}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={status === "preparing"} type="submit">
              <FileDown aria-hidden="true" className="size-4" />
              {status === "preparing" ? "กำลังเตรียมรายงาน…" : "สร้าง PDF"}
            </Button>
            <p aria-live="polite" className="text-muted-foreground text-sm">
              {status === "ready"
                ? "เปิดหน้าต่างพิมพ์แล้ว โปรดเลือกบันทึกเป็น PDF"
                : null}
              {status === "error"
                ? "ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดลองอีกครั้งหรือตรวจการตั้งค่าเบราว์เซอร์"
                : null}
            </p>
          </div>
        </form>

        <p className="text-muted-foreground mt-4 text-xs leading-5">
          รายงานไม่มีผลคำนวณภาษี ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ
          และระบบไม่อัปโหลดไฟล์ที่สร้าง
        </p>
      </section>

      <PrintablePdfReport report={report} />
    </>
  );
}

function PrintablePdfReport({
  report,
}: {
  readonly report: LocalPdfReportModel;
}) {
  return (
    <article
      aria-hidden="true"
      className="pdf-export-report"
      data-testid="local-pdf-report"
    >
      <div className="pdf-export-watermark">
        <strong>JAI MAI WAI LAEW</strong>
        <span>รายงานเพื่อการจัดระเบียบข้อมูลส่วนตัว</span>
        <span>ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ</span>
      </div>

      <header className="pdf-export-document-header">
        <p className="pdf-export-product-name">JAI MAI WAI LAEW</p>
        <h1>{report.title}</h1>
        {report.displayName ? <p>จัดทำสำหรับ: {report.displayName}</p> : null}
        <dl className="pdf-export-meta-grid">
          <div>
            <dt>ปีภาษี</dt>
            <dd>{report.taxYearBE}</dd>
          </div>
          <div>
            <dt>ช่วงข้อมูล</dt>
            <dd>{report.periodLabel}</dd>
          </div>
          <div>
            <dt>สร้างเมื่อ (Asia/Bangkok)</dt>
            <dd>{report.generatedAtLabel}</dd>
          </div>
          <div>
            <dt>เวอร์ชันรูปแบบรายงาน</dt>
            <dd>{report.reportVersion}</dd>
          </div>
        </dl>
      </header>

      <PdfSection title="1. ภาพรวม">
        <dl className="pdf-export-summary-grid">
          <PdfSummaryItem
            label="รายรับรวม"
            value={formatThaiBaht(report.totals.totalIncomeSatang)}
          />
          <PdfSummaryItem
            label="รายจ่ายรวม"
            value={formatThaiBaht(report.totals.totalExpenseSatang)}
          />
          <PdfSummaryItem
            label="ภาษีหัก ณ ที่จ่ายที่บันทึกไว้"
            value={formatThaiBaht(report.totals.totalWithholdingSatang)}
          />
          <PdfSummaryItem
            label="ค่าลดหย่อนที่บันทึกแบบร่าง"
            value={formatThaiBaht(report.totals.totalDeclaredAllowanceSatang)}
          />
        </dl>
        <div className="pdf-export-alert">
          <strong>Tax estimate unavailable</strong>
          <span>
            กฎภาษียังไม่ผ่านการตรวจสอบ ระบบจึงไม่แสดงภาษีประมาณการ
            ภาษีที่ต้องชำระ หรือเงินคืนภาษี
          </span>
        </div>
      </PdfSection>

      <PdfEntrySection
        emptyMessage="ไม่มีรายการรายรับในช่วงที่เลือก"
        groups={report.incomeGroups}
        secondaryHeading="แหล่งที่มา"
        title="2. รายการรายรับ"
      />
      <PdfEntrySection
        emptyMessage="ไม่มีรายการรายจ่ายในช่วงที่เลือก"
        groups={report.expenseGroups}
        secondaryHeading="สถานะการจัดกลุ่ม"
        title="3. รายการรายจ่าย"
      />
      <PdfEntrySection
        emptyMessage="ไม่มีรายการภาษีหัก ณ ที่จ่ายในช่วงที่เลือก"
        groups={report.withholdingGroups}
        secondaryHeading="เลขอ้างอิง"
        title="4. ภาษีหัก ณ ที่จ่าย"
      />

      <PdfSection title="5. ค่าลดหย่อน / ค่าลดภาษี (แบบร่าง)">
        {report.allowanceRows.length === 0 ? (
          <p className="pdf-export-empty">ไม่มีรายการค่าลดหย่อนแบบร่าง</p>
        ) : (
          <table className="pdf-export-table">
            <thead>
              <tr>
                <th>หมวดบันทึก</th>
                <th>หมายเหตุ</th>
                <th className="pdf-export-number">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {report.allowanceRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.note ?? "—"}</td>
                  <td className="pdf-export-number">
                    {row.amountSatang === undefined
                      ? "ไม่ระบุจำนวน"
                      : formatThaiBaht(row.amountSatang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="pdf-export-note">
          รายการส่วนนี้เป็นข้อมูลแบบร่างที่ผู้ใช้บันทึกเอง
          ไม่ใช่การยืนยันสิทธิหรือวงเงินลดหย่อนตามกฎหมาย
        </p>
      </PdfSection>

      <PdfSection title="6. Summary Breakdown">
        <div className="pdf-export-breakdown-grid">
          {report.breakdownSections.map((section) => (
            <section className="pdf-export-breakdown" key={section.key}>
              <h3>{section.title}</h3>
              {section.details.length === 0 ? (
                <p className="pdf-export-empty">ไม่มีข้อมูลในช่วงที่เลือก</p>
              ) : (
                <table className="pdf-export-table">
                  <thead>
                    <tr>
                      <th>กลุ่ม</th>
                      <th className="pdf-export-number">รายการ</th>
                      <th className="pdf-export-number">สัดส่วน</th>
                      <th className="pdf-export-number">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.details.map(({ group }) => (
                      <tr key={group.key}>
                        <td>{group.label}</td>
                        <td className="pdf-export-number">
                          {group.entryCount}
                        </td>
                        <td className="pdf-export-number">
                          {group.percentage}%
                        </td>
                        <td className="pdf-export-number">
                          {formatThaiBaht(group.totalSatang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      </PdfSection>

      <PdfSection title="สถานะกฎและแหล่งข้อมูล">
        <p className="pdf-export-note">
          Tax Rules 2568/2569: unverified / not for calculation
        </p>
        <dl className="pdf-export-rule-grid">
          <div>
            <dt>Rule set ID</dt>
            <dd>{report.ruleSetId}</dd>
          </div>
          <div>
            <dt>Rule version</dt>
            <dd>{report.ruleSetVersion}</dd>
          </div>
          <div>
            <dt>Rule status</dt>
            <dd>{report.ruleStatus} / not for calculation</dd>
          </div>
          <div>
            <dt>Validation status</dt>
            <dd>{report.validationStatus}</dd>
          </div>
          <div>
            <dt>Tax Rule Resolver</dt>
            <dd>{report.resolverStatus}</dd>
          </div>
          <div>
            <dt>แหล่งข้อมูลรายงาน</dt>
            <dd>ข้อมูลที่บันทึกในอุปกรณ์นี้</dd>
          </div>
        </dl>
      </PdfSection>

      <PdfTextList items={report.warnings} title="คำเตือน" />
      <PdfTextList items={report.assumptions} title="สมมติฐาน" />

      <section className="pdf-export-disclaimer">
        <h2>ข้อจำกัดความรับผิดชอบ</h2>
        <p>เอกสารนี้สร้างขึ้นเพื่อการจัดระเบียบข้อมูลส่วนตัวเท่านั้น</p>
        <p>ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ และไม่มีการคำนวณภาษี</p>
        <p>
          การจัดหมวดและสถานะรายการไม่ใช่คำวินิจฉัยทางกฎหมายหรือการยืนยันสิทธิทางภาษี
        </p>
      </section>

      <footer className="pdf-export-footer">
        JAI MAI WAI LAEW · สร้างเมื่อ {report.generatedAtLabel} ·
        ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ
      </footer>
    </article>
  );
}

function PdfSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="pdf-export-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PdfSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PdfEntrySection({
  title,
  groups,
  secondaryHeading,
  emptyMessage,
}: {
  readonly title: string;
  readonly groups: readonly LocalPdfEntryGroup[];
  readonly secondaryHeading: string;
  readonly emptyMessage: string;
}) {
  return (
    <PdfSection title={title}>
      {groups.length === 0 ? (
        <p className="pdf-export-empty">{emptyMessage}</p>
      ) : (
        groups.map((group) => (
          <section
            className="pdf-export-entry-group"
            key={group.entryFrequency}
          >
            <div className="pdf-export-group-heading">
              <h3>{group.label}</h3>
              <p>
                {group.entryCount} รายการ · {formatThaiBaht(group.totalSatang)}
              </p>
            </div>
            <table className="pdf-export-table">
              <thead>
                <tr>
                  <th>วันที่ / เดือน</th>
                  <th>หมวด / ผู้จ่าย</th>
                  <th>{secondaryHeading}</th>
                  <th>หมายเหตุ</th>
                  <th className="pdf-export-number">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.periodLabel}</td>
                    <td>{row.primaryLabel}</td>
                    <td>{row.secondaryLabel ?? "—"}</td>
                    <td>{row.note ?? "—"}</td>
                    <td className="pdf-export-number">
                      {formatThaiBaht(row.amountSatang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </PdfSection>
  );
}

function PdfTextList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}) {
  return (
    <PdfSection title={title}>
      <ul className="pdf-export-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </PdfSection>
  );
}
