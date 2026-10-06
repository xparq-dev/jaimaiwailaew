# Security Decision — Content Security Policy

วันที่ตัดสินใจ: 2026-10-06

## Context

Production ใช้ CSP จาก `next.config.ts` โดยจำกัด source หลักไว้ที่ same-origin และ origin ของ
Supabase/Cloud Sync ที่ตั้งค่าผ่าน environment variables พร้อมปิด object/embed, จำกัด frame,
form action และ base URI ปัจจุบัน `script-src` ยังต้องมี `'unsafe-inline'` สำหรับ Next.js hydration

โครงการเป็น local-first PWA และพึ่ง static/offline app shell, service worker cache allow-list
และ CDN/static optimization จึงต้องประเมินผลกระทบก่อนใช้ nonce ต่อ request

## Decision

ยังไม่ใช้ nonce-based CSP ใน Production baseline ปัจจุบัน และไม่เปิด experimental SRI

เหตุผล:

- คู่มือ Next.js ของ version ที่ติดตั้งกำหนดว่า nonce ต้องสร้างใหม่ทุก request
- การใช้ nonce ทำให้ทุกหน้าต้อง dynamic render, ปิด static optimization/ISR และไม่รองรับ PPR
- ผลกระทบต่อ CDN caching, server load, latency และ offline app shell ยังไม่มี acceptance evidence
- hash-based SRI ของ App Router ยังเป็น experimental และไม่ควรเพิ่มใน release-hardening cleanup

## Controls ที่คงไว้

- CSP origin allow-list, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` และ
  `frame-ancestors 'none'`
- HSTS, `nosniff`, Referrer Policy, Permissions Policy และ same-origin opener policy
- ไม่เพิ่ม third-party script/analytics โดยไม่มี privacy review
- service worker cache เฉพาะ public app shell และไม่ cache Auth, Cloud Sync, user data หรือ export
- dependency, lint, typecheck, unit/browser tests และ production-header verification

## Trigger ให้ทบทวนใหม่

- มีข้อกำหนด compliance ที่ห้าม `'unsafe-inline'`
- เปลี่ยน architecture ไปใช้ dynamic rendering อยู่แล้ว
- Next.js มี strict CSP/SRI แบบ stable ที่รักษา static/PWA behavior ได้
- เพิ่ม third-party script หรือเกิด security finding ที่ controls ปัจจุบันป้องกันไม่พอ

เมื่อเกิด trigger ต้องทำ PR แยกพร้อม browser matrix, offline/PWA regression, performance comparison,
Preview/Production header inspection และ rollback plan
