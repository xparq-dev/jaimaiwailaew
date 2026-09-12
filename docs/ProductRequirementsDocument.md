Product Requirements Document

> หมายเหตุสถานะการดำเนินงาน: ข้อกำหนดในเอกสารนี้เป็น source of truth ของผลิตภัณฑ์
> ส่วนผลการทำ Phase 0, deployment และ acceptance gates ที่ยังค้าง อัปเดตไว้ใน
> [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) เพื่อไม่แก้ข้อกำหนดให้ปะปนกับสถานะงาน

ชื่อและตัวตนผลิตภัณฑ์
รายการ	ข้อกำหนด
ชื่อไทย	จ่ายไม่ไหวแล้ว
ชื่ออังกฤษ	Jai Mai Wai Laew
Technical slug	JaiMaiWaiLaew
โดเมนเริ่มต้น	jaimaiwailaew.vercel.app
ประเภทผลิตภัณฑ์	Progressive Web App หรือ PWA
ภาษาเริ่มต้น	ไทยเป็นหลัก พร้อมโครงสร้าง i18n สำหรับไทยและอังกฤษ
กลุ่มเป้าหมายหลัก	ผู้ขายออนไลน์, ฟรีแลนซ์, คนที่มีหลายรายได้, เจ้าของกิจการรายย่อย, พนักงานประจำ
คุณค่าหลัก	ช่วยบันทึก สรุป และประมาณการภาษีอย่างเข้าใจง่าย โดยไม่ทำให้ผู้ใช้ต้องเป็นผู้เชี่ยวชาญภาษี
น้ำเสียง	สุภาพ, น่าเชื่อถือ, เข้าใจง่าย, เป็นมืออาชีพ, ไม่ตลกจนลดความน่าเชื่อถือ
สถานะทางกฎหมาย	เครื่องมือช่วยบันทึก/ประมาณการ/จัดเตรียมข้อมูล ไม่ใช่ผู้ยื่นแบบ ไม่ใช่สำนักงานบัญชี และไม่ใช่คำปรึกษาภาษีเฉพาะบุคคล
เป้าหมาย MVP 1
MVP 1 ต้องตอบโจทย์ผู้ใช้ที่เข้ามาแบบเร่งด่วน เช่น:

“ฉันขายของออนไลน์ตั้งแต่มกราคมถึงมิถุนายน อยากรู้ว่ารายได้รวมเท่าไร รายจ่ายเท่าไร ข้อมูลของฉันพร้อมประมาณการภาษีหรือยัง และอยากพิมพ์สรุปออกไปดู”

MVP 1 ต้องทำสิ่งต่อไปนี้ได้:

ใช้งานโดยไม่สมัครสมาชิก

ไม่จำกัดจำนวนครั้งในการคำนวณ

ไม่บันทึกข้อมูลผู้เยี่ยมชมไปยัง Cloud

เก็บข้อมูลชั่วคราวเฉพาะใน session หรือใน browser ของผู้ใช้ตามการอนุญาต

เพิ่ม/แก้ไข/ลบรายการรายรับ รายจ่าย ภาษีหัก ณ ที่จ่าย และค่าลดหย่อนเบื้องต้น

เลือกปีภาษี 2568 และ 2569

คำนวณข้อมูลสะสมรายเดือน

คำนวณช่วง ม.ค.–มิ.ย. สำหรับ Use Case ภ.ง.ด.94

คำนวณประมาณการรายปี

รองรับกรณีเงินเดือน/ภ.ง.ด.91 ระดับพื้นฐาน

แสดงคำเตือนเมื่อข้อมูลยังไม่ครบหรือรายการมีความคลุมเครือ

Export PDF รายละเอียดทั้งหมดที่ผู้ใช้กรอก

ใส่ลายน้ำจางทั่วเอกสาร PDF เช่น Jai Mai Wai Laew — Draft / For reference only

แสดง Disclaimer ในหน้าเว็บและ PDF

ติดตั้งเป็น PWA ได้

ทำงาน Offline สำหรับเครื่องคำนวณที่เคยเปิดและกฎภาษีที่ cache ไว้ล่าสุด

แสดงสถานะ Offline/Online อย่างชัดเจน

รองรับ Dark Mode

Responsive: Desktop, Mobile, Tablet และ browser ใน LINE

สิ่งที่ไม่อยู่ใน MVP 1
ตัดสิ่งเหล่านี้ออกจากเวอร์ชันแรกโดยตั้งใจ:

Login / สมัครสมาชิก

Google Login

LINE Login

การเก็บข้อมูลผู้ใช้บน Cloud

การอัปโหลดเอกสาร

OCR สลิป

LINE Official Account / LINE Bot

Excel/CSV Export

การ Import Excel/CSV

Dashboard สมาชิก

Admin Dashboard ที่จัดการข้อมูลส่วนบุคคล

ระบบสมาชิกแบบมีค่าใช้จ่าย

ระบบชำระเงิน

AI Chatbot ภาษี

การเชื่อมต่อธนาคาร

การยื่นภาษีแทนผู้ใช้

การรับรองว่า PDF/ผลลัพธ์ใช้ยื่นกรมสรรพากรได้โดยตรง

