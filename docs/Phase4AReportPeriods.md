# Phase 4A — Report Periods

สถานะ: กำลังดำเนินการบน branch `feat/phase-4a-report-periods`

## เป้าหมาย

ให้ผู้ใช้เลือกช่วงรายงานหนึ่งครั้งจากหน้า Summary แล้วใช้ช่วงเดียวกันกับตัวอย่างและไฟล์
PDF, Excel และ CSV โดยยังสร้างไฟล์ภายในอุปกรณ์และไม่แก้ข้อมูลจริงของ Workspace

## In scope

- ช่วง Workspace ปัจจุบันเป็นค่าเริ่มต้น
- เลือกรายงานทั้งปี ครึ่งปีแรก ครึ่งปีหลัง หรือรายเดือนตามปีภาษีของ Workspace
- แสดงช่วงวันที่ใน PDF และ metadata/preview ของ Excel/CSV
- ใช้กลไกคัดกรองรายการและ Breakdown เดิม เพื่อให้ยอดรวมสอดคล้องกันทุก format
- แสดง empty state ตามข้อมูลจริง โดยไม่สร้างรายการหรือวันที่สมมติ
- รองรับ mobile, dark mode และ keyboard ด้วย native select

## Safety rule สำหรับช่วงย่อย

รายการค่าลดหย่อนแบบร่างไม่มีวันที่กำกับ และผลประมาณการภาษีเดิมผูกกับช่วงคำนวณของ
Workspace ดังนั้นเมื่อเลือกช่วงอื่นจากช่วง Workspace ระบบจะไม่แสดงค่าลดหย่อนแบบร่าง
และผลประมาณการภาษีดังกล่าว เพื่อไม่ให้ตัวเลขรายปีหรือครึ่งปีถูกสื่อว่าเป็นตัวเลขของเดือน

ประกันสังคม ม.33 แบบอัตโนมัติยังคำนวณจากรายการเงินเดือนรายเดือนที่อยู่ในช่วงที่เลือกได้
ส่วนยอดประกันสังคมที่ผู้ใช้กรอกเองจะไม่ถูกแบ่งสัดส่วนโดยระบบ

## Out of scope

- Report template editor
- Export history, quota, document ID หรือ download audit log
- Scheduled/background export
- การอัปโหลดไฟล์รายงานขึ้น Cloud
- การเปลี่ยนสูตรภาษี กฎภาษี หรือข้อมูลต้นฉบับใน Workspace
- Account, OAuth, Worker/R2, Cloud Sync และ `supabase/`

## Acceptance criteria

- ผู้ใช้เลือกช่วงครั้งเดียวและ PDF/Excel/CSV ใช้ช่วงเดียวกัน
- ช่วง Workspace เป็นค่าเริ่มต้นและคงพฤติกรรม export เดิม
- รายงานทั้งปี ครึ่งปี และรายเดือนกรองรายการ ยอดรวม และ Breakdown ถูกต้อง
- รายงานช่วงย่อยไม่แสดงค่าลดหย่อนแบบร่างหรือประมาณการภาษีของ Workspace
- ช่วงรายงานปรากฏใน preview และไฟล์ที่ดาวน์โหลด
- ไม่มี network request, Local Storage write หรือ URL mutation จากการเลือก/สร้างรายงาน
- unit/component/browser tests, lint, typecheck และ build ผ่าน
