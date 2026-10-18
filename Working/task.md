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
  - [x] สร้าง `WebApp/shared/stb-loader.js`, `WebApp/shared/stb-sso-guard.js`, `WebApp/shared/stb-drive-upload.js`
  - [x] สร้าง `WebApp/Portal-SSO/assets/css/portal.css` (ฟอนต์หลัก `Sarabun` จาก Google Fonts + Light/Dark Mode)
- [x] **🟡 เฟส 1C: หน้าเว็บ Central Portal SPA (ส่วนที่ 1: โครงสร้างหลัก, First-Time Setup Bypass, Auth, Dashboard & Profile)** *(เสร็จสมบูรณ์ 100%)*
  - [x] สร้าง `WebApp/Portal-SSO/index.html`, `WebApp/Portal-SSO/assets/js/portal-config.js`, `WebApp/Portal-SSO/assets/js/portal-api.js`
  - [x] สร้าง `WebApp/Portal-SSO/assets/js/portal-app.js` (Login/Setup Bypass, Register 3 ขั้นตอน, Dashboard การ์ดแอป SSO, Profile & วาดลายเซ็น)
- [x] **🟣 เฟส 1D: หน้าเว็บ Central Portal SPA (ส่วนที่ 2: ปรับโครงสร้าง `WebApp/` + ระบบจัดการ Admin/Superadmin & แอปย่อยตัวอย่าง)** *(เสร็จสมบูรณ์ 100%)*
  - [x] ย้ายโครงสร้างโปรเจกต์เข้า `WebApp/` และสร้าง Root Redirector `index.html`
  - [x] พัฒนา `WebApp/Portal-SSO/assets/js/portal-admin.js` ครบทั้ง 6 โมดูลแอดมิน (`#personnel`, `#users`, `#webapps`, `#reference`, `#positions`, `#settings`)
  - [x] พัฒนา `WebApp/sample-subapp/index.html` ทดสอบ SSO Handshake 38 ฟิลด์, Master Data และ Drive Upload
  - [x] แก้ไข Integration Mismatch ข้ามไฟล์ (`stb-loader.js`, `portal-config.js`, `stb-sso-guard.js`) และรัน SQL Patch หมวด B2 บน Supabase จริง

## เฟส 2+: การพัฒนาเว็บแอปพลิเคชันย่อยเฉพาะทาง
- [ ] วางแผนและออกแบบเว็บแอปย่อยแรกของส่วนตรวจและบังคับการใน `WebApp/<app_name>/`
- [ ] สร้าง Schema `app_<app_name>` ใน Supabase เพื่อเชื่อมโยงข้อมูลกับระบบแกนกลาง
