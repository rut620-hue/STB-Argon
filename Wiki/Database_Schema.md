# 🗄️ โครงสร้างตารางฐานข้อมูลและคอลัมน์จริง (Database Schema - Source of Truth)

> [!IMPORTANT]
> เอกสารนี้คือ **Source of Truth** ของฐานข้อมูลโปรเจกต์ **STB APP n2** บน **Supabase PostgreSQL 17.11 (`ycyefnsfamlhnwgizavs`)** โดยตรวจสอบเทียบแบบตัวต่อตัวกับ [`Wiki/Portal_SSO_Blueprint/`](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/01_Data_Model_and_Core.md) ครบ 100%

## 1. ภาพรวมสถาปัตยกรรมฐานข้อมูล (Multi-Schema Architecture)
- **Supabase Project Ref:** `ycyefnsfamlhnwgizavs`
- **PostgreSQL Pooler Host:** `aws-0-ap-south-1.pooler.supabase.com` (Port `6543`)
- **การแบ่งแยก Schema:**
  - **`portal`**: เก็บตารางหลักทั้ง 8 ตารางของระบบ Central Portal & SSO
  - **`app_<ชื่อแอปย่อย>`**: สำหรับเว็บแอปย่อยแต่ละตัวที่จะสร้างเพิ่มในอนาคต (เชื่อมโยง `personnel_id` ข้ามมาที่ `portal.personnel` ได้)

---

## 2. รายละเอียดทั้ง 8 ตารางใน Schema `portal`

### 2.1 `portal.users` (11 คอลัมน์)
- `personnel_ref_id` (PK, `VARCHAR(50)`) — อ้างอิง 1:1 กับ `portal.personnel(personnel_id)`
- `username` (`VARCHAR(100) UNIQUE`) — ตัวพิมพ์เล็ก `^[a-z0-9_.]+$`
- `email` (`VARCHAR(255) UNIQUE`) — อีเมลผู้ใช้
- `password_salt` (`TEXT`) — ค่า Salt เฉพาะบุคคล
- `password_hash` (`VARCHAR(64)`) — `SHA-256(salt + "|" + password)`
- `role` (`VARCHAR(20)`) — `'SUPERADMIN'`, `'ADMIN'`, `'USER'`
- `status` (`VARCHAR(50)`) — `'รอการยืนยันอีเมล'`, `'รออนุมัติ'`, `'ใช้งานปกติ'`, `'ระงับบัญชี'`
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)
- `last_login_at` (`TIMESTAMPTZ`)
- `username_changed` (`BOOLEAN DEFAULT FALSE`) — บันทึกการเปลี่ยน Username ครั้งเดียวของ `USER`

### 2.2 `portal.personnel` (20 คอลัมน์)
- `personnel_id` (PK, `VARCHAR(50)`) — เช่น `'PS0001'`
- `id_card_number` (`VARCHAR(13) UNIQUE`) — เลขบัตรประชาชน 13 หลัก (Modulo-11)
- `prefix` (`VARCHAR(50)`) — คำนำหน้าชื่อ
- `first_name` (`VARCHAR(100)`) — ชื่อจริง
- `last_name` (`VARCHAR(100)`) — นามสกุล
- `position_type` (`VARCHAR(100)`) — ประเภทตำแหน่ง (`'วิชาการ'`, `'ทั่วไป'`, `'อำนวยการ'`)
- `position` (`VARCHAR(150)`) — ชื่อตำแหน่งสายงาน
- `position_level` (`VARCHAR(100)`) — ระดับตำแหน่ง
- `position_2` (`VARCHAR(200)`) — ตำแหน่งบริหาร/รักษาการ
- `bureau_name` (`VARCHAR(150)`) — สำนัก (ค่าเริ่มต้น `'สำนักเทศกิจ'`)
- `office` (`VARCHAR(150)`) — สำนักงาน / กอง
- `department` (`VARCHAR(150)`) — ฝ่าย / ส่วน
- `division` (`VARCHAR(150)`) — กลุ่มงาน
- `start_service_year_be` (`VARCHAR(10)`) — ปี พ.ศ. ที่เริ่มรับราชการ
- `current_salary` (`NUMERIC(12,2)`) — เงินเดือนปัจจุบัน
- `signature_url` (`TEXT`) — URL รูปลายเซ็นบน Google Drive
- `photo_url` (`TEXT`) — URL รูปถ่ายโปรไฟล์บน Google Drive
- `status` (`VARCHAR(50)`) — `'ทำงานอยู่'`, `'ช่วยราชการ'`, `'ลาออก'`, `'เกษียณ'`
- `created_at` (`TIMESTAMPTZ`)
- `updated_at` (`TIMESTAMPTZ`)

### 2.3 `portal.security_tokens` (10 คอลัมน์)
- `token_id` (PK, `VARCHAR(50)`), `user_id` (`VARCHAR(50)`), `token_type` (`VARCHAR(50)`), `token_string` (`VARCHAR(255) UNIQUE`), `created_at` (`TIMESTAMPTZ`), `expiry_date` (`TIMESTAMPTZ`), `is_used` (`BOOLEAN DEFAULT FALSE`), `ref_app_id` (`VARCHAR(50)`), `expires_at` (`TIMESTAMPTZ`), `is_active` (`BOOLEAN DEFAULT TRUE`)

### 2.4 `portal.webapps` (7 คอลัมน์)
- `webapp_id` (PK, `VARCHAR(50)`), `name` (`VARCHAR(150)`), `url` (`TEXT`), `icon_url` (`TEXT`), `status` (`VARCHAR(50)`), `description` (`TEXT`), `sort_order` (`INTEGER DEFAULT 0`)

### 2.5 `portal.permissions` (3 คอลัมน์)
- `personnel_ref_id` (`VARCHAR(50)`), `webapp_id` (`VARCHAR(50)`), `access_level` (`VARCHAR(20)` — `'USER'`, `'ADMIN'`, `'None'`) — Composite PK `(personnel_ref_id, webapp_id)`

### 2.6 `portal.system_settings` (3 คอลัมน์, 13 Default Keys)
- คอลัมน์: `key` (PK, `VARCHAR(100)`), `value` (`TEXT`), `description` (`TEXT`)
- 13 Keys มาตรฐาน: `App_Display_Name`, `Verify_Email_Hours`, `Reset_Token_Minutes`, `Session_Hours`, `Profile_Folder_ID`, `Signature_Folder_ID`, `Personnel_Photo_Folder_ID`, `App_Icon_Folder_ID`, `Default_Profile_Picture_URL`, `App_Base_Url`, `Login_Logo_URL`, `Dashboard_Logo_URL`, `Default_Theme`

### 2.7 `portal.reference_data` (8 คอลัมน์)
- `reference_id` (PK, `VARCHAR(50)`), `type` (`VARCHAR(50)`), `value` (`VARCHAR(200)`), `short_name` (`VARCHAR(50)`), `parent_type` (`VARCHAR(50)`), `parent_value` (`VARCHAR(200)`), `sort_order` (`INTEGER`), `is_active` (`BOOLEAN`)

### 2.8 `portal.position_structure` (6 คอลัมน์)
- `pos_id` (PK, `VARCHAR(50)`), `position_type` (`VARCHAR(100)`), `position_name` (`VARCHAR(150)`), `position_level` (`VARCHAR(100)`), `sort_order` (`INTEGER`), `is_active` (`BOOLEAN`)