การตัด Scope เช่นนี้จะทำให้คุณสร้างของที่เปิดใช้จริงได้เร็ว ปลอดภัยขึ้น และไม่ต้องมีฐานข้อมูล/ระบบ Auth ตั้งแต่วันแรก

Sitemap และ User Flows
Sitemap สำหรับ MVP 1
text
/
├─ /start
│  ├─ /start/income-type
│  ├─ /start/pnd94
│  ├─ /start/pnd91
│  └─ /start/multi-income
├─ /calculator
│  ├─ /calculator/income
│  ├─ /calculator/expenses
│  ├─ /calculator/withholding-tax
│  ├─ /calculator/allowances
│  ├─ /calculator/summary
│  └─ /calculator/export-pdf
├─ /learn
│  ├─ /learn/tax-basics
│  ├─ /learn/pnd94
│  ├─ /learn/pnd91
│  ├─ /learn/income-types
│  ├─ /learn/expenses
│  ├─ /learn/allowances
│  ├─ /learn/withholding-tax
│  ├─ /learn/tax-calendar
│  └─ /learn/faq
├─ /tax-calendar
├─ /privacy
├─ /terms
├─ /disclaimer
├─ /accessibility
└─ /offline
เมนูหลักสำหรับผู้เยี่ยมชม
หน้าแรก

เริ่มคำนวณ

เครื่องคำนวณภาษี

เรียนรู้ภาษี

ปฏิทินภาษี

คำถามที่พบบ่อย

เกี่ยวกับความเป็นส่วนตัว

เปลี่ยนภาษา

Dark Mode

User Flow: ผู้ขายออนไลน์/ฟรีแลนซ์
text
Landing Page
→ กด “เริ่มสรุปรายได้ 6 เดือน”
→ เลือกปีภาษี 2568 หรือ 2569
→ เลือก “ขายออนไลน์ / ธุรกิจ / ฟรีแลนซ์”
→ กรอกหรือเพิ่มรายการรายรับ
→ กรอกหรือเพิ่มรายการรายจ่าย
→ เพิ่มภาษีหัก ณ ที่จ่าย (ถ้ามี)
→ เพิ่มค่าลดหย่อนเบื้องต้น (ถ้าต้องการ)
→ ตรวจหน้าสรุป ม.ค.–มิ.ย.
→ เห็นยอดสะสมและคำเตือน
→ ดูประมาณการรายปี
→ Export PDF พร้อมลายน้ำ
→ แนะนำสมัครสมาชิกในอนาคตเพื่อเก็บข้อมูล/Export Excel
User Flow: พนักงานประจำ
text
Landing Page
→ กด “คำนวณภาษีเงินเดือน”
→ เลือกปีภาษี
→ กรอกรายได้จากเงินเดือน โบนัส และภาษีหัก ณ ที่จ่าย
→ กรอกค่าลดหย่อน
→ ดูภาษีประมาณการทั้งปี
→ ดูยอดภาษีที่ถูกหักแล้วเทียบกับยอดประมาณการ
→ Export PDF พร้อมลายน้ำ
User Flow: Offline Mode
text
ผู้ใช้เคยเปิดเว็บออนไลน์แล้ว
→ ติดตั้ง PWA หรือเปิดเว็บเดิม
→ อินเทอร์เน็ตขาด
→ หน้าเว็บแสดง Offline Banner
→ ใช้เครื่องคำนวณด้วยข้อมูลที่กรอกในอุปกรณ์ได้
→ ใช้กฎภาษีที่ cache ล่าสุดได้
→ Export PDF จากข้อมูลในอุปกรณ์ได้
→ หน้าเว็บระบุวันที่ของ Tax Rules ที่เก็บไว้
→ เมื่อกลับมาออนไลน์ ระบบแจ้งว่ามีข้อมูลกฎหมายใหม่หรือไม่
ข้อความ Offline Banner ที่แนะนำ:

คุณกำลังใช้งานแบบออฟไลน์ ผลคำนวณใช้ข้อมูลและกฎภาษีที่บันทึกล่าสุดในอุปกรณ์นี้ โปรดเชื่อมต่ออินเทอร์เน็ตเพื่อตรวจสอบข้อมูลล่าสุดก่อนนำข้อมูลไปใช้ประกอบการยื่นภาษี

Tech Architecture
Stack ที่แนะนำ
สำหรับ MVP 1 ซึ่งยังไม่มีบัญชีผู้ใช้หรือ Cloud Data Storage ให้เริ่มให้เล็กที่สุดก่อน:

