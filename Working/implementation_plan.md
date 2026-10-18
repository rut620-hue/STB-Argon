# แผนตรวจสอบสถานะงาน (Audit Checklist) & สถาปัตยกรรมแยกไฟล์แบบ OOP Modular

> [!IMPORTANT]
> แผนฉบับนี้ปรับปรุงตามข้อเสนอแนะของผู้ใช้และซิงค์ตามกฎเหล็ก `.agents/AGENTS.md` (**Dual-Plan Sync Rule**):
> 1. **ปรับปรุงกฎ `.agents/AGENTS.md` เรียบร้อยแล้ว:** บังคับกฎ **Map-First (ต้องอ่าน `Wiki/Code_Map.md` ก่อนวิเคราะห์ไฟล์ทุกครั้ง ห้ามเริ่มอ่านตั้งแต่บรรทัดแรกแบบสุ่ม)** และบังคับ **IDE Tools Only (`view_file`, `grep_search`, `find_by_name`, `list_dir`, `replace_file_content`, `write_to_file`)** ห้ามใช้ Node.js หรือ Terminal ในการอ่าน/วิเคราะห์/ตัดแบ่งไฟล์
> 2. **ปรับปรุงข้อ 2.5 (การโหลดข้อมูลและหน้าจอ): เปลี่ยนมาใช้ระบบจาก `Loader.html` แทนทั้งหมด** (`LOADER.page`, `LOADER.into`, `LOADER.show`, `LOADER.hide`, `LOADER.busy`, `skeleton()`, `loadInto()`) ซึ่งเป็น BMA/สำนักเทศกิจ 3D Logo Flip Loader พร้อมแถบวิ่ง `.ld-bar` และ `.ld-chip` ตามต้นฉบับ `ref_122wc/Loader.html` 100%

---

## 📊 ส่วนที่ 1: ตารางตรวจเช็คสถานะงาน (ทำไปแล้ว `✅` vs ยังไม่ได้ทำ `⏳`)

### 1.1 ข้อกำหนดที่ 1: Footer Fluid Width + พื้นหลังเทาอ่อน + ดึงชื่อระบบและชื่อหน่วยงานจากฐานข้อมูล

| รายการตามคำสั่ง | สถานะ | พิกัดปัจจุบันในโค้ด (`Wiki/Code_Map.md`) | สิ่งที่ต้องทำเพิ่ม (`⏳`) |
| :--- | :---: | :--- | :--- |
| **1.1 Footer Fluid Width (`w-full`)** | `✅ ทำไปแล้ว` | `WebApp/Portal-SSO/index.html` (L161–166): `<footer class="w-full footer-bar px-4 md:px-6 py-4 text-center">` เต็มความกว้างหน้าจอ | — |
| **1.2 เติมสีพื้นหลังเทาอ่อน** | `✅ ทำไปแล้ว` | `WebApp/Portal-SSO/assets/css/portal.css` (L46): `.footer-bar { background: var(--surface2); border-top: 1px solid var(--border); }` | ปรับเฉดสีพื้นหลัง `.footer-bar` ให้เป็นสีเทาอ่อนที่ชัดเจน (`#F1F5F9` ในโหมดสว่าง และ `#161B22` ในโหมดมืด) |
| **1.3 ชื่อระบบ (ดึงข้อมูลจาก DB/Settings)** | `✅ ทำไปแล้ว` | `portal-app.js` (`applyBranding`): ดึง `STATE.settings.App_Display_Name || STATE.settings.App_Name` มาใส่ใน `#ftSys` | เชื่อมกับ `LOADER.saveBrand()` และ `LOADER.brandBoot()` ตามแบบ `Loader.html` เพื่อแคชและแสดงชื่อระบบทันทีตั้งแต่เปิดหน้า |
| **1.4 ชื่อหน่วยงาน (ดึงข้อมูลจาก DB/Settings)** | `⏳ ทำไปบางส่วน` | `portal-app.js` (`applyBranding`): ดึง `Organization_Name` มาใส่ใน `#ftOrg` แต่ปี พ.ศ. ใน `index.html` (L164) ยังพิมพ์ตายตัวว่า `2570` | 1. ดึงชื่อหน่วยงานจาก `STATE.settings` หรือชื่อสำนักจาก `STATE.referenceData` (`BUREAU`) พร้อมแคชผ่าน `LOADER.saveBrand()`<br>2. คำนวณปี พ.ศ. ปัจจุบันแบบ Dynamic (`new Date().getFullYear() + 543`) |

