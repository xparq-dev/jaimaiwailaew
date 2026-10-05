import { AuthForm } from "@/components/auth/auth-form";
import { PageHeader } from "@/components/page-header";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ใช้บัญชี Google หรือ GitHub เพื่อสำรองข้อมูลและใช้งานหลายอุปกรณ์"
        eyebrow="บัญชีของฉัน"
        title="สร้างบัญชี"
      />
      <AuthForm mode="signup" />
    </div>
  );
}
