import { AuthForm } from "@/components/auth/auth-form";
import { PageHeader } from "@/components/page-header";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="เข้าสู่ระบบเพื่อเปิดใช้ Cloud Sync แบบสมัครใจ ข้อมูลจะยังอยู่ในอุปกรณ์จนกว่าคุณจะเปิด Cloud Sync"
        eyebrow="บัญชีและการซิงก์"
        title="เข้าสู่ระบบ"
      />
      <AuthForm mode="login" />
    </div>
  );
}
