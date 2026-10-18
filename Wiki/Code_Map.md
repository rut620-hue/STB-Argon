# 🗺️ แผนผังโครงสร้างโปรเจกต์และพิกัดบรรทัด (Code Map & Line Index)

> [!IMPORTANT]
> **กฎเหล็ก Read-Once:** ก่อนใช้ `view_file` เปิดอ่านโค้ดใดๆ ต้องตรวจสอบตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ในไฟล์นี้ก่อนเสมอ และให้ `archivist` อัปเดตเลขบรรทัดทุกครั้งหลังแก้ไขโค้ด

## 1. โครงสร้างโฟลเดอร์โปรเจกต์ (`d:\STB APP n2`)
```text
d:\STB APP n2/
├── .agents/                  # ศูนย์ควบคุมกฎและโปรไฟล์ของ AI (AGENTS.md + 4 Subagents + skills/)
│   ├── AGENTS.md             # กฎการทำงาน Orchestrator, Subagents และ Model Selection
│   ├── agents/               # โปรไฟล์ Subagents เฉพาะทาง 4 ตัว (planner, coder, reviewer, archivist)
│   └── skills/               # คลังทักษะ Agent Skills (supabase, supabase-postgres-best-practices)
├── .vscode/                  # การตั้งค่า VS Code และ MCP Server
│   └── mcp.json              # Supabase MCP Server endpoint configuration
├── gas/                      # Google Apps Script Project (sync ผ่าน clasp)
│   ├── appsscript.json       # Manifest ไฟล์ของ Apps Script
│   └── รหัส.js               # โค้ดต้นฉบับ Apps Script
├── Wiki/                     # ฐานความรู้ Second Brain (index.md, Code_Map.md, Database_Schema.md, log.md)
├── Working/                  # พื้นที่ติดตามสถานะงานปัจจุบัน (CURRENT_STATE.md, task.md, Master_plan.md, system_urls.md)
├── .clasp.json               # การตั้งค่าเชื่อมต่อ Google Apps Script (ScriptId)
└── .gitignore                # ป้องกัน Secret files (.env*, .clasprc.json)
```

## 2. ตารางพิกัดไฟล์และฟังก์ชัน (File & Function Line Index)

| โมดูล / ไฟล์ | ฟังก์ชัน / ส่วนประกอบ | ช่วงบรรทัด (`StartLine`–`EndLine`) | หน้าที่โดยย่อ |
| :--- | :--- | :---: | :--- |
| `gas/appsscript.json` | Manifest Settings | 1–7 | การตั้งค่าสภาพแวดล้อม Apps Script V8 & TimeZone `Asia/Bangkok` |
| `gas/รหัส.js` | `myFunction()` | 1–3 | ฟังก์ชันเริ่มต้น Apps Script (รอพัฒนา logic ระบบ STB) |
| `.vscode/mcp.json` | Supabase MCP Config | 1–8 | Endpoint URL เชื่อมโยง Supabase Project (`ycyefnsfamlhnwgizavs`) |
| `.clasp.json` | Clasp Root Config | 1–4 | ผูก ScriptId (`1V-dsBkgFv9zJ...`) กับโฟลเดอร์ `gas` |
| `.agents/AGENTS.md` | Core Agent Rules | 1–31 | กฎการทำงาน Multi-Subagent และ Token-Diet Workflow |
| `Working/CURRENT_STATE.md` | Fast Boot State | 1–30 | สถานะย่อล่าสุดของโปรเจกต์ (จำกัดไม่เกิน 40 บรรทัด) |
