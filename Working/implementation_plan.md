# 📋 แผนการดำเนินงานทางเทคนิคฉบับสมบูรณ์ (Comprehensive Master Plan) — 🟣 เฟส 1D
**ปรับโครงสร้างโฟลเดอร์ `WebApp/` + อัปเดตไฟล์โค้ดและเอกสารทั้งหมดที่เกี่ยวข้อง + พัฒนาระบบ Admin เต็มรูปแบบ & เว็บแอปย่อยตัวอย่าง**

> [!IMPORTANT]
> **สถานะปัจจุบัน:** แผนงานนี้จัดทำขึ้นในโหมด **Read-Only** โดย `planner` Subagent ตามคำสั่งของผู้ใช้ เพื่อสำรวจและระบุพิกัดไฟล์และบรรทัดทั้งหมดที่ต้องอัปเดตตามหลังการย้ายโครงสร้างเข้า `WebApp/` **โดยยังไม่มีการแตะต้องหรือแก้ไขโค้ดจริงในโปรเจกต์** รอให้ผู้ใช้ตรวจสอบและกดปุ่ม **Proceed** ก่อนเท่านั้น

---

## 1. ภาพรวมการปรับโครงสร้างโฟลเดอร์ (`WebApp/` Architecture)
ย้ายศูนย์รวมเว็บแอปพลิเคชันทั้งหมดเข้าไปอยู่ภายใต้โฟลเดอร์ `WebApp/` แบ่งเป็น 3 องค์ประกอบหลัก:
1. `WebApp/shared/`: Shared SDKs กลางสำหรับทุกแอปพลิเคชัน (`stb-loader.js`, `stb-drive-upload.js`, `stb-sso-guard.js`)
2. `WebApp/Portal-SSO/`: ระบบหลัก Central Portal & SSO SPA Shell และ Assets ประจำตัว
3. `WebApp/<subapp>/`: เว็บแอปพลิเคชันย่อยของหน่วยงาน (เริ่มต้นด้วย `WebApp/sample-subapp/`)

```text
d:\STB APP n2/
├── index.html                        # 🔄 Root Redirector ส่งต่อไปยัง WebApp/Portal-SSO/index.html ทันที
├── WebApp/                           # 📁 ศูนย์รวมแอปพลิเคชันเว็บทั้งหมดขององค์กร
│   ├── shared/                       # 🧩 Shared SDKs กลางสำหรับทุกแอป
│   │   ├── stb-loader.js
│   │   ├── stb-drive-upload.js
│   │   └── stb-sso-guard.js
│   ├── Portal-SSO/                   # 🏛️ แอปพลิเคชันหลัก Central Portal & SSO
│   │   ├── index.html                # Main SPA Shell (เรียก ../shared/* และ assets/*)
│   │   └── assets/                   # CSS และ JS ประจำตัว Portal
│   │       ├── css/portal.css
│   │       └── js/
│   │           ├── portal-config.js
│   │           ├── portal-api.js
│   │           ├── portal-app.js
│   │           └── portal-admin.js   # 6 โมดูลแอดมินเต็มรูปแบบ (เฟส 1D)
│   └── sample-subapp/                # 🚀 เว็บแอปพลิเคชันย่อยตัวอย่าง (Sub-App Example)
│       └── index.html                # เรียก ../shared/* ทดสอบ SSO Handshake ครบ 38 ฟิลด์
├── gas/                              # ☁️ Google Apps Script Microservice
├── supabase/                         # 🗄️ Database Migrations & Seed
├── Wiki/                             # 📚 Knowledge Base & Code Map
└── Working/                          # 📋 Project State & Task Checklist
```

---

## 2. ตารางสรุปพิกัดไฟล์และบรรทัดที่ต้องแก้ไขทั้งหมด (Complete Coordinate Inventory — 16 รายการ)

### 🔹 หมวด A: ไฟล์โค้ดโปรแกรมและโครงสร้างหน้าเว็บ (Source Code & UI — 8 รายการ)

