import { ProfileCard } from "@/components/account/profile-card";
import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ตรวจสอบบัญชีและจัดการการตั้งค่า Cloud Sync โดยข้อมูลในเครื่องจะยังคงใช้งานได้แม้ไม่ได้เชื่อมต่อ Cloud"
        eyebrow="Phase 1E · Account"
        title="โปรไฟล์"
      />
      <ProfileCard />
    </div>
  );
}
