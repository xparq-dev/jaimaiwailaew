# Phase 1B — Calculator UX (Local-only)

> สถานะ: เสร็จสมบูรณ์ (PASS) — รอบันทึกผลและอนุมัติจาก Owner ก่อนเริ่ม Phase 1C PDF Export

สร้าง UI เครื่องคำนวณของ Jai Mai Wai Laew สำหรับ MVP 1 โดยใช้ Local-only state และห้ามส่งข้อมูลรายการการเงินไป backend

## หน้าและความสามารถที่สร้างเสร็จแล้ว:
- `/start`: หน้านำทางเริ่มต้น อธิบายความเป็นส่วนตัวและการจัดเก็บข้อมูลในอุปกรณ์ 100%
- `/start/income-type`: Wizard ให้เลือก Persona (ขายออนไลน์/ธุรกิจ, ฟรีแลนซ์, พนักงานประจำ, หลายรายได้, ยังไม่แน่ใจ พร้อมคำถามช่วยประเมินเบื้องต้น)
- `/start/pnd94`: Wizard ตั้งค่าปีภาษี (2568/2569) และช่วง ม.ค.–มิ.ย. สำหรับ ภ.ง.ด.94
- `/start/pnd91`: Wizard ตั้งค่าปีภาษีและรายได้จากเงินเดือนประจำปีสำหรับ ภ.ง.ด.91
- `/start/multi-income`: Wizard สำหรับรวบรวมหลายแหล่งรายได้
- `/calculator`: หน้าภาพรวมเครื่องคำนวณและสรุปยอดเบื้องต้น
- `/calculator/income`: ตารางและรายการการ์ดบนมือถือสำหรับ เพิ่ม/แก้ไข/ลบ รายรับ
- `/calculator/expenses`: ตารางและรายการการ์ดบนมือถือสำหรับ เพิ่ม/แก้ไข/ลบ รายจ่าย (พร้อมสถานะ likely related, needs review)
- `/calculator/withholding-tax`: ตารางและรายการการ์ดสำหรับบันทึกภาษีหัก ณ ที่จ่ายตามเอกสารอ้างอิงภาษีหัก ณ ที่จ่ายที่มี
- `/calculator/allowances`: แบบฟอร์มค่าลดหย่อนแบบร่าง พร้อมคำเตือนชัดเจนว่าไม่ใช่การอนุมัติสิทธิทางภาษี
- `/calculator/summary`: Summary cards แสดงยอดรวมเลขคณิต, ตารางแจกแจงรายเดือน, รายการคำเตือน, รายการสมมติฐาน, และ Tax Estimate Unavailable Card
- ปุ่ม `ล้างข้อมูลในอุปกรณ์นี้` พร้อม modal confirmation
- Empty states, validation messages ภาษาไทยด้วย React Hook Form + Zod
- Dark mode และ responsive รองรับหน้าจอ 320px ขึ้นไปโดยไม่มี horizontal scroll
- Desktop sidebar และ Mobile bottom navigation
- Offline support ผ่าน Service Worker โดยแคชเฉพาะ App shell และ static assets (ห้ามแคชข้อมูลการเงินของผู้ใช้เด็ดขาด)

## ข้อกำหนดความปลอดภัยและความเป็นส่วนตัว:
- ใช้ React Hook Form + Zod พร้อมข้อความภาษาไทย
- ใช้ Zustand local state ที่ persist ได้เฉพาะในเบราว์เซอร์ของผู้ใช้ (`jaimaiwailaew:calculator:v1`)
- ห้ามใส่ข้อมูลการเงินใน URL query string หรือ hash
- ห้ามส่งข้อมูลการเงินเข้า analytics, server logs, error tracking หรือ console logs
- มี accessibility labels, aria-live, และ keyboard navigation รองรับครบถ้วน
- ห้ามแสดงคำว่า “ภาษีที่ต้องจ่ายแน่นอน” หรือตัวเลขภาษีใด ๆ; แสดงเฉพาะ “ยังไม่พร้อมคำนวณภาษีประมาณการ” เนื่องจากกฎภาษียัง unverified
