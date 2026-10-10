import type { Metadata } from "next";

import { AdminAuditAccess } from "@/components/admin/admin-audit-access";

export const metadata: Metadata = {
  title: "ประวัติการดำเนินการ | จ่ายไม่ไหวแล้ว",
  description: "ตรวจเหตุการณ์สำคัญในพื้นที่ผู้ดูแลระบบ",
};

export default function AdminAuditPage() {
  return <AdminAuditAccess />;
}