---

### 1.2 ข้อกำหนดที่ 2: ฟอนต์ Sarabun, Responsive Mobile Sidebar, Tailwind Modern Minimal Premium, `Loader.html` (Page/Inline/Overlay Loader), Modal/SweetAlert2, Badge, Table Overflow, Chart.js & 12 Theme Colors

| รายการตามคำสั่ง | สถานะ | พิกัดปัจจุบันในโค้ด (`Wiki/Code_Map.md`) | สิ่งที่ต้องทำเพิ่ม (`⏳`) |
| :--- | :---: | :--- | :--- |
| **2.1 Font Sarabun Google** | `✅ ทำไปแล้ว` | `index.html` (L9–10) และ `portal.css` (L7–9) โหลด Google Fonts `Sarabun` (300–800) และบังคับใช้ทั้งระบบ | — |
| **2.2 Responsive Mobile App + เมนูซ้ายมือสไลด์เปิด-ปิด** | `✅ ทำไปแล้ว` | `index.html` (L75–107): เมนูผู้ดูแลระบบและบุคลากรอยู่ด้านซ้ายมือ (`#sidebar`), เมื่อหน้าจอเล็กซ่อน (`-translate-x-full lg:translate-x-0`) มีปุ่มคลิกเปิดเมนูสไลด์ออกมาพร้อม `#overlay` | — |
| **2.3 Icon สวยงามทันสมัย (Lucide Icons)** | `✅ ทำไปแล้ว` | `index.html` (L16) ใช้ Lucide Icons พร้อมฟังก์ชัน `icons()` รีเฟรชไอคอนทุกครั้งหลังเรนเดอร์ | — |
| **2.4 UI/UX Tailwind CSS Style Modern มินิมอล Premium** | `✅ ทำไปแล้ว` | ใช้ Tailwind CSS Play CDN ร่วมกับโทเคนดีไซน์ใน `portal.css` (`.card`, `.stat-card`, `.section-bar`, `.pill`, `.seg`) | — |
| **2.5 การโหลดหน้าจอและพื้นที่เนื้อหาด้วย `Loader.html` (`LOADER.page` / `LOADER.into` / `skeleton()`) + Lazy Loading** | `⏳ ปรับให้ใช้ Loader.html เต็มรูปแบบ` | มี `WebApp/shared/stb-loader.js` แล้ว แต่เวลาสลับหน้าหรือโหลดข้อมูลในพื้นที่เนื้อหา/การ์ดบางจุดยังไม่ได้เรียก `skeleton()` (`LOADER.page`) และ `loadInto(id, text)` (`LOADER.into`) ตามต้นฉบับ `ref_122wc/Loader.html` | 1. อัปเกรด `WebApp/shared/stb-loader.js` และแยก `WebApp/Portal-SSO/views/loader.html` ให้ตรงกับ `ref_122wc/Loader.html` 100% (`LOADER.page`, `LOADER.into`, `LOADER.show`, `LOADER.hide`, `LOADER.text`, `LOADER.busy`, `LOADER.brandBoot`, `LOADER.saveBrand`, `showLoad`, `hideLoad`, `loadText`, `skeleton`, `loadInto`)<br>2. เมื่อสลับหน้าหรือรอโหลดตาราง/กราฟ ให้แสดง `LOADER.page('กำลังโหลดข้อมูล...', 'โปรดรอสักครู่')` และ `LOADER.into(el, 'กำลังโหลด...')` แทนกล่องเทา `.sk` ทั้งหมด + ใส่ `loading="lazy"` ให้รูปภาพ |
| **2.6 Loading Spin ทุกกระบวนการทำงาน** | `✅ ทำไปแล้ว` *(เชื่อม `LOADER.busy` `⏳`)* | มี Overlay Loader เต็มจอพร้อม Watchdog 60 วินาที | เชื่อมทุกกระบวนการทำงาน (เข้าสู่ระบบ, สมัครสมาชิก, บันทึก Modal, ลบข้อมูล, สลับสถานะ, อัปโหลดไฟล์) ให้ผ่าน `LOADER.show(text)` / `LOADER.busy(promise, text)` ครบ 100% |
| **2.7 การเพิ่ม (Modal) & การแก้ไข (Modal)** | `✅ ทำไปแล้ว` | ใช้ `#appModal` (`openModal` / `closeModal`) สำหรับการเพิ่มและแก้ไขข้อมูลทุกเมนู | — |
| **2.8 การลบ (Sweet Confirm) & การแจ้งเตือน (Sweet Alert) & การออกจากระบบ (Sweet Confirm)** | `✅ ทำไปแล้ว` | - การลบ: ใช้ `confirmAction` (`Swal.fire` warning ปุ่มสีแดง `#E53935`)<br>- การแจ้งเตือน: ใช้ `toast()`, `alertSuccess()`, `alertError()`<br>- การออกจากระบบ: `handleLogout()` เรียก `confirmAction('ยืนยันการออกจากระบบ', ...)` | — |
| **2.9 ตกแต่งด้วย Badge, Table Overflow, `<div><canvas></div>`** | `✅ ทำไปแล้ว` | - Badge: `.badge`, `.chip`, `.soft`<br>- Table Overflow: `<div class="overflow-x-auto">` ครอบตาราง `.tbl` ทุกหน้า<br>- Chart.js: มี `<div><canvas id="chartOrgPersonnel"></canvas></div>` และ `<div><canvas id="chartPosTypes"></canvas></div>` | — |
| **2.10 Theme Color (`#007B3E`, `#4EBA6F`) & พาเลตต์ 12 สี** | `✅ ทำไปแล้ว` | `portal.css` (L14–37) และ `portal-app.js` (`THEMEC`, `GRADC`) กำหนดสีหลัก `#007B3E`, `#4EBA6F` และพาเลตต์ครบทั้ง 12 สี (`#007B3E`, `#4EBA6F`, `#00838F`, `#8BC34A`, `#FFB300`, `#FF7043`, `#E53935`, `#4A148C`, `#C62828`, `#FB8C00`, `#FDD835`, `#0288D1`) | เพิ่ม CSS Variables สำหรับทั้ง 12 สีใน `portal.css` เพื่อให้เรียกใช้ได้ทั่วทั้งระบบ |

