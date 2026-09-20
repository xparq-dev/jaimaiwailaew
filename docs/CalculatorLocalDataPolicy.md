# นโยบายการจัดเก็บข้อมูลภายในอุปกรณ์ (Calculator Local Data Policy)

อัปเดตล่าสุด: 2026-09-20 (Phase 1D Local-only Excel/CSV Export)

เอกสารนี้ระบุนโยบายและสถาปัตยกรรมความปลอดภัยและการปกป้องความเป็นส่วนตัวของข้อมูลการเงินในส่วนเครื่องคำนวณของ **Jai Mai Wai Laew (จ่ายไม่ไหวแล้ว)**

---

## 1. หลักการความเป็นส่วนตัวสูงสุด (Privacy-First & Local-Only)

1. **ประมวลผลบนอุปกรณ์ของผู้ใช้ 100%:** รายการรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย และค่าลดหย่อนแบบร่างทั้งหมด ถูกจัดเก็บและประมวลผลภายในเบราว์เซอร์ของอุปกรณ์ที่ผู้ใช้ใช้งานอยู่เท่านั้น
2. **ไม่มีการส่งข้อมูลการเงินออกนอกเครื่อง:** ไม่มีการส่ง network request ที่บรรจุข้อมูลรายการ จำนวนเงิน หรือโน้ตไปยัง backend, API หรือระบบภายนอกใด ๆ ทั้งสิ้น
3. **ไม่มีการเก็บใน URL:** ไม่มีการส่งหรือเข้ารหัสข้อมูลการเงินใน URL query string หรือ hash เพื่อป้องกันไม่ให้ข้อมูลรั่วไหลผ่าน web history หรือ server access logs
4. **ไม่มีการส่งเข้า Analytics หรือ Logs:** ข้อมูลรายการการเงินทั้งหมดจะไม่ถูกส่งเข้า analytics, server logs, error tracking หรือ client console logs
5. **Compact Privacy Indicator:** จัดวางการควบคุมความเป็นส่วนตัวแบบกะทัดรัดใต้ heading (“ข้อมูลบันทึกในอุปกรณ์นี้”) ซึ่งสามารถคลิก/แตะเพื่อเปิดอ่านคำอธิบายโดยละเอียดและเข้าถึงปุ่มล้างข้อมูลได้อย่างปลอดภัย

---

## 2. โครงสร้างและการจัดเก็บข้อมูล (Storage Specification)

1. **Storage Mechanism:** ใช้งานเบราว์เซอร์ `localStorage` ผ่าน Zustand Persist Middleware
2. **Storage Keys:**
   - เวอร์ชันปัจจุบัน (v2):
     ```text
     jaimaiwailaew:calculator:v2
     ```
   - เลกาซีเวอร์ชันเดิม (v1):
     ```text
     jaimaiwailaew:calculator:v1
     ```
3. **Schema Versioning:** โครงสร้างข้อมูลระบุ `schemaVersion: 2`
4. **Entry Frequency Model:**
   - รายการรายรับ, รายจ่าย และภาษีหัก ณ ที่จ่าย รองรับสองรูปแบบความถี่:
     - `one_time` (ระบุวัน / รายการครั้งเดียว): ต้องมี `occurredOn: "YYYY-MM-DD"` และ `occurredMonth: null`
     - `monthly` (ระบุเดือน / รายการรายเดือน): ต้องมี `occurredMonth: "YYYY-MM"` และ `occurredOn: null`
   - ค่าลดหย่อนแบบร่างยังคงเป็นยอดรวม draft ไม่มี entry frequency
5. **Atomic-like Migration Flow (write → validate → verify → delete old):**
   - เมื่อตรวจพบข้อมูลจาก v1 (`jaimaiwailaew:calculator:v1`):
     1. อ่าน legacy state จาก key v1
     2. Parse และ validate v1 state ด้วย Zod schema
     3. ทำการ migrate ในหน่วยความจำ โดยกำหนด `schemaVersion: 2`, เพิ่ม `entryFrequency: "one_time"` และ `occurredMonth: null` ให้ทุก entry เดิม
     4. Validate migrated state ด้วย Zod v2 schema
     5. เขียนข้อมูล migrated state ไปยัง `jaimaiwailaew:calculator:v2`
     6. อ่านข้อมูล v2 กลับมาจาก localStorage
     7. Validate ข้อมูลที่อ่านกลับมาด้วย Zod v2 schema อีกครั้ง
     8. ตรวจสอบ Data Integrity (ID ตรงกัน, จำนวน entries ครบทุกหมวดหมู่, คุณสมบัติความถี่ถูกต้อง)
     9. เมื่อทุกขั้นตอนสำเร็จอย่างสมบูรณ์เท่านั้น จึงทำการลบ key v1 เก่า (`removeItem`)
