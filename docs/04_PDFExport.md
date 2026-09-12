> สถานะ: ยังไม่เริ่ม — ห้ามดำเนินการก่อน Calculator UX ผ่านเกณฑ์และรายงาน Owner

เพิ่มระบบ Export PDF ฝั่ง client สำหรับ Jai Mai Wai Laew MVP 1

ข้อกำหนด:
- ทำงานโดยไม่ส่งข้อมูลรายรับรายจ่ายไป server
- PDF ขนาด A4 portrait
- รองรับข้อความภาษาไทยด้วย font ที่ embed ได้จริง
- มีฟอร์ม optional report name และ optional name to show on report
- รายงานต้องประกอบด้วย:
  1. ชื่อผลิตภัณฑ์
  2. ชื่อรายงาน
  3. ปีภาษีและช่วงเวลา
  4. วันเวลา Asia/Bangkok
  5. ruleSetId และ rule version
  6. สรุปรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย ค่าลดหย่อน และภาษีประมาณการ
  7. ตารางรายละเอียดรายการทั้งหมด
  8. warnings
  9. assumptions
  10. source/version information
  11. disclaimer
- ใส่ watermark ซ้ำทั่วเอกสารด้วยข้อความ:
  “JAI MAI WAI LAEW — รายงานชั่วคราวเพื่อการอ้างอิง — ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ”
- watermark ต้องเป็นแนวทแยง, opacity 4–7%, และไม่บังเนื้อหา
- PDF ต้องใช้ light printable theme แม้เว็บอยู่ Dark Mode
- ต้องมี loading/error UI และ test อย่างน้อยระดับ component/unit
- ห้ามมี signature field ใน MVP 1