---

### 1.3 ข้อกำหนดที่ 3: การแยกไฟล์แบบ OOP Modular (HTML 1 หน้า/ไฟล์ + JS แยกคลาสตามฟังก์ชัน) & ปรับปรุง `Wiki/Code_Map.md`

| รายการตามคำสั่ง | สถานะปัจจุบัน | ปัญหาที่พบ | แผนการแก้ไข (`⏳`) |
| :--- | :---: | :--- | :--- |
| **3.1 แยกหน้าไฟล์ HTML (1 หน้าต่อ 1 ไฟล์)** | `⏳ ยังไม่ได้ทำ` | ปัจจุบัน HTML ของแต่ละหน้าถูกเขียนฝังรวมอยู่ในไฟล์ JS ขนาดใหญ่ | สร้างโฟลเดอร์ `WebApp/Portal-SSO/views/` แยก HTML ออกเป็น **10 ไฟล์ (1 หน้าต่อ 1 ไฟล์ รวม `loader.html`)** โหลดผ่านคลาส `PortalViewLoader` (พร้อม Memory Cache) |
| **3.2 แยกไฟล์ JS แบบ OOP ตามฟังก์ชันการทำงาน** | `⏳ ยังไม่ได้ทำ` | `portal-app.js` ยาว **1,849 บรรทัด** และ `portal-admin.js` ยาว **2,332 บรรทัด** ทำให้เสีย Token จำนวนมากเวลาอ่าน/วิเคราะห์ | แยกไฟล์ JS ออกเป็นคลาส OOP ตามหน้าที่รับผิดชอบ เหลือไฟล์ละ **~110–430 บรรทัด** โดยคง `window.PORTAL_APP` และ `window.PORTAL_ADMIN` Facade เดิมไว้ 100% |
| **3.3 ปรับแต่ง `Wiki/Code_Map.md` ให้เข้าถึงข้อมูลรวดเร็ว** | `⏳ ต้องอัปเดตตามไฟล์ใหม่` | พิกัดเดิมชี้ไปที่ไฟล์ใหญ่ 2 ไฟล์ | อัปเดต `Wiki/Code_Map.md` ให้มี **ตารางพิกัดรายฟังก์ชันของทุกไฟล์ย่อย** เพื่อให้อ่าน `Wiki/Code_Map.md` ก่อนแล้วใช้ `view_file` กระโดดไปยังบรรทัดเป้าหมายได้ทันทีโดยไม่ต้องอ่านตั้งแต่บรรทัดแรก |

