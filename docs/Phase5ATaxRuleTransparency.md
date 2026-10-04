# Phase 5A — Tax Rule Transparency & Governance Readiness

สถานะ: ปิดงานแล้ว — merged ผ่าน PR #37

## เป้าหมาย

ให้ผู้ใช้ตรวจสถานะและแหล่งอ้างอิงของกฎภาษีที่แอปใช้ได้จากหน้าอ่านอย่างเดียว โดยไม่ทำให้
การประมาณการถูกตีความเป็นคำรับรองหรือการยื่นภาษี

## In scope

- สร้างหน้า `ข้อมูลกฎภาษี` จาก metadata ที่ผ่าน resolver ใน repository แล้ว
- แสดงปีภาษี เวอร์ชันที่เผยแพร่ วันที่ตรวจทาน ขอบเขตการประมาณการ และแหล่งอ้างอิงที่เปิดได้
- แปลสถานะทางเทคนิคเป็นข้อความที่ผู้ใช้เข้าใจได้ และคง disclaimer ที่ชัดเจน
- เชื่อมจากการ์ดสถานะภาษีในหน้า Summary เพื่อให้ตรวจแหล่งอ้างอิงได้ตรงบริบท
- ทดสอบว่า projection ไม่เปิดเผย rule-set/source/reviewer/workspace identifiers

## Out of scope

- หน้า Admin, role/permission, sign-in policy ใหม่ หรือการแก้ไข/publish กฎจาก browser
- API, Worker/R2, Cloud Sync, Supabase หรือ `supabase/`
- เปลี่ยนอัตรา สูตร tax rules หรือผลคำนวณ
- audit log, consent ledger, quota, payment, notification หรือ automation
- ดึงข้อมูลกฎจาก network, ตรวจ URL อัตโนมัติ หรืออ้างว่าเป็น legal approval

## Security และ Privacy

- ข้อมูลทุกอย่างมาจาก local rule resolver ที่ schema validate และ fail closed
- Public view ตัด `ruleSetId`, `sourceId`, reviewer identity และ identifier ภายในทั้งหมด
- ไม่มี user data, Workspace, URL query ที่มีข้อมูลการเงิน หรือ network request ใหม่
- ลิงก์ออกไปยังแหล่งทางการต้องเป็น user action และใช้ `noopener noreferrer`

## Acceptance criteria

- ผู้ใช้เปิดหน้าและเห็นสถานะที่เข้าใจได้สำหรับปี 2568/2569
- แต่ละแหล่งมีชื่อ หน่วยงาน ระดับหลักฐาน วันที่ตรวจ และลิงก์ออกอย่างปลอดภัย
- สถานะที่ unavailable ไม่แสดงตัวเลขภาษีหรืออ้างว่าใช้ยื่นได้
- Summary มีทางไปยังหน้า sources โดยไม่เปิดเผยข้อมูลส่วนตัว
- desktop/mobile/dark mode, unit/component/browser tests, lint, typecheck และ build ผ่าน
