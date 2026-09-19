"use client";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PERSONA_OPTIONS } from "@/calculator/categories";
import type { CalculatorPersona } from "@/calculator/types";
import { Button } from "@/components/ui/button";

export function WorkspacePersonaEditor({
  persona,
  onSave,
}: {
  readonly persona: CalculatorPersona;
  readonly onSave: (persona: CalculatorPersona) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftPersona, setDraftPersona] = useState(persona);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogRef.current?.showModal();
  }, [open]);

  return (
    <>
      <Button
        onClick={() => {
          setDraftPersona(persona);
          setOpen(true);
        }}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Pencil aria-hidden="true" className="size-4" />
        แก้ไขประเภทผู้ใช้งาน
      </Button>

      <dialog
        aria-labelledby="workspace-persona-title"
        className="border-border bg-card text-foreground m-auto w-[min(100%,38rem)] rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          dialogRef.current?.close();
        }}
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <form
          className="space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draftPersona);
            dialogRef.current?.close();
          }}
        >
          <div>
            <h2 className="text-lg font-bold" id="workspace-persona-title">
              แก้ไขประเภทผู้ใช้งาน
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              เปลี่ยนประเภทได้โดยข้อมูลรายรับ รายจ่าย และรายการเดิมไม่ถูกลบ
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="sr-only">เลือกประเภทผู้ใช้งาน</legend>
            {PERSONA_OPTIONS.map((option) => (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                  draftPersona === option.code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
                key={option.code}
              >
                <input
                  checked={draftPersona === option.code}
                  className="mt-1"
                  name="workspace-persona"
                  onChange={() => setDraftPersona(option.code)}
                  type="radio"
                  value={option.code}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  {option.hint ? (
                    <span className="text-muted-foreground mt-1 block text-xs leading-5">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => dialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              ยกเลิก
            </Button>
            <Button type="submit">บันทึกประเภทผู้ใช้งาน</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
