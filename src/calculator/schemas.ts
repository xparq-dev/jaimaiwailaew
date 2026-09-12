import { z } from "zod";

import {
  safeAddMoney,
  safeSubtractMoney,
  toMoneySatang,
  type MoneySatang,
} from "@/tax/money";

import {
  ALLOWANCE_DRAFT_CATEGORY_CODES,
  CALCULATOR_PERSONAS,
  CALCULATOR_SCHEMA_VERSION,
  EXPENSE_CATEGORY_CODES,
  EXPENSE_TAX_RELEVANCE_STATUSES,
  INCOME_CATEGORY_CODES,
} from "./types";

export const CALCULATOR_STORAGE_KEY = "jaimaiwailaew:calculator:v1";

export const MAX_NOTE_LENGTH = 500;
export const MAX_SOURCE_NAME_LENGTH = 120;
export const MAX_REPORT_NAME_LENGTH = 80;

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD",
  });

const moneySatangSchema = z
  .number()
  .int("จำนวนเงินต้องเป็นจำนวนเต็ม (สตางค์)")
  .nonnegative("จำนวนเงินต้องไม่ติดลบ")
  .max(Number.MAX_SAFE_INTEGER, "จำนวนเงินเกินขอบเขตที่รองรับ")
  .transform((value) => toMoneySatang(value));

const optionalMoneySatangSchema = z
  .union([moneySatangSchema, z.undefined()])
  .optional();

const noteSchema = z
  .string()
  .trim()
  .max(MAX_NOTE_LENGTH, `หมายเหตุต้องไม่เกิน ${MAX_NOTE_LENGTH} ตัวอักษร`)
  .refine((value) => !/<[^>]+>/.test(value), {
    message: "หมายเหตุห้ามมี HTML หรือสคริปต์",
  })
  .optional();

const timestampSchema = z.string().datetime({ offset: true });

export const incomeEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  occurredOn: isoDateSchema,
  categoryCode: z.enum(INCOME_CATEGORY_CODES),
  sourceName: z
    .string()
    .trim()
    .max(
      MAX_SOURCE_NAME_LENGTH,
      `ชื่อแหล่งรายได้ต้องไม่เกิน ${MAX_SOURCE_NAME_LENGTH} ตัวอักษร`,
    )
    .optional(),
  amountSatang: moneySatangSchema,
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const expenseEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  occurredOn: isoDateSchema,
  categoryCode: z.enum(EXPENSE_CATEGORY_CODES),
  amountSatang: moneySatangSchema,
  taxRelevanceStatus: z.enum(EXPENSE_TAX_RELEVANCE_STATUSES),
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const withholdingEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  occurredOn: isoDateSchema,
  payerName: z.string().trim().max(MAX_SOURCE_NAME_LENGTH).optional(),
  certificateReference: z
    .string()
    .trim()
    .max(MAX_SOURCE_NAME_LENGTH)
    .optional(),
  amountSatang: moneySatangSchema,
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const allowanceDraftEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  categoryCode: z.enum(ALLOWANCE_DRAFT_CATEGORY_CODES),
  declaredAmountSatang: optionalMoneySatangSchema,
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const taxRuleResolutionSnapshotSchema = z.strictObject({
  taxYearBE: z.number().int(),
  ruleSetId: z.union([z.string().trim().min(1), z.null()]),
  ruleSetVersion: z.union([z.string().trim().min(1), z.null()]),
  availability: z.string().trim().min(1),
  resolvedAt: timestampSchema,
});

export const calculatorWorkspaceSchema = z.strictObject({
  id: z.string().trim().min(1),
  schemaVersion: z.literal(CALCULATOR_SCHEMA_VERSION),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  taxYearBE: z.union([z.literal(2568), z.literal(2569)]),
  persona: z.enum(CALCULATOR_PERSONAS),
  calculationMode: z.enum([
    "pnd94",
    "pnd91",
    "annual_estimate",
    "multi_income_estimate",
  ]),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  reportName: z.string().trim().max(MAX_REPORT_NAME_LENGTH).optional(),
  incomeEntries: z.array(incomeEntrySchema),
  expenseEntries: z.array(expenseEntrySchema),
  withholdingEntries: z.array(withholdingEntrySchema),
  allowanceDraftEntries: z.array(allowanceDraftEntrySchema),
  taxRuleResolutionSnapshot: taxRuleResolutionSnapshotSchema,
  localOnly: z.literal(true),
});

