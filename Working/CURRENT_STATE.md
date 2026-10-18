# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะ:** **🎉 OOP Modular Refactoring เสร็จสมบูรณ์ 100% (10 Views + 16 JS Classes + Quick-Jump Code Map)!**
- **สถาปัตยกรรม:** `WebApp/Portal-SSO/views/` (10 ไฟล์) + `assets/js/` (`core/`, `modules/`, `admin/` 16 คลาส) + Supabase Schema `portal` (PostgreSQL 17.11) + GAS

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main`)
- **GitHub Pages:** `https://rut620-hue.github.io/STB-Argon/`
- **GAS Microservice (`@1`):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (PostgreSQL 17.11 — Schema `portal` 8 ตาราง + 26 RPCs)

## 3. งานล่าสุดที่เสร็จสมบูรณ์ (Recent Completed)
- **Footer Fluid Width & 12 Theme Colors:** `.footer-bar` เทาอ่อน `#F1F5F9`/`#161B22` + ปี พ.ศ. Dynamic (`#ftYear`) + 12 CSS Variables (`--color-1..12`)
- **Loader.html Parity 100%:** `stb-loader.js` & `views/loader.html` รองรับ 4 โหมด (`show`, `hide`, `page`, `into`), `busy`, `saveBrand`, `brandBoot`, `skeleton`, `loadInto`
- **10 HTML Views (`views/`):** `loader`, `auth`, `dashboard`, `profile`, `personnel`, `users`, `webapps`, `reference`, `positions`, `settings`
- **16 JS OOP Classes (`assets/js/`):** แยกจากไฟล์ monolithic เป็น `core/` (4), `modules/` (3), `admin/` (7) และ Facades `portal-app.js`, `portal-admin.js` คงเดิม 100%
- **Quick-Jump Index:** ปรับปรุง `Wiki/Code_Map.md` ระบุพิกัดบรรทัดและ DOM IDs ทุกไฟล์ย่อย ละเอียดยิบ กระโดดอ่านเฉพาะจุดได้ทันที

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items - Phase 2)
1. พัฒนาเว็บแอปพลิเคชันย่อยเฉพาะทางของส่วนตรวจและบังคับการ (เช่น ระบบตรวจจับกุม/เปรียบเทียบปรับ)
2. เชื่อมต่อฐานข้อมูล Schema `app_<ชื่อระบบ>` บน Supabase เพื่อแยกตรรกะและข้อมูลจากระบบแกนกลาง

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- แผนแม่บทโปรเจกต์: `Working/Master_plan.md`
- ศูนย์รวม URL: `Working/system_urls.md`
