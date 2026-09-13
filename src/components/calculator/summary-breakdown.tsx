"use client";

import { ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  buildExpenseCategoryBreakdown,
  buildExpenseStatusBreakdown,
  buildIncomeCategoryBreakdown,
  buildIncomeSourceBreakdown,
  normalizeIncomeSourceName,
  type BreakdownDetail,
  type BreakdownKind,
} from "@/calculator/breakdown";
import {
  EXPENSE_CATEGORY_DISCLAIMER,
  INCOME_CATEGORY_DISCLAIMER,
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getIncomeCategoryLabel,
} from "@/calculator/categories";
import type {
  CalculatorWorkspace,
  ExpenseEntry,
  IncomeEntry,
} from "@/calculator/types";
import {
  formatEntryPeriod,
  formatThaiDate,
  isEntryWithinPeriod,
} from "@/calculator/utils";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { Button } from "@/components/ui/button";
import { formatThaiBaht, safeAddMoney, toMoneySatang } from "@/tax/money";

interface BreakdownSectionDefinition {
  readonly kind: BreakdownKind;
  readonly title: string;
  readonly description: string;
  readonly emptyMessage: string;
  readonly disclaimer?: string | undefined;
  readonly details: readonly BreakdownDetail[];
}

interface SelectedBreakdown {
  readonly kind: BreakdownKind;
  readonly sectionTitle: string;
  readonly detail: BreakdownDetail;
}

export function SummaryBreakdown({
  workspace,
}: {
  readonly workspace: CalculatorWorkspace;
}) {
  const [selectedBreakdown, setSelectedBreakdown] =
    useState<SelectedBreakdown | null>(null);

  const sections = useMemo<readonly BreakdownSectionDefinition[]>(
    () => [
      {
        kind: "income_source",
        title: "รายรับตามแหล่งที่มา",
        description: "รวมรายการรายรับตามชื่อแหล่งที่มาที่คุณบันทึก",
        emptyMessage: "ยังไม่มีรายรับในช่วงเวลาที่เลือก",
        details: buildIncomeSourceBreakdown(workspace),
      },
      {
        kind: "income_category",
        title: "รายรับตามหมวดบันทึก",
        description: "รวมรายการรายรับตามหมวดที่ใช้จัดระเบียบข้อมูล",
        emptyMessage: "ยังไม่มีรายรับตามหมวดในช่วงเวลาที่เลือก",
        disclaimer: INCOME_CATEGORY_DISCLAIMER,
        details: buildIncomeCategoryBreakdown(workspace),
      },
      {
        kind: "expense_category",
        title: "รายจ่ายตามหมวดบันทึก",
        description: "รวมรายการรายจ่ายตามหมวดที่ใช้ทบทวนข้อมูล",
        emptyMessage: "ยังไม่มีรายจ่ายตามหมวดในช่วงเวลาที่เลือก",
        disclaimer: EXPENSE_CATEGORY_DISCLAIMER,
        details: buildExpenseCategoryBreakdown(workspace),
      },
      {
        kind: "expense_status",
        title: "รายจ่ายตามสถานะการจัดกลุ่ม",
        description: "รวมรายการรายจ่ายตามสถานะที่คุณเลือกไว้เพื่อช่วยทบทวน",
        emptyMessage: "ยังไม่มีรายจ่ายตามสถานะในช่วงเวลาที่เลือก",
        disclaimer: EXPENSE_CATEGORY_DISCLAIMER,
        details: buildExpenseStatusBreakdown(workspace),
      },
    ],
    [workspace],
  );

  return (
    <section
      aria-labelledby="summary-breakdown-title"
      className="space-y-4"
      data-testid="summary-breakdown"
    >
      <div>
        <h2 className="text-xl font-bold" id="summary-breakdown-title">
          รายละเอียดรายรับและรายจ่าย
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          สรุปจากข้อมูลที่คุณบันทึกในช่วงเวลาที่เลือก
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <BreakdownSection
            key={section.kind}
            onSelect={(detail) =>
              setSelectedBreakdown({
                kind: section.kind,
                sectionTitle: section.title,
                detail,
              })
            }
            section={section}
          />
        ))}
      </div>

      <BreakdownDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBreakdown(null);
          }
        }}
        selected={selectedBreakdown}
        workspace={workspace}
      />
    </section>
  );
}

