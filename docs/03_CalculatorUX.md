# Phase 1B — Calculator UX (Local-only)

> สถานะปัจจุบัน: Phase 1B–1D และ Phase 1E merge เข้า `main` แล้ว เอกสารนี้เก็บรายละเอียด
> Calculator UX; สถานะ release ล่าสุดให้ยึด [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)

สร้างและปรับปรุง UI เครื่องคำนวณของ Jai Mai Wai Laew สำหรับ MVP 1 โดยใช้ Local-only state และห้ามส่งข้อมูลรายการการเงินไป backend

## หน้าและความสามารถที่สร้างและปรับปรุงแล้ว:

- `/start`: หน้านำทางเริ่มต้น อธิบายความเป็นส่วนตัวและการจัดเก็บข้อมูลในอุปกรณ์ 100% พร้อมแสดง Workspace เดิมให้เปิดต่อได้ และแจ้งข้อจำกัดก่อนเริ่ม Workspace ใหม่
- `/start/income-type`: Wizard ให้เลือก Persona (ขายออนไลน์/ธุรกิจ, ฟรีแลนซ์, พนักงานประจำ, หลายรายได้, ยังไม่แน่ใจ พร้อมคำถามช่วยประเมินเบื้องต้น)
- `/start/pnd94`: Wizard ตั้งค่าปีภาษี (2568/2569) และช่วง ม.ค.–มิ.ย. สำหรับ ภ.ง.ด.94
- `/start/pnd91`: Wizard ตั้งค่าปีภาษีและรายได้จากเงินเดือนประจำปีสำหรับ ภ.ง.ด.91
- `/start/multi-income`: Wizard สำหรับรวบรวมหลายแหล่งรายได้
- `/calculator`: หน้าภาพรวมเครื่องคำนวณและสรุปยอดเบื้องต้น พร้อมแก้ไขประเภทผู้ใช้งานโดยไม่ล้างรายการเดิม
- `/calculator/income`: รายการรายรับแยกเป็นกลุ่มเดือนสำหรับ เพิ่ม/แก้ไข/ลบ โดยแต่ละเดือนแยกรายการรายเดือนและรายการระบุวัน พร้อมยอดรวมระดับเดือนและระดับรูปแบบรายการ ฟอร์มมีหมวดรายรับ 19 รายการใน 5 กลุ่ม และจะแนะนำแหล่งรายได้ให้สัมพันธ์กับหมวดหมู่แบบเลือกได้ ยกเลิกได้ และพิมพ์ค่าอื่นได้
- `/calculator/expenses`: ตารางและรายการการ์ดบนมือถือสำหรับ เพิ่ม/แก้ไข/ลบ รายจ่าย (พร้อมสถานะ likely related, needs review) รองรับทั้งแบบระบุวันและรายเดือน
- `/calculator/withholding-tax`: ตารางและรายการการ์ดสำหรับบันทึกภาษีหัก ณ ที่จ่ายตามเอกสารอ้างอิงภาษีหัก ณ ที่จ่ายที่มี รองรับทั้งแบบระบุวันและรายเดือน
- `/calculator/allowances`: แบบฟอร์มค่าลดหย่อนแบบร่าง พร้อมคำเตือนชัดเจนว่าไม่ใช่การอนุมัติสิทธิทางภาษี (ไม่มี entry frequency เพราะเป็นแบบร่างรวม)
- `/calculator/summary`: Summary cards แสดงยอดรวมเลขคณิต, Summary Breakdown ตามแหล่งที่มา/หมวดบันทึก/สถานะการจัดกลุ่ม, Detail Dialog ของรายการต้นทาง, ตารางแจกแจงรายเดือน, รายการคำเตือน/สมมติฐาน, Tax Estimate Card และ PDF/Excel/CSV ที่เปิด Preview ก่อนดาวน์โหลด
- **Compact Privacy Indicator:** ปรับจากแบนเนอร์/การ์ดขนาดใหญ่เป็น inline status control กะทัดรัดใต้ heading แสดง “ข้อมูลบันทึกในอุปกรณ์นี้” พร้อมเวลาบันทึกล่าสุด มีปุ่มกดเปิด Dialog ดูรายละเอียดความเป็นส่วนตัว พร้อมปุ่มล้างข้อมูล และลิงก์ไปยังหน้านโยบายความเป็นส่วนตัว
- **Entry Frequency (ความถี่ของรายการ):** รองรับทั้ง `one_time` (ระบุวัน / รายการครั้งเดียว) และ `monthly` (ระบุเดือน / รายการรายเดือน) ในฟอร์มรายรับ, รายจ่าย และภาษีหัก ณ ที่จ่าย เพื่อให้ผู้ใช้เงินเดือนหรือค่าใช้จ่ายรายเดือนกรอกได้โดยไม่ต้องระบุวัน
- **Income Month Groups:** หน้า `รายรับ` จัดรายการในช่วงที่เลือกเป็นกลุ่มตามเดือนล่าสุดก่อน ภายในแยก `รายการรายเดือน` และ `รายการระบุวัน` พร้อมยอดรวมของแต่ละกลุ่ม ส่วนรายการนอกช่วงแสดงแยกและไม่รวมในยอด Summary โดยไม่เปลี่ยนข้อมูลต้นทาง
- **Income Categories & Source Suggestions:** หมวดรายรับ 19 รายการแบ่งเป็นงานประจำ, การขาย/ธุรกิจ, งานบริการ/สื่อ, ทรัพย์สิน/การลงทุน และเกษตร/เกษียณ/อื่น ๆ เมื่อเลือกหมวด ระบบเลือกคำแนะนำแรกที่ตรงกันอัตโนมัติ ผู้ใช้ยกเลิก เลือกคำแนะนำอื่น เลือกแหล่งที่เคยใช้ หรือพิมพ์เองได้ โดยยังบันทึกเป็น `sourceName` เดิม
- **Workspace Entry:** หน้า `/start` แสดง Workspace เดิมและเปิดกลับเข้าไปได้ โหมดไม่สมัครสมาชิกยังเก็บได้ 1 Workspace; ปุ่มเพิ่มจะแจ้งก่อนพาไป flow ที่ต้องยืนยันการแทนที่ข้อมูลเดิม ผู้ใช้ที่เข้าสู่ระบบเลือกเปิด Cloud Sync ได้จาก Settings
- **Editable Persona:** ประเภทผู้ใช้งานแก้ไขจากหน้า `/calculator` ได้โดยคง Workspace ID และรายการการเงินทั้งหมดไว้
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
- ใช้ Zustand local state (`jaimaiwailaew:calculator:v2`) เป็นแหล่งข้อมูลหลักพร้อม Atomic Migration v1 → v2; การส่งสำเนาไป R2 เกิดเฉพาะบัญชีที่เปิด Cloud Sync แบบ opt-in
- ห้ามใส่ข้อมูลการเงินใน URL query string หรือ hash
- ห้ามส่งข้อมูลการเงินเข้า analytics, server logs, error tracking หรือ console logs
- ห้าม persist selected Summary Breakdown หรือ Detail Dialog state ลง localStorage
- มี accessibility labels, aria-live, aria-expanded, dialog focus management และ keyboard navigation รองรับครบถ้วน
- ห้ามอ้างว่าผลประมาณการเป็น “ภาษีที่ต้องจ่ายแน่นอน” หรือแบบยื่นภาษีอย่างเป็นทางการ
- ชุดกฎปี 2568/2569 ปัจจุบันเป็น `verified / published (v1.0.0)`; ชุดกฎอื่นที่ไม่ผ่าน validation ต้อง fail closed
- Cloud Sync เป็น opt-in ผ่าน Supabase Auth และ private R2; PDF, Excel และ CSV ยังคงสร้างจากข้อมูลในอุปกรณ์เมื่อผู้ใช้กดและไม่ upload ไฟล์ export

## Gate เดิมของ Phase 1D

Gate นี้ผ่านแล้วและเก็บไว้เป็น historical record: Local tests/CI/Preview ผ่าน, Owner ตรวจ Preview แล้ว
และ Phase 1D merge ก่อนเริ่ม Phase 1E
