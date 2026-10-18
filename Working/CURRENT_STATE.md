# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะปัจจุบัน:** **🟢 เฟส 1A เสร็จสมบูรณ์ 100%** (สร้าง Schema `portal` 8 ตาราง 68 คอลัมน์ + 26 ฟังก์ชัน RPC + Seed ค่าตั้งต้นระบบใน Supabase เรียบร้อยแล้ว) พร้อมเริ่ม **🔵 เฟส 1B**

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **Google Apps Script:** `1V-dsBkgFv9zJ-7v5mHP4I73MYVxlomXhG-CXfQooCtMjygJHBsG6pSRA` (`gas/`)
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (`aws-0-ap-south-1.pooler.supabase.com`, PostgreSQL 17.11, Schema: `portal`)

## 3. งานที่เพิ่งทำเสร็จล่าสุด (Recent Completed - Phase 1A)
- สร้างและรัน `supabase/migrations/01_portal_schema_and_tables.sql` (8 ตาราง 68 คอลัมน์ใน Schema `portal`)
- สร้างและรัน `supabase/migrations/02_portal_rpc_and_seed.sql` (RPCs ครบทุกโมดูล, `First-Time Setup Bypass Mode`, `fn_reset_test_data`, และ Seed 13 Settings + 20 Reference Data + 37 Position Structure)
- ทดสอบ `portal.fn_check_system_init()` บน Supabase จริง ยืนยัน `is_setup_mode: true` (`has_superadmin: false`)

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 1B)
1. พัฒนาและ Deploy `gas/รหัส.js` & `gas/appsscript.json` (รับอัปโหลดไฟล์เข้า Google Drive Folder + ส่งอีเมลยืนยัน/รีเซ็ตรหัสผ่าน)
2. สร้าง Shared SDK (`shared/stb-loader.js` 3D Flip Loader, `shared/stb-sso-guard.js`, `shared/stb-drive-upload.js`)
3. สร้าง `assets/css/portal.css` (ธีมสีเขียว กทม. Light/Dark Mode + ฟอนต์หลัก `Sarabun` จาก Google Fonts)

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- โครงสร้างฐานข้อมูล: `Wiki/Database_Schema.md`
- แผนงานและรายการงาน: `Working/implementation_plan.md` และ `Working/task.md`