export const persistedCalculatorStateSchema = z.strictObject({
  workspace: z.union([calculatorWorkspaceSchema, z.null()]),
  lastSavedAt: z.union([timestampSchema, z.null()]),
});

export const incomeEntryFormSchema = z.strictObject({
  occurredOn: isoDateSchema,
  categoryCode: z.enum(INCOME_CATEGORY_CODES, {
    message: "กรุณาเลือกประเภทรายรับ",
  }),
  sourceName: z.string().trim().max(MAX_SOURCE_NAME_LENGTH).optional(),
  amount: z
    .string()
    .trim()
    .min(1, "กรุณาระบุจำนวนเงิน")
    .regex(/^\d+(?:\.\d{1,2})?$/, "รูปแบบจำนวนเงินไม่ถูกต้อง"),
  note: noteSchema,
});

export const expenseEntryFormSchema = z.strictObject({
  occurredOn: isoDateSchema,
  categoryCode: z.enum(EXPENSE_CATEGORY_CODES, {
    message: "กรุณาเลือกประเภทรายจ่าย",
  }),
  amount: z
    .string()
    .trim()
    .min(1, "กรุณาระบุจำนวนเงิน")
    .regex(/^\d+(?:\.\d{1,2})?$/, "รูปแบบจำนวนเงินไม่ถูกต้อง"),
  taxRelevanceStatus: z.enum(EXPENSE_TAX_RELEVANCE_STATUSES, {
    message: "กรุณาเลือกสถานะการตรวจสอบ",
  }),
  note: noteSchema,
});

export const withholdingEntryFormSchema = z.strictObject({
  occurredOn: isoDateSchema,
  payerName: z.string().trim().max(MAX_SOURCE_NAME_LENGTH).optional(),
  certificateReference: z
    .string()
    .trim()
    .max(MAX_SOURCE_NAME_LENGTH)
    .optional(),
  amount: z
    .string()
    .trim()
    .min(1, "กรุณาระบุจำนวนเงิน")
    .regex(/^\d+(?:\.\d{1,2})?$/, "รูปแบบจำนวนเงินไม่ถูกต้อง"),
  note: noteSchema,
});

export const allowanceDraftEntryFormSchema = z.strictObject({
  categoryCode: z.enum(ALLOWANCE_DRAFT_CATEGORY_CODES, {
    message: "กรุณาเลือกประเภทค่าลดหย่อน",
  }),
  amount: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^\d+(?:\.\d{1,2})?$/, "รูปแบบจำนวนเงินไม่ถูกต้อง"),
    ])
    .optional(),
  note: noteSchema,
});

export type IncomeEntryFormValues = z.infer<typeof incomeEntryFormSchema>;
export type ExpenseEntryFormValues = z.infer<typeof expenseEntryFormSchema>;
export type WithholdingEntryFormValues = z.infer<
  typeof withholdingEntryFormSchema
>;
export type AllowanceDraftEntryFormValues = z.infer<
  typeof allowanceDraftEntryFormSchema
>;

export function zeroMoneySatang(): MoneySatang {
  return toMoneySatang(0);
}

export function sumMoneySatang(values: readonly MoneySatang[]): MoneySatang {
  return values.reduce(
    (total, value) => safeAddMoney(total, value),
    zeroMoneySatang(),
  );
}

export function subtractMoneySatang(
  a: ReturnType<typeof toMoneySatang>,
  b: ReturnType<typeof toMoneySatang>,
) {
  return safeSubtractMoney(a, b, { allowNegative: true });
}