Layer	เครื่องมือแนะนำ	เหตุผล
Framework	Next.js + TypeScript + App Router	เหมาะกับ PWA, SEO, หน้าเนื้อหา, PDF และต่อยอด Auth ได้
UI	Tailwind CSS + shadcn/ui	สร้าง UI มืออาชีพเร็ว, รองรับ Dark Mode, ปรับแต่งได้
Form	React Hook Form + Zod	ตรวจข้อมูลฟอร์มและคุม Type ได้ดี
State	Zustand หรือ React Context แบบจำกัด	เก็บ Draft Calculation ภายในอุปกรณ์
ตาราง	TanStack Table	จัดการรายรับรายจ่าย, filter, sort และ export ได้ดี
PDF	@react-pdf/renderer หรือ jsPDF	สร้าง PDF ฝั่ง client โดยไม่ส่งข้อมูลไป server
Excel ในอนาคต	SheetJS / xlsx	สร้าง .xlsx แบบหลาย sheet ใน MVP 2
Chart	Recharts	สรุปรายเดือน, รายรับ-รายจ่าย, สัดส่วนหมวดหมู่
PWA	next-pwa หรือ Workbox Service Worker ที่ตั้งค่าเอง	Cache หน้าเว็บและรองรับ offline-first
Analytics	เริ่มจาก Privacy-friendly analytics หรือ Cloudflare Web Analytics	ลดการเก็บ PII และภาระ cookie
Hosting Public Beta	Vercel Hobby + Cloudflare DNS/Turnstile	เริ่มต้นเร็วและต้นทุนต่ำ
Source Control	GitHub	version control, issue tracking, GitHub Actions
Backend MVP 2	Supabase	Auth, Postgres, RLS, Storage, Edge Functions
Email MVP 2	Supabase Auth email หรือ Resend	Email verification และ password reset แบบ token
Rate limit	Cloudflare WAF/Turnstile + Edge rate limit	ป้องกัน abuse และ brute force
ข้อควรระวังด้านรายได้: Vercel Hobby เหมาะกับ Public Beta ที่ยังไม่หารายได้ แต่ Vercel ระบุว่า Hobby จำกัดเพื่อ personal, non-commercial use; เมื่อเว็บเปิดขายแพ็กเกจ รับเงิน หรือมีรายได้เชิงพาณิชย์ ต้องตรวจเงื่อนไขและย้ายไปแผนที่เหมาะสมก่อน

Architecture ของ MVP 1
text
User Browser / PWA
│
├─ Next.js App
│  ├─ Landing / Learn / Calculator
│  ├─ Client-side Tax Calculation Engine
│  ├─ IndexedDB / Browser Local Draft Storage
│  ├─ Client-side PDF Generator
│  ├─ Service Worker / Offline Cache
│  └─ Local Tax Rules Cache
│
├─ Vercel
│  ├─ Static Pages
│  ├─ Server Components
│  └─ Optional API Routes for public content only
│
├─ Cloudflare
│  ├─ DNS
│  ├─ CDN / WAF
│  ├─ Turnstile
│  └─ Optional Worker for public tax-content freshness manifest
│
└─ GitHub
   ├─ Source code
   ├─ CI checks
   ├─ Unit tests
   └─ Versioned tax-rule JSON files
หลักการสำคัญของ MVP 1
เครื่องคำนวณทำงานใน browser

ข้อมูลที่ผู้เยี่ยมชมกรอกไม่ถูกส่งไปยัง server

การสร้าง PDF ทำใน browser เพื่อไม่ส่งรายได้/รายจ่ายขึ้น Cloud

ไม่มี API ที่รับข้อมูลการเงินของผู้เยี่ยมชม

Tax Rules เป็น JSON ที่ versioned ใน source code หรือ public static asset

ไม่มี tracking ที่เก็บเนื้อหารายได้ รายจ่าย ชื่อ หรือข้อมูลกรอกฟอร์ม

Analytics ต้องนับแบบ aggregate เท่านั้น

ต้องมีปุ่ม ล้างข้อมูลในอุปกรณ์นี้ อย่างชัดเจน

Architecture ของ MVP 2
เมื่อพร้อมทำบัญชีผู้ใช้ ให้ต่อ Supabase ภายใต้หลัก “Privacy by Design”:

text
Browser / PWA
│
├─ Supabase Auth
│  ├─ Email + Password
│  ├─ Email verification
│  ├─ Password reset via one-time expiring email link
│  ├─ Google OAuth
│  └─ LINE Login OAuth in a later phase
│
├─ Supabase Postgres
│  ├─ profiles
│  ├─ tax_workspaces
│  ├─ income_entries
│  ├─ expense_entries
│  ├─ withholding_entries
│  ├─ allowance_entries
│  ├─ export_jobs
│  └─ audit_events
│
├─ Supabase Storage
│  ├─ private-tax-documents bucket
│  └─ private-user-uploads bucket
│
├─ Supabase RLS
│  ├─ Owner-only personal records
│  ├─ Least privilege
│  ├─ Separate admin permissions
│  └─ No public PII/document access
│
└─ Cloudflare / Vercel
   ├─ WAF
   ├─ Rate limiting
   ├─ Turnstile
   └─ Server-side secret management
Supabase RLS เป็นแกนสำคัญ เพราะเป็น policy ระดับฐานข้อมูลที่ถูกบังคับทุกครั้งที่เข้าถึง table และ Storage ก็สามารถใช้ RLS เพื่อจำกัดการอัปโหลด ดาวน์โหลด และลบไฟล์ตามสิทธิ์ได้

Tax Rules Data Model
หลักออกแบบ
อย่าเขียนสูตรภาษีใน UI แบบนี้:

ts
if (income > 150000) {
  tax = ...
}
ให้ UI เรียกใช้ Tax Calculation Engine ที่อ่านกฎจาก Tax Rules Version ที่เลือกแทน

Tax Rule ทุกตัวต้องมี:

