# 🏗️ MASTER REBUILD BLUEPRINT: ระบบ Central Portal & SSO (`portal-apps-script`)

> [!CAUTION]
> **กฎเหล็ก: เริ่มต้นใหม่ทั้งหมด 100% แบบแยกส่วน (Standalone GAS + Separate Google Sheet)**
> แอปพลิเคชันที่สร้างขึ้นใหม่จากพิมพ์เขียวนี้ **เป็นการเริ่มต้นระบบใหม่ทั้งหมด (Greenfield / Clean-Slate Deployment)** โดยมีสถาปัตยกรรมดังนี้:
> - ❌ **ห้ามเชื่อมต่อกับ Google Sheets URL เดิม, Google Drive Folder ID เดิม, หรือ Script ID เดิมของระบบเก่าโดยเด็ดขาด!**
> - 🔗 **สร้างแยกระหว่าง Google Sheet และโปรเจกต์ Google Apps Script (Standalone GAS):** โปรเจกต์ GAS ไม่ได้ผูกติดอยู่ในไฟล์ Sheet (ไม่ใช่ Container-bound) แต่เชื่อมต่อข้ามไปหาไฟล์ Google Sheets ผ่าน `SpreadsheetApp.openById(getDbId_())`
> - 📌 **การรับค่าเมื่อเริ่มโปรเจกต์ใหม่:** เมื่อเริ่มสร้างโปรเจกต์ใหม่ ให้ AI **สอบถามหรือรอรับค่าจากผู้ใช้** (หรือเว้น Placeholder `const DATABASE_URL = 'PUT_NEW_GOOGLE_SHEET_URL_HERE';` ไว้ให้ชัดเจน) ได้แก่:
>   1. **URL หรือ ID ของไฟล์ Google Sheets ใบใหม่** (สำหรับใส่ใน `DATABASE_URL` ใน `Code.gs`)
>   2. **Script ID ของโปรเจกต์ GAS ใบใหม่** (สำหรับตั้งค่า `.clasp.json` เพื่อ Push โค้ดขึ้นระบบใหม่)
> - ✅ เมื่อใส่ `DATABASE_URL` ของชีตใหม่แล้วรัน `RUN_SETUP_DATABASE()` (หรือเปิดเว็บครั้งแรกผ่าน `validateAndRepairDatabase_()`) ตัวโค้ด GAS จะเข้าไปสร้างตารางทั้ง 8 ชีต พร้อมตั้งค่าเริ่มต้น (`DEFAULT_SETTINGS` ที่ค่า Folder ID และ URL ต่างๆ เป็นค่าว่าง `""`) ลงในไฟล์ Google Sheets ใบใหม่อัตโนมัติ

> [!IMPORTANT]
> **คู่มือสำหรับ AI Model ที่ทำหน้าที่สร้างแอปพลิเคชันนี้ใหม่ (Rebuild Instructions):**
> เอกสารชุดนี้คือ **พิมพ์เขียวฉบับสมบูรณ์ 100% (Complete Reverse-Engineered Specification)** ของระบบ **Central Portal & SSO**
> - **สิ่งที่ต้องคงไว้เหมือนต้นฉบับ 100% (Strict System & Storage Architecture):** โครงสร้างตารางและชื่อคอลัมน์ใน Google Sheets ทั้ง 8 ตาราง, รูปแบบรหัส ID, อัลกอริทึมเข้ารหัสรหัสผ่าน (`SHA-256` + `salt|password`), กลไก Session & Cache (`DB_<SheetName>`, `SESSION_<token>`), สัญญาการรับ-ส่งข้อมูล API (`processClientRequest`, `doGet`, `doPost`), และฟังก์ชัน Library สาธารณะ (`verifySSOToken`, `getPersonnelList`, `getReferenceData`, `getPositionStructure`, `getPublicConfig`) สำหรับเชื่อมต่อกับแอปพลิเคชันลูกชุดใหม่
> - **สิ่งที่ให้อิสระ AI โมเดลใหม่ออกแบบเอง 100% (Free UI/UX Redesign):** โครงสร้าง HTML Layout, CSS Framework, สีสัน, Typography, Animation, การจัดวาง Component, และประสบการณ์ผู้ใช้ (UX/UI) ทั้งหมด สามารถออกแบบใหม่ให้สวยงาม ทันสมัย และใช้งานง่ายที่สุดได้เต็มที่

---

## 📂 สารบัญเอกสารพิมพ์เขียว (Blueprint Modules)

ให้อ่านเอกสารทั้ง 4 ไฟล์ตามลำดับดังนี้ก่อนเริ่มเขียนโค้ด:

