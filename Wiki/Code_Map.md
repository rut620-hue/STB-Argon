# 🗺️ แผนผังโครงสร้างโปรเจกต์และพิกัดบรรทัด (Code Map & Line Index)

> [!IMPORTANT]
> **กฎเหล็ก Read-Once & Quick-Jump:** ก่อนใช้ `view_file` เปิดอ่านโค้ดใดๆ ต้องตรวจสอบตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ในไฟล์นี้ก่อนเสมอ เพื่อกระโดดไปเปิดอ่านเฉพาะจุดที่ต้องการทันที (ห้ามเริ่มอ่านตั้งแต่บรรทัดที่ 1 ของไฟล์ใหญ่ และห้ามอ่านเกินครั้งละ 150 บรรทัด)

---

## 1. โครงสร้างโฟลเดอร์โปรเจกต์ใหม่ (OOP Modular Architecture)
```text
d:\STB APP n2/
├── .agents/                                # ศูนย์ควบคุมกฎและโปรไฟล์ของ AI (AGENTS.md + 4 Subagents + skills/)
├── .vscode/                                # การตั้งค่า VS Code และ MCP Server (mcp.json)
├── index.html                              # 🔄 Root Redirector ส่งต่อไปยัง WebApp/Portal-SSO/index.html ทันที
├── WebApp/                                 # 📁 ศูนย์รวมแอปพลิเคชันเว็บทั้งหมดขององค์กร
│   ├── shared/                             # 🧩 Shared SDKs กลางสำหรับทุกแอปพลิเคชัน
│   │   ├── stb-loader.js                   # BMA 3D Logo Flip Loader (100% Loader.html parity + Watchdog 60s)
│   │   ├── stb-drive-upload.js             # บีบอัดรูปฝั่ง Client + อัปโหลดรูป/PDF เข้า Google Drive ผ่าน GAS
│   │   └── stb-sso-guard.js                # บังคับเข้าเว็บแอปย่อยผ่าน Portal SSO + ดึงข้อมูลบุคลากรกลาง (STB_SSO)
│   ├── Portal-SSO/                         # 🏛️ แอปพลิเคชันหลัก Central Portal & SSO SPA
│   │   ├── index.html                      # Main SPA Shell (Footer Fluid Width + Dynamic Year #ftYear)
│   │   ├── views/                          # 📄 Standalone HTML Views (1 หน้าต่อ 1 ไฟล์ ครบ 10 ไฟล์)
│   │   │   ├── loader.html                 # 3D Flip Logo Loader Component & Styles
│   │   │   ├── auth.html                   # Login, 3-Step Register, Forgot/Reset Password, Missing Key
│   │   │   ├── dashboard.html              # 4 Stat Cards, SSO Launchpad Grid & Chart.js Canvases
│   │   │   ├── profile.html                # Profile Card, Masked ID, Canvas Signature Pad & Form
│   │   │   ├── personnel.html              # Personnel Management Bar, Table & Modal Container
│   │   │   ├── users.html                  # User Accounts, Role Dropdown, Table & Setup Banner
│   │   │   ├── webapps.html                # WebApps Registry Table (▲▼ Reorder, Status Toggle)
│   │   │   ├── reference.html              # 4-Bureau Structure Tabs (BUREAU/OFFICE/DEPT/DIV) & Table
│   │   │   ├── positions.html              # Positions Structure Tabs (PREFIX/STATUS & Dynamic Types)
│   │   │   └── settings.html               # 13 Database Keys Form, Drive Folders Test & Reset Modal
│   │   └── assets/                         # CSS และ JS ประจำตัว Portal
│   │       ├── css/
│   │       │   └── portal.css              # ธีมเขียว กทม. + 12 Color Variables (--color-1..12) + .footer-bar
│   │       └── js/
│   │           ├── portal-config.js        # Supabase Config, GAS Microservice URL & Schema portal
│   │           ├── portal-api.js           # 26 RPCs API Wrapper บน Supabase Schema portal
│   │           ├── portal-app.js           # Main Orchestrator Facade (window.PORTAL_APP)
│   │           ├── portal-admin.js         # Admin Orchestrator Facade (window.PORTAL_ADMIN)
│   │           ├── core/                   # ⚙️ Core Modules
│   │           │   ├── portal-state.js     # Global STATE, THEMEC, GRADC, UI Atoms, Esc, Resolvers
│   │           │   ├── portal-view-loader.js # PortalViewLoader (Async Fetch, Memory Cache & Preload)
│   │           │   ├── portal-ui.js        # Theme, Branding Dynamic Footer, Modal & SweetAlert2
│   │           │   └── portal-cascade.js   # 4-Level Org & Position Cascade (100% Deduplication)
│   │           ├── modules/                # 💼 Feature Modules
│   │           │   ├── portal-auth.js      # Auth Controller, 3-Step Wizard, Reset Password
│   │           │   ├── portal-dashboard.js # 4 Stat Cards, SSO Launchpad & 2 Chart.js Charts
│   │           │   └── portal-profile.js   # Masked ID, Canvas Signature Pad & Profile Sync
│   │           └── admin/                  # 🛡️ Admin & Superadmin Modules
│   │               ├── admin-shared.js     # ADMIN_STATE, Accessors & Dialog Helpers
│   │               ├── admin-personnel.js  # #personnel Registry, Search, Filter & Modals
│   │               ├── admin-users.js      # #users Accounts, Roles & Per-App SSO Matrix
│   │               ├── admin-webapps.js    # #webapps Registry, ▲▼ Reorder & Status Toggle
│   │               ├── admin-reference.js  # #reference 4-Bureau Tabs & Multi-Row Batch Modal
│   │               ├── admin-positions.js  # #positions Dynamic Types & Multi-Row Batch Modal
│   │               └── admin-settings.js   # #settings 13 Keys, Drive Test & Database Reset
│   └── sample-subapp/                      # 🚀 เว็บแอปพลิเคชันย่อยตัวอย่าง (Sub-App Example)
│       └── index.html                      # ทดสอบรับสิทธิ์ SSO Handshake 38 ฟิลด์ & Master Data
├── gas/                                    # Google Apps Script Microservice (sync ผ่าน clasp)
├── supabase/migrations/                    # SQL Migrations สำหรับ Schema portal
├── Wiki/                                   # ฐานความรู้ Second Brain (Code_Map.md, Database_Schema.md, log.md)
└── Working/                                # พื้นที่ติดตามงาน (CURRENT_STATE.md <= 40 บรรทัด, task.md, Master_plan.md)
```