รหัสกฎ

ปีภาษี

รุ่นของข้อมูล

สถานะ

วันที่เริ่มมีผล

วันที่สิ้นสุดหรือ null

วันที่ตรวจสอบล่าสุด

แหล่งอ้างอิง

ผู้อนุมัติในอนาคต

ข้อความคำเตือน

test cases ที่ผ่านการทดสอบ

โครงสร้างไฟล์ Tax Rules
text
src/
└─ tax/
   ├─ engine/
   │  ├─ calculatePersonalIncomeTax.ts
   │  ├─ calculatePnd94Estimate.ts
   │  ├─ calculatePnd91Estimate.ts
   │  ├─ validateTaxInput.ts
   │  └─ taxRuleResolver.ts
   ├─ rules/
   │  ├─ 2568/
   │  │  ├─ meta.json
   │  │  ├─ tax-brackets.json
   │  │  ├─ income-types.json
   │  │  ├─ expense-deductions.json
   │  │  ├─ allowances.json
   │  │  ├─ pnd94.json
   │  │  └─ sources.json
   │  └─ 2569/
   │     ├─ meta.json
   │     ├─ tax-brackets.json
   │     ├─ income-types.json
   │     ├─ expense-deductions.json
   │     ├─ allowances.json
   │     ├─ pnd94.json
   │     └─ sources.json
   ├─ tests/
   │  ├─ pnd94.test.ts
   │  ├─ pnd91.test.ts
   │  ├─ tax-brackets.test.ts
   │  └─ regression.test.ts
   └─ types.ts
ตัวอย่าง meta.json
json
{
  "taxYearBE": 2569,
  "taxYearCE": 2026,
  "ruleSetId": "th-pit-2569-v1",
  "version": "1.0.0",
  "status": "draft",
  "effectiveFrom": "2026-01-01",
  "effectiveTo": null,
  "lastReviewedAt": "2026-09-12",
  "reviewedBy": "Tax Reviewer",
  "calculationScope": [
    "personal-income-tax-estimate",
    "pnd91-estimate",
    "pnd94-estimate"
  ],
  "disclaimer": "ผลลัพธ์เป็นเพียงการประมาณการเพื่อช่วยจัดเตรียมข้อมูล ไม่ใช่ผลการยื่นแบบหรือคำแนะนำภาษีเฉพาะบุคคล"
}
ตัวอย่าง tax-brackets.json
json
{
  "ruleId": "pit-progressive-rates-2569",
  "taxYearBE": 2569,
  "currency": "THB",
  "basis": "net-taxable-income",
  "brackets": [
    { "from": 0, "to": 150000, "rate": 0 },
    { "from": 150001, "to": 300000, "rate": 0.05 },
    { "from": 300001, "to": 500000, "rate": 0.1 },
    { "from": 500001, "to": 750000, "rate": 0.15 },
    { "from": 750001, "to": 1000000, "rate": 0.2 },
    { "from": 1000001, "to": 2000000, "rate": 0.25 },
    { "from": 2000001, "to": 5000000, "rate": 0.3 },
    { "from": 5000001, "to": null, "rate": 0.35 }
  ],
  "sourceIds": ["rd-pit-rates-primary"],
  "notes": [
    "ต้องตรวจสอบและอนุมัติกฎสำหรับทุกปีภาษีก่อนเปิดเผยแก่ผู้ใช้"
  ]
}
ตารางอัตราภาษีแบบก้าวหน้าที่เผยแพร่โดยกรมสรรพากรระบุช่วงรายได้สุทธิ 0–150,000 บาทเป็นอัตรายกเว้น และอัตราขั้นสูงสุด 35% สำหรับรายได้เกินช่วงบนสุด; อย่างไรก็ดี ทีมผลิตภัณฑ์ควรยืนยันรายละเอียดกับแบบ/คำแนะนำของปีภาษีที่จะเปิดใช้งานก่อนเปลี่ยนสถานะ rule เป็น published

Tax Input Model
ts
type TaxCalculationInput = {
  taxYearBE: 2568 | 2569;
  calculationMode: "pnd94" | "pnd91" | "annual-estimate";
  period: {
    startDate: string;
    endDate: string;
  };
  taxpayer: {
    residencyStatus?: "thai-resident" | "unknown";
    filingStatus?: "single" | "joint" | "unknown";
  };
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  withholdings: WithholdingTaxEntry[];
  allowances: AllowanceEntry[];
  assumptions: {
    annualizeIncome?: boolean;
    applyEstimatedAllowances?: boolean;
  };
};
ข้อกำหนดของ Tax Calculation Engine
รับ input ผ่าน Zod schema

ปฏิเสธตัวเลขติดลบใน field ที่ไม่ควรติดลบ

เก็บเงินเป็นหน่วย satang หรือ integer บาทตาม policy เดียวกัน

ห้ามคำนวณด้วย floating-point แบบไม่มีการจัดการความคลาดเคลื่อน

ระบุทุก assumption ในผลลัพธ์

แสดงคำเตือนหากข้อมูลไม่ครบ

บอกว่าใช้ taxYearBE และ ruleSetId ใด

รองรับการคำนวณซ้ำด้วย input เดิมแล้วได้ผลเดิม

