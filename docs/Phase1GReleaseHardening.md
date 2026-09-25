# Phase 1G — Release Hardening and Phase 1F Closeout

ตรวจสอบล่าสุด: 2026-09-25 (Asia/Bangkok)

## ขอบเขตและผลลัพธ์

งานนี้เป็น release-governance closeout ไม่ใช่ feature phase และไม่เปลี่ยน runtime behavior,
Auth/OAuth, Cloud Sync, Worker/R2, tax calculation, export หรือ service-worker policy

- Production baseline: `main @ 200979963a6ebaaec7f490a45c625d579652a1f4`
- PR #19: Phase 1F PWA and Offline Completion
- PR #20: member multi-workspace, cross-device sync และ safe workspace deletion
- Production: <https://jaimaiwailaew.vercel.app>
- Production Worker version: `73aaf135-a4b9-4b32-90ae-0b757dec2818`
- Automated Production browser acceptance: ผ่าน 12/12 หลัง rerun mobile timing case
- Workspace deletion บน Production: Product Owner ยืนยันผ่าน; collection sync/tombstone behavior
  มี CI/Browser test coverage
- `supabase/`: local untracked directory เดิม ไม่อยู่ใน scope และไม่ถูกแตะ

## GitHub ruleset

เปิดใช้ repository ruleset `Protect main` (ruleset ID `23977461`) กับ `refs/heads/main` แล้ว:

- บังคับให้เปลี่ยนแปลงผ่าน Pull Request
- บังคับ `Lint, type check, test, and build`
- บังคับ `Browser tests`
- branch ต้องทดสอบกับ `main` ล่าสุดก่อน merge
- บังคับ resolve review conversations
- ป้องกัน force-push และการลบ `main`

Vercel deployment status ยังแสดงใน PR แต่ไม่ได้ตั้งเป็น required status check เพื่อไม่ให้ Deployment
Protection หรือเหตุขัดข้องของผู้ให้บริการภายนอกล็อก repository โดยไม่มีช่องทางแก้ไข

## Lighthouse lab baseline

วัดจาก Production ด้วย Lighthouse `13.5.0` เมื่อ 2026-09-25 โดยใช้ cold-load lab run
แยก mobile และ desktop; SEO ไม่ใช่ release gate เพราะ Production ตั้ง `noindex, nofollow`
โดยเจตนา

| Route | Profile | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Mobile | 71 | 100 | 96 | 60 | 971 ms | 2,881 ms | 1,223 ms | 0 |
| `/start` | Mobile | 69 | 100 | 96 | 60 | 944 ms | 2,884 ms | 1,496 ms | 0 |
| `/login` | Mobile | 70 | 100 | 96 | 60 | 1,003 ms | 2,969 ms | 1,362 ms | 0 |
| `/calculator` | Mobile | 69 | 100 | 96 | 60 | 946 ms | 2,956 ms | 1,441 ms | 0 |
| `/` | Desktop | 95 | 100 | 96 | 60 | 281 ms | 594 ms | 185 ms | 0 |
| `/start` | Desktop | 93 | 100 | 96 | 60 | 272 ms | 632 ms | 204 ms | 0 |
| `/login` | Desktop | 94 | 100 | 96 | 60 | 271 ms | 654 ms | 193 ms | 0 |
| `/calculator` | Desktop | 96 | 100 | 96 | 60 | 270 ms | 630 ms | 160 ms | 0 |

ข้อสรุป:

- Lighthouse accessibility ไม่มี failed audit ในทั้ง 8 reports
- Desktop performance อยู่ในช่วง 93–96
- Mobile performance อยู่ในช่วง 69–71 และ LCP ประมาณ 2.9 วินาที จึงเป็น follow-up
  ด้าน performance ไม่ใช่ข้ออ้างว่า Core Web Vitals ภาคสนามผ่าน
- TBT mobile 1.2–1.5 วินาทีเป็นคอขวดหลัก; unused JavaScript มี estimated savings สูงสุดประมาณ
  530 ms / 88 KiB ใน route ที่ตรวจ
- transfer ต่อ cold load ประมาณ 418–436 KiB โดย JavaScript ประมาณ 332–349 KiB
- Best Practices หักคะแนนจาก missing production source maps ของ JavaScript ขนาดใหญ่และ Chrome
  Inspector CSP issue; source maps เป็น debugging trade-off และต้องประเมินความเสี่ยงก่อนเปิดเผยใน Production
- INP วัดจาก Lighthouse lab run ไม่ได้ ต้องใช้ field data เมื่อมีฐานผู้ใช้และ consent ที่เหมาะสม

## Security and privacy verification

- Production ตอบ HTTPS 200 และมี CSP, HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` และ `Referrer-Policy: strict-origin-when-cross-origin`
- `sw.js` ใช้ `no-cache, no-store, must-revalidate`
- HTML มี `noindex, nofollow` ตาม release policy ปัจจุบัน
- service worker cache เป็น allow-list และ automated tests ยืนยันว่าไม่ cache API, Auth/Profile/Settings,
  Cloud Sync payload, ข้อมูลผู้ใช้ หรือไฟล์ PDF/Excel/CSV
- Production Worker CORS อนุญาตเฉพาะ Production origin, ปฏิเสธ foreign origin ด้วย 403 และ
  ปฏิเสธ request ที่ไม่มี JWT ด้วย 401
- ไม่มี Firebase/FCM/VAPID, Web Push UI หรือ Notification permission request ใน runtime
- CSP ยังใช้ `'unsafe-inline'` สำหรับ Next.js hydration; nonce-based CSP เป็นงานประเมินแยกและห้าม
  เปลี่ยนแบบเร่งด่วนใน documentation-only PR นี้

## Phase 1F closeout decision

ผล implementation, CI, Production browser tests, offline Calculator/PDF, cache privacy, online recovery
และ cross-device workspace sync/delete ผ่านแล้ว จึงปิด **Phase 1F implementation and automated
Production gate = PASS**

อย่างไรก็ตาม ยังไม่มีหลักฐานจากอุปกรณ์จริงครบทุกช่องใน
[`Phase1FManualAcceptance.md`](./Phase1FManualAcceptance.md) โดยเฉพาะ Android install UI,
iOS Add to Home Screen/safe area และ Desktop installed-app UI ดังนั้นสถานะ
**manual device certification = HOLD** จนกว่า Product Owner จะบันทึก device/browser/version และผลจริง
ห้ามตีความ automated Playwright/Lighthouse ว่าแทนการติดตั้งบนอุปกรณ์จริง

## External follow-ups

- Product Owner ต้องกรอกชื่อผู้ควบคุมข้อมูลและช่องทางติดต่อ แล้วให้ผู้เชี่ยวชาญตรวจ
  Privacy/Terms/Disclaimer ก่อนถือว่า legal release gate ผ่าน
- custom domain และ Cloudflare DNS/WAF/Analytics ยังไม่มี decision
- mobile JavaScript/TBT optimization ควรเป็น performance PR แยกที่มี before/after evidence
- Phase 2 Knowledge Center ยังไม่เริ่ม และต้องมี content source/review scope แยก

## Method references

- [Web Vitals](https://web.dev/articles/vitals) — LCP/INP/CLS field thresholds และ percentile guidance
- [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) — lab score interpretation และ variability
- [GitHub repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository) — enforcement และ required checks