| ลำดับ | ไฟล์เอกสาร | ขอบเขตเนื้อหาสำคัญ |
| :---: | :--- | :--- |
| **01** | **[`01_Data_Model_and_Core.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/01_Data_Model_and_Core.md)** | การตั้งค่า `appsscript.json`, สถาปัตยกรรม Standalone GAS แยกจาก Google Sheets, โครงสร้างทั้ง 8 ตาราง (`HEADERS` มาตรฐานสำหรับสร้างชีตใหม่), ค่าคงที่ (`ROLES`, `USER_STATUS`, `TOKEN_TYPES`, `DEFAULT_SETTINGS`), ระบบ Auto-Healing Database (`validateAndRepairDatabase_`), ชั้นอ่าน/เขียนข้อมูลพร้อม `CacheService` (6 ชม.), `doGet`/`doPost`/`processClientRequest`, ตาราง API Router ครบทุก Action และฟังก์ชัน Library สาธารณะ |
| **02** | **[`02_Auth_and_SSO.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/02_Auth_and_SSO.md)** | โครงสร้างตาราง `Security_Tokens`, สูตรแฮชรหัสผ่าน `hashPassword_(password, salt)`, วงจรชีวิต Session, แผนผังสถานะบัญชีผู้ใช้ 4 สถานะ, การสมัครสมาชิก 3 ขั้นตอนพร้อมสูตรตรวจเลขบัตรประชาชน 13 หลัก (Modulo-11), ยืนยันอีเมล, แก้ไขโปรไฟล์และอัปโหลดรูป/ลายเซ็นขึ้น Google Drive, รีเซ็ตรหัสผ่าน, กลไก Cross-App SSO Handshake (`generateSSOToken_` -> `verifySSOToken_`) และ Cron ล้างโทเค็นหมดอายุ |
| **03** | **[`03_Domain_Logic.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/03_Domain_Logic.md)** | ตารางสิทธิ์ RBAC (`SUPERADMIN`, `ADMIN`, `USER`), ลอจิกการจัดการผู้ใช้ (`Users`), ทำเนียบบุคลากร (`Personnel`), ทะเบียนเว็บแอป (`Webapps`), สิทธิ์เข้าใช้งานรายแอป (`Permissions`), โครงสร้างหน่วยงาน 4 ลำดับชั้น (`Reference_Data`: สำนัก -> สำนักงาน/กอง -> ฝ่าย -> กลุ่มงาน), โครงสร้างตำแหน่ง (`Position_Structure`), การตั้งค่าระบบ (`System_Settings`), ตัวตรวจลิงก์ Google Drive และการแจ้งเตือนผู้รออนุมัติ |
| **04** | **[`04_Frontend_Behavior.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/04_Frontend_Behavior.md)** | สถาปัตยกรรม SPA ฝั่งไคลเอนต์ (`window.APP_BOOT`, `localStorage` keys, `ApiClient.call`), ตาราง Hash Routes 8 หน้าจอ, Flow การทำงานของหน้า Login/Register 3 ขั้นตอน, เทคนิคเปิดแท็บ SSO เลี่ยง Popup Blocker (`launchApp`), โมดูลจัดการข้อมูลของ Admin ทั้ง 6 หน้าจอ และตารางสรุป UI Action -> API Payload ทั้ง 36 คำสั่ง |

---

## 🛠️ ลำดับขั้นตอนการสร้างระบบใหม่สำหรับ AI (Recommended Rebuild Order)

1. **ขั้นที่ 1 — สร้างแกนกลาง Standalone GAS และระบบสร้างฐานข้อมูลใหม่อัตโนมัติ (`Code.gs`, `Data.gs`, `Migration.gs`):**
   - อ้างอิง [`01_Data_Model_and_Core.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/01_Data_Model_and_Core.md) สร้างค่าคงที่ `DATABASE_URL` (รับค่า URL ของ Google Sheets ใบใหม่ที่ผู้ใช้แจ้งขณะเริ่มโปรเจกต์ใหม่ — ห้ามใช้ URL เดิม), `SHEET_NAMES`, `HEADERS`, `ROLES`, `USER_STATUS`, `TOKEN_TYPES`, `DEFAULT_SETTINGS`, ฟังก์ชัน `validateAndRepairDatabase_()`, ชั้น CRUD + `CacheService`, และ Router `apiHandler_`
2. **ขั้นที่ 2 — สร้างระบบยืนยันตัวตนและ SSO (`Auth.gs`):**
   - อ้างอิง [`02_Auth_and_SSO.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/02_Auth_and_SSO.md) สร้างฟังก์ชัน `hashPassword_`, `loginUser_`, `verifySession_`, `requireSession_`, `registerUser_`, `handleVerifyEmail_`, `updateMyProfile_`, `generateSSOToken_`, `verifySSOToken_`, และ `cleanupSecurityTokens_`
