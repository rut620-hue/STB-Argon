# 📌 สถานะปัจจุบันของโปรเจกต์ (Current State - Fast Boot)

## 1. ภาพรวมและเฟสปัจจุบัน
- **ชื่อโปรเจกต์:** STB APP n2 (Central Portal & SSO)
- **สถานะล่าสุด:** **ตั้งค่าสภาพแวดล้อมเครื่องใหม่ + Deep CRUD Audit เสร็จสิ้น 100%**
- **สถาปัตยกรรม:** `WebApp/Portal-SSO/views/` (10 ไฟล์) + `assets/js/` (16 คลาส OOP) + Supabase Schema `portal` + GAS

## 2. การเชื่อมต่อระบบภายนอก (Connected Ecosystem)
- **GitHub:** `https://github.com/rut620-hue/STB-Argon.git` (Branch: `main` — เชื่อมต่อสมบูรณ์)
- **GitHub Pages:** `https://rut620-hue.github.io/STB-Argon/`
- **GAS Microservice (@1):** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`
- **Supabase Project:** `ycyefnsfamlhnwgizavs` (PostgreSQL 17.11 — เชื่อมต่อและทดสอบสำเร็จ 100%)

## 3. งานล่าสุดที่เสร็จสมบูรณ์ (Recent Completed)
- **Environment Setup:** ย้ายมาเครื่องใหม่และเชื่อมต่อ GitHub + Supabase (`ycyefnsfamlhnwgizavs`) สำเร็จ 100%
- **Deep CRUD Audit:** ตรวจสอบเชิงลึกแบบ Line-by-Line ครบทั้งระบบ พบ 10 ประเด็นสำคัญ (เช่น บั๊กลบโครงสร้างตำแหน่ง `pos_id` vs `position_id`, Cross-Tab State Contamination, Data Reset Safety, Webapp Move/Toggle Error, Upload Arg Mismatch)
- **Master Plan Dual Sync:** บันทึกแผนผ่าตัดแก้ไขทั้ง 10 จุดอย่างละเอียดไว้ใน `Working/implementation_plan.md` เรียบร้อยแล้ว

## 4. งานถัดไปที่ต้องทำต่อ (Next Action Items)
1. เมื่อเปิดเครื่องครั้งหน้า: ผู้ใช้กดอนุมัติ (**Proceed**) เพื่อสั่ง `coder` ลงมือแก้ไข 10 จุดตาม `Working/implementation_plan.md`
2. ให้ `reviewer` ตรวจสอบความถูกต้องของ diff และ deploy อัปเดต RPCs บน Supabase
3. ให้ `archivist` อัปเดต `Wiki/Code_Map.md` และสำรองข้อมูล

## 5. พิกัดเอกสารสำคัญ
- แผนผังโค้ดและเลขบรรทัด: `Wiki/Code_Map.md`
- แผนผ่าตัดแก้ไข 10 จุด CRUD: `Working/implementation_plan.md`
- ศูนย์รวม URL: `Working/system_urls.md`
