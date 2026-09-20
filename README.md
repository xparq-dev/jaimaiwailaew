# จ่ายไม่ไหวแล้ว (Jai Mai Wai Laew)

เว็บแอปช่วยบันทึก สรุป และประมาณการภาษีเงินได้บุคคลธรรมดาสำหรับผู้ใช้ชาวไทย
ออกแบบเป็น Progressive Web App (PWA) ที่ให้ความสำคัญกับความเป็นส่วนตัว ความเข้าใจง่าย
และการทำงานภายในอุปกรณ์ของผู้ใช้

> ผลลัพธ์ทั้งหมดเป็นเพียงข้อมูลประมาณการเพื่อช่วยเตรียมข้อมูล ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ
> ไม่ใช่คำปรึกษาด้านภาษี และไม่รับรองว่ากรมสรรพากรจะยอมรับผลลัพธ์

## สถานะโครงการ

> สถานะ: Summary Breakdown และ Income Month Grouping merge เข้า main แล้วผ่าน PR #7; Phase 1C Local-only PDF Export กำลังพัฒนาบน branch `feat/local-pdf-export` โดยกฎภาษียังคงเป็น unverified placeholder และบล็อกการคำนวณจริงตาม fail-closed policy

โครงการพัฒนาผ่าน **Phase 0 — Project Foundation**, **Phase 1A — Tax Rule Engine**, **Phase 1B — Calculator UX**, **Phase 1B UX Hotfix** และ Summary Breakdown/Income Month Grouping แล้ว ขณะนี้กำลังเพิ่มรายงาน A4 แบบ local-only แต่ยังไม่มีอัตราภาษีหรือค่าทางกฎหมายจริงที่ยืนยันแล้ว

