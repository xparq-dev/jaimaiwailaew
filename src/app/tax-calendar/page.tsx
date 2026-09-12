import { PlaceholderPage } from "@/components/placeholder-page";

export default function TaxCalendarPage() {
  return (
    <PlaceholderPage
      content={{
        eyebrow: "ปฏิทินภาษี",
        title: "วันที่สำคัญต้องผ่านการตรวจสอบก่อนเผยแพร่",
        description:
          "โครงหน้าปฏิทินสำหรับข้อมูลที่อ้างอิงแหล่งทางการและระบุวันที่ตรวจสอบล่าสุด โดยยังไม่มีวันครบกำหนดจริงใน Phase 0",
        plannedItems: [
          "ปีและช่วงภาษี",
          "แหล่งอ้างอิงทางการ",
          "วันที่ตรวจสอบล่าสุด",
          "คำเตือนเมื่อใช้งานออฟไลน์",
        ],
      }}
    />
  );
}
