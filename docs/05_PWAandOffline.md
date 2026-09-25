# Phase 1F — PWA and Offline Completion

> สถานะปัจจุบัน: implementation merge ผ่าน PR #19 แล้ว และ automated Production gate เป็น `PASS`
> ตาม [`Phase1GReleaseHardening.md`](./Phase1GReleaseHardening.md) ส่วน manual device certification
> ยัง `HOLD` จนกว่าจะบันทึกผล Android/iOS/Desktop ใน product matrix ครบ

## เป้าหมาย

ทำให้เครื่องคำนวณและการสร้าง PDF ใช้งานต่อได้หลัง first successful online visit โดยยังรักษา
local-first default และไม่คัดลอกข้อมูลผู้ใช้เข้า Cache Storage

## In scope

- Web App Manifest พร้อม PNG icons ขนาด 192/512, Apple touch icon และ maskable icon
- public Calculator app shell และ build assets ที่จำเป็นต่อการคำนวณด้วยกฎภาษีเวอร์ชัน `1.0.0`
- offline banner ที่แสดงเวอร์ชันกฎและเวลาที่เตรียม cache ตาม Asia/Bangkok
- static offline fallback สำหรับหน้าที่ไม่อยู่ใน safe navigation allow-list
- offline PDF generation หลังระบบเตรียม public PDF runtime ขณะออนไลน์
- การล้าง cache รุ่นเก่าเมื่อ app cache version หรือ tax-rule version เปลี่ยน
- unit/browser/manual-device acceptance

## Cache policy

Service worker ใช้ allow-list และเก็บได้เฉพาะ:

- static fallback, manifest และ public icons
- exact public navigation routes ที่ระบุใน `SAFE_NAVIGATION_PATHS`
- same-origin `/_next/static/` build assets ของ public app shell, tax engine/rules และ PDF runtime
- metadata เชิงเทคนิค: cache version, tax-rule version, cached timestamp และจำนวน route ที่เตรียมสำเร็จ

Service worker ห้าม cache:

- Local Storage, รายรับ, รายจ่าย, ภาษีหัก ณ ที่จ่าย, ค่าลดหย่อน หรือ note ของผู้ใช้
- `/api`, `/auth`, `/login`, `/signup`, `/profile`, `/settings` และ Cloud Sync payload
- query-bearing navigation URL
- PDF, Excel, CSV, ZIP หรือเส้นทาง export/download/upload
- OAuth callback/token หรือข้อมูลบัญชี

ข้อมูลที่ผู้ใช้แก้ขณะออฟไลน์ยังบันทึกใน Local Storage ตามกลไก Calculator เดิม Cloud Sync
ไม่ทำงานแทนผู้ใช้และจะกลับมาทำงานตาม opt-in setting เมื่อออนไลน์

## Invalidation

เมื่อ public shell เปลี่ยนแบบไม่ compatible ให้เพิ่ม `CACHE_VERSION` ใน `public/sw.js` เมื่อเผยแพร่
tax-rule bundle ใหม่ ให้เปลี่ยน `TAX_RULE_VERSION` ให้ตรงกับ reviewed/published metadata
ชื่อ cache จะเปลี่ยนและ service worker จะลบเฉพาะ cache รุ่นเก่าภายใต้ `jmwl-public-static-`

## Acceptance

- Automated: manifest/icon dimensions, cache allow-list/privacy, offline Calculator, cached rule metadata,
  offline PDF และ online recovery
- Manual: Android/desktop installability, iOS Add to Home Screen, maskable safe area, standalone launch,
  update/recovery และ accessibility ตาม
  [`Phase1FManualAcceptance.md`](./Phase1FManualAcceptance.md)

Phase 1F implementation และ automated Production gate ปิดเป็น `PASS` ได้จากหลักฐาน CI/Production
แต่ห้ามระบุว่า manual device certification ผ่านจนกว่าจะมี device/browser/version และผลจริงครบตาม checklist
