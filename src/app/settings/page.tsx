import { AppearanceSettings } from "@/components/account/appearance-settings";
import { SettingsPanel } from "@/components/account/settings-panel";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="เลือกรูปแบบการแสดงผลและจัดการข้อมูลสำรองของบัญชีนี้"
        eyebrow="บัญชีของฉัน"
        title="การตั้งค่า"
      />
      <AppearanceSettings />
      <SettingsPanel />
    </div>
  );
}
