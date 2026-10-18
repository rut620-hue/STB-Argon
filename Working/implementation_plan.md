# 🏛️ แผนการปรับปรุง UX/UI ให้ตรงตามต้นฉบับ `122wcJrr...` 100% (Faithful Reference Alignment Plan)
**นำโครงสร้างจริงจาก `Index.html`, `Css.html`, `JsLayout.html`, `JsPersonnel.html`, และ `JsSettings.html` ของโปรเจกต์ต้นแบบมาใช้เต็มรูปแบบ**

> [!IMPORTANT]
> แผนงานนี้จัดทำขึ้นหลังจากดึงซอร์สโค้ดจริงทั้ง 18 ไฟล์จากโปรเจกต์ `122wcJrrBi_5lEMMLfm_cnlurm6ZCQEXMFFsL6IcL6PmCPzIn_Mu6qusX` มาวิเคราะห์เปรียบเทียบ และซิงค์ตรงกัน 100% กับ `<ArtifactDir>/portal_uxui_theme_plan.md` กรุณาตรวจสอบและกดปุ่ม **Proceed** เพื่อสั่งให้เริ่มดำเนินการ

---

## 1. สิ่งที่โปรเจกต์ต้นแบบ (`122wcJrr...`) ใช้จริง และสาเหตุที่ของเดิมไม่ตรง

จากการเปิดอ่าน `Index.html`, `Css.html`, และ `JsLayout.html` ของโปรเจกต์ต้นแบบ พบโครงสร้างแท้จริงดังนี้:

1. **ไลบรารีใน `<head>` (`Index.html` บรรทัด 9–13):**
   - ใช้ **Tailwind CSS Play CDN** (`https://cdn.tailwindcss.com`) ร่วมกับ `Css.html` (138 บรรทัด)
   - ใช้ **Lucide Icons** (`https://unpkg.com/lucide@latest` ด้วยแท็ก `<i data-lucide="..."></i>` และฟังก์ชัน `icons()`)
   - ใช้ **Chart.js 4.4.1** (`https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`) สำหรับกราฟ Doughnut และ Horizontal Bar ในหน้า Dashboard
   - ใช้ **SweetAlert2** และ **SheetJS (`xlsx`)**
   - ใช้ฟอนต์ **`Sarabun`** จาก Google Fonts (`wght@300;400;500;600;700;800`)

2. **การเขียน Sidebar & Top Header (`Index.html` บรรทัด 59–122 + `JsLayout.html` บรรทัด 1–91):**
   - **Sidebar (`aside#sidebar.sidebar`):**
     - คลาส: `sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 -translate-x-full lg:translate-x-0 transition-transform duration-300 flex flex-col`
     - ด้านบนมีบล็อกโลโก้คู่ + ชื่อระบบ + **กล่องข้อมูลผู้ใช้งานย่อใน Sidebar** (`bg-white/10 rounded-xl p-2.5 flex items-center gap-2.5`) แสดง `#uName`, `#uPos`, `#uRoleBadge`
     - รายการเมนู (`nav#menu`) เรนเดอร์ด้วย `buildMenu()` ใช้ `.menu-group`, `.menu-item` (เมื่อ `.active` จะมีแถบสีเหลืองทอง `--yellow: #FDD835` กว้าง 4px ด้านซ้าย) และเมนูย่อยแบบพับได้ (`.menu-parent` + `.submenu.open`)
   - **Top Header (`header.app-header`):**
     - พื้นหลัง `linear-gradient(120deg, var(--hd1) 0%, var(--hd2) 55%, var(--hd3) 100%)`
     - ด้านซ้ายมีปุ่มเปิดเมนูมือถือ + กล่องไอคอนหน้า `#pageIcon` (`w-10 h-10 rounded-xl bg-white/15`) + `#pageTitle` + `#pageSub`
     - ด้านขวามีชิปสถานะ/ปี พ.ศ. + ปุ่มสลับโหมดมืด/สว่าง `#themeBtn` (สลับคลาส `html.dark`) + กล่องโปรไฟล์ `#hdAvatar` (พื้นหลังทอง `linear-gradient(135deg,#FFB300,#FDD835)`)

3. **การเขียน Dashboard, Stat Cards & กราฟ (`JsLayout.html` บรรทัด 93–229):**
   - **Section Bar (`sectionBar(t, right, ic)`):** หัวข้อแต่ละส่วนมีขีดสีเขียวด้านซ้าย (`<span class="w-1.5 h-6 rounded-full" style="background:var(--g1)"></span>`) + ไอคอน Lucide + ชื่อหัวข้อ
   - **Stat Cards (`statCard(t, v, ic, gi, sub)`):** การ์ดไล่เฉดสีจาก `GRADC()` มีวงกลมสะท้อนแสง 3 วง (`.deco.d1`, `.deco.d2`, `.deco.d3`), ตัวเลขขนาด `text-3xl font-extrabold` และกล่องไอคอน `w-11 h-11 rounded-xl bg-white/20`
   - **กราฟ Chart.js:** การ์ด `.card p-5` แสดงกราฟ Doughnut (`cutout: '56%'`) และกราฟแท่งแนวนอน (`indexAxis: 'y'`, `borderRadius: 6`) โดยใช้ชุดสี `THEMEC()`

