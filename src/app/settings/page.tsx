import { SettingsPanel } from "@/components/account/settings-panel";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="เลือกสำรองข้อมูล ใช้งานหลายอุปกรณ์ หรือลบข้อมูลสำรอง"
        eyebrow="บัญชีของฉัน"
        title="การสำรองข้อมูล"
      />
      <SettingsPanel />
    </div>
  );
}
