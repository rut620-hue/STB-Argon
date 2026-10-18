# ✅ รายการงานปัจจุบัน (Active Task Checklist)

## เฟส 0: การตั้งค่าระบบ AI Operating System & Project Bootstrap
- [x] อ่านและวิเคราะห์ `Wiki/AI_Workflow_Blueprint.md`
- [x] สร้าง `.agents/AGENTS.md` และโปรไฟล์ Subagents ทั้ง 4 ตัว (`planner`, `coder`, `reviewer`, `archivist`)
- [x] เชื่อมต่อและทดสอบ GitHub (`STB-Argon`), GAS (`1V-dsBkgFv9zJ...`), และ Supabase PostgreSQL 17.11 (`ycyefnsfamlhnwgizavs`)
- [x] วิเคราะห์ `Wiki/Portal_SSO_Blueprint/` และโปรเจกต์ต้นแบบ (`122wcJrr...`) ครบ 100%

## เฟส 1: พัฒนาระบบหลัก Central Portal & SSO (แบ่ง 4 เฟสย่อยเพื่อประหยัด Token)
- [x] **🟢 เฟส 1A: ฐานข้อมูล Supabase Schema `portal` (8 ตาราง 68 คอลัมน์ + RPCs + Seed ข้อมูลตั้งต้น)** *(เสร็จสมบูรณ์ 100%)*
  - [x] สร้าง `supabase/migrations/01_portal_schema_and_tables.sql` (ครบ 8 ตาราง 68 คอลัมน์)
  - [x] สร้าง `supabase/migrations/02_portal_rpc_and_seed.sql` (ครบทุก RPC + First-Time Setup Bypass + `fn_reset_test_data`)
  - [x] รัน Migration เข้า Supabase จริงและทดสอบ RPC สำเร็จ (`is_setup_mode: true`, 13 Settings, 20 Reference Data, 37 Positions)
- [x] **🔵 เฟส 1B: GAS Microservice + Shared SDK + 3D Loader (`Loader.html`) + ธีมสีเขียว กทม. & ฟอนต์หลัก `Sarabun`** *(เสร็จสมบูรณ์ 100%)*
  - [x] พัฒนาและ Deploy `gas/รหัส.js` & `gas/appsscript.json` (`clasp push` & `clasp deploy @1`)
  - [x] สร้าง `shared/stb-loader.js`, `shared/stb-sso-guard.js`, `shared/stb-drive-upload.js`
  - [x] สร้าง `assets/css/portal.css` (ฟอนต์หลัก `Sarabun` จาก Google Fonts + Light/Dark Mode)
- [ ] **🟡 เฟส 1C: หน้าเว็บ Central Portal SPA (ส่วนที่ 1: โครงสร้างหลัก, First-Time Setup Bypass, Auth, Dashboard & Profile)** *(เฟสถัดไป)*
  - [ ] สร้าง `index.html`, `assets/js/portal-config.js`, `assets/js/portal-api.js`
  - [ ] สร้าง `assets/js/portal-app.js` (ส่วนที่ 1: Login/Setup Bypass, Register 3 ขั้นตอน, Dashboard การ์ดแอป SSO, Profile & วาดลายเซ็น)
- [ ] **🟣 เฟส 1D: หน้าเว็บ Central Portal SPA (ส่วนที่ 2: ระบบจัดการ Admin/Superadmin & แอปย่อยตัวอย่าง)**
  - [ ] เพิ่มโมดูล `#personnel`, `#users`, `#webapps`, `#reference`, `#positions` (Batch Add & เลื่อนลำดับ `▲▼`), `#settings` (พร้อมปุ่ม `รีเซ็ตข้อมูลทดสอบ`)
  - [ ] สร้าง `apps/sample-subapp/index.html` ทดสอบ SSO ครบวงจร และ Push ขึ้น GitHub Pages