function BreakdownSection({
  section,
  onSelect,
}: {
  readonly section: BreakdownSectionDefinition;
  readonly onSelect: (detail: BreakdownDetail) => void;
}) {
  const totalSatang = section.details.reduce(
    (total, detail) => safeAddMoney(total, detail.group.totalSatang),
    toMoneySatang(0),
  );

  return (
    <section
      aria-labelledby={`${section.kind}-title`}
      className="border-border bg-card min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5"
      data-breakdown-kind={section.kind}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold" id={`${section.kind}-title`}>
            {section.title}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {section.description}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm">
          <span className="text-muted-foreground block text-xs">ยอดรวม</span>
          <span className="font-semibold tabular-nums">
            {formatThaiBaht(totalSatang)}
          </span>
        </p>
      </div>

      {section.details.length === 0 ? (
        <p
          className="border-border bg-muted/40 text-muted-foreground mt-4 rounded-xl border border-dashed p-4 text-sm"
          role="status"
        >
          {section.emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {section.details.map((detail) => {
            const { group } = detail;
            const amount = formatThaiBaht(group.totalSatang);
            return (
              <li key={group.key}>
                <button
                  aria-label={`ดูรายละเอียด${section.title} ${group.label} จำนวน ${group.entryCount} รายการ รวม ${amount}`}
                  className="border-border bg-background hover:bg-muted/60 focus-visible:ring-focus/35 block min-h-11 w-full rounded-xl border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none"
                  onClick={() => onSelect(detail)}
                  type="button"
                >
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium break-words">
                        {group.label}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {group.entryCount} รายการ · {group.percentage}%
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {amount}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="text-muted-foreground size-4"
                      />
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="bg-muted mt-2 block h-2 overflow-hidden rounded-full"
                  >
                    <span
                      className="bg-primary block h-full rounded-full"
                      style={{ width: `${Math.min(group.percentage, 100)}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {section.disclaimer ? (
        <p className="text-muted-foreground mt-4 text-xs leading-5">
          {section.disclaimer}
        </p>
      ) : null}
    </section>
  );
}

function BreakdownDetailDialog({
  selected,
  workspace,
  onOpenChange,
}: {
  readonly selected: SelectedBreakdown | null;
  readonly workspace: CalculatorWorkspace;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef("");
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (selected) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      previousBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
      closeButtonRef.current?.focus();
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
    document.body.style.overflow = previousBodyOverflowRef.current;
    previousFocusRef.current?.focus();
  }, [selected]);

  useEffect(
    () => () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
    },
    [],
  );

  const entries = selected
    ? getSelectedEntries(workspace, selected.kind, selected.detail.entryIds)
    : [];

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="border-border bg-card text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="border-border flex items-start justify-between gap-3 border-b p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold break-words" id={titleId}>
              {selected
                ? `${selected.sectionTitle}: ${selected.detail.group.label}`
                : "รายละเอียดรายการ"}
            </h2>
            <p
              className="text-muted-foreground mt-1 text-sm leading-6"
              id={descriptionId}
            >
              ช่วงเวลา {formatThaiDate(workspace.periodStart)} –{" "}
              {formatThaiDate(workspace.periodEnd)}
            </p>
          </div>
          <Button
            aria-label="ปิดรายละเอียดรายการ"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            ref={closeButtonRef}
            size="icon"
            type="button"
            variant="secondary"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        {selected ? (
          <div className="border-border bg-muted/30 grid grid-cols-2 gap-3 border-b px-4 py-3 text-sm sm:px-5">
            <p>
              <span className="text-muted-foreground block text-xs">
                จำนวนรายการ
              </span>
              <span className="font-semibold">
                {selected.detail.group.entryCount} รายการ
              </span>
            </p>
            <p className="text-right">
              <span className="text-muted-foreground block text-xs">
                ยอดรวมเชิงคณิตศาสตร์
              </span>
              <span className="font-semibold tabular-nums">
                {formatThaiBaht(selected.detail.group.totalSatang)}
              </span>
            </p>
          </div>
        ) : null}

        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {entries.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
              ไม่พบรายการต้นทางในกลุ่มนี้
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <BreakdownEntryCard entry={entry} key={entry.id} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}

function getSelectedEntries(
  workspace: CalculatorWorkspace,
  kind: BreakdownKind,
  entryIds: readonly string[],
): Array<IncomeEntry | ExpenseEntry> {
  const ids = new Set(entryIds);
  const entries = kind.startsWith("income_")
    ? workspace.incomeEntries
    : workspace.expenseEntries;

  return sortEntriesByDateDesc(
    entries.filter(
      (entry) =>
        ids.has(entry.id) &&
        isEntryWithinPeriod(entry, workspace.periodStart, workspace.periodEnd),
    ),
  );
}

function BreakdownEntryCard({
  entry,
}: {
  readonly entry: IncomeEntry | ExpenseEntry;
}) {
  const isIncome = !("taxRelevanceStatus" in entry);

  return (
    <li className="border-border bg-background min-w-0 rounded-xl border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{formatEntryPeriod(entry)}</p>
          <span className="bg-muted text-muted-foreground mt-1 inline-flex min-h-6 items-center rounded-full px-2 text-xs">
            {entry.entryFrequency === "monthly"
              ? "รายเดือน"
              : "ระบุวัน / ครั้งเดียว"}
          </span>
        </div>
        <p className="font-semibold tabular-nums">
          {formatThaiBaht(entry.amountSatang)}
        </p>
      </div>

      <dl className="mt-3 grid gap-2 text-xs leading-5">
        {isIncome && entry.sourceName?.trim() ? (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <dt className="text-muted-foreground">แหล่งที่มา</dt>
            <dd className="text-right break-words">
              {normalizeIncomeSourceName(entry.sourceName)}
            </dd>
          </div>
        ) : null}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <dt className="text-muted-foreground">หมวดบันทึก</dt>
          <dd className="text-right break-words">
            {isIncome
              ? getIncomeCategoryLabel(entry.categoryCode)
              : getExpenseCategoryLabel(entry.categoryCode)}
          </dd>
        </div>
        {!isIncome ? (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <dt className="text-muted-foreground">สถานะ</dt>
            <dd className="text-right break-words">
              {getExpenseStatusLabel(entry.taxRelevanceStatus)}
            </dd>
          </div>
        ) : null}
      </dl>

      {entry.note ? (
        <p className="border-border text-muted-foreground mt-3 border-t pt-3 text-xs leading-5 break-words">
          {entry.note}
        </p>
      ) : null}
    </li>
  );
}
