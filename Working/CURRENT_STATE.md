# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะปัจจุบัน:** **🟢 เฟส 1A, 🔵 เฟส 1B และ 🟡 เฟส 1C เสร็จสมบูรณ์ 100%** พร้อมเริ่ม **🟣 เฟส 1D (ระบบจัดการ Admin/Superadmin & แอปย่อยตัวอย่าง)**

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **GAS Microservice (`@1`):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (Schema: `portal` — 8 ตาราง 68 คอลัมน์ + 26 RPCs)

## 3. งานที่เพิ่งทำเสร็จล่าสุด (Recent Completed - Phase 1C)
- สร้าง `index.html`, `assets/js/portal-config.js`, และ `assets/js/portal-api.js` เชื่อมต่อ 26 RPCs ใน Schema `portal`
- สร้าง `assets/js/portal-app.js` ครอบคลุมระบบ First-Time Setup Bypass, หน้า Login, สมัครสมาชิก 3 ขั้นตอน (ตรวจเลขบัตร 13 หลัก Modulo-11 + Cascading Dropdowns), หน้า `#dashboard` (ส่งต่อ SSO Handshake Token), และหน้า `#profile` (อัปโหลดรูปโปรไฟล์ + กระดานวาดลายเซ็น HTML5 Canvas)

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 1D)
1. พัฒนา `assets/js/portal-admin.js` ครบทั้ง 6 โมดูลผู้ดูแลระบบ: `#personnel`, `#users` (ผูกบัญชี SUPERADMIN คนแรกแล้ว Auto-Login ทันที), `#webapps`, `#reference`, `#positions` (Batch Add & เลื่อนลำดับ `▲▼`), และ `#settings` (ครบ 13 Keys + ปุ่ม `รีเซ็ตข้อมูลทดสอบ`)
2. สร้างเว็บแอปย่อยตัวอย่าง `apps/sample-subapp/index.html` เพื่อทดสอบ SSO ครบวงจร

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- โครงสร้างฐานข้อมูล: `Wiki/Database_Schema.md`
- แผนงานและรายการงาน: `Working/implementation_plan.md` และ `Working/task.md`
