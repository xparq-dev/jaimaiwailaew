"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { formatThaiBaht } from "@/tax/money";
import { useCalculatorStore } from "@/calculator/store";
import {
  getIncomeCategoryLabel,
  INCOME_CATEGORY_OPTIONS,
} from "@/calculator/categories";
import {
  incomeEntryFormSchema,
  type IncomeEntryFormValues,
} from "@/calculator/schemas";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { formatThaiDate, isDateWithinPeriod } from "@/calculator/utils";
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
  occurredOn: "",
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

  const entries = useMemo(() => {
    if (!workspace) {
      return [];
    }
    return sortEntriesByDateDesc(workspace.incomeEntries);
  }, [workspace]);

  const defaultValues = useMemo(() => {
    if (!editingId || !workspace) {
      return {
        ...emptyForm,
        occurredOn: workspace?.periodStart ?? "",
      };
    }

    const entry = workspace.incomeEntries.find((item) => item.id === editingId);
    if (!entry) {
      return emptyForm;
    }

    return {
      occurredOn: entry.occurredOn,
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

      {entries.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <p className="font-medium">ยังไม่มีรายการรายรับ</p>
          <p className="text-muted-foreground mt-2 text-sm">
            เริ่มเพิ่มรายการแรกเพื่อสรุปยอดรวมในช่วงเวลาที่เลือก
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden overflow-x-auto lg:block">
            <table className="border-border w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-2xl border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">วันที่</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    หมวดหมู่
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    แหล่งรายได้
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    จำนวนเงิน
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    การทำงาน
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const inPeriod = isDateWithinPeriod(
                    entry.occurredOn,
                    workspace.periodStart,
                    workspace.periodEnd,
                  );
                  return (
                    <tr className="border-border border-t" key={entry.id}>
                      <td className="px-4 py-3">
                        {formatThaiDate(entry.occurredOn)}
                      </td>
                      <td className="px-4 py-3">
                        {getIncomeCategoryLabel(entry.categoryCode)}
                      </td>
                      <td className="px-4 py-3">{entry.sourceName ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatThaiBaht(entry.amountSatang)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!inPeriod ? (
                            <span className="text-warning-strong text-xs">
                              นอกช่วง
                            </span>
                          ) : null}
                          <Button
                            aria-label={`แก้ไขรายการ ${entry.id}`}
                            onClick={() => {
                              setEditingId(entry.id);
                              setDialogOpen(true);
                            }}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            aria-label={`ลบรายการ ${entry.id}`}
                            onClick={() => setDeleteTargetId(entry.id)}
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
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {entries.map((entry) => (
              <li
                className="border-border bg-card rounded-2xl border p-4 shadow-sm"
                key={entry.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {getIncomeCategoryLabel(entry.categoryCode)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formatThaiDate(entry.occurredOn)}
                    </p>
                    {entry.sourceName ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {entry.sourceName}
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
                    onClick={() => {
                      setEditingId(entry.id);
                      setDialogOpen(true);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    แก้ไข
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setDeleteTargetId(entry.id)}
                    type="button"
                    variant="danger"
                  >
                    ลบ
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
        {(form) => (
          <>
            <FormField
              error={form.formState.errors.occurredOn?.message}
              id="income-date"
              label="วันที่"
            >
              <TextInput
                id="income-date"
                type="date"
                {...form.register("occurredOn")}
              />
            </FormField>
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
              <TextInput id="income-source" {...form.register("sourceName")} />
            </FormField>
            <FormField
              error={form.formState.errors.amount?.message}
              id="income-amount"
              label="จำนวนเงิน (บาท)"
            >
              <TextInput
                id="income-amount"
                inputMode="decimal"
                {...form.register("amount")}
              />
            </FormField>
            <FormField id="income-note" label="หมายเหตุ (ไม่บังคับ)">
              <TextAreaInput id="income-note" {...form.register("note")} />
            </FormField>
          </>
        )}
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