---

## 2. ตารางดัชนีไฟล์ HTML Views (`WebApp/Portal-SSO/views/` — 10 ไฟล์)

| ไฟล์ HTML View | จำนวนบรรทัด | DOM Element IDs / Templates สำคัญ | วัตถุประสงค์และการทำงาน |
| :--- | :---: | :--- | :--- |
| **`loader.html`** | 116 | `.loader`, `.ld-mask`, `.ld-card`, `.ld-page`, `.ld-inline`, `.ld-bar`, `.ld-chip` | 3D Flip Logo Loader 4 โหมดตามต้นฉบับ `ref_122wc/Loader.html` 100% |
| **`auth.html`** | 174 | `#authViewContainer`, `#tmplLoginForm`, `#tmplRegStep1`, `#tmplRegStep2`, `#tmplRegStep3`, `#tmplForgotPassword`, `#tmplResetPassword`, `#tmplMissingKey` | แม่แบบฟอร์มเข้าสู่ระบบ, ลงทะเบียน 3 ขั้นตอน, ขอรีเซ็ตรหัสผ่าน และแจ้งเตือน API Key |
| **`dashboard.html`** | 52 | `#dashboardViewContainer`, `#dashStatsRow`, `#dashAppGrid`, `#dashAdminPills`, `#chPosType`, `#chDept` | ภาพรวม 4 Stat Cards, Launchpad เว็บแอป SSO และกราฟสถิติ Chart.js 2 ชุด |
| **`profile.html`** | 96 | `#profileViewContainer`, `#pfAvatarPreview`, `#pfFullNameTx`, `#pfIdCardTx`, `#pfPositionTx`, `#pfRoleBadge`, `#pfCurrentSigBox`, `#pfSigCanvas`, `#pfPhotoFileInput`, `#pfSigFileInput` | ข้อมูลโปรไฟล์ส่วนบุคคล, เลขบัตร ปชช. Masked, ลายเซ็นอิเล็กทรอนิกส์ & กระดานวาด Canvas |
| **`personnel.html`** | 40 | `#personnelViewContainer`, `#personnelSearchInput`, `#personnelStatusSelect`, `#personnelCounterTx`, `#personnelTable`, `#personnelTableBody` | ทำเนียบบุคลากร, แถบตัวกรองสถานะ, ช่องค้นหา และตารางข้อมูลบุคลากร |
| **`users.html`** | 51 | `#usersViewContainer`, `#usersSetupBanner`, `#usersSearchInput`, `#usersRoleSelect`, `#usersCounterTx`, `#usersTable`, `#usersTableBody` | จัดการบัญชีผู้ใช้, ตัวกรองบทบาท, แบนเนอร์ Setup Bypass และตารางสิทธิ์รายแอป |
| **`webapps.html`** | 25 | `#webappsViewContainer`, `#webappsTable`, `#webappsTableBody` | ทะเบียนเว็บแอปพลิเคชันย่อย SSO รองรับการสลับสถานะ และปุ่มเลื่อนลำดับ ▲▼ |
| **`reference.html`** | 32 | `#referenceViewContainer`, `#refTabsNav`, `#refParentFilterBox`, `#referenceTable`, `#referenceTableBody` | โครงสร้างสังกัด 4 ระดับ (BUREAU, OFFICE, DEPARTMENT, DIVISION) และตัวกรองสังกัดแม่ |
| **`positions.html`** | 16 | `#positionsViewContainer`, `#posTabsNav`, `#positionsTable`, `#positionsTableHeaders`, `#positionsTableBody` | โครงสร้างตำแหน่ง/ระดับ, แท็บคำนำหน้าชื่อ (PREFIX), สถานะ (STATUS) และประเภทตำแหน่ง Dynamic |
| **`settings.html`** | 109 | `#settingsViewContainer`, `#admSettingsForm`, `#cfg_App_Display_Name`, `#cfg_App_Base_Url`, `#cfg_Profile_Folder_ID`, `#cfg_Signature_Folder_ID`, `#cfg_Personnel_Photo_Folder_ID`, `#cfg_App_Icon_Folder_ID` | ฟอร์มตั้งค่าระบบ 13 Keys แบ่ง 3 หมวด, ปุ่มทดสอบโฟลเดอร์ Drive และโมดอลรีเซ็ตข้อมูล |

