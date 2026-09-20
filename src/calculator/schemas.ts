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
  ENTRY_FREQUENCIES,
  EXPENSE_CATEGORY_CODES,
  EXPENSE_TAX_RELEVANCE_STATUSES,
  INCOME_CATEGORY_CODES,
  SOCIAL_SECURITY_CALCULATION_MODES,
} from "./types";

export const CALCULATOR_STORAGE_KEY_V1 = "jaimaiwailaew:calculator:v1";
export const CALCULATOR_STORAGE_KEY_V2 = "jaimaiwailaew:calculator:v2";
export const CALCULATOR_STORAGE_KEY = CALCULATOR_STORAGE_KEY_V2;

export const MAX_NOTE_LENGTH = 500;
export const MAX_SOURCE_NAME_LENGTH = 120;
export const MAX_REPORT_NAME_LENGTH = 80;

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/, {
    message: "วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD",
  });

export const isoMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, {
    message: "เดือนต้องอยู่ในรูปแบบ YYYY-MM",
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

// --- V2 Entry Schemas (Discriminated Union on entryFrequency) ---

const oneTimeIncomeEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("one_time"),
  occurredOn: isoDateSchema,
  occurredMonth: z.null(),
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

const monthlyIncomeEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("monthly"),
  occurredOn: z.null(),
  occurredMonth: isoMonthSchema,
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

export const incomeEntrySchema = z.discriminatedUnion("entryFrequency", [
  oneTimeIncomeEntrySchema,
  monthlyIncomeEntrySchema,
]);

const oneTimeExpenseEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("one_time"),
  occurredOn: isoDateSchema,
  occurredMonth: z.null(),
  categoryCode: z.enum(EXPENSE_CATEGORY_CODES),
  amountSatang: moneySatangSchema,
  taxRelevanceStatus: z.enum(EXPENSE_TAX_RELEVANCE_STATUSES),
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const monthlyExpenseEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("monthly"),
  occurredOn: z.null(),
  occurredMonth: isoMonthSchema,
  categoryCode: z.enum(EXPENSE_CATEGORY_CODES),
  amountSatang: moneySatangSchema,
  taxRelevanceStatus: z.enum(EXPENSE_TAX_RELEVANCE_STATUSES),
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const expenseEntrySchema = z.discriminatedUnion("entryFrequency", [
  oneTimeExpenseEntrySchema,
  monthlyExpenseEntrySchema,
]);

const oneTimeWithholdingEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("one_time"),
  occurredOn: isoDateSchema,
  occurredMonth: z.null(),
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

const monthlyWithholdingEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  entryFrequency: z.literal("monthly"),
  occurredOn: z.null(),
  occurredMonth: isoMonthSchema,
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

export const withholdingEntrySchema = z.discriminatedUnion("entryFrequency", [
  oneTimeWithholdingEntrySchema,
  monthlyWithholdingEntrySchema,
]);

export const allowanceDraftEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  categoryCode: z.enum(ALLOWANCE_DRAFT_CATEGORY_CODES),
  declaredAmountSatang: optionalMoneySatangSchema,
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const socialSecuritySettingsSchema = z
  .discriminatedUnion("mode", [
    z.strictObject({ mode: z.literal("none") }),
    z.strictObject({ mode: z.literal("auto_m33") }),
    z.strictObject({
      mode: z.literal("manual"),
      manualContributionSatang: moneySatangSchema,
    }),
  ])
  .default({ mode: "none" });

export const taxRuleResolutionSnapshotSchema = z.strictObject({
  taxYearBE: z.number().int(),
  ruleSetId: z.union([z.string().trim().min(1), z.null()]),
  ruleSetVersion: z.union([z.string().trim().min(1), z.null()]),
  availability: z.string().trim().min(1),
  status: z.string().trim().min(1).optional(),
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
  socialSecuritySettings: socialSecuritySettingsSchema,
  taxRuleResolutionSnapshot: taxRuleResolutionSnapshotSchema,
  localOnly: z.literal(true),
});

export const persistedCalculatorStateSchema = z.strictObject({
  workspace: z.union([calculatorWorkspaceSchema, z.null()]),
  lastSavedAt: z.union([timestampSchema, z.null()]),
});

// --- Legacy V1 Schemas for Migration ---

export const legacyV1IncomeEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  occurredOn: isoDateSchema,
  categoryCode: z.enum(INCOME_CATEGORY_CODES),
  sourceName: z.string().trim().max(MAX_SOURCE_NAME_LENGTH).optional(),
  amountSatang: moneySatangSchema,
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const legacyV1ExpenseEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  occurredOn: isoDateSchema,
  categoryCode: z.enum(EXPENSE_CATEGORY_CODES),
  amountSatang: moneySatangSchema,
  taxRelevanceStatus: z.enum(EXPENSE_TAX_RELEVANCE_STATUSES),
  note: noteSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const legacyV1WithholdingEntrySchema = z.strictObject({
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

export const legacyV1CalculatorWorkspaceSchema = z.strictObject({
  id: z.string().trim().min(1),
  schemaVersion: z.literal(1),
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
  incomeEntries: z.array(legacyV1IncomeEntrySchema),
  expenseEntries: z.array(legacyV1ExpenseEntrySchema),
  withholdingEntries: z.array(legacyV1WithholdingEntrySchema),
  allowanceDraftEntries: z.array(allowanceDraftEntrySchema),
  taxRuleResolutionSnapshot: taxRuleResolutionSnapshotSchema,
  localOnly: z.literal(true),
});

export const legacyV1PersistedCalculatorStateSchema = z.strictObject({
  workspace: z.union([legacyV1CalculatorWorkspaceSchema, z.null()]),
  lastSavedAt: z.union([timestampSchema, z.null()]),
});

// --- Forms with Frequency Toggle ---

export const incomeEntryFormSchema = z
  .object({
    entryFrequency: z.enum(ENTRY_FREQUENCIES, {
      message: "กรุณาเลือกรูปแบบรายการ",
    }),
    occurredOn: z.string().trim().optional(),
    occurredMonth: z.string().trim().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.entryFrequency === "one_time") {
      if (
        !data.occurredOn ||
        !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(
          data.occurredOn,
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่เกิดรายการ (YYYY-MM-DD)",
          path: ["occurredOn"],
        });
      }
    } else if (data.entryFrequency === "monthly") {
      if (
        !data.occurredMonth ||
        !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(data.occurredMonth)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุเดือนที่เกิดรายการ (YYYY-MM)",
          path: ["occurredMonth"],
        });
      }
    }
  });

