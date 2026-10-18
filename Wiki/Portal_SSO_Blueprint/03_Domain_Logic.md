# 📘 REBUILD BLUEPRINT: Central Portal & SSO
## 03. กฎทางธุรกิจและตรรกะโดเมน (Domain Logic & Business Rules)

> **เป้าหมายเอกสาร:** พิมพ์เขียวทางเทคนิคสำหรับกฎทางธุรกิจ (Business Rules), การตรวจสอบสิทธิ์ตามบทบาท (RBAC), การจัดการผู้ใช้/บุคลากร/เว็บแอป/สิทธิ์รายแอป/ข้อมูลอ้างอิงลำดับชั้น ของระบบ **Central Portal & SSO (`portal-apps-script`)**

---

## 1. Role & Permission Matrix (ระบบบทบาทและตารางกำหนดสิทธิ์)

### 1.1 ค่าคงที่บทบาทและสถานะบัญชี (Enums & Constants)
- **บทบาทผู้ใช้ (`ROLES`):**
  - `SUPERADMIN`: ผู้ดูแลระบบระดับสูงสุด มีสิทธิ์ขาดในการจัดการผู้ใช้ทุกระดับ การตั้งค่าระบบ และเพิ่ม/ลบเว็บแอปพลิเคชัน
  - `ADMIN`: ผู้ดูแลระบบทั่วไป สามารถจัดการข้อมูลบุคลากร ผู้ใช้ระดับ USER/ADMIN และกำหนดสิทธิ์การเข้าถึงแอป
  - `USER`: ผู้ใช้งานทั่วไป สามารถเข้าใช้งานแดชบอร์ดตามสิทธิ์ที่ได้รับ และแก้ไขข้อมูลโปรไฟล์ของตนเองได้บางฟิลด์

- **สถานะบัญชีผู้ใช้ (`USER_STATUS`):**
  - `'รอการยืนยันอีเมล'` (`VERIFY`): สมัครสมาชิกแล้วแต่ยังไม่กดยืนยันผ่านลิงก์อีเมล
  - `'รออนุมัติ'` (`PENDING`): ยืนยันอีเมลแล้ว รอให้ ADMIN หรือ SUPERADMIN ตรวจสอบและอนุมัติ
  - `'ใช้งานปกติ'` (`ACTIVE`): ได้รับการอนุมัติแล้ว สามารถเข้าสู่ระบบและทำ SSO ได้
  - `'ระงับบัญชี'` (`SUSPENDED`): บัญชีถูกปิดการใช้งานชั่วคราวหรือถาวร

### 1.2 ลำดับชั้นการตรวจสอบสิทธิ์เซสชัน (`requireSession_`)
ฟังก์ชัน `requireSession_(tokenString, options)` ใน `Auth.gs` ทำหน้าที่เป็น Gateway ตรวจสอบเซสชันและบทบาท:
1. เรียก `verifySession_(tokenString)` ตรวจสอบความถูกต้องและวันหมดอายุของเซสชันจาก Cache และตาราง `Security_Tokens` หากไม่ผ่านจะ throw Error (`SESSION_EXPIRED`)
2. หากส่ง `options.superadmin === true`: ตรวจสอบว่า `user.Role === 'SUPERADMIN'` หากไม่ใช่จะ throw Error `'เฉพาะ Super Admin เท่านั้น'`
3. หากส่ง `options.admin === true`: ตรวจสอบว่า `user.Role === 'SUPERADMIN' || user.Role === 'ADMIN'` หากไม่ใช่จะ throw Error `'เฉพาะผู้ดูแลระบบเท่านั้น'`
4. หากไม่ระบุ options: อนุญาตให้ผู้ใช้ทุกบทบาท (`SUPERADMIN`, `ADMIN`, `USER`) ที่มีเซสชันถูกต้องผ่านได้

### 1.3 กฎการควบคุมสิทธิ์ระหว่างบทบาท (Role Elevation & Editing Guards)
- **การแก้ไขบัญชี (`saveUser_`):**
  - ผู้ใช้ระดับ `ADMIN` ไม่สามารถแก้ไขบัญชีของ `SUPERADMIN` ได้ (`targetUser.Role === 'SUPERADMIN' && adminUser.Role !== 'SUPERADMIN'` -> throw `'เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขบัญชีระดับเดียวกันได้'`)
  - ผู้ใช้ระดับ `ADMIN` ไม่สามารถยกระดับบทบาทให้ใครเป็น `SUPERADMIN` ได้ (`payload.Role === 'SUPERADMIN' && adminUser.Role !== 'SUPERADMIN'` -> throw `'คุณไม่มีสิทธิ์กำหนดบทบาท SUPERADMIN ให้กับผู้อื่นได้'`)
