> สถานะ: กำลังพัฒนาบน branch `feat/local-pdf-export` — Owner อนุมัติเริ่ม Phase 1C แล้ว; ยังรอ Final Review, Vercel Preview และอนุมัติ PR

เพิ่มระบบ Export PDF ฝั่ง client สำหรับ Jai Mai Wai Laew MVP 1 ผ่าน browser print engine ผู้ใช้เลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์ โดยไม่มีการส่งข้อมูลการเงินออกจากอุปกรณ์

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
  6. สรุปรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย ค่าลดหย่อน และสถานะ Tax estimate unavailable (ไม่มีตัวเลขภาษี)
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
- ไม่มี PDF renderer หรือ font CDN runtime; ใช้ Noto Sans Thai ที่ bundle อยู่ในแอปและ browser print engine เพื่อสร้างเอกสาร A4 หลายหน้า
- ชื่อรายงานและชื่อที่แสดงเป็น ephemeral form state ไม่ persist ลง localStorage และไม่อยู่ใน URL
- Service Worker ห้าม cache เอกสารที่สร้าง และไม่มี API route, upload, cloud storage, Excel หรือ CSV