ขอบเขตและลำดับงานฉบับเต็มอยู่ใน [`docs/`](./docs/) โดยเริ่มจาก
[`00_ProjectMasterPrompt.md`](./docs/00_ProjectMasterPrompt.md) และ
[`03_CalculatorUX.md`](./docs/03_CalculatorUX.md) รายละเอียด workflow กฎภาษีอยู่ที่ [`docs/TaxRuleSourceReviewWorkflow.md`](./docs/TaxRuleSourceReviewWorkflow.md) ส่วนสถานะล่าสุดและรายการคงค้างอยู่ที่
[`PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md)

## หลักการสำคัญของ MVP 1

- ใช้งานสาธารณะได้โดยไม่ต้องสมัครสมาชิกหรือเข้าสู่ระบบ
- ข้อมูลรายการการเงินของผู้เยี่ยมชมประมวลผลภายในอุปกรณ์และไม่ส่งไป backend
- ไม่ใส่ข้อมูลการเงินใน URL, analytics, log หรือ error tracking
- Summary Breakdown เป็น arithmetic aggregation ใน browser; Detail Dialog ใช้ ephemeral state และไม่ส่งข้อมูลออกเครือข่าย
- PDF ต้องสร้างฝั่ง browser และ service worker ต้องไม่ cache PDF หรือข้อมูลที่ผู้ใช้กรอก
- กฎภาษีต้องแยกจาก UI, มี version และผ่าน schema validation
- ค่ากฎหมายที่ยังไม่ได้ตรวจสอบต้องระบุ `unverified` และห้ามนำไปใช้เป็นค่าจริง

## Technology stack ใน Phase 1A

- Next.js App Router และ TypeScript strict mode
- Tailwind CSS และ shadcn/ui
- React Hook Form และ Zod (Tax Domain Schema Validation)
- MoneySatang (Integer satang safe financial operations)
- Vitest สำหรับ unit tests และ Playwright สำหรับ essential end-to-end flows
- ESLint, Prettier และ GitHub Actions

Phase 1C ใช้ pdfmake ฝั่งเบราว์เซอร์และฟอนต์ Sarabun ที่ฝังในแอปเพื่อดาวน์โหลด PDF โดยตรง ไม่มี runtime font CDN; TanStack Table และ Recharts ยังไม่ถูกเพิ่มเพราะยังไม่มี flow ที่ต้องใช้

## เริ่มพัฒนา

ต้องมี Node.js 22.x ตั้งแต่ 22.12 ขึ้นไป และ npm เวอร์ชันที่มากับ Node.js

```bash
npm install
npm run dev
```

จากนั้นเปิด <http://localhost:3000>

หากต้องใช้ environment file ให้คัดลอก `.env.example` เป็น `.env.local` ก่อน
ค่าเริ่มต้นของ foundation ไม่ต้องใช้ secret และห้าม commit `.env.local`

## ตรวจสอบคุณภาพ

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

ติดตั้ง browser สำหรับ E2E หนึ่งครั้ง แล้วรัน Playwright ได้ด้วย:

```bash
npm exec -- playwright install chromium
npm run test:e2e
```

คำสั่ง E2E จะเปิด Next.js test server ที่ `127.0.0.1:3000` และปิดให้อัตโนมัติเมื่อจบ
CI เรียก lint, type check, unit tests และ production build ด้วย Node.js 22 เมื่อ push เข้า `main`
หรือเปิด pull request

`npm run test:e2e` จะ build แล้วเปิด `next start` ก่อนรัน Playwright เพื่อให้ทดสอบ
production CSP, การลงทะเบียน service worker และ offline fallback จริง

## Environment variables

| Variable                         | ประเภท                | วัตถุประสงค์                                                                             |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Public                | canonical URL; `.env.example` ใช้ `http://localhost:3000` และ production ใช้โดเมน Vercel |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public, optional      | placeholder สำหรับ Turnstile ในอนาคต                                                     |
| `TURNSTILE_SECRET_KEY`           | Server-only, optional | ต้องตั้งในระบบ deploy เท่านั้นเมื่อมี integration จริง                                   |

ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะอยู่ใน client bundle จึงห้ามใส่ secret ลงในตัวแปรเหล่านี้

## PWA และ caching strategy

`public/sw.js` เป็น service-worker skeleton แบบ allowlist และมีขอบเขตโดยตั้งใจดังนี้:

- precache เฉพาะหน้า offline fallback และไอคอนสาธารณะ
- cache-on-demand เฉพาะ `/_next/static/`, `/icons/` และ manifest/favicon ที่ระบุชัด
- navigation ใช้ network ก่อน และแสดง static offline fallback เมื่อเชื่อมต่อไม่ได้
- ไม่บันทึก page response, API response, เส้นทาง calculator/start/export/download หรือไฟล์ PDF/CSV/Excel
- cache มี version และลบเฉพาะ cache รุ่นเก่าที่ใช้ namespace ของแอปนี้

Phase นี้ยังไม่ cache calculator shell หรือ tax-rule bundle การรองรับ offline calculation
ต้องเพิ่มภายหลังพร้อม allowlist, rule version, cached timestamp และการทดสอบที่ตรวจว่าไม่มีข้อมูลการเงินหรือ
PDF หลุดเข้า Cache Storage

เมื่อต้องเปลี่ยนสิ่งที่ precache ให้แก้ `CACHE_VERSION` ใน `public/sw.js`
เพื่อให้ service worker ลบ cache รุ่นเก่าหลัง activate

## โครงสร้างที่เกี่ยวข้อง

```text
.
├─ .github/                 # CI และ dependency updates
├─ docs/                    # PRD, ขอบเขตเฟส, Tax review workflow และ deploy checklist
├─ public/                  # PWA assets, offline fallback และ service worker
├─ src/                     # Next.js app, shared code และ tax architecture
│  ├─ calculator/           # Local workspace, MoneySatang arithmetic และ pure breakdown grouping
│  └─ tax/                  # Tax schemas, domain types, money satang utils & resolver
├─ .env.example             # ตัวอย่างตัวแปรโดยไม่มี secret
└─ README.md
```

## Deploy

ก่อน deploy ต้องให้คำสั่งตรวจสอบคุณภาพทั้งหมดผ่าน ทบทวน
[`docs/Checklist ก่อน Deploy.md`](./docs/Checklist%20ก่อน%20Deploy.md) และตรวจว่าไม่มี secret
หรือข้อมูลการเงินของผู้ใช้ใน source, build log หรือ public cache

สถานะ deployment ที่ตรวจล่าสุดเมื่อ 2026-09-12:

- GitHub: <https://github.com/xparq-dev/jaimaiwailaew>
- Production: <https://jaimaiwailaew.vercel.app>
- Runtime: Node.js 22.x ตาม `engines.node` ที่กำหนดเป็น `^22.12.0`
- Vercel เชื่อมกับ GitHub แล้ว การ push เข้า `main` จะสร้าง Production deployment
- Preview deployment ทำงานแล้ว URL จะเปลี่ยนในแต่ละ deployment และอาจต้องเข้าสู่ระบบ
  Vercel ตาม Deployment Protection

Vercel Hobby เหมาะกับการใช้งานแบบ non-commercial ตามเงื่อนไขปัจจุบันของผู้ให้บริการ
หากเปิดบริการเชิงพาณิชย์ต้องตรวจเงื่อนไขและเลือกแผนที่เหมาะสมอีกครั้ง

## สิ่งที่ยังไม่อยู่ในขอบเขต

- Auth, login, Supabase persistence และ cloud document storage
- OCR, อัปโหลดใบเสร็จ, LINE Bot และการเชื่อมต่อธนาคาร
- ระบบสมาชิก การชำระเงิน dashboard และ AI chatbot
- การยื่นภาษีอย่างเป็นทางการหรือคำรับรองว่าผลลัพธ์ถูกต้องตามกฎหมาย
- การอัปเดตกฎหมายอัตโนมัติโดยไม่มี reviewed publish workflow

รายละเอียดข้อจำกัดล่าสุดให้ยึดเอกสารใน `docs/` เป็นหลัก

## ข้อจำกัดที่ยังต้องดำเนินการภายนอก

- กฎภาษีปี 2568/2569 ยังไม่มีค่าจริงและต้องผ่านผู้เชี่ยวชาญก่อนเปิดการคำนวณ
- Privacy, Terms และ Disclaimer เป็นร่าง ต้องเติมผู้ควบคุมข้อมูล ช่องทางติดต่อ และตรวจด้านกฎหมาย
- ยังไม่ได้กำหนด branch protection หรือ ruleset สำหรับ `main` ใน GitHub
- ยังไม่มี Lighthouse report อย่างเป็นทางการสำหรับ mobile และ desktop
- Cloudflare DNS/WAF/Analytics ยังไม่ได้เชื่อม โดยต้องตัดสินใจเรื่อง custom domain ก่อน
- หน้าเว็บตั้ง `noindex` ไว้ใน Foundation โดยตั้งใจ ต้องทบทวนหลังเนื้อหาและกฎผ่านการอนุมัติ
- PWA ใช้ SVG icon แบบ regular/maskable ใน skeleton; ควรเพิ่ม PNG หลายขนาดและตรวจการติดตั้งบนอุปกรณ์จริงก่อน production
- CSP production ยังอนุญาต inline script ที่ Next.js ใช้สำหรับ hydration; ก่อนเปิดรับข้อมูลจริงควรประเมิน nonce-based CSP เทียบกับต้นทุน dynamic rendering
