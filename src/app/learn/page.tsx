import { KnowledgeCenterLibrary } from "@/components/knowledge-center-library";
import { PageHeader } from "@/components/page-header";

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="ค้นคำอธิบายภาษีในภาษาที่เข้าใจง่าย พร้อมวันที่ตรวจทาน ข้อจำกัด และลิงก์ไปยังแหล่งข้อมูลทางการ"
        eyebrow="ศูนย์ความรู้"
        title="เริ่มจากเรื่องที่คุณอยากเข้าใจ"
      />
      <KnowledgeCenterLibrary />
    </div>
  );
}
