# 🗺️ แผนผังโครงสร้างโปรเจกต์และพิกัดบรรทัด (Code Map & Line Index)

> [!IMPORTANT]
> **กฎเหล็ก Read-Once:** ก่อนใช้ `view_file` เปิดอ่านโค้ดใดๆ ต้องตรวจสอบตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ในไฟล์นี้ก่อนเสมอ และให้ `archivist` อัปเดตเลขบรรทัดทุกครั้งหลังแก้ไขโค้ด

## 1. โครงสร้างโฟลเดอร์โปรเจกต์ (`d:\STB APP n2`)
```text
d:\STB APP n2/
├── .agents/                  # ศูนย์ควบคุมกฎและโปรไฟล์ของ AI (AGENTS.md + 4 Subagents + skills/)
├── .vscode/                  # การตั้งค่า VS Code และ MCP Server (mcp.json)
├── index.html                # หน้าเว็บหลัก Central Portal & SSO (Single Page Application Shell)
├── assets/                   # ไฟล์ CSS และ JS ของหน้าเว็บหลัก Central Portal SSO
│   ├── css/
│   │   └── portal.css        # ธีมสีเขียว กทม. (Light/Dark Mode) + ฟอนต์หลัก Sarabun
│   └── js/
│       ├── portal-config.js  # ตั้งค่าการเชื่อมต่อ Supabase Schema portal & GAS Microservice URL
│       ├── portal-api.js     # API Wrapper เชื่อมต่อ 26 RPCs บน Supabase Schema portal
│       ├── portal-app.js     # Core Controller (Phase 1C: Boot, Setup Bypass, Auth, Dashboard, Profile & Signature Pad)
│       └── portal-admin.js   # Admin & Superadmin Controller (Phase 1D: Personnel, Users, Webapps, Reference, Positions, Settings)
├── gas/                      # Google Apps Script Microservice (sync ผ่าน clasp)
│   ├── appsscript.json       # Manifest ไฟล์ของ Apps Script
│   └── รหัส.js               # Microservice อัปโหลดไฟล์เข้า Google Drive & ส่งอีเมล
├── shared/                   # ไลบรารีกลางสำหรับทั้ง Portal และเว็บแอปย่อยทุกตัว
│   ├── stb-loader.js         # BMA 3D Logo Flip Loader (4 โหมด + brandBoot + Watchdog 60s)
│   ├── stb-drive-upload.js   # บีบอัดรูปฝั่ง Client + อัปโหลดรูป/PDF เข้า Google Drive ผ่าน GAS
│   └── stb-sso-guard.js      # บังคับเข้าเว็บแอปย่อยผ่าน Portal SSO + ดึงข้อมูลบุคลากรกลาง
├── supabase/                 # สคริปต์ฐานข้อมูล Supabase PostgreSQL 17.11
│   └── migrations/           # SQL Migrations สำหรับ Schema portal
│       ├── 01_portal_schema_and_tables.sql
│       └── 02_portal_rpc_and_seed.sql
├── Wiki/                     # ฐานความรู้ Second Brain (index.md, Code_Map.md, Database_Schema.md, log.md)
└── Working/                  # พื้นที่ติดตามสถานะงานปัจจุบัน (CURRENT_STATE.md, task.md, Master_plan.md, system_urls.md)
```

## 2. ตารางพิกัดไฟล์และฟังก์ชัน (File & Function Line Index)

