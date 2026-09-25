import { AuthForm } from "@/components/auth/auth-form";
import { PageHeader } from "@/components/page-header";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="สร้างบัญชีด้วย Google หรือ GitHub และเลือกเปิด Cloud Sync ภายหลังได้"
        eyebrow="บัญชีและการซิงก์"
        title="สร้างบัญชี"
      />
      <AuthForm mode="signup" />
    </div>
  );
}
