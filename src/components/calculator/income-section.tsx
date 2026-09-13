"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { formatThaiBaht } from "@/tax/money";
import {
  buildIncomeMonthGroups,
  buildIncomeMonthGroupsForPeriod,
  type IncomeFrequencyGroup,
  type IncomeMonthGroup,
} from "@/calculator/income-month-groups";
import { useCalculatorStore } from "@/calculator/store";
import {
  getIncomeCategoryLabel,
  INCOME_CATEGORY_OPTIONS,
} from "@/calculator/categories";
import {
  incomeEntryFormSchema,
  type IncomeEntryFormValues,
} from "@/calculator/schemas";
import type { IncomeEntry } from "@/calculator/types";
import { formatEntryPeriod, isEntryWithinPeriod } from "@/calculator/utils";
import { Button } from "@/components/ui/button";

import { CalculatorLayout } from "./calculator-layout";
import {
  EntryFormDialog,
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "./entry-form-dialog";

const emptyForm: IncomeEntryFormValues = {
  entryFrequency: "one_time",
  occurredOn: "",
  occurredMonth: "",
  categoryCode: "online_sales",
  sourceName: "",
  amount: "",
  note: "",
};

export function IncomeSectionPage() {
  const workspace = useCalculatorStore((state) => state.workspace);
  const addIncomeEntry = useCalculatorStore((state) => state.addIncomeEntry);
  const updateIncomeEntry = useCalculatorStore(
    (state) => state.updateIncomeEntry,
  );
  const deleteIncomeEntry = useCalculatorStore(
    (state) => state.deleteIncomeEntry,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const { monthGroups, outsidePeriodMonthGroups } = useMemo(() => {
    if (!workspace) {
      return { monthGroups: [], outsidePeriodMonthGroups: [] };
    }

    return {
      monthGroups: buildIncomeMonthGroupsForPeriod(
        workspace.incomeEntries,
        workspace.periodStart,
        workspace.periodEnd,
      ),
      outsidePeriodMonthGroups: buildIncomeMonthGroups(
        workspace.incomeEntries.filter(
          (entry) =>
            !isEntryWithinPeriod(
              entry,
              workspace.periodStart,
              workspace.periodEnd,
            ),
        ),
      ),
    };
  }, [workspace]);

  const defaultValues = useMemo((): IncomeEntryFormValues => {
    if (!workspace) {
      return emptyForm;
    }

    if (!editingId) {
      return {
        ...emptyForm,
        entryFrequency: "one_time",
        occurredOn: workspace.periodStart,
        occurredMonth: workspace.periodStart.slice(0, 7),
      };
    }

    const entry = workspace.incomeEntries.find((item) => item.id === editingId);
    if (!entry) {
      return emptyForm;
    }

    return {
      entryFrequency: entry.entryFrequency,
      occurredOn: entry.occurredOn ?? "",
      occurredMonth: entry.occurredMonth ?? "",
      categoryCode: entry.categoryCode,
      sourceName: entry.sourceName ?? "",
      amount: (entry.amountSatang / 100).toFixed(2),
      note: entry.note ?? "",
    };
  }, [editingId, workspace]);

  if (!workspace) {
    return null;
  }

  return (
    <CalculatorLayout
      actions={
        <Button
          className="lg:hidden"
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          เพิ่มรายการ
        </Button>
      }
      description="บันทึกรายรับในอุปกรณ์เพื่อสรุปยอดรวมเชิงคณิตศาสตร์เท่านั้น"
      title="รายรับ"
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p
        id="income-section-disclaimer"
        className="text-muted-foreground text-sm leading-6"
      >
        หมวดนี้ใช้เพื่อจัดระเบียบข้อมูลส่วนตัวเท่านั้น
        ไม่ใช่การจัดประเภทเงินได้หรือคำวินิจฉัยภาษีตามกฎหมาย
      </p>

      <div className="hidden lg:block">
        <Button
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          เพิ่มรายการ
        </Button>
      </div>

      {workspace.incomeEntries.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <p className="font-medium">ยังไม่มีรายการรายรับ</p>
          <p className="text-muted-foreground mt-2 text-sm">
            เริ่มเพิ่มรายการแรกเพื่อสรุปยอดรวมในช่วงเวลาที่เลือก
          </p>
        </div>
      ) : (
        <>
          {monthGroups.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-6 text-center">
              <p className="font-medium">ยังไม่มีรายการรายรับในช่วงที่เลือก</p>
              <p className="text-muted-foreground mt-2 text-sm">
                รายการนอกช่วงจะแสดงแยกด้านล่างและไม่รวมในยอดสรุป
              </p>
            </div>
          ) : (
            <div className="space-y-5" data-testid="income-month-groups">
              {monthGroups.map((group) => (
                <IncomeMonthSection
                  group={group}
                  key={group.monthKey}
                  onDelete={setDeleteTargetId}
                  onEdit={(entryId) => {
                    setEditingId(entryId);
                    setDialogOpen(true);
                  }}
                  periodEnd={workspace.periodEnd}
                  periodStart={workspace.periodStart}
                  testIdPrefix="income-month"
                  totalLabel="ยอดรวมเดือน"
                />
              ))}
            </div>
          )}

          {outsidePeriodMonthGroups.length > 0 ? (
            <section
              aria-labelledby="outside-period-income-title"
              className="space-y-4"
              data-testid="income-outside-period-groups"
            >
              <div>
                <h2 className="font-bold" id="outside-period-income-title">
                  รายการนอกช่วงที่เลือก
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  แสดงไว้เพื่อให้แก้ไขหรือลบได้ แต่ไม่รวมในยอดสรุปของช่วงนี้
                </p>
              </div>
              <div className="space-y-5">
                {outsidePeriodMonthGroups.map((group) => (
                  <IncomeMonthSection
                    group={group}
                    key={group.monthKey}
                    onDelete={setDeleteTargetId}
                    onEdit={(entryId) => {
                      setEditingId(entryId);
                      setDialogOpen(true);
                    }}
                    periodEnd={workspace.periodEnd}
                    periodStart={workspace.periodStart}
                    testIdPrefix="income-outside-month"
                    totalLabel="ยอดรวมนอกช่วง"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <EntryFormDialog
        defaultValues={defaultValues}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => {
          const error = editingId
            ? updateIncomeEntry(editingId, values)
            : addIncomeEntry(values);
          if (!error) {
            setAnnouncement(
              editingId ? "แก้ไขรายการเรียบร้อย" : "เพิ่มรายการเรียบร้อย",
            );
          }
          return error;
        }}
        open={dialogOpen}
        schema={incomeEntryFormSchema}
        submitLabel={editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
        title={editingId ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
      >
        {(form) => {
          const frequency = form.watch("entryFrequency");
          return (
            <>
              <div className="space-y-2">
                <label className="text-foreground block text-sm font-medium">
                  รูปแบบรายการ *
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      value="one_time"
                      {...form.register("entryFrequency", {
                        onChange: () => {
                          form.setValue("occurredMonth", "");
                          if (!form.getValues("occurredOn")) {
                            form.setValue("occurredOn", workspace.periodStart);
                          }
                        },
                      })}
                    />
                    <span>ระบุวัน / รายการครั้งเดียว</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      value="monthly"
                      {...form.register("entryFrequency", {
                        onChange: () => {
                          form.setValue("occurredOn", "");
                          if (!form.getValues("occurredMonth")) {
                            form.setValue(
                              "occurredMonth",
                              workspace.periodStart.slice(0, 7),
                            );
                          }
                        },
                      })}
                    />
                    <span>ระบุเดือน / รายการรายเดือน</span>
                  </label>
                </div>
              </div>

              {frequency === "one_time" ? (
                <FormField
                  error={form.formState.errors.occurredOn?.message}
                  hint="เหมาะกับยอดขาย ค่าขนส่ง หรืองานที่เกิดขึ้นเป็นครั้ง ๆ"
                  id="income-date"
                  label="วันที่เกิดรายการ *"
                >
                  <TextInput
                    id="income-date"
                    type="date"
                    {...form.register("occurredOn")}
                  />
                </FormField>
              ) : (
                <FormField
                  error={form.formState.errors.occurredMonth?.message}
                  hint="เหมาะกับเงินเดือน ค่าเช่า ค่าสมาชิก หรือค่าใช้จ่ายที่สรุปเป็นรายเดือน"
                  id="income-month"
                  label="เดือนที่เกิดรายการ *"
                >
                  <TextInput
                    id="income-month"
                    type="month"
                    {...form.register("occurredMonth")}
                  />
                </FormField>
              )}

              <FormField
                error={form.formState.errors.categoryCode?.message}
                hint="หมวดนี้ใช้เพื่อจัดระเบียบข้อมูลส่วนตัวเท่านั้น ไม่ใช่การจัดประเภทเงินได้หรือคำวินิจฉัยภาษีตามกฎหมาย หากต้องใช้ยื่นภาษี โปรดตรวจสอบกับแหล่งทางการหรือผู้เชี่ยวชาญ"
                id="income-category"
                label="หมวดหมู่รายรับ"
              >
                <SelectInput
                  id="income-category"
                  {...form.register("categoryCode")}
                >
                  {INCOME_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField id="income-source" label="แหล่งรายได้ (ไม่บังคับ)">
                <TextInput
                  id="income-source"
                  placeholder="เช่น Shopee, ลูกค้า A, เงินเดือน"
                  {...form.register("sourceName")}
                />
              </FormField>
              <FormField
                error={form.formState.errors.amount?.message}
                id="income-amount"
                label="จำนวนเงิน (บาท) *"
              >
                <TextInput
                  id="income-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...form.register("amount")}
                />
              </FormField>
              <FormField id="income-note" label="หมายเหตุ (ไม่บังคับ)">
                <TextAreaInput
                  id="income-note"
                  placeholder="รายละเอียดเพิ่มเติม"
                  {...form.register("note")}
                />
              </FormField>
            </>
          );
        }}
      </EntryFormDialog>

      {deleteTargetId ? (
        <dialog
          aria-labelledby="delete-income-title"
          className="border-border bg-card m-auto rounded-2xl border p-6 shadow-xl backdrop:bg-black/50"
          open
        >
          <h2 className="font-bold" id="delete-income-title">
            ยืนยันการลบรายการ
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            รายการที่ลบจะหายจากอุปกรณ์นี้ทันที
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => setDeleteTargetId(null)}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                deleteIncomeEntry(deleteTargetId);
                setDeleteTargetId(null);
                setAnnouncement("ลบรายการเรียบร้อย");
              }}
              type="button"
              variant="danger"
            >
              ลบ
            </Button>
          </div>
        </dialog>
      ) : null}

      <div className="fixed right-4 bottom-24 z-30 lg:hidden">
        <Button
          aria-label="เพิ่มรายการรายรับ"
          className="shadow-lg"
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
          size="icon"
          type="button"
        >
          <Plus aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </CalculatorLayout>
  );
}

function IncomeMonthSection({
  group,
  periodStart,
  periodEnd,
  testIdPrefix,
  totalLabel,
  onEdit,
  onDelete,
}: {
  readonly group: IncomeMonthGroup;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly testIdPrefix: "income-month" | "income-outside-month";
  readonly totalLabel: string;
  readonly onEdit: (entryId: string) => void;
  readonly onDelete: (entryId: string) => void;
}) {
  const titleId = `${testIdPrefix}-${group.monthKey}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="border-border bg-card min-w-0 overflow-hidden rounded-2xl border shadow-sm"
      data-month-key={group.monthKey}
      data-testid={`${testIdPrefix}-${group.monthKey}`}
    >
      <header className="border-border bg-muted/40 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-bold" id={titleId}>
            {group.label}
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {group.entryCount} รายการ
          </p>
        </div>
        <p className="text-right">
          <span className="text-muted-foreground block text-xs">
            {totalLabel}
          </span>
          <span className="font-semibold tabular-nums">
            {formatThaiBaht(group.totalSatang)}
          </span>
        </p>
      </header>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">รายการรายรับ {group.label}</caption>
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                วันที่ / เดือน
              </th>
              <th className="px-4 py-3 text-left font-semibold">รูปแบบ</th>
              <th className="px-4 py-3 text-left font-semibold">หมวดหมู่</th>
              <th className="px-4 py-3 text-left font-semibold">แหล่งรายได้</th>
              <th className="px-4 py-3 text-right font-semibold">จำนวนเงิน</th>
              <th className="px-4 py-3 text-right font-semibold">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {group.frequencyGroups.map((frequencyGroup) => (
              <Fragment key={frequencyGroup.entryFrequency}>
                <IncomeFrequencyTableHeader group={frequencyGroup} />
                {frequencyGroup.entries.map((entry) => (
                  <IncomeTableRow
                    entry={entry}
                    key={entry.id}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    periodEnd={periodEnd}
                    periodStart={periodStart}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-5 p-4 lg:hidden">
        {group.frequencyGroups.map((frequencyGroup) => (
          <section
            aria-labelledby={`${titleId}-${frequencyGroup.entryFrequency}`}
            key={frequencyGroup.entryFrequency}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3
                className="text-sm font-semibold"
                id={`${titleId}-${frequencyGroup.entryFrequency}`}
              >
                {frequencyGroup.label}
              </h3>
              <p className="text-muted-foreground text-xs">
                {frequencyGroup.entries.length} รายการ ·{" "}
                <span className="tabular-nums">
                  {formatThaiBaht(frequencyGroup.totalSatang)}
                </span>
              </p>
            </div>
            <ul className="space-y-3">
              {frequencyGroup.entries.map((entry) => (
                <IncomeMobileEntryCard
                  entry={entry}
                  key={entry.id}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  periodEnd={periodEnd}
                  periodStart={periodStart}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function IncomeFrequencyTableHeader({
  group,
}: {
  readonly group: IncomeFrequencyGroup;
}) {
  return (
    <tr className="border-border bg-muted/25 border-t">
      <th className="px-4 py-2 text-left" colSpan={6} scope="rowgroup">
        <span className="font-semibold">{group.label}</span>
        <span className="text-muted-foreground ml-2 text-xs font-normal">
          {group.entries.length} รายการ · {formatThaiBaht(group.totalSatang)}
        </span>
      </th>
    </tr>
  );
}

function IncomeTableRow({
  entry,
  periodStart,
  periodEnd,
  onEdit,
  onDelete,
}: {
  readonly entry: IncomeEntry;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly onEdit: (entryId: string) => void;
  readonly onDelete: (entryId: string) => void;
}) {
  const inPeriod = isEntryWithinPeriod(entry, periodStart, periodEnd);

  return (
    <tr className="border-border border-t">
      <td className="px-4 py-3">{formatEntryPeriod(entry)}</td>
      <td className="px-4 py-3">
        <IncomeFrequencyBadge entry={entry} />
      </td>
      <td className="px-4 py-3">
        {getIncomeCategoryLabel(entry.categoryCode)}
      </td>
      <td className="px-4 py-3">{entry.sourceName ?? "—"}</td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {formatThaiBaht(entry.amountSatang)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {!inPeriod ? (
            <span className="text-warning-strong text-xs font-medium">
              นอกช่วง
            </span>
          ) : null}
          <Button
            aria-label={`แก้ไขรายการ ${entry.id}`}
            onClick={() => onEdit(entry.id)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            aria-label={`ลบรายการ ${entry.id}`}
            onClick={() => onDelete(entry.id)}
            size="sm"
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function IncomeMobileEntryCard({
  entry,
  periodStart,
  periodEnd,
  onEdit,
  onDelete,
}: {
  readonly entry: IncomeEntry;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly onEdit: (entryId: string) => void;
  readonly onDelete: (entryId: string) => void;
}) {
  const inPeriod = isEntryWithinPeriod(entry, periodStart, periodEnd);

  return (
    <li className="border-border bg-background rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold break-words">
              {getIncomeCategoryLabel(entry.categoryCode)}
            </p>
            <IncomeFrequencyBadge entry={entry} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatEntryPeriod(entry)}
          </p>
          {entry.sourceName ? (
            <p className="text-muted-foreground mt-1 text-sm break-words">
              {entry.sourceName}
            </p>
          ) : null}
          {!inPeriod ? (
            <p className="text-warning-strong mt-1 text-xs font-medium">
              อยู่นอกช่วงที่เลือก
            </p>
          ) : null}
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {formatThaiBaht(entry.amountSatang)}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => onEdit(entry.id)}
          type="button"
          variant="secondary"
        >
          แก้ไข
        </Button>
        <Button
          className="flex-1"
          onClick={() => onDelete(entry.id)}
          type="button"
          variant="danger"
        >
          ลบ
        </Button>
      </div>
    </li>
  );
}

function IncomeFrequencyBadge({ entry }: { readonly entry: IncomeEntry }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
      {entry.entryFrequency === "monthly" ? "รายเดือน" : "ระบุวัน"}
    </span>
  );
}
