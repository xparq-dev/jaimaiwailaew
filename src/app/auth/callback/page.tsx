import { AuthCallback } from "@/components/auth/auth-callback";
import { PageHeader } from "@/components/page-header";

export default function AuthCallbackPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ระบบกำลังตรวจสอบ session จาก Supabase Auth"
        eyebrow="Authentication"
        title="ยืนยันการเข้าสู่ระบบ"
      />
      <AuthCallback />
    </div>
  );
}
