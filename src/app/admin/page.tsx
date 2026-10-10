import type { Metadata } from "next";

import { AdminDashboardAccess } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "ศูนย์จัดการระบบ | จ่ายไม่ไหวแล้ว",
  description: "พื้นที่ทำงานสำหรับผู้ดูแลระบบที่ได้รับสิทธิ์",
};

export default function AdminPage() {
  return <AdminDashboardAccess />;
}
