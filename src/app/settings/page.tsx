import { SettingsPanel } from "@/components/account/settings-panel";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="จัดการการตั้งค่าบัญชีและ Cloud Sync โดยข้อมูลในเครื่องจะยังคงใช้งานได้แม้ไม่ได้เชื่อมต่อ Cloud"
        eyebrow="Phase 1E · Privacy controls"
        title="การตั้งค่าบัญชีและ Cloud Sync"
      />
      <SettingsPanel />
    </div>
  );
}
