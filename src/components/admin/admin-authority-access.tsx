"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { AdminAccessGate } from "@/components/admin/admin-tax-rule-access";
import { AuthorityPanel } from "@/components/admin/authority-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export function AdminAuthorityAccess() {
  return (
    <AdminAccessGate description="มอบหมายและถอนบทบาทของทีมดูแลระบบ">
      {({ api, roles }) => (
        <div className="space-y-7">
          <PageHeader
            actions={
              <Button asChild variant="secondary">
                <Link href="/admin">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  กลับศูนย์ผู้ดูแล
                </Link>
              </Button>
            }
            description="กำหนดเฉพาะบทบาทที่จำเป็น และบันทึกเหตุผลทุกครั้งที่เปลี่ยนสิทธิ์"
            eyebrow="พื้นที่ผู้ดูแล"
            title="ทีมและสิทธิ์"
          />
          {roles.includes("owner") ? (
            <AuthorityPanel api={api} />
          ) : (
            <section className="surface-card p-6">
              <ShieldAlert
                aria-hidden="true"
                className="text-warning-strong size-7"
              />
              <h2 className="mt-4 text-xl font-bold">เฉพาะเจ้าของระบบ</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                บัญชีของคุณมีสิทธิ์ทำงานส่วนอื่น
                แต่ไม่มีสิทธิ์เปลี่ยนบทบาทของทีม
              </p>
            </section>
          )}
        </div>
      )}
    </AdminAccessGate>
  );
}
