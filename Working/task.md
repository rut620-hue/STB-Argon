# ✅ รายการงานปัจจุบัน (Active Task Checklist)

## เฟส 0: การตั้งค่าระบบ AI Operating System & Project Bootstrap
- [x] อ่านและวิเคราะห์ `Wiki/AI_Workflow_Blueprint.md`
- [x] สร้าง `.agents/AGENTS.md` และโปรไฟล์ Subagents ทั้ง 4 ตัว (`planner`, `coder`, `reviewer`, `archivist`)
- [x] เชื่อมต่อและทดสอบ GitHub (`STB-Argon`), GAS (`1V-dsBkgFv9zJ...`), และ Supabase PostgreSQL 17.11 (`ycyefnsfamlhnwgizavs`)
- [x] วิเคราะห์ `Wiki/Portal_SSO_Blueprint/` และโปรเจกต์ต้นแบบ (`122wcJrr...`) ครบ 100%

## เฟส 1: พัฒนาระบบหลัก Central Portal & SSO (แบ่งเฟสย่อยเพื่อประหยัด Token)
- [x] **🟢 เฟส 1A: ฐานข้อมูล Supabase Schema `portal` (8 ตาราง 68 คอลัมน์ + RPCs + Seed ข้อมูลตั้งต้น)** *(เสร็จสมบูรณ์ 100%)*
- [x] **🔵 เฟส 1B: GAS Microservice + Shared SDK + 3D Loader (`Loader.html`) + ธีมสีเขียว กทม. & ฟอนต์หลัก `Sarabun`** *(เสร็จสมบูรณ์ 100%)*
- [x] **🟡 เฟส 1C: หน้าเว็บ Central Portal SPA (ส่วนที่ 1: โครงสร้างหลัก, First-Time Setup Bypass, Auth, Dashboard & Profile)** *(เสร็จสมบูรณ์ 100%)*
- [x] **🟣 เฟส 1D: หน้าเว็บ Central Portal SPA (ส่วนที่ 2: ปรับโครงสร้าง `WebApp/` + ระบบจัดการ Admin/Superadmin & แอปย่อยตัวอย่าง)** *(เสร็จสมบูรณ์ 100%)*
- [x] **🟠 เฟส 1E: โครงสร้างสังกัด 4 ระดับ ไดนามิก 100% + ป้องกันข้อมูลซ้ำ + Multi-Row Modals + Cross-Menu Sync** *(เสร็จสมบูรณ์ 100%)*
- [x] **🔴 เฟส 1F: สถาปัตยกรรม OOP Modular (10 HTML Views + 16 JS Classes) + Loader.html Parity 100% + Quick-Jump Code Map** *(เสร็จสมบูรณ์ 100%)*
  - [x] Footer Fluid Width (`w-full`), พื้นหลังเทาอ่อน `#F1F5F9`/`#161B22`, ปี พ.ศ. Dynamic (`#ftYear`), 12 Color Variables (`--color-1..12`)
  - [x] อัปเกรด `WebApp/shared/stb-loader.js` และสร้าง `WebApp/Portal-SSO/views/loader.html` ให้ตรงกับ `ref_122wc/Loader.html` 100% (`LOADER.show`, `LOADER.hide`, `LOADER.page`, `LOADER.into`, `LOADER.busy`, `LOADER.brandBoot`, `LOADER.saveBrand`, `skeleton()`, `loadInto()`)
  - [x] แยกหน้าไฟล์ HTML แบบ Standalone 10 ไฟล์ใน `WebApp/Portal-SSO/views/` (`loader`, `auth`, `dashboard`, `profile`, `personnel`, `users`, `webapps`, `reference`, `positions`, `settings`)
  - [x] แยกไฟล์ JS เป็น OOP Modular Classes 16 ไฟล์ใน `WebApp/Portal-SSO/assets/js/` (`core/` 4 ไฟล์, `modules/` 3 ไฟล์, `admin/` 7 ไฟล์ และ Facades `portal-app.js`, `portal-admin.js` 2 ไฟล์)
  - [x] ปรับปรุง `Wiki/Code_Map.md` เป็น Quick-Jump Index ฉบับสมบูรณ์พร้อมตารางพิกัดบรรทัดรายฟังก์ชันทุกไฟล์
  - [x] ตรวจสอบไวยากรณ์ `node -c` ผ่าน 100% และ Reviewer ยืนยัน Zero-Regression 100%

## เฟส 2+: การพัฒนาเว็บแอปพลิเคชันย่อยเฉพาะทาง
- [ ] วางแผนและออกแบบเว็บแอปย่อยแรกของส่วนตรวจและบังคับการใน `WebApp/<app_name>/`
- [ ] สร้าง Schema `app_<app_name>` ใน Supabase เพื่อเชื่อมโยงข้อมูลกับระบบแกนกลาง
