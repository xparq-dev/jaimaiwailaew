import type { Metadata } from "next";

import { AdminAuthorityAccess } from "@/components/admin/admin-authority-access";

export const metadata: Metadata = {
  title: "ทีมและสิทธิ์ | จ่ายไม่ไหวแล้ว",
  description: "จัดการบทบาทของทีมผู้ดูแลระบบ",
};

export default function AdminAccessPage() {
  return <AdminAuthorityAccess />;
}
