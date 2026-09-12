"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  withholdingEntryFormSchema,
  type WithholdingEntryFormValues,
} from "@/calculator/schemas";
import { useCalculatorStore } from "@/calculator/store";
import { formatThaiDate, isDateWithinPeriod } from "@/calculator/utils";
import { sortEntriesByDateDesc } from "@/calculator/workspace";
import { Button } from "@/components/ui/button";
import { formatThaiBaht } from "@/tax/money";

import { CalculatorLayout } from "./calculator-layout";
import {
  EntryFormDialog,
  FormField,
  TextAreaInput,
  TextInput,
} from "./entry-form-dialog";

const emptyForm: WithholdingEntryFormValues = {
  occurredOn: "",
  payerName: "",
  certificateReference: "",
  amount: "",
  note: "",
};

export function WithholdingSectionPage() {
  const workspace = useCalculatorStore((state) => state.workspace);
  const addWithholdingEntry = useCalculatorStore(
    (state) => state.addWithholdingEntry,
  );
  const updateWithholdingEntry = useCalculatorStore(
    (state) => state.updateWithholdingEntry,
  );
  const deleteWithholdingEntry = useCalculatorStore(
    (state) => state.deleteWithholdingEntry,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const entries = useMemo(() => {
    if (!workspace) {
      return [];
    }
    return sortEntriesByDateDesc(workspace.withholdingEntries);
  }, [workspace]);

  const defaultValues = useMemo(() => {
    if (!editingId || !workspace) {
      return {
        ...emptyForm,
        occurredOn: workspace?.periodStart ?? "",
      };
    }

    const entry = workspace.withholdingEntries.find(
      (item) => item.id === editingId,
    );
    if (!entry) {
      return emptyForm;
    }

    return {
      occurredOn: entry.occurredOn,
      payerName: entry.payerName ?? "",
      certificateReference: entry.certificateReference ?? "",
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
      description="บันทึกภาษีที่ถูกหักไว้ตามหนังสือรับรอง (50 ทวิ) เพื่อรวบรวมข้อมูลในอุปกรณ์"
      title="ภาษีหัก ณ ที่จ่าย"
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p className="text-muted-foreground text-sm leading-6">
        บันทึกรายการภาษีหัก ณ ที่จ่ายตามเอกสารอ้างอิงที่มี
        เพื่อใช้สรุปยอดเลขคณิตในอุปกรณ์
        ระบบไม่ได้ตรวจสอบหรือรับรองความถูกต้องของเอกสารภาษี
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
          <p className="font-medium">ยังไม่มีรายการภาษีหัก ณ ที่จ่าย</p>
          <p className="text-muted-foreground mt-2 text-sm">
            เพิ่มรายการตามเอกสารอ้างอิงเพื่อรวมยอดภาษีที่ถูกหักไว้
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
                    ผู้จ่ายเงิน
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    เลขอ้างอิงเอกสารภาษีหัก ณ ที่จ่าย (ถ้ามี)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    ยอดภาษีที่หัก
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
                      <td className="px-4 py-3">{entry.payerName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {entry.certificateReference ?? "—"}
                      </td>
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
            {entries.map((entry) => {
              const inPeriod = isDateWithinPeriod(
                entry.occurredOn,
                workspace.periodStart,
                workspace.periodEnd,
              );
              return (
                <li
                  className="border-border bg-card rounded-2xl border p-4 shadow-sm"
                  key={entry.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {entry.payerName || "ไม่ระบุผู้จ่าย"}
                      </p>
                      {entry.certificateReference ? (
                        <p className="text-muted-foreground text-xs">
                          เลขที่: {entry.certificateReference}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatThaiDate(entry.occurredOn)}
                      </p>
                      {!inPeriod ? (
                        <p className="text-warning-strong mt-1 text-xs">
                          อยู่นอกช่วงที่เลือก
                        </p>
                      ) : null}
                    </div>
                    <p className="text-primary font-semibold">
                      {formatThaiBaht(entry.amountSatang)}
                    </p>
                  </div>
                  {entry.note ? (
                    <p className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                      {entry.note}
                    </p>
                  ) : null}
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
                      <Pencil aria-hidden="true" className="size-4" />
                      แก้ไข
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setDeleteTargetId(entry.id)}
                      type="button"
                      variant="danger"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      ลบ
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Floating Add Button on mobile */}
      <div className="fixed right-4 bottom-20 z-30 lg:hidden">
        <Button
          aria-label="เพิ่มรายการภาษีหัก ณ ที่จ่าย"
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

      <EntryFormDialog<WithholdingEntryFormValues>
        defaultValues={defaultValues}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => {
          const error = editingId
            ? updateWithholdingEntry(editingId, values)
            : addWithholdingEntry(values);
          if (!error) {
            setAnnouncement(
              editingId ? "แก้ไขรายการเรียบร้อย" : "เพิ่มรายการเรียบร้อย",
            );
          }
          return error;
        }}
        open={dialogOpen}
        schema={withholdingEntryFormSchema}
        submitLabel={editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
        title={editingId ? "แก้ไขภาษีหัก ณ ที่จ่าย" : "เพิ่มภาษีหัก ณ ที่จ่าย"}
      >
        {(form) => (
          <>
            <FormField
              error={form.formState.errors.occurredOn?.message}
              id="withholding-date"
              label="วันที่"
            >
              <TextInput
                id="withholding-date"
                type="date"
                {...form.register("occurredOn")}
              />
            </FormField>
            <FormField
              id="withholding-payer"
              label="ผู้จ่ายเงิน / บริษัท (ไม่บังคับ)"
            >
              <TextInput
                id="withholding-payer"
                placeholder="เช่น บริษัท ลูกค้า จำกัด"
                {...form.register("payerName")}
              />
            </FormField>
            <FormField
              hint="ระบบไม่ได้ตรวจสอบหรือรับรองความถูกต้องของเอกสารภาษี"
              id="withholding-ref"
              label="เลขอ้างอิงเอกสารภาษีหัก ณ ที่จ่าย (ถ้ามี)"
            >
              <TextInput
                id="withholding-ref"
                placeholder="เช่น REF-2026-001"
                {...form.register("certificateReference")}
              />
            </FormField>
            <FormField
              error={form.formState.errors.amount?.message}
              id="withholding-amount"
              label="ยอดภาษีที่ถูกหัก (บาท)"
            >
              <TextInput
                id="withholding-amount"
                inputMode="decimal"
                placeholder="0.00"
                {...form.register("amount")}
              />
            </FormField>
            <FormField id="withholding-note" label="หมายเหตุ (ไม่บังคับ)">
              <TextAreaInput
                id="withholding-note"
                placeholder="รายละเอียดเพิ่มเติม"
                {...form.register("note")}
              />
            </FormField>
          </>
        )}
      </EntryFormDialog>

      {deleteTargetId ? (
        <dialog
          aria-labelledby="delete-withholding-title"
          className="border-border bg-card m-auto rounded-2xl border p-6 shadow-xl backdrop:bg-black/50"
          open
        >
          <h2 className="font-bold" id="delete-withholding-title">
            ยืนยันการลบรายการ
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ ข้อมูลจะถูกลบออกจากอุปกรณ์ทันที
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={() => setDeleteTargetId(null)}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                deleteWithholdingEntry(deleteTargetId);
                setDeleteTargetId(null);
                setAnnouncement("ลบรายการเรียบร้อยแล้ว");
              }}
              type="button"
              variant="danger"
            >
              ยืนยันลบ
            </Button>
          </div>
        </dialog>
      ) : null}
    </CalculatorLayout>
  );
}
