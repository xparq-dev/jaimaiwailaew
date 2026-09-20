# Phase 1D — Local-only Excel/CSV Export

สถานะ: กำลังพัฒนาบน branch `feat/local-excel-csv-export`; ยังไม่เปิด Pull Request

## ขอบเขต

หน้า Summary มีปุ่ม `ส่งออก Excel` และ `ส่งออก CSV` ถัดจากการสร้าง PDF เมื่อกดปุ่ม ระบบจะสร้างข้อมูลใน memory และเปิด Preview แบบแท็บให้ตรวจทุก Sheet/ไฟล์ก่อน ผู้ใช้ต้องกดดาวน์โหลดใน Preview อีกครั้งจึงจะบันทึกไฟล์ลงอุปกรณ์ ไม่มี API route, server action, upload, Auth, Cloud หรือการคำนวณภาษี

## รูปแบบไฟล์

- Excel เป็น `.xlsx` มาตรฐาน OOXML มี Sheet `Summary`, `Income`, `Expense`, `Withholding Tax`, `Deductions` และ `Breakdown`
- `Withholding Tax` และ `Deductions` ถูกสร้างเมื่อมีรายการที่ส่งออกได้เท่านั้น
- จำนวนเงินและเปอร์เซ็นต์ใน Excel เป็น numeric cell เพื่อแก้ไขและคำนวณต่อได้
- CSV ไม่มีแนวคิดเรื่อง Sheet จึงดาวน์โหลดเป็น ZIP หนึ่งไฟล์ ภายในมี UTF-8 BOM `.csv` แยกตามประเภท ช่วยให้การกดครั้งเดียวทำงานได้สม่ำเสมอบนมือถือและไม่ถูก browser บล็อกหลาย download
- CSV ใช้ CRLF, quote ข้อความ และทำ neutralize ค่าเริ่มต้น `=`, `+`, `-`, `@`, tab หรือ carriage return เพื่อป้องกัน spreadsheet formula injection

## ข้อมูลและความเป็นส่วนตัว

- ใช้เฉพาะรายการในช่วงวันที่ของ Workspace เดียวกับหน้า Summary
- รายการรายเดือนแสดง `MM/พ.ศ.` โดยไม่สร้างวันที่สมมติ; รายการครั้งเดียวแสดง `DD/MM/พ.ศ.`
- Summary มีรายรับรวม รายจ่ายรวม ภาษีหัก ณ ที่จ่ายรวม ค่าลดหย่อนรวม และยอดคงเหลือ
- Breakdown ครอบคลุมรายรับตามแหล่งที่มา/หมวดหมู่ และรายจ่ายตามหมวดหมู่/สถานะ พร้อมจำนวนรายการ ยอดรวม และสัดส่วนสองตำแหน่ง
- Summary มี Bangkok timestamp, `Tax Rules 2568/2569: unverified / not for calculation` และ disclaimer
- ไม่ส่งออก entry/workspace/rule ID, หมายเหตุ, certificate reference, URL, path, filename, build/version/commit SHA, tax rate, tax due หรือ refund
- Service Worker ไม่ cache `.xlsx`, `.csv` หรือ `.zip`

## การทดสอบ

Unit tests เปิด ZIP และตรวจ OOXML/CSV จริง รวมทั้งชื่อ Sheet/ไฟล์, numeric cells, UTF-8 BOM, formula neutralization, optional sections และการไม่มีข้อมูลภายใน Component tests ยืนยันว่า Preview ต้องปรากฏก่อนดาวน์โหลดและไม่มี fetch/storage/URL mutation ส่วน Playwright ตรวจ Preview, การดาวน์โหลดจริงทั้ง desktop/mobile, light/dark mode และ network privacy

Phase 1E, Auth และ Cloud ไม่อยู่ในขอบเขตงานนี้
