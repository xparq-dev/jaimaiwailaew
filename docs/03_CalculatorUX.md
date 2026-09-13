# Phase 1B — Calculator UX (Local-only)

> สถานะ: Summary Breakdown UX Improvement พัฒนาและทดสอบบน branch `feat/summary-breakdown` แล้ว — เพิ่มการรวมกลุ่มเชิงคณิตศาสตร์แบบ local-only และ Detail Dialog โดยยังรอการตรวจ Final Report และอนุมัติจาก Owner ก่อน commit/push/PR และก่อนเริ่ม Phase 1C PDF Export

สร้างและปรับปรุง UI เครื่องคำนวณของ Jai Mai Wai Laew สำหรับ MVP 1 โดยใช้ Local-only state และห้ามส่งข้อมูลรายการการเงินไป backend

## หน้าและความสามารถที่สร้างและปรับปรุงแล้ว:
- `/start`: หน้านำทางเริ่มต้น อธิบายความเป็นส่วนตัวและการจัดเก็บข้อมูลในอุปกรณ์ 100%
- `/start/income-type`: Wizard ให้เลือก Persona (ขายออนไลน์/ธุรกิจ, ฟรีแลนซ์, พนักงานประจำ, หลายรายได้, ยังไม่แน่ใจ พร้อมคำถามช่วยประเมินเบื้องต้น)
- `/start/pnd94`: Wizard ตั้งค่าปีภาษี (2568/2569) และช่วง ม.ค.–มิ.ย. สำหรับ ภ.ง.ด.94
- `/start/pnd91`: Wizard ตั้งค่าปีภาษีและรายได้จากเงินเดือนประจำปีสำหรับ ภ.ง.ด.91
- `/start/multi-income`: Wizard สำหรับรวบรวมหลายแหล่งรายได้
- `/calculator`: หน้าภาพรวมเครื่องคำนวณและสรุปยอดเบื้องต้น
- `/calculator/income`: รายการรายรับแยกเป็นกลุ่มเดือนสำหรับ เพิ่ม/แก้ไข/ลบ โดยแต่ละเดือนแยกรายการรายเดือนและรายการระบุวัน พร้อมยอดรวมระดับเดือนและระดับรูปแบบรายการ
- `/calculator/expenses`: ตารางและรายการการ์ดบนมือถือสำหรับ เพิ่ม/แก้ไข/ลบ รายจ่าย (พร้อมสถานะ likely related, needs review) รองรับทั้งแบบระบุวันและรายเดือน
- `/calculator/withholding-tax`: ตารางและรายการการ์ดสำหรับบันทึกภาษีหัก ณ ที่จ่ายตามเอกสารอ้างอิงภาษีหัก ณ ที่จ่ายที่มี รองรับทั้งแบบระบุวันและรายเดือน
- `/calculator/allowances`: แบบฟอร์มค่าลดหย่อนแบบร่าง พร้อมคำเตือนชัดเจนว่าไม่ใช่การอนุมัติสิทธิทางภาษี (ไม่มี entry frequency เพราะเป็นแบบร่างรวม)
- `/calculator/summary`: Summary cards แสดงยอดรวมเลขคณิต, Summary Breakdown ตามแหล่งที่มา/หมวดบันทึก/สถานะการจัดกลุ่ม, Detail Dialog ของรายการต้นทาง, ตารางแจกแจงรายเดือน (รวมทั้งรายการระบุวันและรายเดือนได้อย่างแม่นยำ), รายการคำเตือน, รายการสมมติฐาน, และ Tax Estimate Unavailable Card
- **Compact Privacy Indicator:** ปรับจากแบนเนอร์/การ์ดขนาดใหญ่เป็น inline status control กะทัดรัดใต้ heading แสดง “ข้อมูลบันทึกในอุปกรณ์นี้” พร้อมเวลาบันทึกล่าสุด มีปุ่มกดเปิด Dialog ดูรายละเอียดความเป็นส่วนตัว พร้อมปุ่มล้างข้อมูล และลิงก์ไปยังหน้านโยบายความเป็นส่วนตัว
- **Entry Frequency (ความถี่ของรายการ):** รองรับทั้ง `one_time` (ระบุวัน / รายการครั้งเดียว) และ `monthly` (ระบุเดือน / รายการรายเดือน) ในฟอร์มรายรับ, รายจ่าย และภาษีหัก ณ ที่จ่าย เพื่อให้ผู้ใช้เงินเดือนหรือค่าใช้จ่ายรายเดือนกรอกได้โดยไม่ต้องระบุวัน
- **Income Month Groups:** หน้า `รายรับ` จัดรายการในช่วงที่เลือกเป็นกลุ่มตามเดือนล่าสุดก่อน ภายในแยก `รายการรายเดือน` และ `รายการระบุวัน` พร้อมยอดรวมของแต่ละกลุ่ม ส่วนรายการนอกช่วงแสดงแยกและไม่รวมในยอด Summary โดยไม่เปลี่ยนข้อมูลต้นทาง
- **ปุ่ม `ล้างข้อมูลในอุปกรณ์นี้`:** พร้อม modal confirmation สามารถล้างข้อมูลทั้ง v1 และ v2 ออกจากเครื่องได้ทันที
- Empty states, validation messages ภาษาไทยด้วย React Hook Form + Zod
- Dark mode และ responsive รองรับหน้าจอ 320px ขึ้นไปโดยไม่มี horizontal scroll
- Desktop sidebar และ Mobile bottom navigation
- Offline support ผ่าน Service Worker โดยแคชเฉพาะ App shell และ static assets (ห้ามแคชข้อมูลการเงินของผู้ใช้เด็ดขาด)

