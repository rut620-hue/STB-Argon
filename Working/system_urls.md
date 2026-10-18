# 🔗 ศูนย์รวมลิงก์ รหัสสคริปต์ และฐานข้อมูลของระบบ (System URLs & IDs)

> [!IMPORTANT]
> เอกสารรวบรวม URL, Script ID, และ Project Reference ของโปรเจกต์ **STB APP n2** (สำหรับรหัสผ่านฐานข้อมูลถูกแยกเก็บไว้ในไฟล์ `.env.local` ซึ่งอยู่ใน `.gitignore` เพื่อความปลอดภัยในการ Push ขึ้น GitHub)

## 1. GitHub Repository & Deployment URLs (ยืนยันการเชื่อมต่อสำเร็จ ✅)
- **Repository URL:** `https://github.com/rut620-hue/STB-Argon.git`
- **Branch หลัก:** `main`
- **GitHub Pages URLs (เปิดใช้งาน):**
  - **Root Redirector:** `https://rut620-hue.github.io/STB-Argon/`
  - **Central Portal & SSO:** `https://rut620-hue.github.io/STB-Argon/WebApp/Portal-SSO/index.html`
  - **Sample Sub-App:** `https://rut620-hue.github.io/STB-Argon/WebApp/sample-subapp/index.html`

## 2. Google Apps Script Microservice (Drive Upload & Email Bridge ✅)
- **GAS Editor URL:** `https://script.google.com/home/projects/1V-dsBkgFv9zJ-7v5mHP4I73MYVxlomXhG-CXfQooCtMjygJHBsG6pSRA/edit`
- **Script ID:** `1V-dsBkgFv9zJ-7v5mHP4I73MYVxlomXhG-CXfQooCtMjygJHBsG6pSRA`
- **Deployment ID (`@1`):** `AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA`
- **GAS Web App Endpoint URL:** `https://script.google.com/macros/s/AKfycbzDR2f1LIawaz6fh4gfEJ6yeIpD7yHG2oWDT07qOpbCpmTpYAExF_O2-KoFeeVnAJsyeA/exec`

## 3. Supabase Database & MCP (ยืนยันการเชื่อมต่อสำเร็จ ✅)
- **Supabase Project Ref:** `ycyefnsfamlhnwgizavs`
- **Supabase Project URL:** `https://ycyefnsfamlhnwgizavs.supabase.co`
- **Supabase Dashboard (Table Editor - Schema `portal`):** `https://supabase.com/dashboard/project/ycyefnsfamlhnwgizavs/editor`
- **PostgreSQL Pooler Host:** `aws-0-ap-south-1.pooler.supabase.com` (Port: `6543`, User: `postgres.ycyefnsfamlhnwgizavs`, Schema: `portal`)
- **PostgreSQL Version:** `PostgreSQL 17.11 on x86_64-pc-linux-gnu`
- **Supabase MCP URL:** `https://mcp.supabase.com/mcp?project_ref=ycyefnsfamlhnwgizavs&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching`
- **Database Password:** เก็บไว้ใน `.env.local` (`SUPABASE_DB_PASSWORD`)

## 4. บัญชีผู้ดูแลระบบ (First-Time Setup Mode)
- ระบบเริ่มต้นในโหมด **First-Time Setup Bypass** (`has_superadmin: false`) เพื่อให้ผู้ดูแลระบบเพิ่มข้อมูลบุคลากรจริงใน `#personnel` แล้วผูกบัญชี `SUPERADMIN` ใน `#users` โดยระบบจะทำ Seamless Auto-Login ให้ทันทีหลังสร้างบัญชีแรกสำเร็จ
