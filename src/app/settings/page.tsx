import { SettingsPanel } from "@/components/account/settings-panel";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ควบคุมการสำรองข้อมูลและการแจ้งเตือนด้วยตัวคุณเอง ทุกตัวเลือกปิดไว้เป็นค่าเริ่มต้น"
        eyebrow="Phase 1E · Privacy controls"
        title="ตั้งค่า Cloud และการแจ้งเตือน"
      />
      <SettingsPanel />
    </div>
  );
}
