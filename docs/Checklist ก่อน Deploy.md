1.Checklist ก่อน Deploy
คุณภาพโค้ด

npm run lint ผ่าน

npm run typecheck ผ่าน

npm run test ผ่าน

npm run build ผ่าน

ไม่มี TypeScript error

ไม่มี secret ใน source code

ไม่มี .env ถูก commit

เปิด branch protection ใน GitHub

เปิด Dependabot หรือกระบวนการตรวจ dependency

มี README สำหรับ onboarding นักพัฒนา


2.Tax Safety
Tax Rules แยกจาก UI

Rule ทุกชุดระบุปีภาษีและ version

Rule ทุกชุดมี source metadata

Rule ที่ไม่ผ่านการตรวจสอบไม่ถูก publish

Unit test ของสูตรสำคัญผ่าน

PDF มี disclaimer

หน้า summary มี disclaimer

ไม่มีข้อความยืนยันผลลัพธ์แบบทางการ

ไม่มีการใช้คำว่า “ยื่นแทน”, “รับรอง”, “การันตี”


3.Privacy และ Security

MVP 1 ไม่มี API ส่งข้อมูลการเงิน

PDF generate ใน browser

ไม่มีการ log รายการการเงิน

ไม่มี query parameter ที่มีข้อมูลการเงิน

Analytics ไม่เก็บเนื้อหาฟอร์ม

มี Clear Local Data

Privacy Notice ระบุพฤติกรรมจริงของระบบ

Terms และ Disclaimer เข้าถึงได้จากทุกหน้า

CSP และ security headers ถูกตั้งค่า

HTTPS ผ่าน Vercel/Cloudflare

มี rate limiting/Turnstile เฉพาะ endpoint สาธารณะที่จำเป็นในอนาคต


4.UX และ Accessibility

ใช้งานมือถือได้จริง

Sidebar Desktop และ Bottom Navigation Mobile ทำงาน

Dark Mode ใช้ได้

Keyboard navigation ใช้ได้

Focus state มองเห็นชัด

label ของ form ครบ

error message ระบุว่าแก้ตรงไหน

จำนวนเงินอ่านง่าย

ตารางไม่พังบนจอเล็ก

มี Empty, Loading, Error, Offline states

PDF ภาษาไทยไม่กลายเป็นกล่องสี่เหลี่ยม

5.PWA

Manifest ผ่าน

ไอคอนครบหลายขนาด

ติดตั้ง PWA ได้บน browser ที่รองรับ

เปิด Offline ได้หลังเคยเปิด Online

Offline Banner แสดงถูกต้อง

ไม่ cache ข้อมูลการเงินใน public cache

Cache ใช้ versioning และล้าง cache เก่าได้

มีวิธีตรวจสอบ Tax Rules cached timestamp


6.จากนี้เป็นต้นไป สิ่งที่ควรทำต่อทันที แจ้ง Owner หลังจาก Master Prompt เสร็จแล้ว ให้ Owner ดำเนินการต่อ

1.สร้าง GitHub repository ชื่อ jaimaiwailaew

2.ใช้ Master Prompt สำหรับ Antigravity เพื่อสร้าง Foundation

3.ให้ Antigravity หยุดที่ Phase 0 ก่อน อย่าเพิ่งสั่งให้ทำทุก Phase พร้อมกัน

4.เปิดโปรเจกต์ใน Cursor

5.ใช้ Prompt 1 เพื่อ review หรือเติมส่วน Foundation

6.ใช้ Prompt 2 เพื่อวาง Tax Rules Engine โดยยังไม่ใส่ตัวเลขภาษีจริงที่ไม่ผ่านการตรวจสอบ

7.ทำ Prompt 3 เพื่อสร้าง Calculator Flow

8.ทำ Prompt 4 เพื่อสร้าง PDF Export

9.ทำ Prompt 5 เพื่อทำ PWA/Offline

10.ส่งโค้ดหรือโครงสร้างไฟล์ที่ได้กลับมาให้ผมตรวจได้ แล้วผมจะช่วยคุณทำ Tax Rules ที่มีแหล่งอ้างอิงจริง, SQL/RLS สำหรับ MVP 2, และแผนย้ายจาก Public Beta สู่ระบบสมาชิก ต่อได้

ก่อนเปิดเว็บให้ผู้ใช้คำนวณจริง ควรให้ผู้เชี่ยวชาญภาษีหรือผู้ทำบัญชีตรวจสอบ Tax Rules ของปี 2568 และ 2569 รวมถึง test cases เพราะแม้เว็บจะวางสถาปัตยกรรมดีเพียงใด ความถูกต้องของผลลัพธ์ขึ้นกับกฎภาษี, ข้อเท็จจริงของผู้ใช้, เอกสารประกอบ และการตีความที่อาจเปลี่ยนแปลงได้ครับ