export const expenseEntryFormSchema = z
  .object({
    entryFrequency: z.enum(ENTRY_FREQUENCIES, {
      message: "กรุณาเลือกรูปแบบรายการ",
    }),
    occurredOn: z.string().trim().optional(),
    occurredMonth: z.string().trim().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.entryFrequency === "one_time") {
      if (
        !data.occurredOn ||
        !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(
          data.occurredOn,
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่เกิดรายการ (YYYY-MM-DD)",
          path: ["occurredOn"],
        });
      }
    } else if (data.entryFrequency === "monthly") {
      if (
        !data.occurredMonth ||
        !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(data.occurredMonth)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุเดือนที่เกิดรายการ (YYYY-MM)",
          path: ["occurredMonth"],
        });
      }
    }
  });

export const withholdingEntryFormSchema = z
  .object({
    entryFrequency: z.enum(ENTRY_FREQUENCIES, {
      message: "กรุณาเลือกรูปแบบรายการ",
    }),
    occurredOn: z.string().trim().optional(),
    occurredMonth: z.string().trim().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.entryFrequency === "one_time") {
      if (
        !data.occurredOn ||
        !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(
          data.occurredOn,
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุวันที่เกิดรายการ (YYYY-MM-DD)",
          path: ["occurredOn"],
        });
      }
    } else if (data.entryFrequency === "monthly") {
      if (
        !data.occurredMonth ||
        !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(data.occurredMonth)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุเดือนที่เกิดรายการ (YYYY-MM)",
          path: ["occurredMonth"],
        });
      }
    }
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

export const socialSecuritySettingsFormSchema = z
  .strictObject({
    mode: z.enum(SOCIAL_SECURITY_CALCULATION_MODES),
    manualAmount: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "manual") {
      return;
    }

    if (!data.manualAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุยอดประกันสังคมที่จ่ายจริง",
        path: ["manualAmount"],
      });
      return;
    }

    if (!/^\d+(?:\.\d{1,2})?$/.test(data.manualAmount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "รูปแบบจำนวนเงินไม่ถูกต้อง",
        path: ["manualAmount"],
      });
    }
  });

export type IncomeEntryFormValues = z.infer<typeof incomeEntryFormSchema>;
export type ExpenseEntryFormValues = z.infer<typeof expenseEntryFormSchema>;
export type WithholdingEntryFormValues = z.infer<
  typeof withholdingEntryFormSchema
>;
export type AllowanceDraftEntryFormValues = z.infer<
  typeof allowanceDraftEntryFormSchema
>;
export type SocialSecuritySettingsFormValues = z.infer<
  typeof socialSecuritySettingsFormSchema
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
