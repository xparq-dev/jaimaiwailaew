import { AuthCallback } from "@/components/auth/auth-callback";
import { PageHeader } from "@/components/page-header";

export default function AuthCallbackPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ระบบกำลังตรวจสอบข้อมูลและเตรียมบัญชีของคุณ"
        eyebrow="การเข้าสู่ระบบ"
        title="ยืนยันการเข้าสู่ระบบ"
      />
      <AuthCallback />
    </div>
  );
}