มี unit tests และ regression tests

ห้ามให้ AI เปลี่ยน Tax Rule, threshold หรือ rate อัตโนมัติ

ห้าม publish rule โดยไม่มี source URL, วันที่ตรวจสอบ และผู้อนุมัติใน MVP 3

UI Design System
แนวทางสีที่เลือก
ผมแนะนำ Navy + White + Emerald เพราะดูเป็นเครื่องมือการเงินมืออาชีพ ใช้กับข้อมูลตารางได้ดี และมี Emerald สำหรับสถานะเงินเข้า/ผ่าน/สำเร็จ โดยไม่ดูเหมือนแอปเก็งกำไรหรือเว็บสินเชื่อ

Token	Light Mode	Dark Mode	ใช้สำหรับ
brand-navy	#0B1F3A	#DCE8F8	Heading, navigation, brand
brand-emerald	#0E8F68	#3DD6A1	Success, เงินเข้า, CTA รอง
brand-sky	#2563EB	#60A5FA	Link, info, focus
surface	#FFFFFF	#0B1220	พื้นหลังหลัก
surface-muted	#F5F7FA	#121C2D	card รอง, table header
text-primary	#111827	#F8FAFC	ข้อความหลัก
text-secondary	#475569	#94A3B8	ข้อความรอง
warning	#B45309	#FBBF24	รายการควรตรวจสอบ
danger	#B91C1C	#F87171	ลบ/ข้อผิดพลาด
border	#D8E0EA	#293548	เส้นแบ่ง
Typography
ฟอนต์ไทย: Noto Sans Thai หรือ IBM Plex Sans Thai

ฟอนต์อังกฤษ/ตัวเลข: Inter หรือ IBM Plex Sans

ตัวเลขยอดเงินใช้ tabular-nums

หัวข้อควรชัด, ไม่ใช้ฟอนต์ลายมือ

ตัวเลขการเงินต้องไม่ถูกตัดด้วย ellipsis

แสดงเงินบาท เช่น ฿125,430.00

ใช้รูปแบบวันที่ไทยได้ เช่น 12 ก.ย. 2569

ในเอกสาร Export ต้องระบุ Asia/Bangkok

Desktop Layout
text
┌─────────────────────────────────────────────────────────┐
│ Top Bar: Logo | Offline State | Language | Theme | Menu │
├───────────────┬─────────────────────────────────────────┤
│ Sidebar       │ Main Content                            │
│               │                                         │
│ ภาพรวม        │ [Title] [Tax Year] [Period]             │
│ รายรับ        │                                         │
│ รายจ่าย       │ [Summary Cards]                         │
│ ภาษีของฉัน    │                                         │
│ ค่าลดหย่อน    │ [Chart] [Action Buttons]                │
│ รายงาน        │                                         │
│ เรียนรู้ภาษี  │ [Entry Table / Form / Summary]          │
│ ตั้งค่า       │                                         │
└───────────────┴─────────────────────────────────────────┘
Mobile Layout
text
┌───────────────────────────────────────┐
│ Logo       Offline Badge   Theme/Menu │
├───────────────────────────────────────┤
│ Main content                           │
│ Summary cards                          │
│ Entry forms and table                  │
│ Floating “+ เพิ่มรายการ” button        │
├───────────────────────────────────────┤
│ ภาพรวม | รายรับ | + | รายจ่าย | สรุป │
└───────────────────────────────────────┘
Dark Mode
ใช้ class strategy เช่น <html class="dark">

เคารพ prefers-color-scheme ครั้งแรก

ผู้ใช้เปลี่ยนเองได้

บันทึก preference ใน local storage

PDF ให้มีธีมขาวแบบเอกสารเสมอ เพื่อการพิมพ์และความเป็นทางการ

ห้ามให้ Dark Mode ทำให้ warning/success อ่านยาก

ตรวจ contrast ขั้นต่ำตาม WCAG

ลายน้ำ PDF
สำหรับ PDF ผู้เยี่ยมชม ใช้ลายน้ำจาง ๆ ทั่วกระดาษ:

text
JAI MAI WAI LAEW
รายงานชั่วคราวเพื่อการอ้างอิง
ไม่ใช่แบบยื่นภาษีอย่างเป็นทางการ
ข้อกำหนด:

Opacity ประมาณ 4–7%

หมุนประมาณ -35 ถึง -45 องศา

ทำซ้ำแบบ tile ทั่วหน้า

ไม่บังตัวเลข ตาราง หรือข้อความสำคัญ

Header และ Footer ต้องยังอ่านง่าย

มี Disclaimer แบบตัวอักษรจริงในหน้าแรกและหน้าสุดท้าย ไม่พึ่งลายน้ำอย่างเดียว

Privacy, Security และ PDPA
หลักสำคัญที่สุด
อย่าใช้ข้อความว่า:

“เว็บไซต์ไม่เก็บข้อมูลส่วนบุคคลของผู้ใช้”

เพราะแม้ใน MVP 1 จะไม่เก็บข้อมูลบน Cloud แต่ยังอาจมี browser storage, analytics, server access log หรือ cookies ตามการตั้งค่า

ข้อความที่เหมาะสมกว่าบน MVP 1:

