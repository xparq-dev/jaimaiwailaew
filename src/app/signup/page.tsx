import { AuthForm } from "@/components/auth/auth-form";
import { PageHeader } from "@/components/page-header";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="สมัครสมาชิกด้วยอีเมล หรือใช้บัญชี Google/GitHub และเลือกเปิด Cloud Sync ภายหลังได้"
        eyebrow="Phase 1E · Supabase Auth"
        title="สร้างบัญชี"
      />
      <AuthForm mode="signup" />
    </div>
  );
}