| ลำดับ | ไฟล์เป้าหมาย | ประเภทงาน | บรรทัด | รายละเอียดการดำเนินการ |
| :---: | :--- | :---: | :---: | :--- |
| **A1** | [`index.html`](file:///d:/STB%20APP%20n2/index.html) (Root) | **แปลงเป็น Redirector** | 1–181 | แปลงเป็นหน้า Redirector น้ำหนักเบา ส่งผู้ใช้ที่เปิดหน้าแรก/GitHub Pages ไปยัง `WebApp/Portal-SSO/index.html` ทันที |
| **A2** | `WebApp/Portal-SSO/index.html` | **ย้าย & ปรับ Script Paths** | 171–178 | ย้าย `index.html` เดิมมาที่นี่ และเปลี่ยน Script Tags จาก `shared/...` เป็น `../shared/...` |
| **A3** | `WebApp/Portal-SSO/assets/*` | **ย้ายโฟลเดอร์** | ทั้งหมด | ย้ายโฟลเดอร์ `assets/css/` และ `assets/js/` เข้ามาอยู่ใน `WebApp/Portal-SSO/assets/` |
| **A4** | [`assets/js/portal-config.js`](file:///d:/STB%20APP%20n2/assets/js/portal-config.js#L1-L69) $\rightarrow$ `WebApp/Portal-SSO/assets/js/portal-config.js` | **แก้ Base URL** | 1–69 | ปรับ `PORTAL_BASE_URL` ให้รองรับโครงสร้าง `/WebApp/<subapp>/` และชี้กลับมาที่ `WebApp/Portal-SSO/index.html` |
| **A5** | [`assets/js/portal-app.js`](file:///d:/STB%20APP%20n2/assets/js/portal-app.js#L62-L71) $\rightarrow$ `WebApp/Portal-SSO/assets/js/portal-app.js` | **แก้ SSO Launch URL** | 62–71 | ปรับฟังก์ชัน `resolveWebappTargetUrl` ให้ใช้ `new URL(rawUrl, window.location.href).href` เพื่อ Resolve Relative Path ข้ามโฟลเดอร์ (`../<subapp>/index.html`) ได้แม่นยำ 100% |
| **A6** | [`shared/stb-sso-guard.js`](file:///d:/STB%20APP%20n2/shared/stb-sso-guard.js#L25-L45) $\rightarrow$ `WebApp/shared/stb-sso-guard.js` | **ย้าย & แก้ Portal URL** | 25–45 | ย้าย `shared/` เข้า `WebApp/shared/` และปรับ Default `portalUrl` จาก `../../index.html` เป็น `../Portal-SSO/index.html` |
| **A7** | [`assets/js/portal-admin.js`](file:///d:/STB%20APP%20n2/assets/js/portal-admin.js#L1-L50) $\rightarrow$ `WebApp/Portal-SSO/assets/js/portal-admin.js` | **แทนที่ Stub ด้วยโค้ดจริง** | 1–50 | พัฒนาระบบจัดการ Admin/Superadmin เต็มรูปแบบ 6 โมดูล (`#personnel`, `#users`, `#webapps`, `#reference`, `#positions`, `#settings`) |
| **A8** | `WebApp/sample-subapp/index.html` | **สร้างไฟล์ใหม่** | 1–END | พัฒนาเว็บแอปย่อยตัวอย่าง เรียกใช้ `../shared/*` ทดสอบ SSO Handshake 38 ฟิลด์, Master Data และ Drive Upload |

---

### 🔹 หมวด B: ฐานข้อมูลและการ Seed ข้อมูลเริ่มต้น (Database & Migrations — 2 รายการ)

| ลำดับ | ไฟล์เป้าหมาย | ประเภทงาน | บรรทัด | รายละเอียดการดำเนินการ |
| :---: | :--- | :---: | :---: | :--- |
| **B1** | [`supabase/migrations/02_portal_rpc_and_seed.sql`](file:///d:/STB%20APP%20n2/supabase/migrations/02_portal_rpc_and_seed.sql#L1480-L1501) | **อัปเดต Seed Webapp URL** | 1480–1501 | แก้ไข URL ของ `APP0001` จาก `'apps/sample-subapp/index.html'` เป็น `'../sample-subapp/index.html'` เพื่อให้ตรงกับโครงสร้างใหม่ |
| **B2** | ฐานข้อมูลจริง Supabase (Schema `portal`) | **รันคำสั่ง SQL Patch** | - | รัน SQL: `UPDATE portal.webapps SET url = '../sample-subapp/index.html' WHERE webapp_id = 'APP0001';` เพื่อให้ข้อมูลแถวเดิมในระบบใช้งานได้ทันที |

---

### 🔹 หมวด C: เอกสารฐานความรู้ แผนแม่บท และการติดตามงาน (Wiki & Working Docs — 6 รายการ)

| ลำดับ | ไฟล์เป้าหมาย | ประเภทงาน | บรรทัด | รายละเอียดการดำเนินการ |
| :---: | :--- | :---: | :---: | :--- |
| **C1** | [`Wiki/Code_Map.md`](file:///d:/STB%20APP%20n2/Wiki/Code_Map.md#L6-L55) | **อัปเดตผังและดัชนีบรรทัด** | 6–55 | อัปเดตผัง ASCII Directory Tree ให้มีโฟลเดอร์ `WebApp/` และปรับแก้พาธในตารางดัชนีบรรทัดของทุกไฟล์ให้ตรงกับพิกัดจริงหลังย้าย |
| **C2** | [`Working/Master_plan.md`](file:///d:/STB%20APP%20n2/Working/Master_plan.md#L1-L40) | **อัปเดตโครงสร้างสถาปัตยกรรม** | 8–25 | ปรับหัวข้อโครงสร้าง Multi-App Subfolder จาก `/shared/` และ `/apps/` ให้เป็นโครงสร้าง `WebApp/` (`WebApp/shared/`, `WebApp/Portal-SSO/`, `WebApp/<app_name>/`) |
| **C3** | [`Working/CURRENT_STATE.md`](file:///d:/STB%20APP%20n2/Working/CURRENT_STATE.md#L1-L25) | **อัปเดตสถานะงานปัจจุบัน** | 1–25 | อัปเดตพิกัดไฟล์ทั้งหมดให้สะท้อนโฟลเดอร์ `WebApp/` และบันทึกว่าเฟส 1D เสร็จสมบูรณ์ |
| **C4** | [`Working/task.md`](file:///d:/STB%20APP%20n2/Working/task.md#L1-L25) | **อัปเดตรายการ Checklist** | 14–24 | อัปเดต Path ในเช็กลิสต์ของเฟส 1B, 1C และ 1D จาก `shared/*`, `assets/*`, `apps/*` ให้เป็น `WebApp/*` ทั้งหมด |
| **C5** | [`Working/system_urls.md`](file:///d:/STB%20APP%20n2/Working/system_urls.md#L1-L35) | **อัปเดตตาราง URL ของระบบ** | 1–35 | เพิ่ม URL ของ Root Redirector, `WebApp/Portal-SSO/index.html`, และ `WebApp/sample-subapp/index.html` |
| **C6** | [`Wiki/log.md`](file:///d:/STB%20APP%20n2/Wiki/log.md) | **บันทึกประวัติการเปลี่ยนแปลง** | ท้ายไฟล์ | บันทึกประวัติการย้ายโครงสร้างโปรเจกต์เข้าสู่ `WebApp/` และการพัฒนาเสร็จสิ้นของเฟส 1D |

---

## 3. รายละเอียดการพัฒนาโมดูลในเฟส 1D

### 3.1 `WebApp/Portal-SSO/assets/js/portal-admin.js` (ครบทั้ง 6 โมดูลแอดมิน)
1. **`#personnel` (ทำเนียบบุคลากร 20 คอลัมน์):** ค้นหา Realtime, กรองสถานะ, เพิ่ม/แก้ไข/ลบครบ 20 คอลัมน์, Cascading Dropdowns สังกัด 4 ระดับและตำแหน่ง 3 ระดับ, อัปโหลดรูปโปรไฟล์และลายเซ็นลง Google Drive
2. **`#users` (จัดการผู้ใช้งาน & สิทธิ์รายแอป + Seamless Auto-Login ใน Setup Mode):** ผูกบุคลากรจากทำเนียบ, กำหนด Role (`USER`, `ADMIN`, `SUPERADMIN`), ตารางกำหนดสิทธิ์รายเว็บแอป (`NONE`, `USER`, `ADMIN`) และเมื่อสร้าง `SUPERADMIN` คนแรกในโหมด Setup จะล็อกโหมด Bypass และ Auto-Login เข้าสู่บัญชีจริงทันที
3. **`#webapps` (จัดการเว็บแอปพลิเคชันย่อย SSO):** เพิ่ม/แก้ไข/ลบเว็บแอปย่อย, อัปโหลดไอคอนแอปเข้า Google Drive, ทดสอบเปิดแอปผ่าน SSO
4. **`#reference` (โครงสร้างสังกัด 4 ระดับ & คำนำหน้าชื่อ):** 5 แท็บ (`PREFIX`, `BUREAU`, `OFFICE`, `DEPARTMENT`, `DIVISION`) พร้อมปุ่มเลื่อนลำดับ `▲▼` และปุ่ม **เพิ่มแบบกลุ่ม (Batch Add)**
5. **`#positions` (โครงสร้างตำแหน่ง 6 ประเภทของ กทม.):** 6 แท็บตามโครงสร้าง กทม. พร้อมปุ่มเลื่อนลำดับ `▲▼` และปุ่ม **เพิ่มแบบกลุ่ม (Batch Add)**
6. **`#settings` (ตั้งค่าระบบครบ 13 Keys + ทดสอบโฟลเดอร์ Google Drive + รีเซ็ตข้อมูลทดสอบ):** แก้ไขครบ 13 Keys, ปุ่มทดสอบโฟลเดอร์ Google Drive รายช่อง, และปุ่มรีเซ็ตข้อมูลทดสอบ 2 โหมด (`USERS_AND_PERSONNEL` และ `FULL_FACTORY_RESET`)

### 3.2 `WebApp/sample-subapp/index.html` (เว็บแอปย่อยตัวอย่าง)
- เรียกใช้ `STB_SSO.requireSSO({ webappId: 'APP0001', portalUrl: '../Portal-SSO/index.html' })`
- แสดงข้อมูลผู้ใช้งานที่ได้รับจาก SSO Handshake ครบทั้ง **38 ฟิลด์** พร้อมปุ่มทดสอบดึง `getPersonnelList()`, `getReferenceData()`, `getPositionStructure()`

---

## 4. ลำดับการทำงานหลังกด Proceed
1. **`coder` Subagent:** ย้ายโฟลเดอร์เข้า `WebApp/`, อัปเดตไฟล์หมวด A1–A8 และ B1
2. **`reviewer` Subagent:** รัน SQL Patch (หมวด B2) บน Supabase จริง และตรวจสอบความถูกต้องของทุกไฟล์
3. **`archivist` Subagent:** อัปเดตไฟล์เอกสารหมวด C1–C6 ทั้งหมด และรัน `git push origin main`