“เครื่องคำนวณสำหรับผู้เยี่ยมชมออกแบบให้ประมวลผลข้อมูลในอุปกรณ์ของคุณ และไม่ส่งรายการรายรับ รายจ่าย หรือข้อมูลการคำนวณไปจัดเก็บในฐานข้อมูลของเว็บไซต์ โปรดหลีกเลี่ยงการกรอกข้อมูลอ่อนไหวที่ไม่จำเป็น และล้างข้อมูลในอุปกรณ์เมื่อใช้งานบนเครื่องสาธารณะ”

เมื่อเข้าสู่ MVP 2 และมีระบบสมาชิก ให้เปลี่ยนคำอธิบายเป็น:

“เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ โดยแยกสิทธิ์การเข้าถึงข้อมูลอย่างเข้มงวด ผู้ใช้แต่ละรายเข้าถึงข้อมูลของตนเองได้เท่านั้นตามสิทธิ์ปกติ ผู้ดูแลเนื้อหาและฝ่ายวิเคราะห์ไม่สามารถเข้าถึงข้อมูลการเงินส่วนบุคคลของผู้ใช้ได้”

PDPA กำหนดให้ผู้ควบคุมข้อมูลแจ้งรายละเอียด เช่น วัตถุประสงค์ของการเก็บ ประเภทข้อมูล ระยะเวลาการเก็บ ผู้รับข้อมูล และสิทธิของเจ้าของข้อมูล ก่อนหรือขณะเก็บข้อมูล จึงต้องมี Privacy Notice ที่อ่านง่ายตั้งแต่ก่อนเปิดระบบสมาชิก

MFA และ Password Policy
MVP 2 ต้องใช้:

ยืนยันอีเมลก่อนใช้งาน Cloud data

Password Reset ผ่าน one-time, expiring email link เท่านั้น

ห้ามส่ง password ที่สร้างใหม่ผ่าน LINE หรืออีเมล

Password ขั้นต่ำ 12 ตัวอักษรสำหรับบัญชี password-based

บังคับใช้ password manager-friendly rules

ไม่บังคับ character pattern ที่ทำให้ผู้ใช้ใช้รหัสผ่านอ่อนแอ

Google OAuth สำหรับผู้ใช้ที่ต้องการ login ง่าย

LINE Login ในระยะต่อยอด

จำกัดความพยายาม login เกิน 10 ครั้ง

เพิ่ม progressive delay และ CAPTCHA/Turnstile

แจ้งเตือน login ใหม่หรืออุปกรณ์ใหม่

Logout ทุกอุปกรณ์

เปิดใช้ MFA สำหรับ Owner, Super Admin และ Tax Reviewer ตั้งแต่วันแรกที่มี Admin

ไม่ใช้วันเกิดเป็นปัจจัยกู้บัญชี

Supabase รองรับ password reset ผ่านลิงก์อีเมล และออกแบบ API ให้ไม่เปิดเผยว่าอีเมลใดมีบัญชีอยู่หรือไม่ เพื่อลดความเสี่ยง user enumeration

Emergency Access
คุณเลือกให้มี Emergency Access ซึ่งทำได้ แต่ต้องไม่ทำให้กลายเป็น “ปุ่ม Admin ดูข้อมูลทุกคนได้”

กฎที่ต้องกำหนด:

ใช้ได้เฉพาะ Owner หรือ Super Admin ที่ได้รับอนุมัติ

ต้องกรอกเหตุผล

ต้องมี Ticket ID

ต้องยืนยันตัวตนเพิ่มด้วย MFA

ระบบต้องขอการยินยอมจากผู้ใช้ก่อน หากสถานการณ์อนุญาต

จำกัดเวลา เช่น 30 นาที

แสดงเฉพาะข้อมูลขั้นต่ำที่จำเป็น

ปิดการดาวน์โหลดเอกสารเป็น default

ทุกการเปิดดู, แก้ไข, export ต้องบันทึก Audit Log

ผู้ใช้เห็นประวัติ Emergency Access ของตนเองได้

มีการแจ้งผู้ใช้หลังเกิดเหตุการณ์

ห้ามใช้เพื่อ support ทั่วไปหรือ marketing

Database Schema และ RLS Design
ส่วนนี้เป็น แบบสำหรับ MVP 2 ไม่ต้องสร้างทั้งหมดใน MVP 1 แต่ต้องออกแบบไว้ตั้งแต่ต้น

ตารางหลัก
text
auth.users
│
├─ profiles
├─ user_consents
├─ tax_workspaces
│  ├─ income_entries
│  ├─ expense_entries
│  ├─ withholding_tax_entries
│  ├─ allowance_entries
│  ├─ calculation_snapshots
│  └─ export_records
│
├─ documents
├─ linked_identities
├─ account_deletion_requests
├─ feedback
├─ public_reviews
├─ audit_events
├─ support_tickets
├─ emergency_access_requests
├─ emergency_access_events
├─ tax_rule_sets
├─ tax_rule_sources
├─ tax_rule_change_logs
└─ admin_roles
profiles
sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_user_code text unique not null,
  display_name text,
  legal_first_name text,
  legal_last_name text,
  locale text not null default 'th',
  timezone text not null default 'Asia/Bangkok',
  account_status text not null default 'active',
  deletion_scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
