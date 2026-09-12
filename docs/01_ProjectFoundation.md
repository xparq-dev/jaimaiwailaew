> สถานะตรวจล่าสุด 2026-09-12: โค้ด Foundation, GitHub, CI, Vercel Preview และ Production
> ผ่านบน deployment baseline commit `7232114` แต่ Phase 0 ยังมี acceptance gates ภายนอกตาม
> [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) จึงยังไม่ควรประกาศว่าปิด Phase ครบ 100%

สร้าง Foundation ของโปรเจกต์ Jai Mai Wai Laew (จ่ายไม่ไหวแล้ว) ตามข้อกำหนดต่อไปนี้

ใช้ Next.js App Router + TypeScript strict + Tailwind CSS + shadcn/ui + React Hook Form + Zod + Zustand + Vitest + Playwright

สร้าง:
- โครงสร้าง App Router
- Design tokens สำหรับ Navy #0B1F3A, Emerald #0E8F68, Sky #2563EB
- Light/Dark mode ด้วย class strategy
- Font ไทยที่รองรับการแสดงผลดี
- Layout Desktop แบบ Sidebar
- Layout Mobile แบบ Bottom Navigation
- routes: /, /start, /calculator, /learn, /privacy, /terms, /disclaimer, /accessibility, /offline
- PWA manifest
- Service worker skeleton ที่ยังไม่ cache user-generated data
- i18n-ready structure สำหรับ th/en
- README
- ESLint, Prettier, strict TypeScript
- Vitest setup และ Playwright setup
- GitHub Actions workflow สำหรับ lint, typecheck, test และ build

เงื่อนไข:
- ห้ามมี Auth, Supabase, Cloud database, login, OCR, LINE Bot, payment
- ห้าม hard-code กฎหมายหรืออัตราภาษี
- ห้ามใส่ secret หรือ API key
- ต้อง responsive และ accessible
- ให้สรุปรายชื่อไฟล์ที่สร้าง/แก้ และบอกคำสั่ง run/test/build หลังทำเสร็จ
