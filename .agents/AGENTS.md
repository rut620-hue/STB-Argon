# กฎและข้อกำหนดในการพัฒนาระบบ (Orchestrator, 4 Subagents & Surgical Workflow)

> [!IMPORTANT]
> ไฟล์นี้คือศูนย์กลางควบคุมการทำงานของ **Main Agent (Orchestrator)** เพื่อประหยัด Token สูงสุด (**"อ่านครั้งเดียว แก้เฉพาะจุด ทดสอบเฉพาะส่วน"**) โดยกระจายงานให้ **Subagents เฉพาะทาง 4 ตัว** และดูแลฐานความรู้ใน `Wiki/`

## 🤖 1. สถาปัตยกรรม Multi-Subagent (4 บทบาทเฉพาะทาง)
1. **`planner` (นักสำรวจและเขียนแผน - Read-Only):** อ่าน `Wiki/Code_Map.md` เพื่อหาพิกัดไฟล์และเลขบรรทัด (`StartLine`–`EndLine`) เปิดอ่านโค้ดเฉพาะช่วงบรรทัดที่เกี่ยวข้อง (ห้ามเกินครั้งละ 150 บรรทัด) แล้วส่งร่างแผนกลับมาให้ Main Agent
2. **`coder` (นักเขียนโค้ดและแก้บั๊กเฉพาะจุด - Surgical Write):** ทำงานหลังจากผู้ใช้กดอนุมัติแผน (**Proceed**) แล้วเท่านั้น อ่านและแก้ไขเฉพาะไฟล์และช่วงบรรทัดที่ระบุในแผนด้วย `replace_file_content`
3. **`reviewer` (ผู้ตรวจสอบโค้ดและ Deploy เฉพาะจุด - QA & Deploy):** ตรวจเฉพาะ `git diff` ของไฟล์ที่แก้ เช็คกฎความปลอดภัยของระบบ และรันคำสั่ง Deploy/Test เฉพาะส่วนที่มีการแก้ไข
4. **`archivist` (ผู้สกัดองค์ความรู้ Wiki, Skills & Backup):** อัปเดตเลขบรรทัดใน `Wiki/Code_Map.md` หากบรรทัดเลื่อน, สกัดความรู้ลง `Wiki/` และ `.agents/skills/`, อัปเดต `Working/CURRENT_STATE.md` (ไม่เกิน 40 บรรทัด) และรัน `git push`

## 🎯 1.1 กฎการเลือกใช้โมเดล AI (Model & Effort Selection Matrix)
- ❌ **ห้ามใช้ Gemini Flash 3.8 (`Low`) หรือ `"flash_lite"` ในทุกกรณี!**
- **Main Agent:** งานทั่วไป (90%) = **Gemini 4 Argon (`Low`)** | งานออกแบบโครงสร้างข้ามระบบ (8%) = **Argon (`Medium`)** | งานแก้บั๊กวิกฤต (2%) = **Argon (`High`)**
- **Subagents (`invoke_subagent`):**
  - `planner`: สำรวจทั่วไป = `"flash"` | วางแผนซับซ้อน = `"pro"` / `"inherit"`
  - `coder`: แก้จุดเล็กน้อย/UI/CSS = `"flash"` (Flash High) หรือ `"inherit"` (Argon Low) | แก้ Logic/Backend/Bug = `"pro"` / `"inherit"`
  - `reviewer`: ตรวจ diff & Deploy = `"flash"` | ตรวจ Auth/Security เชิงลึก = `"pro"`
  - `archivist`: ทุกกรณี = `"flash"`

## 📋 2. กฎเหล็กการวางแผนคู่ขนาน (Dual-Plan Sync Rule)
ซิงค์แผนงานลง 2 จุดเสมอ:
1. `<ArtifactDir>/<topic>_plan.md` (`RequestFeedback: true, UserFacing: true` — ห้ามตั้งชื่อซ้ำกับ `implementation_plan.md`)
2. `Working/implementation_plan.md` (เนื้อหาตรงกัน 100%)
- กด **Review** = ปรับปรุงแผน ห้ามแก้โค้ด | กด **Proceed** = สั่ง `coder` แก้โค้ดได้

## ⚡ 3. กฎประหยัด Token และความสะอาดโฟลเดอร์
1. **Fast Boot:** เริ่มแชทใหม่ให้อ่านเฉพาะ `Working/CURRENT_STATE.md` และ `Working/task.md`
2. **Read-Once via Code Map:** ดูพิกัดบรรทัดใน `Wiki/Code_Map.md` ก่อนใช้ `view_file` เสมอ
3. **No Terminal for File I/O & Zero Clutter:** ห้ามใช้คำสั่ง Terminal อ่าน/แก้ไฟล์ และห้ามสร้างไฟล์ขยะทิ้งไว้ใน Root หรือ `Working/`

