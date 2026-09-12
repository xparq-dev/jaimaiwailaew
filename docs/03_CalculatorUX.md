สร้าง UI เครื่องคำนวณของ Jai Mai Wai Laew สำหรับ MVP 1 โดยใช้ Local-only state และห้ามส่งข้อมูลรายการการเงินไป backend

หน้าและความสามารถ:
- /start/income-type: Wizard ให้เลือก ขายออนไลน์/ธุรกิจ, ฟรีแลนซ์, พนักงานประจำ, หลายรายได้, ยังไม่แน่ใจ
- /start/pnd94: เลือกปีภาษีและช่วง ม.ค.–มิ.ย.
- /start/pnd91: เลือกปีภาษีและรายได้จากเงินเดือน
- /calculator/income: ตารางเพิ่ม/แก้ไข/ลบรายรับ
- /calculator/expenses: ตารางเพิ่ม/แก้ไข/ลบรายจ่าย
- /calculator/withholding-tax: บันทึกภาษีหัก ณ ที่จ่าย
- /calculator/allowances: ฟอร์มค่าลดหย่อนเบื้องต้น
- /calculator/summary: summary cards, chart, warning list, assumption list, tax rule version
- ปุ่ม clear local data พร้อม confirmation
- empty states, sample data option, validation messages ภาษาไทย
- Dark mode และ responsive
- Desktop sidebar, Mobile bottom navigation
- Offline banner พร้อม rule-cache timestamp placeholder

ข้อกำหนด:
- ใช้ React Hook Form + Zod
- ใช้ Zustand local state ที่ persist ได้เฉพาะอุปกรณ์
- ห้ามใส่ข้อมูลใน URL
- ห้าม analytics/log financial inputs
- ต้องมี accessibility labels และ keyboard support
- ไม่แสดงคำว่า “ภาษีที่ต้องจ่ายแน่นอน”; ใช้ “ภาษีประมาณการ”