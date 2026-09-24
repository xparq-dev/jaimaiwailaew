# Phase 1F Manual Device Acceptance

ใช้ข้อมูลทดสอบเท่านั้น ห้ามใส่ข้อมูลการเงินจริง token หรือข้อมูลบัญชีลง screenshot/log

## Android / Chromium

- [ ] เปิด Production/Preview ออนไลน์หนึ่งครั้ง แล้วรอจนหน้า Calculator พร้อมใช้งาน
- [ ] Install app จาก browser UI ได้ โดยไม่มี custom permission prompt
- [ ] ไอคอน 512 px และ maskable icon ไม่ถูกตัดส่วนสำคัญ
- [ ] เปิดจาก Home Screen แล้วทำงานใน standalone display
- [ ] เปิด airplane mode แล้ว reload หน้า Calculator ที่เตรียมไว้ได้
- [ ] เพิ่ม/แก้ไข/ลบรายการทดสอบออฟไลน์ และยอดสรุป/ภาษีปรับตาม
- [ ] Offline banner แสดง rule version และ cached timestamp
- [ ] Preview และดาวน์โหลด PDF ออฟไลน์ได้
- [ ] กลับออนไลน์แล้วข้อมูล local ไม่หาย และ app shell อัปเดตได้

## iOS / Safari

- [ ] Add to Home Screen ได้และไอคอน Apple touch แสดงถูกต้อง
- [ ] เปิดจาก Home Screen แล้ว layout ไม่ล้น safe area
- [ ] หลัง first online visit เปิด Calculator และข้อมูล local ใน airplane mode ได้
- [ ] Offline banner, การคำนวณ และ recovery ทำงานตาม expected behavior
- [ ] บันทึกข้อจำกัดของ PDF preview/download ตาม Safari/iOS version ที่ทดสอบ

## Desktop Chromium

- [ ] Installability indicator/app install UI ปรากฏเมื่อ browser รองรับ
- [ ] เปิด installed app แบบ standalone และ keyboard navigation ใช้งานได้
- [ ] DevTools Application แสดง manifest/icons/service worker ไม่มี error
- [ ] Cache Storage ไม่มี `/api`, Auth/Profile/Settings/Sync, OAuth callback, ข้อมูลผู้ใช้ หรือไฟล์ export
- [ ] Update service worker แล้ว cache namespace รุ่นเก่าถูกล้าง โดย Local Storage ไม่ถูกลบ

## Accessibility / visual

- [ ] Offline banner อ่านด้วย screen reader ได้และไม่แย่ง focus
- [ ] Light/Dark mode มี contrast และไม่มี layout shift บน mobile/desktop
- [ ] ลดการเคลื่อนไหวตาม `prefers-reduced-motion`
- [ ] Static fallback มีลิงก์ไป Calculator และปุ่ม retry ที่ใช้งานด้วย keyboard ได้

## Release record

```text
Phase 1F Manual Acceptance:
- Android device/browser/version:
- Android install/offline/PDF/recovery:
- iOS device/Safari version:
- iOS Add to Home Screen/offline/recovery:
- Desktop browser/version:
- Desktop install/cache privacy/update:
- Accessibility/Dark Mode:
- Result: PASS / HOLD
```
