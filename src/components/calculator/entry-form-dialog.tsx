"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodType } from "zod";

import { Button } from "@/components/ui/button";

interface EntryFormDialogProps<TFieldValues extends FieldValues> {
  readonly open: boolean;
  readonly title: string;
  readonly submitLabel: string;
  readonly schema: ZodType<TFieldValues>;
  readonly defaultValues: TFieldValues;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (
    values: TFieldValues,
  ) => Promise<string | null> | string | null;
  readonly children: (
    form: UseFormReturn<TFieldValues, unknown, TFieldValues>,
  ) => React.ReactNode;
}

export function EntryFormDialog<TFieldValues extends FieldValues>({
  open,
  title,
  submitLabel,
  schema,
  defaultValues,
  onOpenChange,
  onSubmit,
  children,
}: EntryFormDialogProps<TFieldValues>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const form = useForm<TFieldValues, unknown, TFieldValues>({
    resolver: zodResolver(schema as never) as unknown as Resolver<
      TFieldValues,
      unknown,
      TFieldValues
    >,
    defaultValues: defaultValues as DefaultValues<TFieldValues>,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      dialog.showModal();
      cancelRef.current?.focus();
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className="border-border bg-card text-foreground m-0 mt-auto max-h-[92dvh] w-full rounded-t-3xl border p-0 shadow-2xl backdrop:bg-black/55 sm:m-auto sm:w-[min(calc(100%_-_2rem),38rem)] sm:rounded-3xl"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <form
        className="max-h-[92dvh] space-y-5 overflow-y-auto p-5 sm:p-7"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          const errorMessage = await onSubmit(values);
          if (errorMessage) {
            form.setError("root", { message: errorMessage });
            return;
          }
          onOpenChange(false);
        })}
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight" id={titleId}>
            {title}
          </h2>
        </div>
        {children(form)}
        {form.formState.errors.root?.message ? (
          <p className="text-danger text-sm" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <div className="border-border bg-card/95 sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t px-5 py-4 backdrop-blur sm:-mx-7 sm:-mb-7 sm:flex-row sm:justify-end sm:px-7">
          <Button
            onClick={() => onOpenChange(false)}
            ref={cancelRef}
            type="button"
            variant="secondary"
          >
            ยกเลิก
          </Button>
          <Button disabled={form.formState.isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="text-foreground block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-muted-foreground text-xs leading-5" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-danger text-sm" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      autoComplete={props.autoComplete ?? "off"}
      className="border-border bg-card focus-visible:ring-focus/35 focus-visible:border-focus min-h-12 w-full rounded-xl border px-3.5 text-sm shadow-inner shadow-black/[0.02] transition-colors focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className="border-border bg-card focus-visible:ring-focus/35 focus-visible:border-focus min-h-12 w-full rounded-xl border px-3.5 text-sm shadow-inner shadow-black/[0.02] focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}

export function TextAreaInput(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      autoComplete="off"
      className="border-border bg-card focus-visible:ring-focus/35 focus-visible:border-focus min-h-28 w-full rounded-xl border px-3.5 py-3 text-sm shadow-inner shadow-black/[0.02] focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}