---

## 3. ตารางดัชนีไฟล์ JS OOP Modules (`WebApp/Portal-SSO/assets/js/` — 16 ไฟล์)

### 3.1 กลุ่ม Core Modules (`assets/js/core/`)

| ไฟล์ | บรรทัดรวม | ฟังก์ชัน / เมธอดสำคัญ | พิกัดบรรทัด (`StartLine`–`EndLine`) | หน้าที่การทำงาน |
| :--- | :---: | :--- | :---: | :--- |
| **`portal-state.js`** | 127 | `STATE`, `ADMIN_ROUTES`, `DASH_CHARTS` | 16–37 | ตัวแปร State กลางของทั้งระบบ |
| | | `THEME_L`, `THEME_D`, `THEMEC()`, `GRADC()` | 39–49 | โทเคน 12 ธีมสี (Light & Dark Mode) |
| | | `icons()`, `esc()`, `TW`, `th()` | 51–77 | UI Atoms: Escape HTML, Lucide Icons, ความกว้างตาราง |
| | | `statCard()`, `sectionBar()` | 79–96 | UI Atoms: การ์ดสถิติ 3 มิติ และแถบหัวข้อพร้อมไอคอน |
| | | `resolveDriveImg()`, `resolveWebappTargetUrl()` | 98–119 | แปลง URL รูป Drive และสร้าง SSO Handshake Target URL |
| | | `getContentEl()`, `destroyCharts()` | 121–126 | ตัวช่วย DOM Main Container และทำลาย Chart.js ป้องกัน Memory Leak |
| **`portal-view-loader.js`** | 96 | `PortalViewLoader.loadView(viewName)` | 14–37 | โหลด HTML View จาก `views/*.html` พร้อม In-Memory Cache |
| | | `PortalViewLoader.getCached(viewName)` | 39–46 | ดึง HTML View ที่แคชไว้ในหน่วยความจำ |
| | | `PortalViewLoader.getTemplate(viewName, sel)` | 48–67 | แยกดึงเฉพาะ `<template id="...">` หรือ Selector ภายใน View |
| | | `PortalViewLoader.renderInto(target, viewName)` | 69–84 | เรนเดอร์ HTML View ลงใน DOM Container ทันที |
| | | `PortalViewLoader.preloadAll(viewNames)` | 86–94 | โหลด Views ทั้ง 10 ไฟล์ล่วงหน้าพร้อมกันแบบ Asynchronous |
| **`portal-ui.js`** | 372 | `PortalUI.applyTheme(mode, saveLocal)`, `toggleTheme()` | 29–48 | ควบคุมโหมดสว่าง/มืด (Light/Dark Mode) |
| | | `PortalUI.applyBranding()` | 50–111 | ซิงค์ชื่อระบบ, ชื่อหน่วยงาน, ปี พ.ศ. Dynamic (`#ftYear`) & `LOADER.saveBrand()` |
| | | `PortalUI.hideSplash()`, `showLoginShell()`, `showAppShell()` | 113–139 | สลับหน้าจอกลางระหว่าง Splash, Login และ Application Shell |
| | | `PortalUI.renderHeaderUser()` | 141–181 | เรนเดอร์ชื่อผู้ใช้, รูปโปรไฟล์ และ Badge สิทธิ์บน Header |
| | | `PortalUI.renderSidebarNav()`, `highlightSidebar()` | 183–236 | เรนเดอร์เมนู Sidebar ตาม Role สิทธิ์ พร้อมไฮไลต์หน้าปัจจุบัน |
| | | `PortalUI.togglePasswordVisibility()`, `toggleSidebar()` | 238–249 | ตัวช่วยเปิด/ปิดรหัสผ่าน และสไลด์เมนู Sidebar บนมือถือ |
| | | `PortalUI.openModal()`, `closeModal()` | 251–272 | หน้าต่าง Universal Modal (`#appModal`) |
| | | `PortalUI.toast()`, `alertError()`, `alertSuccess()`, `confirmAction()` | 274–311 | การแจ้งเตือน Toast, SweetAlert2 และ Sweet Confirm |
| | | `PortalUI.openConnectionConfigModal()`, `saveConnectionConfig()` | 313–370 | โมดอลตั้งค่า Supabase Anon Key และ GAS Bridge URL |
| **`portal-cascade.js`** | 203 | `PortalCascade.getReferenceItems(type, parentValue)` | 21–57 | ดึงข้อมูลอ้างอิงสังกัดแม่ลูก พร้อม Deduplication ป้องกันข้อมูลซ้ำ |
| | | `PortalCascade.getPositionTypes()` | 59–73 | ดึงประเภทตำแหน่งทั้งหมดที่มีในระบบ |
| | | `PortalCascade.getPositionsByType(posType)` | 75–93 | ดึงสายงาน/ตำแหน่งตามประเภท |
| | | `PortalCascade.getLevelsByPosition(posType, posName)` | 95–122 | ดึงระดับตำแหน่งตามสายงาน |
| | | `PortalCascade.buildOptionsHtml(...)` | 124–146 | ตัวสร้าง `<option>` Dropdown พร้อมตัดค่าซ้ำ |
| | | `PortalCascade.bindOrgAndPositionCascade(prefix, init)` | 148–201 | ผูกความสัมพันธ์ Dropdown สำนัก->กอง->ฝ่าย->กลุ่มงาน และ ตำแหน่ง->ระดับ |