| โมดูล / ไฟล์ | ฟังก์ชัน / ส่วนประกอบ | ช่วงบรรทัด (`StartLine`–`EndLine`) | หน้าที่โดยย่อ |
| :--- | :--- | :---: | :--- |
| `supabase/migrations/01_portal_schema_and_tables.sql` | Schema, Sequences & 8 Tables | 1–206 | สร้าง Schema `portal`, Sequences รันรหัสอัตโนมัติ และตารางทั้ง 8 ตารางครบ 68 คอลัมน์ |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | RPCs, Setup Guard, Reset & Seed | 1–1501 | ฟังก์ชัน RPC ทั้ง 26 ตัว (`fn_check_system_init`, `fn_login`, `fn_verify_sso_handshake`, `fn_reset_test_data` ฯลฯ) และ Seed ค่าเริ่มต้น |
| `gas/appsscript.json` | WebApp & OAuth Scopes | 1–15 | ตั้งค่า WebApp (`ANYONE_ANONYMOUS`) และสิทธิ์ `drive`, `send_mail`, `external_request` |
| `gas/รหัส.js` | `doGet`, `doPost`, `extractDriveId_`, `checkDriveFolder_` | 16–128 | Router รับคำขอ HTTP และตรวจสอบลิงก์/รหัสโฟลเดอร์ Google Drive |
| `gas/รหัส.js` | `handleUploadFile_` | 133–216 | รับไฟล์ Base64 บันทึกลง Google Drive Folder, ตั้งสิทธิ์ View และลบไฟล์เก่าอัตโนมัติ |
| `gas/รหัส.js` | `handleSendEmail_`, `buildEmailTemplate_` | 221–304 | ส่งอีเมลยืนยันตัวตน (`VERIFY_EMAIL`) และรีเซ็ตรหัสผ่าน (`RESET_PASSWORD`) ผ่าน `MailApp` |
| `shared/stb-loader.js` | `injectLoaderStyles_`, `LOADER` | 1–312 | โมดูล **BMA 3D Logo Flip Loader** (`setBrand`, `brandBoot`, `show`, `hide`, `page`, `inline`, `busy`, `closeSplash`) |
| `shared/stb-drive-upload.js` | `STB_DRIVE` | 1–203 | ย่อรูปด้วย Canvas (`compressImageFile`), แปลงลิงก์รูป Drive (`resolveDriveImageUrl`), อัปโหลดไฟล์ (`uploadToDrive`) |
| `shared/stb-sso-guard.js` | `STB_SSO` (`PortalAPI`) | 1–239 | ตรวจบัตรผ่าน SSO (`requireSSO`), เรียก RPC (`callPortalRpc`), ดึงข้อมูลบุคลากร/สังกัด/ตำแหน่ง (`getPersonnelList`, `getReferenceData`, `getPositionStructure`) |
| `assets/css/portal.css` | BMA Green Theme & UI Components | 1–466 | ฟอนต์หลัก `Sarabun` จาก Google Fonts, ธีมสีเขียว กทม. (Light/Dark Mode), Split Auth Card, Sidebar, Stat Cards, Tables & Modals |
| `index.html` | Central Portal SPA Shell | 1–181 | โครงสร้าง HTML หลัก (`#splash`, `#ldMask`, `#loginView`, `#appView`, `#setupBanner`, `#appModal`) |
| `assets/js/portal-config.js` | `STB_CONFIG` | 1–69 | ตั้งค่าการเชื่อมต่อ Supabase (`ycyefnsfamlhnwgizavs`) Schema `portal` และ GAS Bridge URL |
| `assets/js/portal-api.js` | `PORTAL_API` | 1–316 | ฟังก์ชันเรียกใช้งาน RPC ทั้ง 26 ตัวบน Supabase Schema `portal` พร้อมจัดการ Session Token |
| `assets/js/portal-app.js` | `PORTAL_APP` (Core, Auth, Dashboard, Profile) | 1–931 | ควบคุม Boot, First-Time Setup Bypass, Login/Register 3 ขั้นตอน, `#dashboard` SSO Launch, และ `#profile` + วาดลายเซ็น Canvas |
| `assets/js/portal-admin.js` | Admin Routes Registry | 1–50 | โครงสร้าง Route ผู้ดูแลระบบ (`#personnel`, `#users`, `#webapps`, `#reference`, `#positions`, `#settings`) รอเติมเต็มในเฟส 1D |