---

## 🏗️ ส่วนที่ 2: สถาปัตยกรรมการแยกไฟล์แบบ OOP (HTML 1 หน้า/ไฟล์ + JS Classes)

### 2.1 โครงสร้างไฟล์ HTML แยกตามหน้า (`WebApp/Portal-SSO/views/` — 1 หน้าต่อ 1 ไฟล์)
1. `WebApp/Portal-SSO/views/loader.html` — โครงสร้างและสไตล์ของ BMA 3D Logo Flip Loader (`ref_122wc/Loader.html` 100%: `.loader`, `.ld-mask`, `.ld-card`, `.ld-page`, `.ld-inline`, `.ld-bar`, `.ld-chip`)
2. `WebApp/Portal-SSO/views/auth.html` — หน้าเข้าสู่ระบบ, ลืมรหัสผ่าน, และลงทะเบียนบุคลากรใหม่ 2 ขั้นตอน
3. `WebApp/Portal-SSO/views/dashboard.html` — หน้าภาพรวมระบบ (4 Stat Cards + SSO WebApp Launchpad + กราฟ `<canvas>` 2 ชุด)
4. `WebApp/Portal-SSO/views/profile.html` — หน้าข้อมูลส่วนตัวและรหัสผ่าน (ข้อมูลบุคลากร, เปลี่ยน Username 1 ครั้ง, อัปโหลดรูปและลายเซ็น)
5. `WebApp/Portal-SSO/views/personnel.html` — หน้าทำเนียบบุคลากร (`#personnel`)
6. `WebApp/Portal-SSO/views/users.html` — หน้าจัดการบัญชีผู้ใช้งานและสิทธิ์รายแอป (`#users`)
7. `WebApp/Portal-SSO/views/webapps.html` — หน้าจัดการเว็บแอปพลิเคชันย่อย SSO (`#webapps`)
8. `WebApp/Portal-SSO/views/reference.html` — หน้าโครงสร้างสังกัด 4 ระดับ (`#reference`)
9. `WebApp/Portal-SSO/views/positions.html` — หน้าโครงสร้างตำแหน่ง & คำนำหน้าชื่อ (`#positions`)
10. `WebApp/Portal-SSO/views/settings.html` — หน้าตั้งค่าระบบส่วนกลาง (`#settings`)

---

### 2.2 โครงสร้างการแยกไฟล์ JS แบบ OOP จัดกลุ่มตามฟังก์ชันการทำงาน (`WebApp/Portal-SSO/assets/js/`)