ข้อกำหนด:

ไม่เก็บวันเกิดใน MVP 2 เว้นแต่มี use case ที่ผ่านการพิจารณาจริง

ชื่อจริง/นามสกุลเป็น optional

ใช้ public_user_code สำหรับ Support แทนการเปิดเผย UUID

ไม่ส่งชื่อจริงไป analytics

ไม่ใช้ชื่อจริงเป็น identifier ใน URL

tax_workspaces
sql
create table public.tax_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year_be integer not null,
  workspace_name text not null,
  calculation_mode text not null,
  tax_rule_set_id uuid,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
income_entries
sql
create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tax_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  income_category_code text not null,
  source_name text,
  amount_satang bigint not null check (amount_satang >= 0),
  withholding_tax_satang bigint not null default 0 check (withholding_tax_satang >= 0),
  note text,
  review_status text not null default 'unreviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
expense_entries
sql
create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tax_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  category_code text not null,
  amount_satang bigint not null check (amount_satang >= 0),
  tax_relevance_status text not null default 'needs_review',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
RLS Policy หลัก
หลักการ: ทุก row ที่เป็นข้อมูลส่วนตัวต้องเป็นเจ้าของโดย auth.uid() และผู้ใช้เข้าถึงได้เฉพาะข้อมูลของตนเอง

sql
alter table public.tax_workspaces enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;

create policy "Users can view only their workspaces"
on public.tax_workspaces
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create only their own workspaces"
on public.tax_workspaces
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update only their own workspaces"
on public.tax_workspaces
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete only their own workspaces"
on public.tax_workspaces
for delete
to authenticated
using (user_id = auth.uid());
ทุกตาราง child เช่น income_entries, expense_entries, documents ต้องมีนโยบายในลักษณะเดียวกัน และต้องตรวจ ownership ผ่าน user_id และ/หรือ workspace ที่เป็นของผู้ใช้ อย่าพึ่งความปลอดภัยจาก frontend filtering

Roadmap การพัฒนา
Phase 0: Foundation
เป้าหมาย: สร้างฐานโค้ดที่พัฒนาต่อได้โดยไม่ต้องรื้อ

สร้าง GitHub repository

ตั้งค่า Next.js + TypeScript

ตั้งค่า ESLint, Prettier, Husky

ตั้งค่า environment variables

สร้าง Design System

สร้าง Dark Mode

สร้าง i18n ไทย/อังกฤษ

ตั้งค่า PWA manifest และ service worker

สร้าง Tax Rules data model

สร้าง unit tests สำหรับ Tax Engine

สร้างหน้า Privacy, Terms, Disclaimer

ตั้งค่า Cloudflare DNS, Turnstile และ analytics

ตั้งค่า GitHub Actions

Definition of Done

Deploy Preview ทำงาน

Build ผ่าน

Lint ผ่าน

Tests ผ่าน

Lighthouse และ mobile responsive อยู่ในเกณฑ์ดี

ไม่มี secret อยู่ใน Git

Tax Rule JSON ถูก validate ด้วย schema

Phase 1: MVP 1 Calculator
เป้าหมาย: ผู้เยี่ยมชมคำนวณและ Export PDF ได้โดยไม่มี Cloud account

Landing Page

Onboarding Wizard

เลือกปีภาษี 2568/2569

PND 94 Flow

PND 91 Flow

Income Entry

Expense Entry

Withholding Entry

Allowance Entry

Summary Dashboard

Chart รายเดือน

Tax Warnings

PDF Export พร้อมลายน้ำ

Local Draft Storage

Clear Local Data

Offline Banner

Dark Mode

Responsive UI

Definition of Done

ผู้ใช้เปิดเว็บ, กรอกข้อมูล, คำนวณ, และ Export PDF ได้

ไม่ต้อง Login

ไม่มี financial payload ถูกส่งไป Cloud

PDF แสดง rule version, period, disclaimer และลายน้ำ

เครื่องคำนวณทำงานเมื่อ offline หลังจากเปิดใช้งานออนไลน์มาแล้ว

มี test case สำหรับ PND 94 และ PND 91 ที่สำคัญ

UI อ่านง่ายทั้งมือถือและ Desktop

Phase 2: Knowledge Center
เป้าหมาย: ทำให้เว็บเป็นแหล่งความรู้ ไม่ใช่แค่เครื่องคิดเลข

Tax basics

PND 94 explainer

PND 91 explainer

Income type guide

Expense guide

Allowance guide

Withholding tax guide

Tax calendar

FAQ

Source citation component

Last reviewed date

Version badge

Content search

“อ่านต่อ” ตาม persona

Definition of Done

ทุกบทความมีแหล่งที่มาและวันที่ตรวจสอบ

ไม่มีบทความที่ฟันธงเกินข้อมูล

ทุกบทความมี disclaimer ที่เกี่ยวข้อง

Content สามารถ version ได้ในอนาคต

Phase 3: Account and Cloud Data
เป้าหมาย: ให้ผู้ใช้บันทึกงานและกลับมาใช้ต่อได้อย่างปลอดภัย

Supabase Auth

Email Login

Email verification

Password Reset Link

Google Login

