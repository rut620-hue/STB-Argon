# 📋 แผนการตรวจสอบ CRUD ทั้งระบบ (Deep Audit) และแก้ไขปัญหาการลบข้อมูล "โครงสร้างสายงานและระดับตำแหน่ง"

> [!IMPORTANT]
> **สถานะแผนงาน:** อัปเดตผลจากการตรวจสอบเจาะลึกทุกบรรทัด (Line-by-Line Surgical Audit) โดย `planner` พบข้อผิดพลาดและจุดที่ Key/Parameter ไม่ตรงกันระหว่าง Frontend, API, Shared SDK และ Database RPC รวมทั้งหมด **10 ประเด็นสำคัญ** รอการตรวจสอบและกดอนุมัติ (**Proceed**) จากผู้ใช้ตามกฎ `.agents/AGENTS.md` (Dual-Plan Sync Rule)

---

## 🔍 1. รายงานผลการวิเคราะห์สาเหตุในเมนู "โครงสร้างสายงานและระดับตำแหน่ง" (จุดที่ 1)

### 🚨 ประเด็นที่ 1: Primary Key Mismatch (`position_id` vs `pos_id`) ทำการลบ/แก้ไข/เลื่อนลำดับไม่ได้
* **ไฟล์และพิกัดบรรทัด:**
  * [admin-positions.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-positions.js#L135-L153):
    * บรรทัด 142–143: `PORTAL_ADMIN.movePosition(\'' + esc(p.position_id) + '\', ...)`
    * บรรทัด 148: `PORTAL_ADMIN.openSinglePositionModal(\'' + esc(p.position_id) + '\')`
    * บรรทัด 149: `PORTAL_ADMIN.deletePosition(\'' + esc(p.position_id) + '\', ...)`
    * บรรทัด 234, 250–251 (`movePosition`), บรรทัด 269, 281 (`openSinglePositionModal`), บรรทัด 316 (`submitSinglePositionModal`)
  * [02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L281-L284) & บรรทัด 1755–1815:
    * ตาราง `portal.position_structure` และ RPC `fn_check_system_init` คืนค่าคอลัมน์ชื่อ `pos_id`
* **สาเหตุ:** หน้าเว็บเรียกใช้ `p.position_id` ซึ่งไม่มีอยู่จริง (มีค่าเป็น `undefined`) เมื่อกดปุ่มลบจึงส่ง字串 `"undefined"` ไปให้ `fn_delete_position_structure(p_session_token, p_pos_id)` ส่งผลให้ SQL รัน `DELETE FROM portal.position_structure WHERE pos_id = 'undefined'` (ลบ 0 แถว แต่ไม่เกิด SQL Error) ระบบจึงขึ้นแจ้งเตือนว่าลบสำเร็จ แต่ข้อมูลยังอยู่ครบทั้งบนหน้าเว็บและฐานข้อมูล! และเมื่อกดแก้ไขก็จะหาข้อมูลเดิมไม่เจอ กลายเป็น INSERT ซ้ำจนติด Unique Error
* **การแก้ไข:**
  * เปลี่ยน `p.position_id` เป็น `p.pos_id || p.position_id` ทุกจุดใน `admin-positions.js` และส่งทั้ง `pos_id` และ `position_id` ใน Payload
  * ใน SQL `fn_save_position_structure` เพิ่ม Fallback: `v_id := trim(COALESCE(p_payload->>'pos_id', p_payload->>'position_id', ''));`

### 🚨 ประเด็นที่ 2: Cross-Tab State Contamination ระหว่างแท็บคำนำหน้า/สถานะ (`PREFIX`/`STATUS`) ในหน้าตำแหน่ง กับหน้าโครงสร้างสังกัด (`#reference`)
* **ไฟล์และพิกัดบรรทัด:** [admin-reference.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-reference.js#L173-L215) และบรรทัด 511–516
* **สาเหตุ:** ในเมนู "โครงสร้างสายงานและระดับตำแหน่ง" มีแท็บย่อย `PREFIX` และ `STATUS` ซึ่งเก็บค่าไว้ใน `admState.currentPosTab` เมื่อผู้ใช้คลิกแท็บ `PREFIX` หรือ `STATUS` แล้วสลับไปเมนู "โครงสร้างสังกัด 4 ระดับ (`#reference`)" ค่า `admState.currentPosTab` ยังคงค้างเป็น `PREFIX`/`STATUS` อยู่ ทำให้ฟังก์ชัน `moveReference` และ `deleteReference` เข้าใจผิดว่าผู้ใช้กำลังอยู่ในหน้าตำแหน่ง จึงเลื่อนลำดับไม่ได้และเด้งกลับไปเรนเดอร์หน้าตำแหน่งแทน
* **การแก้ไข:**
  * ใน `moveReference(referenceId, direction)`: ค้นหา `targetItem` จาก `referenceId` โดยตรงเพื่อดึง `targetItem.type` และ `targetItem.parent_value` จริง
  * ตอนรีเรนเดอร์หลังบันทึก/ลบ/เลื่อนลำดับ: เช็คจาก `app.STATE.currentRoute === 'positions'` แทนการเช็ค `admState.currentPosTab`

---

## 🔍 2. รายงานผลการตรวจสอบส่วน CRUD ทั้งหมดของระบบ (พบอีก 8 ประเด็นสำคัญ)

| ลำดับ | เมนู / โมดูล | พิกัดไฟล์และบรรทัด | ปัญหาที่ตรวจพบจากการ Audit เชิงลึก | แนวทางแก้ไข |
| :---: | :--- | :--- | :--- | :--- |
| **3** | **ตั้งค่าระบบ: รีเซ็ตข้อมูล** (`#settings`) | [admin-settings.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-settings.js#L202-L210)<br>[02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L1843-L1897) | **บั๊กวิกฤต:** หน้าเว็บส่งโหมด `MOCK_ONLY` และ `FULL_PURGE` แต่ SQL RPC `fn_reset_test_data` มีแต่ `IF p_mode = 'FULL_FACTORY_RESET' ... ELSE TRUNCATE users, personnel` ทำให้ถ้าเลือก `MOCK_ONLY` จะตกลง `ELSE` และลบข้อมูลจริงทั้งหมด! | เพิ่มบล็อก `IF p_mode = 'MOCK_ONLY'` ใน SQL เพื่อลบเฉพาะแถวทดสอบ (`MOCK_%`) และรองรับ `FULL_PURGE` / `USERS_AND_PERSONNEL` อย่างถูกต้อง |
| **4** | **ทะเบียนเว็บแอป: เลื่อนลำดับ & สลับสถานะ** (`#webapps`) | [admin-webapps.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-webapps.js#L290-L315)<br>[02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L1505-L1508) | `moveWebapp` และ `toggleWebappStatus` ส่งเฉพาะ `webapp_id` กับ `sort_order`/`status` แต่ SQL `fn_save_webapp` เช็ค `name = '' OR url = ''` ไว้นอกบล็อก `IF v_id = ''` ทำให้กดเลื่อนลำดับหรือสลับสถานะแล้วติด Error เสมอ | ย้ายเงื่อนไขเช็ค `name` และ `url` ใน SQL `fn_save_webapp` เข้าไปไว้ในบล็อก `IF v_id = '' THEN` (ตรวจเฉพาะตอนสร้างใหม่) |
| **5** | **ลงทะเบียนผู้ใช้ใหม่ 3 ขั้นตอน** (`#auth`) | [portal-auth.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/modules/portal-auth.js#L305-L405)<br>[portal-api.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/portal-api.js#L141-L153)<br>[02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L444-L495) | 1) เรียก `PORTAL_API.checkIdCardPersonnel` และ `PORTAL_API.register` แต่ใน `portal-api.js` ชื่อ `checkIdCardForRegister` และ `registerUser`<br>2) หน้าเว็บเช็ค `res.found` แต่ SQL คืน `res.exists`<br>3) หน้าเว็บส่ง `id_card` แต่ SQL รับ `id_card_number` | 1) เพิ่ม Alias ใน `portal-api.js`<br>2) เช็ค `res.exists \|\| res.found` และส่งทั้ง `id_card` & `id_card_number`<br>3) SQL รับ `COALESCE(p_payload->>'id_card_number', p_payload->>'id_card')` |
| **6** | **โปรไฟล์ส่วนตัว: เลขบัตร ปชช.** (`#profile`) | [portal-profile.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/modules/portal-profile.js#L79)<br>[02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L145-L168) | หน้าเว็บอ่าน `u.Id_Card \|\| u.id_card_number \|\| u.idCardNumber` แต่ SQL `fn_build_user_payload` ส่งคีย์ `ID_Card_Number` ทำให้เลขบัตรแสดงเป็น `-` | แก้ `portal-profile.js` ให้เช็ค `u.ID_Card_Number` ด้วย และเพิ่ม `'idCardNumber'` ใน SQL `fn_build_user_payload` |
| **7** | **อัปโหลดไฟล์ Google Drive ทุกหน้า** (`stb-drive-upload.js`) | [stb-drive-upload.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/shared/stb-drive-upload.js#L153-L165)<br>`admin-personnel.js`, `admin-webapps.js`, `portal-profile.js` | ทุกหน้าเรียก `uploadToDrive(fileOrDataUrl, { folderId, fileName })` (2 arguments) แต่ `uploadToDrive(opts)` ใน SDK รับแค่ 1 argument ทำให้ `folderId` และไฟล์หลุดหาย | ปรับ `uploadToDrive(arg1, arg2)` ใน `stb-drive-upload.js` ให้รองรับทั้งการเรียกแบบ 1 argument `(opts)` และ 2 arguments `(fileOrDataUrl, opts)` |
| **8** | **ทดสอบโฟลเดอร์ Drive** (`#settings`) | [admin-settings.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-settings.js#L125-L136)<br>[stb-drive-upload.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/shared/stb-drive-upload.js#L210-L215) | `admin-settings.js` เรียก `STB_DRIVE.testFolderAccess(val)` และเช็ค `res.ok` แต่ใน `stb-drive-upload.js` ชื่อ `checkDriveFolder` และคืน `res.success` | เพิ่ม Alias `testFolderAccess: checkDriveFolder` ใน `stb-drive-upload.js` และเช็ค `res.success \|\| res.ok` ใน `admin-settings.js` |
| **9** | **โฟลเดอร์เก็บรูปบุคลากรและไอคอนแอป** (`#webapps`, `#personnel`) | [admin-webapps.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-webapps.js#L207)<br>[admin-personnel.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-personnel.js#L330) | ทั้ง 2 โมดูลไปดึง `Profile_Folder_ID` แทนที่จะใช้ `App_Icon_Folder_ID` และ `Personnel_Photo_Folder_ID` ที่ตั้งค่าไว้ใน Settings | แก้ให้ดึง `App_Icon_Folder_ID` (สำหรับ Webapps) และ `Personnel_Photo_Folder_ID` (สำหรับ Personnel) โดยมี `Profile_Folder_ID` เป็น Fallback |
| **10** | **ชื่อบุคลากรในตารางบัญชีผู้ใช้** (`#users`) | [admin-users.js](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/WebApp/Portal-SSO/assets/js/admin/admin-users.js#L70-L116)<br>[02_portal_rpc_and_seed.sql](file:///f:/STB%20System/STB%20System%20n2/STB-Argon/supabase/migrations/02_portal_rpc_and_seed.sql#L1261) | `admin-users.js` แสดงผลและค้นหาด้วย `u.personnel_name` แต่ SQL `fn_list_users` ส่งคีย์ชื่อ `u.full_name` ทำให้ชื่อเจ้าของบัญชีแสดงเป็น `-` | แก้ใน `admin-users.js` บรรทัด 70 และ 116 ให้ใช้ `u.full_name \|\| u.personnel_name` |

---

## 🛠️ 3. ลำดับขั้นตอนการผ่าตัดแก้ไข (Surgical Execution Steps)

เมื่อผู้ใช้กด **Proceed** จะสั่งการให้ Subagents ดำเนินการตามลำดับดังนี้:

1. **ส่วนฐานข้อมูล Supabase (`supabase/migrations/02_portal_rpc_and_seed.sql` & รันอัปเดต RPC บน Supabase `ycyefnsfamlhnwgizavs`):**
   * อัปเดตฟังก์ชัน `portal.fn_build_user_payload` (เพิ่ม `'idCardNumber'`)
   * อัปเดตฟังก์ชัน `portal.fn_register_user` (รองรับทั้ง `id_card_number` และ `id_card`)
   * อัปเดตฟังก์ชัน `portal.fn_save_webapp` (ตรวจ `name`/`url` เฉพาะตอนสร้างใหม่ `v_id = ''`)
   * อัปเดตฟังก์ชัน `portal.fn_save_position_structure` (รองรับทั้ง `pos_id` และ `position_id`)
   * อัปเดตฟังก์ชัน `portal.fn_reset_test_data` (แยกโหมด `MOCK_ONLY`, `FULL_PURGE`/`USERS_AND_PERSONNEL`, และ `FULL_FACTORY_RESET` อย่างปลอดภัย)
2. **ส่วน Shared SDK & API (`WebApp/shared/stb-drive-upload.js`, `WebApp/Portal-SSO/assets/js/portal-api.js`):**
   * ปรับ `uploadToDrive` ให้รับได้ทั้ง 1 และ 2 arguments + เพิ่ม `testFolderAccess`
   * เพิ่ม Alias `checkIdCardPersonnel`, `register`, และปรับ `savePositionStructure` / `deletePositionStructure` ใน `portal-api.js`
3. **ส่วน Frontend Modules (`admin-positions.js`, `admin-reference.js`, `admin-webapps.js`, `admin-personnel.js`, `admin-users.js`, `admin-settings.js`, `portal-auth.js`, `portal-profile.js`):**
   * แก้ไขเฉพาะบรรทัดที่มีปัญหาตามตารางทั้ง 10 ประเด็นด้วย `replace_file_content`
4. **ส่วน QA & Verification (`reviewer`) และ Knowledge Update (`archivist`):**
   * `reviewer` ตรวจ `git diff`, เช็ค Syntax `node -c` ทุกไฟล์ และรัน SQL migration อัปเดต RPC บนฐานข้อมูลจริง
   * `archivist` อัปเดตพิกัดบรรทัดใน `Wiki/Code_Map.md`, `Working/CURRENT_STATE.md` และสำรองข้อมูลขึ้น GitHub
