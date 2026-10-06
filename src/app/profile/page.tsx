import { AccountDashboard } from "@/components/account/account-dashboard";
import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ดูบัญชี ชุดข้อมูลในเครื่อง และสถานะการสำรองข้อมูล"
        eyebrow="ข้อมูลบัญชี"
        title="บัญชีและข้อมูลของฉัน"
      />
      <AccountDashboard />
    </div>
  );
}
