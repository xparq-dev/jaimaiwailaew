"use client";

import { AlertTriangle, ShieldBan } from "lucide-react";

import { useCalculatorStore } from "@/calculator/store";

export function TaxEstimateUnavailableCard() {
  const workspace = useCalculatorStore((state) => state.workspace);

  if (!workspace) {
    return null;
  }

  const snapshot = workspace.taxRuleResolutionSnapshot;

  return (
    <section
      aria-labelledby="tax-estimate-unavailable-title"
      className="border-warning/30 bg-warning-soft rounded-2xl border p-5"
    >
      <div className="flex items-start gap-3">
        <ShieldBan
          aria-hidden="true"
          className="text-warning-strong mt-0.5 size-5 shrink-0"
        />
        <div className="space-y-3">
          <div>
            <h2
              className="text-warning-strong text-lg font-bold"
              id="tax-estimate-unavailable-title"
            >
              ยังไม่พร้อมคำนวณภาษีประมาณการ
            </h2>
            <p className="text-warning-strong mt-2 text-sm leading-6">
              กฎภาษีของปีที่เลือกยังอยู่ระหว่างการตรวจสอบ จึงยังไม่แสดงยอดภาษี
              ยอดขอคืน หรือยอดที่ต้องชำระ
            </p>
          </div>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Tax Rule Set</dt>
              <dd className="font-mono text-sm">
                {snapshot.ruleSetId ?? "ไม่พบ rule set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-mono text-sm">
                {snapshot.ruleSetVersion ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="font-mono text-sm">{snapshot.availability}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-mono text-sm">unverified</dd>
            </div>
          </dl>
          <p className="text-warning-strong flex items-start gap-2 text-sm leading-6">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              ระบบจะไม่แสดงตัวเลขภาษี placeholder หรือ 0 บาท
              จนกว่ากฎจะผ่านการตรวจสอบ
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