> [!TIP]
> **พิกัดต้นทางจาก `Wiki/Code_Map.md` สำหรับการแยกไฟล์ด้วย IDE Tools (ไม่ต้องอ่านตั้งแต่บรรทัดแรก):**
> - **จาก `portal-app.js` (1,849 บรรทัด):**
>   - `L1–117`: State, Theme Colors (`THEMEC`, `GRADC`), UI Atoms (`icons`, `esc`, `statCard`, `sectionBar`, `th`, `resolveDriveImg`) $\rightarrow$ แยกไป `assets/js/core/portal-state.js`
>   - `L118–340`: Dynamic Structure & Deduplication Engine (`getReferenceItems`, `getPositionTypes`, `getPositionsByType`, `getLevelsByPosition`, `buildOptionsHtml`, `bindOrgAndPositionCascade`) $\rightarrow$ แยกไป `assets/js/core/portal-cascade.js`
>   - `L341–560`: Theme, Branding (`applyBranding` + Footer Dynamic + `LOADER.saveBrand`), Modal & SweetAlert2 + `LOADER.page` / `LOADER.into` Wrapper $\rightarrow$ แยกไป `assets/js/core/portal-ui.js` และ `assets/js/core/portal-view-loader.js`
>   - `L561–1160`: Auth Views (Login, Register 2 Steps, Forgot/Reset Password, Verify Email, `handleLogout` Sweet Confirm) $\rightarrow$ แยกไป `assets/js/modules/portal-auth.js`
>   - `L1161–1400`: Dashboard View (4 Stat Cards, SSO Launchpad, Chart.js 2 กราฟ, `launchSubApp`) $\rightarrow$ แยกไป `assets/js/modules/portal-dashboard.js`
>   - `L1401–1760`: Profile View (Masked ID Card, 1-Time Username Edit, Drive Photo/Signature Upload, Canvas Signature Pad) $\rightarrow$ แยกไป `assets/js/modules/portal-profile.js`
>   - `L1761–1849`: Main Router & Public Facade (`window.PORTAL_APP`) $\rightarrow$ คงไว้ใน `assets/js/portal-app.js`
> - **จาก `portal-admin.js` (2,332 บรรทัด):**
>   - `L1–110`: Admin Shared State & Helpers $\rightarrow$ แยกไป `assets/js/admin/admin-shared.js`
>   - `L111–560`: `#personnel` (`AdminPersonnel`) $\rightarrow$ แยกไป `assets/js/admin/admin-personnel.js`
>   - `L561–980`: `#users` (`AdminUsers`) $\rightarrow$ แยกไป `assets/js/admin/admin-users.js`
>   - `L981–1390`: `#webapps` (`AdminWebapps`) $\rightarrow$ แยกไป `assets/js/admin/admin-webapps.js`
>   - `L1391–1728`: `#reference` (`AdminReference`) $\rightarrow$ แยกไป `assets/js/admin/admin-reference.js`
>   - `L1729–2141`: `#positions` (`AdminPositions`) $\rightarrow$ แยกไป `assets/js/admin/admin-positions.js`
>   - `L2142–2290`: `#settings` (`AdminSettings`) $\rightarrow$ แยกไป `assets/js/admin/admin-settings.js`
>   - `L2291–2332`: Admin Route Registration & Public Facade (`window.PORTAL_ADMIN`) $\rightarrow$ คงไว้ใน `assets/js/portal-admin.js`

---

## 🛠️ ส่วนที่ 3: ขั้นตอนการดำเนินงานและกฎเหล็กการตรวจสอบ

1. **บังคับใช้กฎ Map-First & IDE Tools 100%:**
   - ทุก Subagent อ่านพิกัดจาก `Wiki/Code_Map.md` และตารางพิกัดในแผนนี้ก่อนใช้ `view_file` เสมอ (ห้ามเริ่มอ่านตั้งแต่บรรทัดที่ 1 เพื่อสแกนหาเอง และห้ามใช้ Node.js หรือ Terminal อ่าน/ตัดแบ่งไฟล์)
2. **อัปเกรด `WebApp/shared/stb-loader.js` & `views/loader.html` ให้ตรงกับ `Loader.html` 100%:**
   - รองรับ `LOADER.show`, `LOADER.hide`, `LOADER.text`, `LOADER.forceHide`, `LOADER.page`, `LOADER.into`, `LOADER.busy`, `LOADER.brandBoot`, `LOADER.saveBrand`, `LOADER.closeSplash` และฟังก์ชันกลาง `showLoad`, `hideLoad`, `loadText`, `skeleton()`, `loadInto()`
3. **แยกไฟล์ HTML Views (10 ไฟล์) และ JS OOP Classes (16 ไฟล์) + ปรับปรุง Footer Fluid Width:**
   - แยกไฟล์ตามพิกัดบรรทัดข้างต้นโดยไม่แก้ไขหรือตัดทอนตรรกะการทำงานเดิม
4. **การตรวจสอบความถูกต้องหลังแยกไฟล์โดย Subagent (`inherit` / Argon):**
   - ให้ Subagent (`Model: "inherit"`) ตรวจสอบยืนยันว่าทุกเมธอดใน `window.PORTAL_APP` และ `window.PORTAL_ADMIN` รวมถึงการทำงานทุกหน้าอยู่ครบถ้วน 100% ไม่มีการเปลี่ยนแปลงฟังก์ชันหรือตรรกะเดิม
5. **อัปเดต `Wiki/Code_Map.md` และ `Working/CURRENT_STATE.md` (`archivist`):**
   - บันทึกตารางพิกัดบรรทัดของไฟล์ย่อยทั้งหมดลงใน `Wiki/Code_Map.md` เพื่อให้การแก้ไขในอนาคตเปิดอ่านเฉพาะไฟล์ย่อยได้ทันที
