import { AccountDashboard } from "@/components/account/account-dashboard";
import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ดูบัญชี สถานะข้อมูล และ Workspace ในอุปกรณ์นี้ พร้อมกลับไปทำงานต่อหรือจัดการ Cloud Sync ได้จากที่เดียว"
        eyebrow="ข้อมูลบัญชี"
        title="ภาพรวมบัญชีและข้อมูล"
      />
      <AccountDashboard />
    </div>
  );
}
