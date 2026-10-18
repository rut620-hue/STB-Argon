# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะปัจจุบัน:** **🎉 โครงสร้างสังกัด 4 ระดับ ไดนามิก 100% + ป้องกันข้อมูลซ้ำ + Multi-Row Modals เสร็จสมบูรณ์!**
- **สถาปัตยกรรม:** `WebApp/` (`shared/`, `Portal-SSO/`, `sample-subapp/`) + Supabase Schema `portal` (PostgreSQL 17.11) + GAS

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **GitHub Pages:** `https://rut620-hue.github.io/STB-Argon/`
- **GAS Microservice (`@1`):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (PostgreSQL 17.11 — Schema `portal` 8 ตาราง + 26+ RPCs)

## 3. งานล่าสุดที่เสร็จสมบูรณ์ (Recent Completed)
- **Database & Live Patch:** `fn_save_reference_data` / `fn_save_position_structure` รองรับ BATCH ป้องกันข้อมูลซ้ำ Compound Unique, Normalize ตัวพิมพ์ใหญ่ และ Seed DIVISION ครบทั้ง 3 ส่วน
- **Portal App & SSO:** Dynamic Org & Position Cascades (100% Deduplication), Register Step 2, Dashboard Maintenance Guard & Badges, Masked ID Card, Single Username Edit, Live Header Sync
- **Portal Admin:** Dynamic `#personnel` STATUS, `#webapps` ▲▼ & Status Toggle, `#users` Perm Revoke, `#reference` 4 Bureau Tabs & Multi-Row Modal, `#positions` PREFIX/STATUS & Dynamic Type & Multi-Row Modal, `#settings` 13 Keys Batch Sync
- ตรวจสอบไวยากรณ์ (`node -c`) และทดสอบผลลัพธ์ RPC บน Live Supabase ผ่าน 100%

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 2)
1. พัฒนาเว็บแอปพลิเคชันย่อยเฉพาะทางของส่วนตรวจและบังคับการ (เช่น ระบบตรวจจับกุม/เปรียบเทียบปรับ)
2. เชื่อมต่อฐานข้อมูล Schema `app_<ชื่อระบบ>` บน Supabase เพื่อแยกตรรกะและข้อมูลจากระบบแกนกลาง

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- แผนแม่บทโปรเจกต์: `Working/Master_plan.md`
- ศูนย์รวม URL: `Working/system_urls.md`
