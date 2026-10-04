# Phase 4B — Report Templates

สถานะ: ปิดแล้วผ่าน PR #34

## เป้าหมาย

ให้ผู้ใช้เลือกเนื้อหารายงานตามวัตถุประสงค์ได้โดยไม่ต้องแก้ข้อมูลต้นฉบับ และใช้รูปแบบเดียวกัน
กับ Preview/Download ของ PDF, Excel และ CSV

## Templates

### ฉบับเต็ม

- ภาพรวมทางการเงิน
- ประมาณการภาษี เมื่อช่วงรายงานตรงกับ Workspace และชุดกฎพร้อมใช้งาน
- Breakdown
- รายรับ รายจ่าย และภาษีหัก ณ ที่จ่าย
- ค่าลดหย่อนและประกันสังคม

Template นี้เป็นค่าเริ่มต้นและคงพฤติกรรมเดิมของระบบ

### สรุปยอด

- ภาพรวมทางการเงิน
- Breakdown
- ไม่แสดงรายการรายตัว รายละเอียดค่าลดหย่อน หรือประมาณการภาษี

### รายการเคลื่อนไหว

- ภาพรวมทางการเงิน
- รายรับ รายจ่าย และภาษีหัก ณ ที่จ่าย
- ไม่แสดง Breakdown รายละเอียดค่าลดหย่อน หรือประมาณการภาษี

## In scope

- เลือก template ครั้งเดียวและใช้ร่วมกันกับ PDF/Excel/CSV
- แสดงชื่อ template ใน PDF และ metadata/preview ของ Excel/CSV
- ไม่สร้าง section, Sheet หรือ CSV file ที่อยู่นอก template
- ทำงานร่วมกับ Report Periods จาก Phase 4A
- ตัวเลือกเป็น page-local state ไม่ persist และไม่เปลี่ยน URL
- รองรับ keyboard, mobile และ dark mode

## Out of scope

- Template editor หรือ custom section ordering
- การบันทึก template เป็นค่าเริ่มต้นของบัญชี
- Export history, quota, document ID และ download audit log
- Scheduled/background export หรือ Cloud upload
- Auth, OAuth, Worker/R2, Cloud Sync, tax rules และ `supabase/`

## Acceptance criteria

- ค่าเริ่มต้น “ฉบับเต็ม” ให้ผลเหมือนก่อนเพิ่ม template
- ทั้งสาม template แสดงคำอธิบายที่ช่วยเลือกได้โดยไม่ใช้ internal code
- PDF/Excel/CSV ใช้ template และช่วงรายงานเดียวกัน
- PDF ไม่มีหัวข้อว่าง และ Excel/CSV ไม่มี Sheet/ไฟล์นอก template
- PDF และ tabular metadata แสดงช่วงรายงานและชื่อ template
- ไม่มี network request, Local Storage write หรือ URL mutation จากการเลือก template
- unit/component/browser tests, lint, typecheck และ build ผ่าน