- **การลบบัญชี (`deleteUser_`):**
  - เฉพาะ `SUPERADMIN` เท่านั้นที่มีสิทธิ์ลบบัญชีผู้ใช้ (`ADMIN` ไม่มีสิทธิ์ลบ)
  - `SUPERADMIN` ไม่สามารถลบบัญชีของตนเองได้ (`targetUser.Personnel_Ref_ID === superAdminUser.Personnel_Ref_ID` -> throw `'ไม่สามารถลบบัญชีตัวเองได้'`)
- **การแก้ไขข้อมูลบุคลากร (`savePersonnel_`):**
  - ผู้ใช้ระดับ `USER` สามารถแก้ไขได้เฉพาะระเบียนของตนเอง (`payload.Personnel_ID === adminUser.Personnel_Ref_ID`) หากระบุของผู้อื่นจะ throw `'ไม่อนุญาตให้แก้ไขข้อมูลผู้อื่น'`
  - ผู้ใช้ระดับ `USER` ไม่สามารถสร้างระเบียนบุคลากรใหม่ได้ (throw `'ไม่อนุญาตให้สร้างข้อมูลใหม่'`)
  - ผู้ใช้ระดับ `USER` จะถูกตัดสิทธิ์ในการแก้ไขฟิลด์เกี่ยวกับตำแหน่ง เงินเดือน และสังกัด โดยระบบจะดึงค่าเดิมจากฐานข้อมูลมาทับเสมอ

### 1.4 ตารางแมทริกซ์สิทธิ์ตามโมดูล API (Domain Capability Matrix)

| API Action | ฟังก์ชันเบื้องหลัง | บทบาทขั้นต่ำ | เงื่อนไขและการป้องกันพิเศษ |
| :--- | :--- | :--- | :--- |
| `users.list` | `listUsers_` | ADMIN | ดึงข้อมูล Users ผูกกับ Personnel ส่งกลับเรียงจากใหม่ไปเก่า |
| `users.create` | `createUser_` | ADMIN | ตรวจสอบ Username/Email ซ้ำ และสร้างหรือผูก Personnel |
| `users.save` | `saveUser_` | ADMIN | ป้องกันแก้ SUPERADMIN, ส่งอีเมลแจ้งเตือนเมื่ออนุมัติ |
| `users.delete` | `deleteUser_` | SUPERADMIN | ลบบัญชีผู้ใช้ ป้องกันการลบบัญชีตนเอง |
| `personnel.list` | `listPersonnel_` | ADMIN | ดึงข้อมูลบุคลากรทั้งหมด เรียงจากใหม่ไปเก่า |
| `personnel.searchUnregistered` | `searchUnregisteredPersonnel_` | ADMIN | ค้นหาบุคลากรที่ยังไม่มีบัญชีใน Users (พิมพ์ขั้นต่ำ 2 ตัวอักษร) |
| `personnel.save` | `savePersonnel_` | USER (มีเงื่อนไข) | USER แก้ได้เฉพาะตนเองและถูกล็อกฟิลด์สำคัญ / ADMIN สร้างและแก้ได้ทั้งหมด |
| `personnel.delete` | `deletePersonnel_` | ADMIN | ป้องกันการลบหากบุคลากรนี้ผูกกับบัญชีใน Users อยู่ |
| `webapps.list` | `listWebapps_` | ADMIN | แสดงรายการเว็บแอปพลิเคชันทั้งหมด |
| `webapps.save` | `saveWebapp_` | SUPERADMIN | เพิ่มหรือแก้ไขเว็บแอปพลิเคชัน (Prefix: APP) |
| `webapps.delete` | `deleteWebapp_` | SUPERADMIN | ลบเว็บแอปพลิเคชันออกจากระบบ |
| `permissions.get` | `getUserPermissions_` | ADMIN | ดึงสิทธิ์รายแอปของบุคลากรตาม Personnel_Ref_ID |
| `permissions.save` | `saveUserPermissions_` | ADMIN | ลบสิทธิ์เดิมทั้งหมดแบบ Bottom-Up แล้วบันทึกสิทธิ์ใหม่ |
| `references.list` | `listReferences_` | USER | ดึงข้อมูล Master Data สำหรับ Cascading Dropdown |
| `references.save` | `saveReference_` | ADMIN | เพิ่ม/แก้ไขข้อมูลอ้างอิง (Prefix: REF) |
| `references.delete` | `deleteReference_` | ADMIN | ลบแถวข้อมูลอ้างอิง |
| `positions.list` | `listPositions_` | ADMIN | ดึงโครงสร้างตำแหน่งทั้งหมด |
| `positions.save` | `savePosition_` | ADMIN | เพิ่ม/แก้ไขข้อมูลตำแหน่ง (Prefix: POS) |
| `positions.delete` | `deletePosition_` | ADMIN | ลบแถวข้อมูลตำแหน่ง |
| `settings.get` | `getSettingsForClient_` | SUPERADMIN | ดึงค่าคอนฟิกและตรวจสถานะ Cron Job |
| `settings.update` | `updateSettings_` | SUPERADMIN | อัปเดตหรือเพิ่มค่าคอนฟิกระบบ |
| `settings.testDriveLink` | `testDriveLink_` | SUPERADMIN | ทดสอบสิทธิ์เข้าถึง Folder/File บน Google Drive |
| `settings.setupCron` | `setupCron_` | SUPERADMIN | สร้าง Time-driven Trigger ล้าง Token ขยะทุกสัปดาห์ |
| `dashboard.apps` | `getDashboardApps_` | USER | กรองแอปที่ผู้ใช้ได้รับสิทธิ์ (SUPERADMIN เห็นทั้งหมด) |
| `notifications.get` | `getNotifications_` | USER | ADMIN/SUPERADMIN จะได้รับแจ้งเตือนจำนวนผู้รออนุมัติ |