---

### 3.2 กลุ่ม Feature Modules (`assets/js/modules/`)

| ไฟล์ | บรรทัดรวม | ฟังก์ชัน / เมธอดสำคัญ | พิกัดบรรทัด (`StartLine`–`EndLine`) | หน้าที่การทำงาน |
| :--- | :---: | :--- | :---: | :--- |
| **`portal-auth.js`** | 481 | `renderMissingKeyNotice()`, `renderBootErrorPanel(err)` | 26–64 | แสดงแจ้งเตือนกรณีขาด API Key หรือเชื่อมต่อล้มเหลว |
| | | `renderLoginForm()`, `submitLogin(ev)` | 66–144 | ฟอร์มและกระบวนการเข้าสู่ระบบผ่าน Supabase RPC (`LOADER.busy`) |
| | | `handleLogout()` | 146–161 | ยืนยันออกจากระบบด้วย Sweet Confirm |
| | | `startRegisterWizard()`, `renderRegisterWizard()` | 163–299 | ตัวควบคุม Wizard ลงทะเบียนบุคลากรใหม่ 3 ขั้นตอน |
| | | `submitRegStep1(ev)` | 301–347 | ขั้นตอนที่ 1: ตรวจสอบเลขบัตร ปชช. 13 หลัก (สูตร Modulo-11 & ประวัติเดิม) |
| | | `submitRegStep2(ev)` | 349–371 | ขั้นตอนที่ 2: บันทึกข้อมูลบุคลากร และโครงสร้างสังกัด |
| | | `submitRegStep3(ev)` | 373–420 | ขั้นตอนที่ 3: กำหนด Username, Email และรหัสผ่าน (`PORTAL_API.register`) |
| | | `renderForgotPasswordForm()`, `submitForgotPassword(ev)` | 422–458 | ขอลิงก์รีเซ็ตรหัสผ่านทางอีเมล |
| | | `handleVerifyEmailHash()`, `renderResetPasswordForm()`, `submitResetPassword()` | 460–479 | ยืนยันอีเมลจากแฮช และตั้งรหัสผ่านใหม่ |
| **`portal-dashboard.js`** | 246 | `renderDashboardPage()` | 31–134 | เรนเดอร์ 4 Stat Cards, บัตรเว็บแอป SSO Launchpad Grid (`loading="lazy"`) |
| | | `renderDashboardCharts()` | 136–211 | เรนเดอร์กราฟ Chart.js: บุคลากรตามประเภทตำแหน่ง (`#chPosType`) & ตามฝ่าย (`#chDept`) |
| | | `launchSubApp(webappId)` | 213–244 | ตรวจสอบสถานะปิดปรับปรุง และขอรับ Token SSO เปิดเว็บแอปย่อย |
| **`portal-profile.js`** | 320 | `formatMaskedIdCard(id)`, `renderProfilePage()` | 31–128 | แสดงข้อมูลส่วนตัว, หน้ากากเลขบัตร ปชช. (X-XXXX-XXXXX-XX-X), Username Edit 1 ครั้ง |
| | | `initSignaturePad()`, `clearSignaturePad()` | 130–177 | วาดลายเซ็นบน HTML5 Canvas (รองรับ Mouse & Touch บนมือถือ) |
| | | `saveCanvasSignature()` | 179–213 | แปลง Canvas เป็น PNG อัปโหลดขึ้น Google Drive และบันทึกลงฐานข้อมูล |
| | | `handleUploadProfilePhoto()`, `handleUploadSignatureFile()` | 215–267 | บีบอัดรูปและอัปโหลดรูปโปรไฟล์/ไฟล์ลายเซ็นขึ้น Google Drive ผ่าน GAS |
| | | `submitProfileUpdate(ev)` | 269–318 | บันทึกแก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน |

