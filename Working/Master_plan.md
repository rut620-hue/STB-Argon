# 🎯 แผนแม่บทของโปรเจกต์ (Master Plan - STB APP n2)

## 1. วิสัยทัศน์และเป้าหมายของโปรเจกต์ (Project Vision & Goals)
พัฒนาระบบ **Central Portal & Single Sign-On (SSO)** และเครือข่ายเว็บแอปพลิเคชันย่อยของหน่วยงาน บนสถาปัตยกรรมสมัยใหม่ที่โหลดเร็ว ปลอดภัย ขยายเว็บแอปย่อยได้ไม่จำกัด และแยกข้อมูลแต่ละระบบออกจากกันอย่างเป็นระเบียบ

## 2. สถาปัตยกรรมระบบและเทคโนโลยี (Tech Stack & Multi-Schema Architecture)
1. **Frontend Hosting (GitHub Pages $\rightarrow$ รองรับการย้ายไป Cloudflare Pages ทันที):**
   - โครงสร้าง **Multi-App Subfolder** ใน Repository เดียว (`STB-Argon`):
     - หน้าหลัก `/` = **Central Portal & SSO**
     - โฟลเดอร์ `/shared/` = **Shared SDK (`stb-sso-guard.js`, `stb-drive-upload.js`)**
     - โฟลเดอร์ `/apps/<app_name>/` = **เว็บแอปย่อย** (สร้างเพิ่มได้ไม่จำกัดแล้วนำลิงก์มาลงทะเบียนใน Portal)
2. **Database & Backend Logic (Supabase PostgreSQL 17 - Multi-Schema):**
   - แยก Schema ตามระบบอย่างชัดเจน:
     - Schema **`portal`** = เก็บตารางหลักทั้ง 8 ตารางของ Central Portal & SSO (`personnel`, `users`, `security_tokens`, `webapps`, `permissions`, `system_settings`, `reference_data`, `position_structure`) และฟังก์ชัน RPC
     - Schema **`app_<ชื่อแอปย่อย>`** = สร้างแยกเมื่อพัฒนาเว็บแอปย่อยใหม่แต่ละตัว โดยสามารถอ้างอิงข้อมูลบุคลากรข้ามมาจาก `portal.personnel` ได้
3. **File Storage & Email Microservice (Google Apps Script + Google Drive):**
   - ใช้ GAS (`gas/รหัส.js`) เป็นสะพานรับอัปโหลดไฟล์รูปภาพ/ลายเซ็น/เอกสาร PDF ไปเก็บใน **Google Drive Folder** ตามลิงก์ที่ตั้งค่าไว้ในหน้าตั้งค่าระบบ และใช้ส่งอีเมลยืนยันตัวตน/รีเซ็ตรหัสผ่านฟรี 100%

## 3. แผนการพัฒนาแบ่งตามเฟส (Development Phases)
- **Phase 0:** ติดตั้งระบบ AI Workflow, เชื่อมต่อ GitHub, GAS, Supabase MCP & Skills *(เสร็จสมบูรณ์)*
- **Phase 1:** พัฒนาระบบหลัก **Central Portal & SSO** (สร้าง Schema `portal` 8 ตารางใน Supabase + GAS Drive/Email Microservice + Shared SSO SDK + หน้าเว็บ Portal SPA ครบทุกเมนู + แอปย่อยตัวอย่าง) *(รอผู้ใช้กด Proceed)*
- **Phase 2+:** ทยอยพัฒนาเว็บแอปย่อยใน `/apps/<app_name>/` คู่กับ Schema `app_<app_name>` ใน Supabase
