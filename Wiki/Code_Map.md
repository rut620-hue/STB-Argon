# 🗺️ แผนผังโครงสร้างโปรเจกต์และพิกัดบรรทัด (Code Map & Line Index)

> [!IMPORTANT]
> **กฎเหล็ก Read-Once:** ก่อนใช้ `view_file` เปิดอ่านโค้ดใดๆ ต้องตรวจสอบตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ในไฟล์นี้ก่อนเสมอ และให้ `archivist` อัปเดตเลขบรรทัดทุกครั้งหลังแก้ไขโค้ด

## 1. โครงสร้างโฟลเดอร์โปรเจกต์ (`d:\STB APP n2`)
```text
d:\STB APP n2/
├── .agents/                      # ศูนย์ควบคุมกฎและโปรไฟล์ของ AI (AGENTS.md + 4 Subagents + skills/)
├── .vscode/                      # การตั้งค่า VS Code และ MCP Server (mcp.json)
├── index.html                    # 🔄 Root Redirector ส่งต่อไปยัง WebApp/Portal-SSO/index.html ทันที
├── WebApp/                       # 📁 ศูนย์รวมแอปพลิเคชันเว็บทั้งหมดขององค์กร
│   ├── shared/                   # 🧩 Shared SDKs กลางสำหรับทุกแอปพลิเคชัน
│   │   ├── stb-loader.js         # BMA 3D Logo Flip Loader (4 โหมด + brandBoot + hideBoot + Watchdog 60s)
│   │   ├── stb-drive-upload.js   # บีบอัดรูปฝั่ง Client + อัปโหลดรูป/PDF เข้า Google Drive ผ่าน GAS
│   │   └── stb-sso-guard.js      # บังคับเข้าเว็บแอปย่อยผ่าน Portal SSO + ดึงข้อมูลบุคลากรกลาง (STB_SSO)
│   ├── Portal-SSO/               # 🏛️ แอปพลิเคชันหลัก Central Portal & SSO SPA
│   │   ├── index.html            # Main SPA Shell (เรียก ../shared/* และ assets/*)
│   │   └── assets/               # CSS และ JS ประจำตัว Portal
│   │       ├── css/
│   │       │   └── portal.css    # ธีมสีเขียว กทม. (Light/Dark Mode) + ฟอนต์หลัก Sarabun
│   │       └── js/
│   │           ├── portal-config.js  # ตั้งค่า Supabase Schema portal & GAS Microservice URL
│   │           ├── portal-api.js     # API Wrapper เชื่อมต่อ 26 RPCs บน Supabase Schema portal
│   │           ├── portal-app.js     # Core Controller (Boot, Setup Bypass, Auth, Dashboard, Profile & Canvas)
│   │           └── portal-admin.js   # Admin & Superadmin Controller ครบทั้ง 6 โมดูล
│   └── sample-subapp/            # 🚀 เว็บแอปพลิเคชันย่อยตัวอย่าง (Sub-App Example)
│       └── index.html            # ทดสอบรับสิทธิ์ SSO Handshake 38 ฟิลด์, Master Data และ Drive Upload
├── gas/                          # Google Apps Script Microservice (sync ผ่าน clasp)
│   ├── appsscript.json           # Manifest ไฟล์ของ Apps Script
│   └── รหัส.js                   # Microservice อัปโหลดไฟล์เข้า Google Drive & ส่งอีเมล
├── supabase/                     # สคริปต์ฐานข้อมูล Supabase PostgreSQL 17.11
│   └── migrations/               # SQL Migrations สำหรับ Schema portal
│       ├── 01_portal_schema_and_tables.sql
│       └── 02_portal_rpc_and_seed.sql
├── Wiki/                         # ฐานความรู้ Second Brain (index.md, Code_Map.md, Database_Schema.md, log.md)
└── Working/                      # พื้นที่ติดตามสถานะงานปัจจุบัน (CURRENT_STATE.md, task.md, Master_plan.md, system_urls.md)
```

## 2. ตารางพิกัดไฟล์และฟังก์ชัน (File & Function Line Index)

