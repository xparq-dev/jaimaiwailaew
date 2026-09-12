"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EXPENSE_CATEGORY_DISCLAIMER,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
} from "@/calculator/categories";
import {
  expenseEntryFormSchema,
  type ExpenseEntryFormValues,
} from "@/calculator/schemas";
import { useCalculatorStore } from "@/calculator/store";
import { formatEntryPeriod, isEntryWithinPeriod } from "@/calculator/utils";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { Button } from "@/components/ui/button";
import { formatThaiBaht } from "@/tax/money";
import type { ExpenseEntry } from "@/calculator/types";

import { CalculatorLayout } from "./calculator-layout";
import {
  EntryFormDialog,
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "./entry-form-dialog";

const emptyForm: ExpenseEntryFormValues = {
  entryFrequency: "one_time",
  occurredOn: "",
  occurredMonth: "",
  categoryCode: "shipping",
  amount: "",
  taxRelevanceStatus: "needs_review",
  note: "",
};

export function ExpenseSectionPage() {
  const workspace = useCalculatorStore((state) => state.workspace);
  const addExpenseEntry = useCalculatorStore((state) => state.addExpenseEntry);
  const updateExpenseEntry = useCalculatorStore(
    (state) => state.updateExpenseEntry,
  );
  const deleteExpenseEntry = useCalculatorStore(
    (state) => state.deleteExpenseEntry,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const entries = useMemo(
    () => (workspace ? sortEntriesByDateDesc(workspace.expenseEntries) : []),
    [workspace],
  );

  const defaultValues = useMemo((): ExpenseEntryFormValues => {
    if (!workspace) return emptyForm;
    if (!editingId) {
      return {
        ...emptyForm,
        entryFrequency: "one_time",
        occurredOn: workspace.periodStart,
        occurredMonth: workspace.periodStart.slice(0, 7),
      };
    }
    const entry = workspace.expenseEntries.find(
      (item) => item.id === editingId,
    );
    if (!entry) return emptyForm;
    return {
      entryFrequency: entry.entryFrequency,
      occurredOn: entry.occurredOn ?? "",
      occurredMonth: entry.occurredMonth ?? "",
      categoryCode: entry.categoryCode,
      amount: (entry.amountSatang / 100).toFixed(2),
      taxRelevanceStatus: entry.taxRelevanceStatus,
      note: entry.note ?? "",
    };
  }, [editingId, workspace]);

  if (!workspace) return null;

  return (
    <CalculatorLayout
      description="จัดกลุ่มรายจ่ายเพื่อสรุปยอดรวม ไม่ใช่การวินิจฉัยว่าหักภาษีได้"
      title="รายจ่าย"
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p className="text-muted-foreground text-sm leading-6">
        {EXPENSE_CATEGORY_DISCLAIMER}
      </p>
      <Button
        className="hidden lg:inline-flex"
        onClick={() => {
          setEditingId(null);
          setDialogOpen(true);
        }}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        เพิ่มรายการ
      </Button>
      {entries.length === 0 ? (
        <EmptyState label="รายจ่าย" />
      ) : (
        <EntryCards
          entries={entries}
          onDelete={setDeleteTargetId}
          onEdit={(id) => {
            setEditingId(id);
            setDialogOpen(true);
          }}
          periodEnd={workspace.periodEnd}
          periodStart={workspace.periodStart}
          renderMeta={(entry) => (
            <>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {getExpenseCategoryLabel(entry.categoryCode)}
                </p>
                <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium">
                  {entry.entryFrequency === "monthly" ? "รายเดือน" : "ระบุวัน"}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {getExpenseStatusLabel(entry.taxRelevanceStatus)}
              </p>
            </>
          )}
        />
      )}
      <EntryFormDialog
        defaultValues={defaultValues}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => {
          const error = editingId
            ? updateExpenseEntry(editingId, values)
            : addExpenseEntry(values);
          if (!error) {
            setAnnouncement(
              editingId ? "แก้ไขรายการเรียบร้อย" : "เพิ่มรายการเรียบร้อย",
            );
          }
          return error;
        }}
        open={dialogOpen}
        schema={expenseEntryFormSchema}
        submitLabel={editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
        title={editingId ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}
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
                  id="expense-date"
                  label="วันที่เกิดรายการ *"
                >
                  <TextInput
                    id="expense-date"
                    type="date"
                    {...form.register("occurredOn")}
                  />
                </FormField>
              ) : (
                <FormField
                  error={form.formState.errors.occurredMonth?.message}
                  hint="เหมาะกับเงินเดือน ค่าเช่า ค่าสมาชิก หรือค่าใช้จ่ายที่สรุปเป็นรายเดือน"
                  id="expense-month"
                  label="เดือนที่เกิดรายการ *"
                >
                  <TextInput
                    id="expense-month"
                    type="month"
                    {...form.register("occurredMonth")}
                  />
                </FormField>
              )}

              <FormField
                error={form.formState.errors.categoryCode?.message}
                id="expense-category"
                label="ประเภทรายจ่าย"
              >
                <SelectInput
                  id="expense-category"
                  {...form.register("categoryCode")}
                >
                  {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                error={form.formState.errors.taxRelevanceStatus?.message}
                hint="สถานะนี้ใช้ช่วยตรวจสอบเท่านั้น ไม่ใช่คำวินิจฉัยทางภาษี"
                id="expense-status"
                label="สถานะการตรวจสอบ"
              >
                <SelectInput
                  id="expense-status"
                  {...form.register("taxRelevanceStatus")}
                >
                  {EXPENSE_STATUS_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField
                error={form.formState.errors.amount?.message}
                id="expense-amount"
                label="จำนวนเงิน (บาท) *"
              >
                <TextInput
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...form.register("amount")}
                />
              </FormField>
              <FormField id="expense-note" label="หมายเหตุ (ไม่บังคับ)">
                <TextAreaInput
                  id="expense-note"
                  placeholder="รายละเอียดเพิ่มเติม"
                  {...form.register("note")}
                />
              </FormField>
            </>
          );
        }}
      </EntryFormDialog>
      <DeleteDialog
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteExpenseEntry(deleteTargetId);
          setDeleteTargetId(null);
          setAnnouncement("ลบรายการเรียบร้อย");
        }}
        open={Boolean(deleteTargetId)}
      />
      <FloatingAddButton
        label="เพิ่มรายการรายจ่าย"
        onClick={() => {
          setEditingId(null);
          setDialogOpen(true);
        }}
      />
    </CalculatorLayout>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6 text-center">
      <p className="font-medium">ยังไม่มีรายการ{label}</p>
    </div>
  );
}

function DeleteDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <dialog
      aria-labelledby="delete-entry-title"
      className="border-border bg-card m-auto rounded-2xl border p-6 shadow-xl backdrop:bg-black/50"
      open
    >
      <h2 className="font-bold" id="delete-entry-title">
        ยืนยันการลบรายการ
      </h2>
      <div className="mt-4 flex gap-2">
        <Button onClick={onCancel} type="button" variant="secondary">
          ยกเลิก
        </Button>
        <Button onClick={onConfirm} type="button" variant="danger">
          ลบ
        </Button>
      </div>
    </dialog>
  );
}

function FloatingAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="fixed right-4 bottom-24 z-30 lg:hidden">
      <Button
        aria-label={label}
        className="shadow-lg"
        onClick={onClick}
        size="icon"
        type="button"
      >
        <Plus aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}

function EntryCards({
  entries,
  periodStart,
  periodEnd,
  renderMeta,
  onEdit,
  onDelete,
}: {
  entries: ExpenseEntry[];
  periodStart: string;
  periodEnd: string;
  renderMeta: (entry: ExpenseEntry) => React.ReactNode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li
          className="border-border bg-card rounded-2xl border p-4 shadow-sm"
          key={entry.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {renderMeta(entry)}
              <p className="text-muted-foreground mt-1 text-sm">
                {formatEntryPeriod(entry)}
              </p>
              {!isEntryWithinPeriod(entry, periodStart, periodEnd) ? (
                <p className="text-warning-strong mt-1 text-xs font-medium">
                  อยู่นอกช่วงที่เลือก
                </p>
              ) : null}
            </div>
            <p className="font-semibold">
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
              <Pencil aria-hidden="true" className="size-4" />
              แก้ไข
            </Button>
            <Button
              className="flex-1"
              onClick={() => onDelete(entry.id)}
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              ลบ
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