## Summary Breakdown UX Improvement

หน้า `/calculator/summary` รวมเฉพาะรายการรายรับและรายจ่ายที่อยู่ในช่วงเวลาที่เลือก โดยใช้ตัวกรองเดียวกับ arithmetic totals และแสดง 4 มุมมอง:

1. รายรับตามแหล่งที่มา (`sourceName`)
2. รายรับตามหมวดบันทึก (`categoryCode`)
3. รายจ่ายตามหมวดบันทึก (`categoryCode`)
4. รายจ่ายตามสถานะการจัดกลุ่ม (`taxRelevanceStatus`)

- ยอดเงินรวมด้วย integer `MoneySatang`; percentage ใช้เพื่อแสดงสัดส่วนเท่านั้นและเป็น `0%` เมื่อยอดรวมเป็นศูนย์
- `sourceName` ถูก trim เฉพาะช่องว่างหัว/ท้าย โดยไม่มี fuzzy merge หรือ case normalization; ค่าว่าง, whitespace, `undefined` และ `null` แสดงรวมเป็น `ไม่ระบุแหล่งที่มา`
- กลุ่มเรียงตามยอดรวมจากมากไปน้อย และใช้ชื่อภาษาไทย/Unicode เรียงจากน้อยไปมากเมื่อยอดเท่ากัน
- หมวดบันทึกและสถานะเป็น product data grouping เพื่อช่วยจัดระเบียบและทบทวนข้อมูล ไม่ใช่การจัดประเภทเงินได้ตามกฎหมายหรือการยืนยันว่ารายจ่ายหักภาษีได้
- แถวของแต่ละกลุ่มเป็นปุ่มที่เปิด Detail Dialog แบบ local-only เพื่อแสดงวันที่/เดือน, ความถี่, หมวด, สถานะที่บันทึก, จำนวนเงิน และหมายเหตุของรายการต้นทางที่ตรงกลุ่ม
- Dialog ใช้ ephemeral React UI state เท่านั้น ไม่บันทึกใน localStorage, ไม่เปลี่ยน URL query/hash, ไม่ส่ง network request และไม่มี export/copy/share
- Dialog รองรับ mouse/touch/keyboard, native modal focus trap, Escape, focus restoration, dark mode และหน้าจอ 320px

## ข้อกำหนดความปลอดภัยและความเป็นส่วนตัว:
- ใช้ React Hook Form + Zod พร้อมข้อความภาษาไทย
- ใช้ Zustand local state ที่ persist ได้เฉพาะในเบราว์เซอร์ของผู้ใช้ (`jaimaiwailaew:calculator:v2`) พร้อม Atomic Migration v1 → v2
- ห้ามใส่ข้อมูลการเงินใน URL query string หรือ hash
- ห้ามส่งข้อมูลการเงินเข้า analytics, server logs, error tracking หรือ console logs
- ห้าม persist selected Summary Breakdown หรือ Detail Dialog state ลง localStorage
- มี accessibility labels, aria-live, aria-expanded, dialog focus management และ keyboard navigation รองรับครบถ้วน
- ห้ามแสดงคำว่า “ภาษีที่ต้องจ่ายแน่นอน” หรือตัวเลขภาษีใด ๆ; แสดงเฉพาะ “ยังไม่พร้อมคำนวณภาษีประมาณการ” เนื่องจากกฎภาษียัง unverified
- ไม่มี Cloud sync, ไม่มี PDF/Excel/CSV export (รอ Phase 1C)

## Gate ก่อนเริ่ม Phase 1C:
1. Owner ตรวจ Final Report ของ Summary Breakdown UX Improvement และอนุมัติ commit/push/PR
2. ห้ามเริ่ม Phase 1C (`04_PDFExport.md`) จนกว่าจะได้รับอนุมัติขอบเขตใหม่