---

## 2. การจัดการผู้ใช้งาน (Users Management)

### 2.1 `listUsers_(adminUser)`
- **ตารางที่เกี่ยวข้อง:** `Users` (อ่าน), `Personnel` (อ่าน)
- **การดึงข้อมูลและการ Join:**
  1. อ่านแถวทั้งหมดจากตาราง `Users` ผ่าน `readObjects_`
  2. อ่านแถวทั้งหมดจากตาราง `Personnel` ผ่าน `readObjects_`
  3. สร้าง Lookup Map (`pMap`) โดยใช้ `Personnel_ID` เป็น Key
  4. วนลูปตาราง `Users` และ Join ข้อมูลจาก `pMap[u.Personnel_Ref_ID]`
  5. ประกอบชื่อเต็มโดยเรียก `buildFullName_(p.Prefix, p.First_Name, p.Last_Name)` ตามกฎภาษาไทย
- **โครงสร้างข้อมูลส่งกลับ (Array of Objects):**
  - `Personnel_Ref_ID`, `Username`, `Email`, `Role` (ค่าเริ่มต้น `'USER'`), `Status` (ค่าเริ่มต้น `'ใช้งานปกติ'`), `Last_Login_At`, `Created_At`, `FullName`, `Position`, `Position_2`, `Department`, `Bureau_Name`
- **การเรียงลำดับ:** เรียก `.reverse()` เพื่อให้ข้อมูลผู้ใช้ที่สร้างใหม่ล่าสุดแสดงขึ้นมาก่อน (Newest First)

