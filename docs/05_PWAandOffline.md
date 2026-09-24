> สถานะปัจจุบัน: มี manifest, service-worker baseline, versioned public cache และ offline fallback แล้ว
> แต่ PWA/Offline Completion ยังไม่เริ่มเป็น Phase ที่อนุมัติ และยังไม่ผ่าน acceptance บนอุปกรณ์จริง

ทำ PWA และ Offline Experience สำหรับ Jai Mai Wai Laew MVP 1

เอกสารนี้เป็น proposed scope ที่พร้อมใช้กำหนด Phase ถัดไป ไม่ได้หมายความว่า Phase 1F เริ่มแล้ว

ต้องมี:

- manifest ที่ถูกต้อง
- install prompt ที่ไม่ intrusive
- cache app shell, static assets, public learn content และ last-known tax rule bundle
- calculator ที่ทำงาน offline ได้หลังเคยเข้าหน้าเว็บออนไลน์แล้ว
- offline page fallback
- offline banner ที่ชัดเจน
- แสดง tax rule version และ cached timestamp
- ปุ่มล้างข้อมูล local ของผู้ใช้
- ห้าม cache รายการการเงิน/PDF/ข้อมูลผู้ใช้ใน service worker public cache
- ห้ามทำเว็บ grayscale ทั้งหน้าเมื่อ offline
- ต้องมี test/checklist สำหรับ offline flow
- เขียน README อธิบาย caching strategy และข้อจำกัด