---

### 3.3 กลุ่ม Admin Modules (`assets/js/admin/`)

| ไฟล์ | บรรทัดรวม | ฟังก์ชัน / เมธอดสำคัญ | พิกัดบรรทัด (`StartLine`–`EndLine`) | หน้าที่การทำงาน |
| :--- | :---: | :--- | :---: | :--- |
| **`admin-shared.js`** | 89 | `ADMIN_STATE` | 14–31 | บันทึก State การค้นหา ตัวกรอง แท็บ และข้อมูลแคชของแอดมิน |
| | | `getApp()`, `getApi()`, `getPageBody()`, `esc()`, `resolveDriveImg()` | 33–55 | ฟังก์ชันอำนวยความสะดวกในการเข้าถึง Core Facade และ API |
| | | `toast()`, `alertError()`, `triggerIcons()` | 57–87 | แสดงผล Dialog และรีเฟรช Lucide Icons |
| **`admin-personnel.js`** | 383 | `loadPersonnelData(silent)` | 35–50 | โหลดข้อมูลทำเนียบบุคลากรทั้งหมด |
| | | `renderPersonnelPage()` | 52–158 | เรนเดอร์หน้าทำเนียบบุคลากร, ค้นหา, กรองสถานะ และแสดง Badge บัญชี |
| | | `openPersonnelModal(personnelId)` | 160–273 | โมดอลเพิ่ม/แก้ไขข้อมูลบุคลากร พร้อม Dropdown ต่อเนื่อง 4 ระดับ |
| | | `submitPersonnelModal()` | 275–351 | อัปโหลดรูป/ลายเซ็นขึ้น Drive และบันทึกบุคลากร (`PORTAL_API.savePersonnel`) |
| | | `deletePersonnel(personnelId, name)`, `refreshPersonnel()` | 353–381 | ลบข้อมูลบุคลากร (Sweet Confirm) และรีเฟรชข้อมูล |
| **`admin-users.js`** | 356 | `loadUsersData(silent)` | 31–46 | โหลดรายชื่อผู้ใช้งานและสิทธิ์ทั้งหมด |
| | | `renderUsersPage()` | 48–154 | เรนเดอร์หน้าจัดการผู้ใช้, ตรวจจับโหมด Setup Bypass, ค้นหา และกรอง Role |
| | | `quickCreateAccountForPersonnel(id)`, `openUserModal()` | 156–235 | โมดอลสร้าง/แก้ไขบัญชีผู้ใช้ และกำหนดสิทธิ์รายแอป SSO Permissions |
| | | `submitUserModal(isEdit)` | 237–299 | บันทึกบัญชีผู้ใช้ (ปลดล็อก Setup Bypass อัตโนมัติเมื่อสร้าง SUPERADMIN คนแรก) |
| | | `deleteUser(refId, username)`, `refreshUsers()` | 301–354 | ลบบัญชีผู้ใช้ และรีเฟรชตาราง |
| **`admin-webapps.js`** | 296 | `loadWebappsData(silent)` | 31–46 | โหลดรายการเว็บแอปพลิเคชันย่อย SSO ทั้งหมด |
| | | `renderWebappsPage()` | 48–137 | เรนเดอร์ทะเบียนเว็บแอป, สลับสถานะเปิด/ปิดปรับปรุง, และปุ่มเลื่อนลำดับ ▲▼ |
| | | `openWebappModal(id)`, `submitWebappModal()` | 139–220 | โมดอลเพิ่ม/แก้ไขเว็บแอป และอัปโหลดภาพไอคอนเข้า Google Drive |
| | | `deleteWebapp()`, `moveWebapp()`, `toggleWebappStatus()`, `refreshWebapps()` | 222–294 | สลับสถานะระบบ, เลื่อนลำดับ ▲▼, ลบเว็บแอป และรีเฟรชข้อมูล |
| **`admin-reference.js`** | 468 | `renderReferencePage()` | 31–125 | เรนเดอร์โครงสร้างสังกัด 4 ระดับ (สำนัก, สำนักงาน/กอง, ส่วน/ฝ่าย, กลุ่มงาน) |
| | | `switchRefTab(tabId)`, `setRefParentFilter(val)`, `moveReference()` | 127–172 | สลับแท็บ, กรองตามสังกัดแม่ และเลื่อนลำดับข้อมูล ▲▼ |
| | | `openSingleReferenceModal()`, `submitSingleReferenceModal()` | 174–256 | โมดอลแก้ไขข้อมูลสังกัดรายแถว |
| | | `openAddReferenceModal()`, `addReferenceInputRow()`, `removeReferenceInputRow()` | 258–351 | โมดอลเพิ่มข้อมูลสังกัดแบบหลายแถวพร้อมกัน (Multi-Row Batch Input) |
| | | `submitAddReferenceModal()`, `openBatchReferenceModal()`, `deleteReference()` | 353–466 | บันทึกข้อมูลหลายแถวแบบ Batch Deduplication และลบข้อมูลสังกัด |
| **`admin-positions.js`** | 451 | `renderPositionsPage()` | 31–148 | เรนเดอร์โครงสร้างตำแหน่ง/ระดับ, แท็บคำนำหน้าชื่อ (PREFIX) และสถานะ (STATUS) |
| | | `switchPosTab(tab)`, `promptAddNewPositionType()`, `movePosition()` | 150–213 | สลับแท็บตำแหน่ง, เพิ่มประเภทตำแหน่งใหม่ และเลื่อนลำดับ ▲▼ |
| | | `openSinglePositionModal()`, `submitSinglePositionModal()` | 215–282 | โมดอลแก้ไขสายงาน/ตำแหน่งรายแถว |
| | | `openAddPositionModal()`, `addPositionInputRow()`, `removePositionInputRow()` | 284–371 | โมดอลเพิ่มสายงาน/ตำแหน่งแบบหลายแถวพร้อมกัน (Multi-Row Batch Input) |
| | | `submitAddPositionModal()`, `openBatchPositionModal()`, `deletePosition()` | 373–449 | บันทึกโครงสร้างตำแหน่งแบบ Batch Deduplication และลบข้อมูลตำแหน่ง |
| **`admin-settings.js`** | 227 | `renderSettingsPage()` | 27–100 | เรนเดอร์แบบฟอร์ม 13 Database Keys แบ่ง 3 กลุ่ม (Branding, Security, Drive Folders) |
| | | `testDriveFolder(inputId, label)` | 102–129 | ทดสอบสิทธิ์การเข้าถึงโฟลเดอร์ Google Drive ผ่าน STB_DRIVE & GAS Bridge |
| | | `submitSettings()` | 131–157 | บันทึกการตั้งค่าระบบส่วนกลางทั้งหมดลงในตาราง `system_settings` |
| | | `confirmResetTestData()`, `executeResetTestData()` | 159–225 | โมดอลยืนยันรีเซ็ตข้อมูลระบบ 2 โหมด: ลบเฉพาะข้อมูลทดสอบ (Mock) หรือล้างทั้งหมด (Full Reset) |

