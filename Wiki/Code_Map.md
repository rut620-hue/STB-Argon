# 🗺️ แผนผังโครงสร้างโปรเจกต์และพิกัดบรรทัด (Code Map & Line Index)

> [!IMPORTANT]
> **กฎเหล็ก Read-Once:** ก่อนใช้ `view_file` เปิดอ่านโค้ดใดๆ ต้องตรวจสอบตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ในไฟล์นี้ก่อนเสมอ และให้ `archivist` อัปเดตเลขบรรทัดทุกครั้งหลังแก้ไขโค้ด

## 1. โครงสร้างโฟลเดอร์โปรเจกต์ (`d:\STB APP n2`)
```text
d:\STB APP n2/
├── .agents/                  # ศูนย์ควบคุมกฎและโปรไฟล์ของ AI (AGENTS.md + 4 Subagents + skills/)
├── .vscode/                  # การตั้งค่า VS Code และ MCP Server (mcp.json)
├── gas/                      # Google Apps Script Microservice (sync ผ่าน clasp)
│   ├── appsscript.json       # Manifest ไฟล์ของ Apps Script
│   └── รหัส.js               # โค้ดต้นฉบับ Apps Script
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
| `supabase/migrations/01_portal_schema_and_tables.sql` | Schema, Sequences & ID Generators | 1–63 | สร้าง Schema `portal`, ตั้งค่า `pgrst.db_schemas` และ Sequences รันรหัสอัตโนมัติ (`PS`, `TK`, `APP`, `REF`, `POS`) |
| `supabase/migrations/01_portal_schema_and_tables.sql` | 8 Tables & Indexes | 64–206 | สร้างตารางทั้ง 8 ตารางครบ 68 คอลัมน์ (`personnel`, `users`, `security_tokens`, `webapps`, `permissions`, `system_settings`, `reference_data`, `position_structure`) และ Indexes |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | Helper & Security Functions | 1–236 | `fn_validate_thai_id`, `fn_build_full_name`, `fn_hash_password`, `fn_has_superadmin`, `fn_build_user_payload` (38 ฟิลด์), `fn_assert_session_or_setup` |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | Init & Auth RPCs | 237–609 | `fn_check_system_init`, `fn_login`, `fn_logout`, `fn_check_id_card_for_register`, `fn_register_user`, `fn_verify_email`, `fn_request_password_reset`, `fn_reset_password` |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | SSO & Master Data RPCs | 610–809 | `fn_get_dashboard_apps`, `fn_generate_sso_token`, `fn_verify_sso_handshake`, `fn_get_portal_master_data` |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | Profile, Admin CRUD & Reset RPCs | 810–1386 | `fn_update_my_profile`, `fn_list/save/delete_personnel`, `fn_list/save/delete_users` (พร้อม Auto-Login ตอนสร้าง SUPERADMIN คนแรก), `fn_list/save/delete_webapps`, `fn_save/delete_reference_data`, `fn_save/delete_position_structure`, `fn_save_system_settings`, `fn_reset_test_data` |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | Seed Defaults (`fn_seed_defaults`) | 1387–1501 | Seed 13 `system_settings`, 20 `reference_data` (สังกัด 4 ระดับ), 37 `position_structure` (6 ประเภท กทม.) และเว็บแอปตัวอย่าง `APP0001` |
| `gas/appsscript.json` | Manifest Settings | 1–7 | การตั้งค่าสภาพแวดล้อม Apps Script V8 & TimeZone `Asia/Bangkok` |
| `gas/รหัส.js` | `myFunction()` | 1–3 | ฟังก์ชันเริ่มต้น Apps Script (รออัปเดตในเฟส 1B) |
