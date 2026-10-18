# 🎯 แผนแม่บทของโปรเจกต์ (Master Plan - STB APP n2)

## 1. วิสัยทัศน์และเป้าหมายของโปรเจกต์ (Project Vision & Goals)
พัฒนาระบบ **Central Portal & Single Sign-On (SSO)** และเครือข่ายเว็บแอปพลิเคชันย่อยของหน่วยงาน บนสถาปัตยกรรมสมัยใหม่ที่โหลดเร็ว ปลอดภัย ขยายเว็บแอปย่อยได้ไม่จำกัด และแยกข้อมูลแต่ละระบบออกจากกันอย่างเป็นระเบียบ

## 2. สถาปัตยกรรมระบบและเทคโนโลยี (Tech Stack & Multi-Schema Architecture)
1. **Frontend Hosting (GitHub Pages $\rightarrow$ รองรับการย้ายไป Cloudflare Pages ทันที):**
   - โครงสร้าง **WebApp/ Multi-App Subfolder** ใน Repository เดียว (`STB-Argon`):
     - `index.html` = **Root Redirector** ส่งต่อไปยัง `WebApp/Portal-SSO/index.html` ทันที
     - `WebApp/shared/` = **Shared SDK (`stb-loader.js`, `stb-drive-upload.js`, `stb-sso-guard.js`)**
     - `WebApp/Portal-SSO/` = **แอปพลิเคชันหลัก Central Portal & SSO SPA**
     - `WebApp/<app_name>/` = **เว็บแอปพลิเคชันย่อย** (เช่น `WebApp/sample-subapp/` สร้างเพิ่มได้ไม่จำกัดแล้วนำลิงก์มาลงทะเบียนใน Portal)
2. **Database & Backend Logic (Supabase PostgreSQL 17.11 - Multi-Schema):**
   - แยก Schema ตามระบบอย่างชัดเจน:
     - Schema **`portal`** = เก็บตารางหลักทั้ง 8 ตารางของ Central Portal & SSO (`personnel`, `users`, `security_tokens`, `webapps`, `permissions`, `system_settings`, `reference_data`, `position_structure`) และฟังก์ชัน RPC ทั้ง 26 ตัว
     - Schema **`app_<ชื่อแอปย่อย>`** = สร้างแยกเมื่อพัฒนาเว็บแอปย่อยใหม่แต่ละตัว โดยสามารถอ้างอิงข้อมูลบุคลากรข้ามมาจาก `portal.personnel` ได้
3. **File Storage & Email Microservice (Google Apps Script + Google Drive):**
   - ใช้ GAS (`gas/รหัส.js`) เป็นสะพานรับอัปโหลดไฟล์รูปภาพ/ลายเซ็น/เอกสาร PDF ไปเก็บใน **Google Drive Folder** ตามลิงก์ที่ตั้งค่าไว้ในหน้าตั้งค่าระบบ และใช้ส่งอีเมลยืนยันตัวตน/รีเซ็ตรหัสผ่านฟรี 100%

## 3. แผนการพัฒนาแบ่งตามเฟส (Development Phases)
- **Phase 0:** ติดตั้งระบบ AI Workflow, เชื่อมต่อ GitHub, GAS, Supabase MCP & Skills *(เสร็จสมบูรณ์ 100%)*
- **Phase 1:** พัฒนาระบบหลัก **Central Portal & SSO** *(เสร็จสมบูรณ์ 100%)*
  - **🟢 เฟส 1A:** Schema `portal` 8 ตาราง 68 คอลัมน์ + 26 RPCs + First-Time Setup Bypass & Reset Data *(เสร็จสมบูรณ์ 100%)*
  - **🔵 เฟส 1B:** GAS Microservice + Shared SDKs + BMA 3D Loader + ธีมสีเขียว กทม. & ฟอนต์ Sarabun *(เสร็จสมบูรณ์ 100%)*
  - **🟡 เฟส 1C:** Central Portal SPA (Auth, Setup Bypass, Dashboard SSO Card, Profile & Signature Pad) *(เสร็จสมบูรณ์ 100%)*
  - **🟣 เฟส 1D:** โครงสร้าง `WebApp/` + ระบบแอดมิน 6 โมดูลเต็มรูปแบบ + เว็บแอปย่อยตัวอย่าง `sample-subapp` *(เสร็จสมบูรณ์ 100%)*
- **Phase 2+:** พัฒนาเว็บแอปย่อยของส่วนตรวจและบังคับการใน `WebApp/<app_name>/` คู่กับ Schema `app_<app_name>` ใน Supabase