---

### 3.4 กลุ่ม Facade Controllers (`assets/js/`)

| ไฟล์ | บรรทัดรวม | ฟังก์ชัน / เมธอดสำคัญ | พิกัดบรรทัด (`StartLine`–`EndLine`) | หน้าที่การทำงาน |
| :--- | :---: | :--- | :---: | :--- |
| **`portal-app.js`** | 240 | `registerAdminRoute(routeName, handlerFn)` | 19–27 | ระบบลงทะเบียน Route ผู้ดูแลระบบข้ามโมดูล |
| | | `bootSystem()` | 29–129 | โหลดแบรนด์ทันทีผ่าน `LOADER.brandBoot`, ตรวจสอบ API Key, ตรวจสอบ Setup Bypass, จัดการ Session และเริ่มระบบ |
| | | `navigate(route)` | 131–178 | Router สลับหน้าจอ, ไฮไลต์เมนู Sidebar, เคลียร์ Chart.js และเรียก Controller ประจำหน้า |
| | | `window.PORTAL_APP` (Public Facade Delegator) | 180–237 | Facade กลางรวบรวมทุกเมธอดเดิมของ `PORTAL_APP` ส่งต่อไปยังโมดูลย่อย 100% |
| **`portal-admin.js`** | 127 | `window.PORTAL_ADMIN` (Public Facade Delegator) | 24–88 | Facade กลางรวบรวมทุกเมธอดเดิมของ `PORTAL_ADMIN` ส่งต่อไปยังโมดูลย่อย 100% |
| | | `initAdminRoutes()` | 90–125 | ลงทะเบียน Route ทั้ง 6 โมดูล (`personnel`, `users`, `webapps`, `reference`, `positions`, `settings`) เข้ากับ Router |