### 2.2 `createUser_(adminUser, payload)`
- **ฟิลด์บังคับ (`assertRequired_`):** `['Username', 'Password', 'First_Name', 'Last_Name', 'Role', 'Status']`
- **การตรวจสอบความถูกต้อง (Validation Rules):**
  - `Username`: แปลงเป็นตัวพิมพ์เล็กและตัดช่องว่าง ตรวจสอบด้วย Regex `/^[a-z0-9_.]+$/` หากไม่ผ่านจะ throw `'รูปแบบบัญชีผู้ใช้ไม่ถูกต้อง (ภาษาอังกฤษ ตัวเลข หรือจุดเท่านั้น)'`
  - `Email`: หากมีการระบุ ให้แปลงเป็นตัวพิมพ์เล็ก ตรวจสอบด้วย Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` หากไม่ผ่านจะ throw `'รูปแบบอีเมลไม่ถูกต้อง'`
- **การควบคุม Concurrency:** เรียก `acquireLock_()` (ScriptLock รอสูงสุด 10,000 มิลลิวินาที)
- **การตรวจสอบข้อมูลซ้ำ (Duplicate Checks):**
  - ตรวจสอบว่ามี `Username` ซ้ำหรือไม่ (แบบ Case-Insensitive) หากซ้ำ throw `'บัญชีผู้ใช้นี้ถูกใช้งานแล้ว'`
  - หากระบุ Email ตรวจสอบว่ามี `Email` ซ้ำหรือไม่ (แบบ Case-Insensitive) หากซ้ำ throw `'อีเมลนี้ถูกใช้งานแล้ว'`
- **การผูกหรือสร้างข้อมูลบุคลากร (Personnel Linking vs Creation):**
  - กรณีที่ 1 (ผูกกับบุคลากรเดิม): หากส่ง `payload.Personnel_Ref_ID` มา ให้นำรหัสดังกล่าวไปใช้เป็น `pId` ทันที
  - กรณีที่ 2 (สร้างบุคลากรใหม่พร้อมผู้ใช้): หากไม่มี `Personnel_Ref_ID` จะสร้างรหัสบุคลากรใหม่ `pId = generateId_('PS', SHEET_NAMES.PERSONNEL, 'Personnel_ID')` และบันทึกลงตาราง `Personnel`
- **การเข้ารหัสผ่าน:** สุ่ม Salt ด้วย `generateTokenString_()` และคำนวณ Hash ด้วย `hashPassword_(payload.Password, salt)`
- **ผลลัพธ์คืนกลับ:** `{ message: 'สร้างบัญชีผู้ใช้ใหม่สำเร็จ', id: pId }`

### 2.3 `saveUser_(adminUser, payload)`
- **ฟิลด์บังคับ:** `['Personnel_Ref_ID', 'Role', 'Status']`
- **การรีเซ็ตรหัสผ่านโดยแอดมิน (Admin Password Reset):** หากส่ง `payload.newPassword` มาและไม่เป็นค่าว่าง จะสุ่ม Salt ใหม่และคำนวณ Hash ใหม่ทันที
- **การตรวจจับการอนุมัติบัญชีและการส่งอีเมลแจ้งเตือน:**
  - ตรวจจับการเปลี่ยนสถานะ: `isJustApproved = (targetUser.Status !== 'ใช้งานปกติ' && payload.Status === 'ใช้งานปกติ')`
  - หาก `isJustApproved === true` และผู้ใช้มีอีเมล จะส่งอีเมลแจ้งผลการอนุมัติผ่าน `MailApp.sendEmail` หัวข้อ `'แจ้งผลการอนุมัติบัญชีผู้ใช้งาน'`
- **ผลลัพธ์คืนกลับ:** `{ message: 'อัปเดตบัญชีผู้ใช้สำเร็จ' }`

### 2.4 `deleteUser_(superAdminUser, payload)`
- **สิทธิ์:** SUPERADMIN เท่านั้น
- **ฟิลด์บังคับ:** `['Personnel_Ref_ID']`
- **การป้องกัน:** ห้ามลบบัญชีตนเอง (`targetUser.Personnel_Ref_ID === superAdminUser.Personnel_Ref_ID`)

---

## 3. การจัดการข้อมูลบุคลากร (Personnel Management)

### 3.1 `listPersonnel_(adminUser)`
- อ่านแถวทั้งหมดจากตาราง `Personnel` และเรียก `.reverse()` ส่งกลับข้อมูลเรียงจากรายการล่าสุดขึ้นก่อน

### 3.2 `searchUnregisteredPersonnel_(adminUser, payload)`
- ข้อความค้นหา `Query` ต้องมีความยาวอย่างน้อย 2 ตัวอักษร
- กรองเฉพาะบุคลากรที่ยังไม่มี `Personnel_Ref_ID` ผูกอยู่ในตาราง `Users`
- ค้นหาจาก `ID_Card_Number`, `First_Name`, `Last_Name` จำกัดผลลัพธ์สูงสุดไม่เกิน 20 รายการ

### 3.3 `savePersonnel_(adminUser, payload)`
- **ฟิลด์บังคับ:** `['First_Name', 'Last_Name', 'Position', 'Department']`
- **การอัปโหลดไฟล์รูปภาพขึ้น Google Drive:**
  - รูปโปรไฟล์ (`Photo_Base64`) เก็บลงโฟลเดอร์ `Profile_Folder_ID`
  - รูปลายเซ็น (`Signature_Base64`) เก็บลงโฟลเดอร์ `Signature_Folder_ID`
  - ตั้งค่าสิทธิ์ไฟล์เป็น `DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW`
- **การล็อกฟิลด์ระดับสิทธิ์สำหรับ `USER`:** หากผู้เรียกเป็น `USER` ระบบจะดึงข้อมูลเดิมจากฐานข้อมูลมาทับฟิลด์ `Start_Service_Year_BE`, `Current_Salary`, `Position`, `Position_Level`, `Position_Type`, `Status`, `Office`, `Department`, `Division` เสมอ

### 3.4 `deletePersonnel_(adminUser, payload)`
- ป้องกันการลบหากบุคลากรผูกกับบัญชีผู้ใช้อยู่ในตาราง `Users` (`'ไม่สามารถลบได้ เนื่องจากบุคลากรนี้ผูกกับบัญชีผู้ใช้อยู่'`)

---

## 4. ระบบเว็บแอปพลิเคชันและสิทธิ์การเข้าถึง (Webapps & App Permissions)

### 4.1 `getDashboardApps_(user)`
- หาก `user.Role === 'SUPERADMIN'` ส่งกลับแอปพลิเคชันทั้งหมดในตาราง `Webapps`
- สำหรับ `ADMIN` และ `USER` คัดกรองเฉพาะแอปที่มีสิทธิ์ในตาราง `Permissions` (`Access_Level` ไม่เป็น `'None'`)

### 4.2 การจัดการสิทธิ์ผู้ใช้งาน (`getUserPermissions_` & `saveUserPermissions_`)
- ใช้ตรรกะการลบสิทธิ์เดิมของบุคลากรคนนั้นแบบ Bottom-Up (`rowsToDelete.sort((a, b) => b - a)`) แล้วเพิ่มแถวใหม่เฉพาะแอปที่ `Access_Level !== 'None'` พร้อมล้างแคช `SHEET_NAMES.PERMISSIONS`

---

## 5. โครงสร้างหน่วยงานและข้อมูลอ้างอิงแบบลำดับชั้น (Organizational Hierarchy & Cascading Reference Data)

### 5.1 โครงสร้างลำดับชั้นของหน่วยงานใน `Reference_Data`
คอลัมน์: `Reference_ID`, `Type`, `Value`, `Short_Name`, `Parent_Type`, `Parent_Value`, `Sort_Order`, `Is_Active`
1. **สำนัก (`Bureau_Name`):** เช่น `'สำนักเทศกิจ'`
2. **สำนักงาน / กอง (`Office`):** `Type = 'Office'`, `Parent_Type = 'Bureau'`, `Parent_Value = 'สำนักเทศกิจ'`
3. **ฝ่าย (`Department`):** `Type = 'Department'`, `Parent_Type = 'Office'`, `Parent_Value = <ชื่อสำนักงาน/กอง>`
4. **กลุ่มงาน (`Division`):** `Type = 'Division'`, `Parent_Type = 'Department'`, `Parent_Value = <ชื่อฝ่าย>`
5. **คำนำหน้าชื่อ (`Prefix`):** `Type = 'Prefix'`

### 5.2 โครงสร้างสายงานและระดับตำแหน่งใน `Position_Structure`
คอลัมน์: `Pos_ID`, `Position_Type`, `Position_Name`, `Position_Level`, `Sort_Order`, `Is_Active`
- Cascade 3 ชั้น: `Position_Type` (ประเภทตำแหน่ง) -> `Position_Name` (ชื่อตำแหน่งสายงาน) -> `Position_Level` (ระดับตำแหน่ง)
- เสริมด้วย `Position_2` สำหรับตำแหน่งบริหาร/รักษาการในตำแหน่ง/ปฏิบัติราชการแทน

---

## 6. การตั้งค่าระบบ, ตัวทดสอบลิงก์ Drive และการแจ้งเตือน (Settings, Drive Tester & Notifications)

- **`getSettingsForClient_`:** ดึงตาราง `System_Settings` พร้อมตรวจสอบ `ScriptApp.getProjectTriggers()` ว่ามี `cleanupSecurityTokens_` ทำงานอยู่หรือไม่ (`cronJobActive`)
- **`updateSettings_`:** อัปเดตค่าตาม `Key` หรือเพิ่มคีย์ใหม่หากยังไม่มีในตาราง
- **`testDriveLink_`:** สกัดรหัส Drive ID ด้วย Regex `/[-\w]{25,}/` แล้วทดสอบ `DriveApp.getFolderById(id)` ก่อน หากไม่ใช่โฟลเดอร์จึง Fallback ไปทดสอบ `DriveApp.getFileById(id)`
- **`getNotifications_`:** สำหรับ `ADMIN` และ `SUPERADMIN` จะนับจำนวนผู้ใช้ในตาราง `Users` ที่มี `Status === 'รออนุมัติ'` แล้วส่งกลับรายการแจ้งเตือนเชื่อมไปยัง `#users`