| โมดูล / ไฟล์ | ฟังก์ชัน / ส่วนประกอบ | ช่วงบรรทัด (`StartLine`–`EndLine`) | หน้าที่โดยย่อ |
| :--- | :--- | :---: | :--- |
| `index.html` (Root) | Redirector Script | 1–56 | นำทางผู้ใช้จาก Root ไปยัง `WebApp/Portal-SSO/index.html` ทันที พร้อมส่งต่อ `search` และ `hash` |
| `WebApp/Portal-SSO/index.html` | Central Portal SPA Shell | 1–198 | โครงสร้าง HTML หลักถอดแบบต้นฉบับ (`ref_122wc/Index.html`): Tailwind CDN, Lucide, Chart.js, XLSX, Sarabun, `#splash`, `#loginView` Split Brand Panel, `#appView` (Sidebar, Header, Main, Footer), `#appModal` & `#modalRoot` |
| `WebApp/Portal-SSO/assets/css/portal.css` | BMA Green Theme & UI Components | 1–470 | โทเคนสีเขียว กทม. (`--g0`..`--g2`) + `html.dark`, ฟอนต์ Sarabun, Split Brand Panel, Sidebar, Stat Cards, Tables, Buttons, Chips, Modals, App Grid & กระดานวาดลายเซ็น `.sig-pad-canvas` |
| `WebApp/Portal-SSO/assets/js/portal-config.js` | `STB_CONFIG` | 1–91 | ตั้งค่า Supabase (`ycyefnsfamlhnwgizavs`), Schema `portal`, `GAS_WEBAPP_URL`, `GAS_BRIDGE_URL`, `PORTAL_BASE_URL` |
| `WebApp/Portal-SSO/assets/js/portal-api.js` | `PORTAL_API` | 1–275 | Wrapper เรียกใช้ RPC 26 ตัวบน Supabase Schema `portal` พร้อมจัดการ Session Token และ First-Time Setup Bypass |
| `WebApp/Portal-SSO/assets/js/portal-app.js` | `PORTAL_APP` (Core Controller) | 1–1767 | ควบคุม Boot, Setup Bypass, Auth, Helper Atoms (`icons`, `THEMEC`, `GRADC`, `statCard`, `sectionBar`, `th`, `TW`), สลับธีม `html.dark`, เมนู Sidebar, Dashboard (4 Stat Cards + SSO Launchpad + 2 กราฟ Chart.js), Profile & Canvas Signature |
| `WebApp/Portal-SSO/assets/js/portal-admin.js` | `PORTAL_ADMIN` (Admin Controller) | 1–2006 | จัดการ 6 โมดูลแอดมินตาม UI Atoms: `#personnel`, `#users`, `#webapps`, `#reference` (`▲▼` & Batch), `#positions` (`▲▼` & Batch), `#settings` (13 Keys & Reset) พร้อม Lucide Icons & Auto triggerIcons() |
| `WebApp/shared/stb-loader.js` | `LOADER` (`STB_LOADER`) | 1–369 | **BMA 3D Logo Flip Loader** (`setBrand`, `brandBoot`, `show`, `hide`, `page`, `showPage`, `hideBoot`, `setLogo`, `busy`, `closeSplash`) |
| `WebApp/shared/stb-drive-upload.js` | `STB_DRIVE` | 1–196 | ย่อรูปด้วย Canvas (`compressImageFile`), แปลงลิงก์รูป Drive (`resolveDriveImageUrl`), ตรวจสอบโฟลเดอร์ (`checkDriveFolder`), อัปโหลดไฟล์ (`uploadToDrive`) |
| `WebApp/shared/stb-sso-guard.js` | `STB_SSO` (`PortalAPI`) | 1–240 | บังคับเข้าเว็บแอปผ่าน SSO (`requireSSO`), ดึง Master Data (`getPersonnelList`, `getReferenceData`, `getPositionStructure`), ออกจากระบบ (`logout`) |
| `WebApp/sample-subapp/index.html` | Sample Sub-App UI | 1–595 | เว็บแอปย่อยตัวอย่าง สไตล์ BMA Green (Tailwind Play CDN + Lucide Icons + `portal.css`) ทดสอบรับสิทธิ์ SSO Handshake 38 ฟิลด์, Master Data และ Drive Upload |
| `supabase/migrations/01_portal_schema_and_tables.sql` | Schema, Sequences & 8 Tables | 1–165 | สร้าง Schema `portal`, Sequences รันรหัสอัตโนมัติ และตารางทั้ง 8 ตารางครบ 68 คอลัมน์ |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | RPCs, Setup Guard, Reset & Seed | 1–1812 | ฟังก์ชัน RPC ทั้ง 26 ตัว (`fn_check_system_init`, `fn_login`, `fn_verify_sso_handshake`, `fn_reset_test_data` ฯลฯ) และ Seed ค่าเริ่มต้น |
| `gas/appsscript.json` | WebApp & OAuth Scopes | 1–15 | ตั้งค่า WebApp (`ANYONE_ANONYMOUS`) และสิทธิ์ `drive`, `send_mail`, `external_request` |
| `gas/รหัส.js` | `doGet`, `doPost`, Upload & Email | 1–260 | Router รับคำขอ HTTP, ตรวจสอบโฟลเดอร์ Drive, บันทึกรูป/PDF เข้า Google Drive, และส่งอีเมลยืนยัน/รีเซ็ตรหัสผ่าน |
