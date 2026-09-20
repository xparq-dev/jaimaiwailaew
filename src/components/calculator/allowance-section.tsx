"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  ALLOWANCE_DRAFT_CATEGORY_OPTIONS,
  getAllowanceCategoryLabel,
} from "@/calculator/categories";
import {
  allowanceDraftEntryFormSchema,
  type AllowanceDraftEntryFormValues,
} from "@/calculator/schemas";
import { useCalculatorStore } from "@/calculator/store";
import { calculateWorkspaceSocialSecurity } from "@/calculator/social-security";
import type { SocialSecurityCalculationMode } from "@/calculator/types";
import { Button } from "@/components/ui/button";
import { formatThaiBaht } from "@/tax/money";

import { CalculatorLayout } from "./calculator-layout";
import {
  EntryFormDialog,
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "./entry-form-dialog";

const emptyForm: AllowanceDraftEntryFormValues = {
  categoryCode: "personal_draft",
  amount: "",
  note: "",
};

export function AllowanceSectionPage() {
  const workspace = useCalculatorStore((state) => state.workspace);
  const addAllowanceDraftEntry = useCalculatorStore(
    (state) => state.addAllowanceDraftEntry,
  );
  const updateAllowanceDraftEntry = useCalculatorStore(
    (state) => state.updateAllowanceDraftEntry,
  );
  const deleteAllowanceDraftEntry = useCalculatorStore(
    (state) => state.deleteAllowanceDraftEntry,
  );
  const updateSocialSecuritySettings = useCalculatorStore(
    (state) => state.updateSocialSecuritySettings,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [socialSecurityModeDraft, setSocialSecurityModeDraft] =
    useState<SocialSecurityCalculationMode | null>(null);
  const [manualSocialSecurityAmountDraft, setManualSocialSecurityAmountDraft] =
    useState<string | null>(null);
  const [socialSecurityError, setSocialSecurityError] = useState("");

  const entries = useMemo(() => {
    if (!workspace) {
      return [];
    }
    return workspace.allowanceDraftEntries;
  }, [workspace]);

  const defaultValues = useMemo(() => {
    if (!editingId || !workspace) {
      return emptyForm;
    }

    const entry = workspace.allowanceDraftEntries.find(
      (item) => item.id === editingId,
    );
    if (!entry) {
      return emptyForm;
    }

    return {
      categoryCode: entry.categoryCode,
      amount:
        entry.declaredAmountSatang !== undefined
          ? (entry.declaredAmountSatang / 100).toFixed(2)
          : "",
      note: entry.note ?? "",
    };
  }, [editingId, workspace]);

  if (!workspace) {
    return null;
  }

  const socialSecurity = calculateWorkspaceSocialSecurity(workspace);
  const socialSecurityMode =
    socialSecurityModeDraft ?? workspace.socialSecuritySettings.mode;
  const manualSocialSecurityAmount =
    manualSocialSecurityAmountDraft ??
    (workspace.socialSecuritySettings.mode === "manual"
      ? (
          workspace.socialSecuritySettings.manualContributionSatang / 100
        ).toFixed(2)
      : "");

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
      description="รวบรวมรายการและยอดค่าลดหย่อนแบบร่างตามที่ผู้ใช้ประเมินเอง"
      title="ค่าลดหย่อน (แบบร่าง)"
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Prominent Disclaimer */}
      <div className="border-warning/30 bg-warning-soft text-warning-strong rounded-2xl border p-4 text-sm leading-6">
        <strong>ข้อสำคัญ:</strong> ระบบนำค่าลดหย่อนบางประเภทไปใช้ประมาณการภาษี
        แต่ไม่ใช่คำวินิจฉัยหรือการอนุมัติสิทธิทางภาษี
        โปรดตรวจสอบยอดจริงและหลักฐานก่อนยื่นภาษี
      </div>

      <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">เงินสมทบประกันสังคม</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              รายรับต้องกรอกเป็นยอดก่อนหัก
              ระบบจะนำเงินสมทบส่วนนี้ไปเป็นค่าลดหย่อนแยกต่างหาก
            </p>
          </div>
          <p className="text-primary text-lg font-bold">
            {formatThaiBaht(socialSecurity.contributionSatang)}
          </p>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const error = updateSocialSecuritySettings({
              mode: socialSecurityMode,
              manualAmount:
                socialSecurityMode === "manual"
                  ? manualSocialSecurityAmount
                  : undefined,
            });
            setSocialSecurityError(error ?? "");
            if (!error) {
              setSocialSecurityModeDraft(null);
              setManualSocialSecurityAmountDraft(null);
            }
            setAnnouncement(
              error ?? "บันทึกการตั้งค่าประกันสังคมเรียบร้อยแล้ว",
            );
          }}
        >
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">วิธีคำนวณประกันสังคม</legend>
            {[
              {
                value: "none" as const,
                label: "ไม่ใช้สิทธิ",
                description:
                  "ไม่เป็นผู้ประกันตน หรือยังไม่ต้องการนำยอดนี้มาคำนวณ",
              },
              {
                value: "auto_m33" as const,
                label: "ม.33 อัตโนมัติ",
                description: "คำนวณ 5% จากเงินเดือนรายเดือนตามเพดานของปีภาษี",
              },
              {
                value: "manual" as const,
                label: "กรอกยอดจริงเอง",
                description: "เหมาะกับผู้ที่มีสลิปหรือยอดสมทบสะสมจริง",
              },
            ].map((option) => (
              <label
                className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                  socialSecurityMode === option.value
                    ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
                key={option.value}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <input
                    checked={socialSecurityMode === option.value}
                    name="social-security-mode"
                    onChange={() => setSocialSecurityModeDraft(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  {option.label}
                </span>
                <span className="text-muted-foreground mt-2 block leading-5">
                  {option.description}
                </span>
              </label>
            ))}
          </fieldset>

          {socialSecurityMode === "manual" ? (
            <FormField
              hint={`กรอกยอดที่จ่ายจริงในช่วงเวลาที่เลือก สูงสุด ${socialSecurity.annualContributionCeilingBaht.toLocaleString("th-TH")} บาทต่อปี`}
              id="social-security-manual-amount"
              label="ยอดเงินสมทบที่จ่ายจริง (บาท)"
            >
              <TextInput
                id="social-security-manual-amount"
                inputMode="decimal"
                onChange={(event) =>
                  setManualSocialSecurityAmountDraft(event.target.value)
                }
                placeholder="เช่น 10500.00"
                value={manualSocialSecurityAmount}
              />
            </FormField>
          ) : null}

          {socialSecurityMode === "auto_m33" ? (
            <div className="border-border bg-muted/30 rounded-xl border p-4 text-sm leading-6">
              <p>
                พบเงินเดือนแบบรายเดือน {socialSecurity.salaryMonthsIncluded}{" "}
                เดือน ระบบจะนับเฉพาะรายการหมวด “เงินเดือน / ค่าจ้างประจำ”
                ที่ระบุเดือน
              </p>
              {socialSecurity.hasOneTimeSalaryEntries ? (
                <p className="text-warning-strong mt-1">
                  มีรายการเงินเดือนแบบครั้งเดียว
                  ระบบไม่สามารถอนุมานจำนวนเดือนได้
                  โปรดเปลี่ยนเป็นรายการรายเดือนหรือเลือกกรอกยอดจริงเอง
                </p>
              ) : null}
            </div>
          ) : null}

          {socialSecurityError ? (
            <p className="text-danger text-sm" role="alert">
              {socialSecurityError}
            </p>
          ) : null}

          <Button type="submit">บันทึกการตั้งค่าประกันสังคม</Button>
        </form>
      </section>

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
          <p className="font-medium">ยังไม่มีรายการค่าลดหย่อนแบบร่าง</p>
          <p className="text-muted-foreground mt-2 text-sm">
            บันทึกรายการที่วางแผนจะใช้สิทธิ เช่น ค่าลดหย่อนส่วนตัว ประกันชีวิต
            กองทุน หรือบริจาค
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden overflow-x-auto lg:block">
            <table className="border-border w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-2xl border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    หมวดหมู่ค่าลดหย่อน
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    หมายเหตุ
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    ยอดที่ระบุ (บาท)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    การทำงาน
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr className="border-border border-t" key={entry.id}>
                    <td className="px-4 py-3 font-medium">
                      {getAllowanceCategoryLabel(entry.categoryCode)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {entry.note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {entry.declaredAmountSatang !== undefined
                        ? formatThaiBaht(entry.declaredAmountSatang)
                        : "ไม่ระบุจำนวน"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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
                ))}
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
                      {getAllowanceCategoryLabel(entry.categoryCode)}
                    </p>
                    {entry.note ? (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-primary font-semibold">
                    {entry.declaredAmountSatang !== undefined
                      ? formatThaiBaht(entry.declaredAmountSatang)
                      : "ไม่ระบุจำนวน"}
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
            ))}
          </ul>
        </div>
      )}

      {/* Floating Add Button on mobile */}
      <div className="fixed right-4 bottom-20 z-30 lg:hidden">
        <Button
          aria-label="เพิ่มรายการค่าลดหย่อนแบบร่าง"
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

      <EntryFormDialog<AllowanceDraftEntryFormValues>
        defaultValues={defaultValues}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => {
          const error = editingId
            ? updateAllowanceDraftEntry(editingId, values)
            : addAllowanceDraftEntry(values);
          if (!error) {
            setAnnouncement(
              editingId ? "แก้ไขรายการเรียบร้อย" : "เพิ่มรายการเรียบร้อย",
            );
          }
          return error;
        }}
        open={dialogOpen}
        schema={allowanceDraftEntryFormSchema}
        submitLabel={editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
        title={editingId ? "แก้ไขค่าลดหย่อนแบบร่าง" : "เพิ่มค่าลดหย่อนแบบร่าง"}
      >
        {(form) => (
          <>
            <FormField
              error={form.formState.errors.categoryCode?.message}
              id="allowance-category"
              label="ประเภทค่าลดหย่อน"
            >
              <SelectInput
                id="allowance-category"
                {...form.register("categoryCode")}
              >
                {ALLOWANCE_DRAFT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField
              error={form.formState.errors.amount?.message}
              hint="ระบุจำนวนเงินที่คาดว่าจะใช้สิทธิ หรือเว้นว่างไว้ได้"
              id="allowance-amount"
              label="จำนวนเงินที่ระบุ (บาท - ไม่บังคับ)"
            >
              <TextInput
                id="allowance-amount"
                inputMode="decimal"
                placeholder="เช่น 60000.00 หรือเว้นว่าง"
                {...form.register("amount")}
              />
            </FormField>
            <FormField id="allowance-note" label="หมายเหตุ (ไม่บังคับ)">
              <TextAreaInput
                id="allowance-note"
                placeholder="เช่น รายละเอียดสิทธิ หรือเงื่อนไขเพิ่มเติม"
                {...form.register("note")}
              />
            </FormField>
          </>
        )}
      </EntryFormDialog>

      {deleteTargetId ? (
        <dialog
          aria-labelledby="delete-allowance-title"
          className="border-border bg-card m-auto rounded-2xl border p-6 shadow-xl backdrop:bg-black/50"
          open
        >
          <h2 className="font-bold" id="delete-allowance-title">
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
                deleteAllowanceDraftEntry(deleteTargetId);
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
