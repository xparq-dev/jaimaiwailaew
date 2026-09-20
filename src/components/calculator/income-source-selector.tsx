"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";

import { getIncomeSourceSuggestions } from "@/calculator/categories";
import type { IncomeCategoryCode } from "@/calculator/types";

import { FormField, TextInput } from "./entry-form-dialog";

export function IncomeSourceSelector({
  categoryCode,
  value,
  additionalOptions = [],
  error,
  onChange,
}: {
  readonly categoryCode: IncomeCategoryCode;
  readonly value: string;
  readonly additionalOptions?: readonly string[];
  readonly error?: string | undefined;
  readonly onChange: (value: string) => void;
}) {
  const options = useMemo(
    () =>
      [
        ...getIncomeSourceSuggestions(categoryCode),
        ...additionalOptions,
      ].filter((option, index, all) => option && all.indexOf(option) === index),
    [additionalOptions, categoryCode],
  );
  const hasSelectedOption = options.includes(value);

  return (
    <FormField
      error={error}
      hint="ระบบเลือกคำแนะนำแรกให้ตามหมวดหมู่ คุณยกเลิก เลือกตัวเลือกอื่น หรือพิมพ์แหล่งรายได้เองได้"
      id="income-source"
      label="แหล่งรายได้ (ไม่บังคับ)"
    >
      <div className="flex flex-wrap gap-2" role="group">
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <label
              className={`focus-within:ring-focus/35 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition focus-within:ring-3 ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
              key={option}
            >
              <input
                aria-label={`เลือกแหล่งรายได้ ${option}`}
                checked={isSelected}
                className="sr-only"
                onChange={() => onChange(isSelected ? "" : option)}
                type="checkbox"
              />
              <span
                aria-hidden="true"
                className={`grid size-4 place-items-center rounded border ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card"
                }`}
              >
                {isSelected ? <Check className="size-3" /> : null}
              </span>
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      <TextInput
        id="income-source"
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        placeholder="หรือพิมพ์แหล่งรายได้อื่น"
        value={hasSelectedOption ? "" : value}
      />
    </FormField>
  );
}
