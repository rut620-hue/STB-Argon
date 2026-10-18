# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะปัจจุบัน:** **🟢 เฟส 1A และ 🔵 เฟส 1B เสร็จสมบูรณ์ 100%** พร้อมเริ่ม **🟡 เฟส 1C (สร้างหน้าเว็บหลัก Central Portal SPA ส่วนที่ 1)**

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **GAS Microservice (`@1`):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (Schema: `portal` — 8 ตาราง 68 คอลัมน์ + 26 RPCs)

## 3. งานที่เพิ่งทำเสร็จล่าสุด (Recent Completed - Phase 1B)
- พัฒนาและ Deploy `gas/รหัส.js` & `gas/appsscript.json` ขึ้น Google Apps Script (`clasp push` & `clasp deploy @1`)
- สร้าง Shared SDK ครบ 3 โมดูล: `shared/stb-loader.js` (BMA 3D Logo Flip Loader), `shared/stb-drive-upload.js`, และ `shared/stb-sso-guard.js`
- สร้าง `assets/css/portal.css` (ธีมสีเขียว กทม. Light/Dark Mode + ฟอนต์หลัก `Sarabun` จาก Google Fonts)

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 1C)
1. สร้าง `index.html`, `assets/js/portal-config.js`, และ `assets/js/portal-api.js`
2. สร้าง `assets/js/portal-app.js` (ส่วนที่ 1: ระบบ First-Time Setup Bypass, หน้า Login, สมัครสมาชิก 3 ขั้นตอน, หน้า `#dashboard` การ์ดแอปย่อย SSO, และหน้า `#profile` พร้อมกระดานวาดลายเซ็น)

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- โครงสร้างฐานข้อมูล: `Wiki/Database_Schema.md`
- แผนงานและรายการงาน: `Working/implementation_plan.md` และ `Working/task.md`
