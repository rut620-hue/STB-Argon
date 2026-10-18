# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะปัจจุบัน:** **🎉 เฟส 1 (1A, 1B, 1C, 1D) เสร็จสมบูรณ์ครบถ้วน 100%!**
- **สถาปัตยกรรม:** ปรับโครงสร้างสู่ `WebApp/` ครบวงจร (`WebApp/shared/`, `WebApp/Portal-SSO/`, `WebApp/sample-subapp/`) พร้อม Root Redirector `index.html`

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **GitHub Pages:** `https://rut620-hue.github.io/STB-Argon/`
- **GAS Microservice (`@1`):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (PostgreSQL 17.11 — Schema: `portal` 8 ตาราง + 26 RPCs)

## 3. งานที่เสร็จสมบูรณ์ในเฟส 1D (Recent Completed - Phase 1D)
- ย้ายโครงสร้างโปรเจกต์เข้า `WebApp/` และสร้าง Root Redirector `index.html`
- พัฒนา `WebApp/Portal-SSO/assets/js/portal-admin.js` ครบทั้ง 6 โมดูลแอดมิน: `#personnel` (20 คอลัมน์), `#users` (Seamless Auto-Login ใน Setup Mode), `#webapps`, `#reference` (`▲▼` & Batch), `#positions` (`▲▼` & Batch), และ `#settings` (13 Keys & Reset)
- พัฒนาเว็บแอปย่อยตัวอย่าง `WebApp/sample-subapp/index.html` ทดสอบ SSO Handshake 38 ฟิลด์, Master Data และ Drive Upload
- แก้ไขจุด Integration Mismatch ข้ามไฟล์ (`stb-loader.js`, `portal-config.js`, `stb-sso-guard.js`) และรัน SQL Patch หมวด B2 บน Supabase จริงสำเร็จ

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 2)
1. พัฒนาเว็บแอปพลิเคชันย่อยเฉพาะทางของส่วนตรวจและบังคับการ (เช่น ระบบตรวจจับกุม/เปรียบเทียบปรับ)
2. เชื่อมต่อฐานข้อมูล Schema `app_<ชื่อระบบ>` บน Supabase เพื่อแยกตรรกะและข้อมูลจากระบบแกนกลาง

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- แผนแม่บทโปรเจกต์: `Working/Master_plan.md`
- ศูนย์รวม URL: `Working/system_urls.md`