6. **Fail-Safe Mechanism:** หากการอ่าน v1 หรือการเขียน v2 ล้มเหลว หรือข้อมูลไม่สมบูรณ์:
   - ห้ามลบ key v1 โดยเด็ดขาด
   - ห้ามเขียนทับ key v1
   - ห้าม crash (แอปพลิเคชันต้องเปิดใช้งานต่อไปได้)
   - Fallback เป็น safe in-memory state
   - แสดงข้อความเตือนบน UI: *"ไม่สามารถย้ายข้อมูลที่บันทึกไว้ในอุปกรณ์นี้ได้อย่างปลอดภัย ข้อมูลเดิมยังไม่ถูกลบ โปรดลองอีกครั้งหรือล้างข้อมูลในอุปกรณ์เมื่อแน่ใจแล้ว"*
   - ผู้ใช้สามารถกดปุ่ม "ล้างข้อมูลในอุปกรณ์นี้" เพื่อลบทั้ง key v1 และ v2 ได้อย่างหมดจดเมื่อต้องการเริ่มต้นใหม่
7. **Summary Breakdown:** การรวมกลุ่มรายรับตามแหล่งที่มา/หมวดบันทึก และรายจ่ายตามหมวดบันทึก/สถานะ ใช้ arithmetic functions ภายใน browser จากรายการในช่วงเวลาที่เลือกเท่านั้น
   - เงินรวมด้วย integer `MoneySatang`; สัดส่วนเปอร์เซ็นต์มีไว้เพื่อแสดงผลและไม่ถูกใช้คำนวณภาษี
   - แหล่งที่มาว่าง, whitespace, `undefined` หรือ `null` รวมเป็น `ไม่ระบุแหล่งที่มา` โดยไม่มี fuzzy merge หรือ case normalization
   - ไม่มีการจัดประเภทเงินได้ตามกฎหมาย และไม่มีการยืนยันว่ารายจ่ายรายการใดหักภาษีได้
8. **Breakdown Detail Dialog:** กลุ่มที่เลือกและสถานะเปิด/ปิด Dialog เป็น ephemeral UI state เท่านั้น
   - ไม่ persist ลง localStorage และไม่เพิ่ม field ใน calculator schema
   - ไม่ใส่ข้อมูลรายการ, จำนวนเงิน, หมายเหตุ หรือ selected group ลง URL query/hash
   - ไม่ส่ง network request, analytics หรือ log เมื่อเปิด/ปิดหรือดูรายละเอียด
9. **Local-only PDF Export:** รายงาน A4 ถูกสร้างเมื่อผู้ใช้กดดูตัวอย่าง โดยตัวสร้าง PDF ฝั่งเบราว์เซอร์อ่าน workspace ใน memory และแสดง Preview ก่อนให้ผู้ใช้กดดาวน์โหลด
   - Preview และไฟล์ดาวน์โหลดมาจาก PDF blob เดียวกัน ไม่สร้างสำเนาบน server
   - `blob:` URL สำหรับ Preview เป็น URL ชั่วคราวภายใน browser และถูก revoke เมื่อปิด Preview หรือออกจากหน้า
   - Content Security Policy อนุญาตให้ iframe อ่านได้เฉพาะ origin ของแอปและ local `blob:`; ไม่อนุญาต frame จากบริการภายนอก
   - ชื่อรายงานและชื่อที่แสดงในรายงานเป็น ephemeral UI state ไม่ persist เพิ่มใน localStorage และไม่อยู่ใน URL
   - ไม่มีการส่งข้อมูลรายงานหรือไฟล์ PDF ไปยัง Vercel, API, analytics หรือบริการภายนอก
   - ใช้รูปแบบเอกสารสีอ่อนและฟอนต์ Sarabun ที่ฝังในแอป ไม่มี font CDN/runtime request สำหรับการ export
   - รายงานแสดงเฉพาะข้อมูลที่ใช้ตรวจสอบรายการและยอดรวม โดยไม่ส่งออกหมายเหตุส่วนตัว รหัสระบบ หรือสถานะภายในภาษาอังกฤษ
   - รายงานแสดงยอดรวมเชิงคณิตศาสตร์ รายการต้นทาง สรุปตามกลุ่ม และข้อความภาษาไทยว่าการคำนวณภาษียังไม่เปิดใช้งาน
   - ไม่มี tax estimate, tax due, refund หรือ tax rate
