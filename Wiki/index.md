# 📚 สารบัญฐานความรู้โปรเจกต์ (Second Brain Index)

> [!NOTE]
> ศูนย์รวมองค์ความรู้ของโปรเจกต์ **STB APP n2** ดูแลและอัปเดตโดย Subagent `archivist`

## 1. โครงสร้างหลักและพิกัดโค้ด (Core References)
- [AI_Workflow_Blueprint.md](file:///d:/STB%20APP%20n2/Wiki/AI_Workflow_Blueprint.md) — พิมพ์เขียวระบบการทำงาน AI (Multi-Subagent, Surgical Workflow & Token-Diet Rules)
- [Code_Map.md](file:///d:/STB%20APP%20n2/Wiki/Code_Map.md) — แผนผังโครงสร้างโปรเจกต์และพิกัดเลขบรรทัด (`StartLine`–`EndLine`) ของทุกฟังก์ชัน
- [Database_Schema.md](file:///d:/STB%20APP%20n2/Wiki/Database_Schema.md) — โครงสร้างตารางฐานข้อมูลและคอลัมน์จริง (Source of Truth)
- [log.md](file:///d:/STB%20APP%20n2/Wiki/log.md) — บันทึกประวัติการอัปเดตฐานความรู้ตามลำดับเวลา

## 2. พิมพ์เขียวระบบ Portal & SSO (`Wiki/Portal_SSO_Blueprint/`)
- [00_README.md](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/00_README.md) — ภาพรวมระบบ Portal & Single Sign-On (SSO)
- [01_Data_Model_and_Core.md](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/01_Data_Model_and_Core.md) — โครงสร้างข้อมูลและ Core Architecture
- [02_Auth_and_SSO.md](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/02_Auth_and_SSO.md) — ระบบยืนยันตัวตนและกลไก SSO
- [03_Domain_Logic.md](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/03_Domain_Logic.md) — กฎธุรกิจและ Domain Logic
- [04_Frontend_Behavior.md](file:///d:/STB%20APP%20n2/Wiki/Portal_SSO_Blueprint/04_Frontend_Behavior.md) — พฤติกรรมฝั่ง Frontend และ UI/UX

## 3. ข้อมูลจำเพาะของแต่ละระบบย่อย (`Wiki/Entities/`)
- *(ยังไม่มีข้อมูล — จะเพิ่มเมื่อเริ่มสร้างโมดูลหรือแอปพลิเคชัน)*

## 4. แนวคิด กฎธุรกิจ และข้อจำกัดทางเทคนิค (`Wiki/Concepts/`)
- *(ยังไม่มีข้อมูล — จะเพิ่มเมื่อสกัดบทเรียนและกฎธุรกิจของโปรเจกต์)*

## 5. ทักษะเฉพาะทางของ AI (`.agents/skills/`)
- [supabase](file:///d:/STB%20APP%20n2/.agents/skills/supabase/SKILL.md) — Best practices, การจัดการ Auth, Database, API, RLS และ Debugging ของ Supabase
- [supabase-postgres-best-practices](file:///d:/STB%20APP%20n2/.agents/skills/supabase-postgres-best-practices/SKILL.md) — กฎและแนวทางปฏิบัติขั้นสูงในการออกแบบ schema, SQL query, indexes และ connection pooling บน Postgres/Supabase