---

## 4. ไฟล์ส่วนกลางอื่นๆ (Shared SDKs, Root & Database)

| โมดูล / ไฟล์ | ฟังก์ชัน / ส่วนประกอบ | ช่วงบรรทัด (`StartLine`–`EndLine`) | หน้าที่โดยย่อ |
| :--- | :--- | :---: | :--- |
| `index.html` (Root) | Redirector Script | 1–56 | นำทางจาก Root ไปยัง `WebApp/Portal-SSO/index.html` ทันที พร้อมส่งต่อ URL Params |
| `WebApp/Portal-SSO/index.html` | Central Portal SPA Shell | 1–217 | Main SPA Shell: Sarabun, Tailwind, Lucide, Chart.js, Footer Fluid Width (`#ftYear`), `#appModal`, โหลด JS 16 โมดูลตามลำดับ |
| `WebApp/Portal-SSO/assets/css/portal.css` | BMA Green Theme & CSS Tokens | 1–480 | โทเคนสี กทม., `--color-1` ถึง `--color-12`, `.footer-bar` (#F1F5F9/#161B22), Split Brand Panel, Stat Cards, Tables |
| `WebApp/Portal-SSO/assets/js/portal-config.js` | `STB_CONFIG` | 1–91 | ตั้งค่า Supabase (`ycyefnsfamlhnwgizavs`), Schema `portal`, `GAS_BRIDGE_URL`, `PORTAL_BASE_URL` |
| `WebApp/Portal-SSO/assets/js/portal-api.js` | `PORTAL_API` | 1–286 | Wrapper เชื่อมต่อ 26 RPCs บน Supabase Schema `portal` (`login`, `register`, `savePersonnel`, `batchAddReference`, `batchAddPosition` ฯลฯ) |
| `WebApp/shared/stb-loader.js` | `LOADER` (`STB_LOADER`) | 1–369 | BMA 3D Flip Logo Loader 100% parity: 4 โหมด (`show`, `hide`, `page`, `into`), `busy`, `saveBrand`, `brandBoot`, `closeSplash` |
| `WebApp/shared/stb-drive-upload.js` | `STB_DRIVE` | 1–196 | ย่อรูปฝั่ง Client (`compressImageFile`), แปลง Drive URL, ตรวจสอบโฟลเดอร์ และอัปโหลดไฟล์ผ่าน GAS |
| `WebApp/shared/stb-sso-guard.js` | `STB_SSO` | 1–240 | SDK ป้องกันการเข้าเว็บแอปย่อยโดยไม่ผ่าน SSO (`requireSSO`), ดึง Master Data และจัดการ Session |
| `supabase/migrations/01_portal_schema_and_tables.sql` | Schema, Sequences & 8 Tables | 1–165 | สร้าง Schema `portal`, Sequences รันรหัสอัตโนมัติ และตารางทั้ง 8 ตารางครบ 68 คอลัมน์ |
| `supabase/migrations/02_portal_rpc_and_seed.sql` | RPCs, Setup Guard, Reset & Seed | 1–2037 | ฟังก์ชัน RPC 26 ฟังก์ชัน, First-Time Setup Guard, Batch Deduplication และ Initial Seed Defaults |
| `gas/รหัส.js` | GAS Router, Upload & Email | 1–260 | Router รับคำขอ HTTP, ตรวจสอบโฟลเดอร์ Drive, บันทึกรูป/PDF เข้า Google Drive, และส่งอีเมลยืนยัน/รีเซ็ตรหัสผ่าน |