10. **Local-only Excel/CSV Export:** สร้างเมื่อผู้ใช้กดปุ่มจาก Workspace ที่อ่านอยู่ใน memory เท่านั้น
   - Excel เป็น OOXML `.xlsx` หลาย Sheet; CSV เป็น ZIP ที่มีไฟล์ `.csv` แยก Summary, Income, Expense, Withholding Tax, Deductions และ Breakdown
   - ไม่ส่งออก ID ภายใน, หมายเหตุส่วนตัว, certificate reference, rule metadata, URL, path, build/version หรือผลคำนวณภาษี
   - ข้อความที่อาจถูกโปรแกรมตารางคำนวณตีความเป็นสูตรถูกทำให้เป็นข้อความก่อนบันทึกไฟล์
   - ไม่มี API request, upload, Auth, Cloud, analytics หรือ background sync ในขั้นตอนสร้างและดาวน์โหลด
11. **Workspace และประเภทผู้ใช้งาน:** โหมดไม่สมัครสมาชิกเก็บ Workspace ได้ 1 รายการใน localStorage เดิม
   - หน้าเริ่มต้นอ่านเฉพาะ state ในอุปกรณ์เพื่อแสดง Workspace เดิมและลิงก์กลับเข้าใช้งาน
   - การเริ่ม Workspace ใหม่ต้องผ่านคำเตือนและ confirmation เดิมก่อนแทนที่ข้อมูล
   - การแก้ไขประเภทผู้ใช้งานเปลี่ยนเฉพาะ `persona` และ `updatedAt`; ไม่ลบหรือย้ายรายการการเงิน
   - คำแนะนำแหล่งรายได้และสถานะ dialog เป็น UI state ใน browser ไม่มี network request และไม่เพิ่มข้อมูลสมาชิก
   - หลาย Workspace, Auth และ Cloud persistence ยังไม่เปิดใช้งาน

---

## 3. นโยบาย Service Worker และการทำงานแบบออฟไลน์ (Offline & Caching Policy)

1. **แคชเฉพาะ Static App Shell:** Service Worker ทำหน้าที่แคชเฉพาะ static HTML shell, JavaScript/CSS bundles (`/_next/static/`), และ assets สาธารณะที่จำเป็นต่อการเปิดหน้าจอ UI
2. **ห้ามแคชข้อมูลผู้ใช้เด็ดขาด:** Service Worker ถูกตั้งค่าด้วยกฎห้ามแคชอย่างเคร่งครัด:
   - ห้ามแคช `localStorage` หรือ IndexedDB
   - ห้ามแคช state หรือ entries ของผู้ใช้
   - ห้ามแคชผลลัพธ์การคำนวณหรือโน้ต
   - ห้ามแคชคำขอ API, การอัปโหลด หรือเอกสารที่สร้างขึ้น (PDF/CSV/Excel/ZIP)
3. **ไม่มี Background Sync:** ไม่อนุญาตให้มี background synchronization หรือ auto-upload ไปยังเซิร์ฟเวอร์

---

## 4. ข้อจำกัดและคำแนะนำด้านความปลอดภัย (Limitations & Recommendations)

1. **ข้อจำกัดของ Browser Data:** ข้อมูลทั้งหมดจะสูญหายหากผู้ใช้สั่งล้างข้อมูลเบราว์เซอร์ (Clear Browsing Data / Clear Cookies & Site Data) หรือใช้โหมดไม่ระบุตัวตน (Incognito / Private Browsing)
2. **คำเตือนอุปกรณ์สาธารณะ (Shared/Public Device Warning):**
   - ไม่แนะนำให้ใช้งานบนอุปกรณ์สาธารณะหรือเครื่องที่ใช้ร่วมกับผู้อื่น
   - มีปุ่ม **"ล้างข้อมูลในอุปกรณ์นี้"** พร้อมกล่องข้อความยืนยัน เพื่อให้ผู้ใช้สามารถลบข้อมูลการเงินทั้งหมด (ทั้ง v1 และ v2) ออกจากเครื่องได้ทันทีเมื่อใช้งานเสร็จสิ้น

---

## 5. สถานะกฎหมายและกฎภาษี (Legal & Tax Rule Status)

1. ข้อมูลทั้งหมดใน Phase 1B เป็นการจัดระเบียบข้อมูลและสรุปผลรวมเชิงคณิตศาสตร์เท่านั้น
2. ไม่มีการคำนวณภาษีจริง ไม่มีการนำอัตราภาษีหรือสูตรกฎหมายมาคำนวณ และไม่แสดงยอดภาษีประมาณการจนกว่าชุดกฎภาษีจะผ่านการตรวจสอบและอนุมัติอย่างเป็นทางการ
3. Summary Breakdown เป็น product data grouping เพื่อช่วยทบทวนข้อมูลเท่านั้น โดย Tax Rules 2568/2569 ยังคง `unverified`/`notForCalculation` และ resolver ยังคง fail-closed