4. **การเขียนตาราง, ปุ่ม, ฟอร์ม และหน้าต่าง Modal (`Css.html` + `JsCore.html` + `JsPersonnel.html` + `JsSettings.html`):**
   - **ตาราง (`table.tbl`):** `<div class="card overflow-hidden"><div class="overflow-x-auto"><table class="tbl">` หัวตารางใช้ `th(label, key)` กำหนดความกว้างมาตรฐาน `TW`
   - **ปุ่ม (`.btn`):** `.btn-primary` (เขียวไล่เฉด), `.btn-ghost` (พื้นขาว/พื้นผิว ขอบบาง), `.btn-amber`, `.btn-danger`, `.btn-sm`
   - **ฟอร์ม:** `.lbl`, `.inp`, `.sel`, `.ta`
   - **Modal (`#modalMask.modal-mask`):** `.modal-box` > `.modal-head` (หัวสีเขียวไล่เฉด `--g1` $\rightarrow$ `--g2`) + `#modalBody` + `#modalFoot.modal-foot`

---

## 2. ตารางพิกัดไฟล์และช่วงบรรทัดที่จะปรับปรุงทั้งหมด

| ลำดับ | ไฟล์เป้าหมาย | ช่วงบรรทัด | รายละเอียดการดำเนินการ |
| :---: | :--- | :---: | :--- |
| **1** | [`WebApp/Portal-SSO/assets/css/portal.css`](file:///d:/STB%20APP%20n2/WebApp/Portal-SSO/assets/css/portal.css) | **1–555** | นำ CSS ต้นฉบับ 138 บรรทัดจาก `ref_122wc/Css.html` มาใช้ 100% (`:root`, `html.dark`, `.sidebar`, `.menu-item`, `.menu-group`, `.submenu`, `.app-header`, `.card`, `.stat-card`, `.deco`, `table.tbl`, `.btn-*`, `.inp/.sel/.ta`, `.chip`, `.modal-mask/.modal-box`, `.tab-btn`) พร้อมคงคลาสเฉพาะของ SSO Launchpad Card |
| **2** | [`WebApp/Portal-SSO/index.html`](file:///d:/STB%20APP%20n2/WebApp/Portal-SSO/index.html) | **1–163** | ปรับ `<head>` ให้โหลด **Tailwind CSS Play CDN**, **Chart.js 4.4.1**, **SheetJS**, **Lucide Icons**, **SweetAlert2** และปรับโครงสร้าง HTML ของ `#loginView`, `#appView` (`aside#sidebar`, `header.app-header`, `#setupBanner`, `main#content`, `footer`, `#modalMask`) ให้ตรงกับ `ref_122wc/Index.html` 100% |
| **3** | [`WebApp/Portal-SSO/assets/js/portal-app.js`](file:///d:/STB%20APP%20n2/WebApp/Portal-SSO/assets/js/portal-app.js) | **1–1521** | ปรับ UI Helpers (`icons()`, `THEMEC()`, `GRADC()`, `statCard()`, `sectionBar()`, `th()`, `buildMenu()`, `toggleSidebar()`, `toggleSub()`) และปรับหน้า `#loginView`, `#dashboard` (เพิ่ม Stat Cards ฟองอากาศ `.deco` + กราฟ Chart.js สรุปบุคลากรตามประเภทตำแหน่ง/สังกัด + การ์ดเข้าเว็บแอปย่อย SSO), และ `#profile` ให้ใช้ Tailwind + Lucide Icons ตามต้นแบบ 100% |
| **4** | [`WebApp/Portal-SSO/assets/js/portal-admin.js`](file:///d:/STB%20APP%20n2/WebApp/Portal-SSO/assets/js/portal-admin.js) | **1–2046** | ปรับทั้ง 6 โมดูลแอดมิน (`#personnel`, `#users`, `#webapps`, `#reference`, `#positions`, `#settings`) ให้ใช้ `sectionBar()`, `statCard()`, `table.tbl` (`th()`), `.btn-primary`, `.btn-ghost`, `.inp`, `.sel`, `.chip`, `.tab-btn` และ Lucide Icons (`data-lucide`) ตาม `JsPersonnel.html` และ `JsSettings.html` ของต้นแบบ 100% |
| **5** | [`WebApp/sample-subapp/index.html`](file:///d:/STB%20APP%20n2/WebApp/sample-subapp/index.html) | **1–524** | ปรับหน้าเว็บแอปย่อยตัวอย่างให้ใช้ Tailwind CSS + Lucide Icons + `Css.html` tokens เข้าชุดกับ Portal SSO 100% |
| **6** | [`Wiki/Code_Map.md`](file:///d:/STB%20APP%20n2/Wiki/Code_Map.md) & [`Working/CURRENT_STATE.md`](file:///d:/STB%20APP%20n2/Working/CURRENT_STATE.md) | ทั้งไฟล์ | อัปเดตเลขบรรทัดและบันทึกสถาปัตยกรรม UI (Tailwind + Lucide + Chart.js + Custom Tokens) ลงฐานความรู้ |

---

## 3. รายละเอียดสิ่งที่คุณจะได้เห็นในหน้าเว็บหลังปรับตามต้นฉบับ `122wcJrr...`

1. **หน้าเข้าสู่ระบบ (`#loginView`):**
   - การ์ด Split-Screen ขอบมน `rounded-3xl` ด้านซ้ายเป็นพาเนลสีเขียวเข้มพร้อมลวดลายวงกลมเรืองแสง 3 วง และโลโก้คู่ (กทม. + สำนักเทศกิจ) ด้านขวาเป็นฟอร์มเข้าสู่ระบบ / สมัครสมาชิก 3 ขั้นตอนที่ใช้ `.lbl`, `.inp`, `.sel`, `.btn-primary` และไอคอน Lucide
2. **Sidebar & Header (`#appView`):**
   - Sidebar สีเขียวเข้ม กทม. มีการ์ดโปรไฟล์ย่อด้านบน, หมวดหมู่ `.menu-group`, เมนู `.menu-item` พร้อมแถบสีเหลืองทองด้านซ้ายเมื่อ Active และเมนูตั้งค่าแบบพับเก็บได้ (`.menu-parent` + `.submenu`)
   - Topbar สีเขียวไล่เฉด มีกล่องไอคอนหน้า `#pageIcon`, ชื่อหน้า `#pageTitle`, ปุ่มสลับโหมดมืด/สว่าง (`html.dark`) และ Avatar สีทอง `#hdAvatar`
3. **หน้าหลัก Dashboard (`#dashboard`):**
   - **แถบหัวข้อ `sectionBar`** พร้อมขีดสีเขียวด้านซ้าย
   - **การ์ดสถิติ 4 ใบ (`statCard`)** ไล่เฉดสีจาก `GRADC()` มีฟองอากาศโปร่งแสง `.deco.d1, .d2, .d3`
   - **การ์ดระบบงานย่อย Single Sign-On (SSO Launchpad):** ดีไซน์เข้าชุดกับ `.card` ของต้นแบบ พร้อมปุ่มกดเข้าสู่ระบบย่อยทันที
   - **กราฟ Chart.js 2 กราฟ** (เหมือนใน `JsLayout.html` ของต้นแบบ):
     1. กราฟวงแหวน (Doughnut Chart) สัดส่วนบุคลากรแยกตามประเภทตำแหน่ง กทม.
     2. กราฟแท่งแนวนอน (Horizontal Bar Chart) จำนวนบุคลากรแยกตามสำนักงาน/กอง/ฝ่าย
4. **หน้าทำเนียบบุคลากร, ผู้ใช้งาน, เว็บแอป, โครงสร้างสังกัด/ตำแหน่ง และตั้งค่าระบบ:**
   - ใช้ตาราง `table.tbl` หัวตารางสีเขียวอ่อน `--thead`, ปุ่ม `.btn-primary` / `.btn-ghost` / `.btn-amber` / `.btn-danger`, แท็บ `.tab-btn`, ปุ่มเลื่อนลำดับ `▲▼` และหน้าต่าง `.modal-mask` ตาม `JsPersonnel.html` และ `JsSettings.html` ของโปรเจกต์ต้นแบบทุกประการ

---

## 4. ขั้นตอนการดำเนินงานเมื่อกด Proceed
1. **`coder` Subagent:** ปรับปรุง `portal.css`, `WebApp/Portal-SSO/index.html`, `portal-app.js`, `portal-admin.js`, และ `WebApp/sample-subapp/index.html` ให้ตรงตามต้นฉบับ `122wcJrr...` 100%
2. **`reviewer` Subagent:** ตรวจสอบ Syntax ด้วย `node -c` ทุกไฟล์ และตรวจสอบว่าทุกหน้าเรียก `icons()` (`lucide.createIcons()`) ครบถ้วน
3. **`archivist` Subagent:** อัปเดต `Wiki/Code_Map.md`, `Working/CURRENT_STATE.md`, `Wiki/log.md` และ Push ขึ้น GitHub (`origin/main`)