3. **ขั้นที่ 3 — สร้างลอจิกจัดการข้อมูล (`Domain.gs`):**
   - อ้างอิง [`03_Domain_Logic.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/03_Domain_Logic.md) สร้างฟังก์ชัน CRUD สำหรับ `Users`, `Personnel`, `Webapps`, `Permissions`, `Reference_Data`, `Position_Structure`, `System_Settings`, `testDriveLink_`, และ `getNotifications_`
4. **ขั้นที่ 4 — ออกแบบและสร้าง UX/UI ฝั่ง Frontend ใหม่ทั้งหมด (`Index.html`, `css.html`, `js-main.html`, `view-*.html`):**
   - อ้างอิงพฤติกรรมและฟิลด์ข้อมูลจาก [`04_Frontend_Behavior.md`](file:///d:/STB-APP-main/Wiki/Portal_SSO_Blueprint/04_Frontend_Behavior.md)
   - ออกแบบ UX/UI ใหม่ได้เต็มที่ โดยระวังกฎเหล็กของ Google Apps Script HtmlService (Caja Sanitizer):
     - ห้ามเช็คคลาส ES6 ด้วย `window.ClassName` (ให้เรียกชื่อคลาสหรือผูกกับ `window.MyObj = {...}` โดยตรง)
     - ห้ามใช้ Nested Template Literals (Backticks ซ้อนกันหลายชั้น) ในไฟล์ HTML
     - ห้ามใส่ `required` ทิ้งไว้บน `<input>` ที่ถูกซ่อนด้วย `display: none` ในฟอร์มเดียวกัน
     - ลิงก์เปลี่ยนหน้า Hash (`#...`) ต้องใช้ `e.preventDefault(); window.location.hash = ...` เพื่อป้องกัน `<base target="_top">` เด้งหลุดออกจาก Iframe

---

## ✅ รายการตรวจสอบการเริ่มต้นระบบใหม่ (Clean-Slate & Compatibility Checklist)

ก่อนส่งมอบโค้ดที่สร้างใหม่ ต้องตรวจสอบว่าผ่านเกณฑ์ต่อไปนี้ครบทุกข้อ:
- [ ] **แยกโปรเจกต์ GAS และ Google Sheet ออกจากกัน (Standalone Mode) & ไม่ใช้ URL เดิม:** ค่า `DATABASE_URL` ใช้ URL ของ Google Sheets ใบใหม่ที่ผู้ใช้แจ้งขณะเริ่มโปรเจกต์ใหม่เท่านั้น และค่า `Profile_Folder_ID`, `Signature_Folder_ID`, `App_Base_Url` ใน `DEFAULT_SETTINGS` เป็นค่าว่าง `""` ทั้งหมด
- [ ] **พร้อมสร้างตารางใหม่ตั้งแต่ศูนย์ (`RUN_SETUP_DATABASE` & `RUN_CREATE_SUPERADMIN`):** เมื่อต่อกับ Google Sheets ใบใหม่ที่ว่างเปล่า ระบบสามารถสร้างชีตทั้ง 8 ตารางพร้อม Header ที่ถูกต้องครบถ้วน และสร้างบัญชี `superadmin` เริ่มต้นได้ทันที
- [ ] **การเข้ารหัสรหัสผ่านตรงตามมาตรฐาน:** ใช้สูตร `SHA-256(String(salt) + '|' + String(password))` แปลงเป็น Hex ตัวพิมพ์เล็ก 64 ตัวอักษร
- [ ] **การจัดรูปแบบชื่อเต็มภาษาไทย (`buildFullName_`):** คำนำหน้า `'นาย'`, `'นาง'`, `'นางสาว'` ต้องติดกับชื่อจริงโดยไม่เว้นวรรค (`นายสมชาย ใจดี`) ส่วนคำนำหน้าหรือยศอื่นๆ ต้องเว้นวรรค 1 เคาะ (`ว่าที่ ร.ต. สมชาย ใจดี`)
- [ ] **คอลัมน์ใน `Security_Tokens` ตรงกันทั้งระบบ:** ใช้หัวคอลัมน์ `Token_ID`, `User_ID`, `Token_Type`, `Token_String`, `Created_At`, `Expiry_Date`, `Is_Used`, `Ref_App_ID` ใน `HEADERS` ตั้งแต่ต้น
- [ ] **Public Library Interface สำหรับแอปพลิเคชันลูก:** มีฟังก์ชันระดับ Global ชื่อ `verifySSOToken(ssoToken)`, `getPersonnelList()`, `getReferenceData()`, `getPositionStructure()`, และ `getPublicConfig()` ที่ส่งคืนโครงสร้างข้อมูลตรงตามสเปกใน `01` และ `02`
- [ ] **URL พารามิเตอร์ SSO:** เมื่อกดเข้าแอปพลิเคชันลูกจากหน้า Dashboard ต้องส่งพารามิเตอร์ `?sso_token=<token>` (และรองรับ `ssoToken` ใน `handleSsoRedirect_`)