Profile แบบเก็บข้อมูลน้อยที่สุด

Cloud Sync

User Dashboard

Data Export

Account Deletion 30 วัน

RLS ครบทุกตาราง

Audit Log

Consent Management

Phase 4: Reports and Excel
เป้าหมาย: สร้างรายงานที่ใช้งานต่อได้จริง

Excel multi-sheet

CSV export

PDF detail

รายงานรายเดือน/ครึ่งปี/รายปี

Report templates

Export history

Export quota

Document ID

Tax Rule Version ในรายงาน

Download audit logs

Phase 5: Admin and Tax Governance
เป้าหมาย: จัดการความถูกต้องโดยไม่ละเมิดข้อมูลผู้ใช้

Admin Role System

Tax Rule Editor

Tax Source Registry

Review/Approve/Publish workflow

Content Editor

Feedback moderation

Public Review moderation

Aggregate analytics

Usage quotas

Security events

Emergency Access workflow

Phase 6: Paid Usage and LINE
เป้าหมาย: เพิ่มฟีเจอร์ที่มีต้นทุน โดยไม่ทำให้ผู้ใช้ฟรีแบกค่าใช้จ่าย

Plan / quota engine

Payment provider ที่เหมาะสม

Plus package

LINE Login

LINE Official Account

LINE Bot for transaction capture

LINE identity linking

Usage-based credits

Notifications

LINE Login เป็น OAuth/OpenID Connect สำหรับเว็บ ส่วน Messaging API มีต้นทุนและโควตาที่ผูกกับ LINE Official Account จึงควรวางไว้หลังระบบบัญชีและ quota ไม่ใช่ใน MVP แรก

Phase 7: OCR and Receipt Intelligence
เป้าหมาย: ลดงานกรอก แต่ไม่หลอกว่าระบบอ่านถูก 100%

อัปโหลดสลิป

OCR queue

Extract amount/date/reference

User confirmation screen

Expense categorization suggestion

Confidence score

Error correction loop

File retention controls

OCR credits

Private storage

Redaction/masking

ไม่มีการส่งข้อมูลสลิปให้โมเดลภายนอกโดยไม่มี consent ที่ชัดเจน

งบประมาณและโมเดลรายได้
งบ Public Beta
ภายใต้งบไม่เกิน 300 บาทต่อเดือน ให้โฟกัสที่ MVP 1 และหลีกเลี่ยงสิ่งที่สร้างค่าใช้จ่ายผันแปร

รายการ	Public Beta	หมายเหตุ
GitHub	0 บาท	ใช้ repository และ Actions ตามขอบเขต
Vercel Hobby	0 บาท	ใช้ระหว่างยังไม่เชิงพาณิชย์
Cloudflare DNS/WAF/Analytics	0 บาทเป็นหลัก	ใช้ Free Tier และจำกัดงานหนัก
Supabase	0 บาทใน MVP 1	ยังไม่ใช้ Cloud database
Resend	0 บาทใน MVP 1	ยังไม่มี account/email reset
Custom Domain	0 บาทก่อนซื้อ	ใช้ .vercel.app
PDF Export	0 บาท	Generate ใน browser
OCR	0 บาท	ยังไม่เปิดใช้
LINE Bot	0 บาท	ยังไม่เปิดใช้
รวม	ใกล้ 0 บาท	ยังอยู่ในกรอบ 300 บาท
Cloudflare Workers Free มี quota สำหรับ workload แบบ lightweight แต่ไม่ควรใช้เป็นที่ทำ OCR หรือสร้างไฟล์หนัก ๆ เพราะมีขีดจำกัด request/CPU ตามแผน

ฟีเจอร์เสียเงินที่แนะนำเป็นลำดับแรก
ผมเลือกให้ตามคำขอข้อ 14 ของคุณ: เริ่มจาก Excel/CSV รายละเอียด + พื้นที่เก็บข้อมูลบน Cloud แบบจำกัด ก่อน

เหตุผล:

มีคุณค่าชัดสำหรับผู้ขายออนไลน์และฟรีแลนซ์

ต้นทุนควบคุมง่ายกว่า OCR และ LINE Bot

ไม่ต้องจัดการความเสี่ยงการอ่านสลิปผิด

เป็นเหตุผลที่ผู้ใช้เข้าใจง่ายในการสมัคร

ใช้เป็นสะพานจาก “เครื่องคำนวณฟรี” ไปสู่ “เครื่องมือใช้งานต่อเนื่อง”

ช่วยให้ต้นทุน Database/Storage ไม่ตกอยู่กับเจ้าของเว็บทั้งหมด

ลำดับ Monetization ที่แนะนำ:

ฟรี: คำนวณไม่จำกัด + PDF ที่มีลายน้ำ

สมาชิกฟรี: บันทึก Cloud จำนวนจำกัด + PDF รายละเอียด

Plus: Excel/CSV, หลายปีภาษี, รายงานละเอียด, Import Template, พื้นที่เอกสารเพิ่ม

Add-on: OCR เครดิตตามจำนวนสลิป

Add-on: LINE Bot รายเดือนตาม quota

Business Lite: ผู้ใช้หลายโปรเจกต์/หลายช่องทางขาย/ส่งข้อมูลให้นักบัญชี
