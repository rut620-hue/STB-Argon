# กฎและข้อกำหนดในการพัฒนาระบบ (Orchestrator, 4 Subagents & Surgical Workflow)

> [!IMPORTANT]
> ไฟล์นี้คือศูนย์กลางควบคุมการทำงานของ **Main Agent (Orchestrator)** เพื่อประหยัด Token สูงสุด (**"อ่านครั้งเดียว แก้เฉพาะจุด ทดสอบเฉพาะส่วน"**) โดยกระจายงานให้ **Subagents เฉพาะทาง 4 ตัว** และดูแลฐานความรู้ใน `Wiki/`

## 🤖 1. สถาปัตยกรรม Multi-Subagent (4 บทบาทเฉพาะทาง)
1. **`planner` (นักสำรวจและเขียนแผน - Read-Only):** **ต้องเปิดอ่าน `Wiki/Code_Map.md` เป็นอันดับแรกเสมอ** เพื่อดูดัชนีไฟล์และพิกัดเลขบรรทัด (`StartLine`–`EndLine`) แล้วใช้ `view_file` กระโดดไปอ่านเฉพาะช่วงบรรทัดเป้าหมายทันที (ห้ามเริ่มไล่อ่านตั้งแต่บรรทัดที่ 1 ของไฟล์ขนาดใหญ่ และห้ามอ่านเกินครั้งละ 150 บรรทัด) จากนั้นส่งร่างแผนกลับมาให้ Main Agent
2. **`coder` (นักเขียนโค้ดและแก้บั๊กเฉพาะจุด - Surgical Write):** ทำงานหลังจากผู้ใช้กดอนุมัติแผน (**Proceed**) แล้วเท่านั้น ดูพิกัดจากแผนและ `Wiki/Code_Map.md` แล้วอ่าน/แก้ไขเฉพาะช่วงบรรทัดที่ระบุด้วย `replace_file_content` หรือ `write_to_file`
3. **`reviewer` (ผู้ตรวจสอบโค้ดและ Deploy เฉพาะจุด - QA & Deploy):** ตรวจเฉพาะ `git diff` หรือพิกัดบรรทัดที่แก้ไขตาม `Wiki/Code_Map.md` เช็คความถูกต้องว่าไม่มีโค้ดหรือฟังก์ชันเดิมเสียหาย และรันคำสั่ง Deploy/Test เฉพาะส่วนที่มีการแก้ไข
4. **`archivist` (ผู้สกัดองค์ความรู้ Wiki, Skills & Backup):** อัปเดตตารางดัชนีไฟล์และเลขบรรทัดใน `Wiki/Code_Map.md` ให้ละเอียดและเป็นปัจจุบันเสมอ, สกัดความรู้ลง `Wiki/` และ `.agents/skills/`, อัปเดต `Working/CURRENT_STATE.md` (ไม่เกิน 40 บรรทัด) และรัน `git push`

## 🎯 1.1 กฎการเลือกใช้โมเดล AI (Model & Effort Selection Matrix)
- ❌ **ห้ามใช้ Gemini Flash 3.8 (`Low`) หรือ `"flash_lite"` ในทุกกรณี!**
- **Main Agent:** งานทั่วไป (90%) = **Gemini 4 Argon (`Low`)** | งานออกแบบโครงสร้างข้ามระบบ (8%) = **Argon (`Medium`)** | งานแก้บั๊กวิกฤต (2%) = **Argon (`High`)**
- **Subagents (`invoke_subagent`):**
  - `planner`: สำรวจทั่วไป = `"flash"` | วางแผนซับซ้อน = `"pro"` / `"inherit"`
  - `coder`: แก้จุดเล็กน้อย/UI/CSS = `"flash"` (Flash High) หรือ `"inherit"` (Argon Low) | แก้ Logic/Backend/Bug = `"pro"` / `"inherit"`
  - `reviewer`: ตรวจ diff & Deploy = `"flash"` | ตรวจ Auth/Security หรือตรวจยืนยันหลังแยกไฟล์ OOP = `"pro"` / `"inherit"`
  - `archivist`: ทุกกรณี = `"flash"`

## 📋 2. กฎเหล็กการวางแผนคู่ขนาน (Dual-Plan Sync Rule)
ซิงค์แผนงานลง 2 จุดเสมอ:
1. `<ArtifactDir>/<topic>_plan.md` (`RequestFeedback: true, UserFacing: true` — ห้ามตั้งชื่อซ้ำกับ `implementation_plan.md`)
2. `Working/implementation_plan.md` (เนื้อหาตรงกัน 100%)
- กด **Review** = ปรับปรุงแผน ห้ามแก้โค้ด | กด **Proceed** = สั่ง `coder` แก้โค้ดได้

## ⚡ 3. กฎประหยัด Token, การใช้ IDE Tools 100% และความสะอาดโฟลเดอร์
1. **Fast Boot:** เริ่มแชทใหม่ให้อ่านเฉพาะ `Working/CURRENT_STATE.md` และ `Working/task.md`
2. **Map-First (อ่าน `Wiki/Code_Map.md` ก่อนวิเคราะห์ไฟล์ทุกครั้ง):** ห้ามเปิดอ่านไฟล์โค้ดตั้งแต่บรรทัดที่ 1 เพื่อสแกนหาฟังก์ชันเองเด็ดขาด! ต้องเปิดดูตารางพิกัดบรรทัด (`StartLine`–`EndLine`) ใน `Wiki/Code_Map.md` ก่อนทุกครั้ง แล้วใช้ `view_file` ระบุ `StartLine`–`EndLine` กระโดดไปอ่านเฉพาะจุดทันที (หากต้องหาคำเฉพาะให้ใช้ `grep_search` เพื่อหาเลขบรรทัดก่อน)
3. **IDE Tools Only (ห้ามรัน Node.js หรือ Terminal เพื่ออ่าน/วิเคราะห์/ตัดไฟล์):** การค้นหา วิเคราะห์ อ่าน และแก้ไขไฟล์โค้ด ต้องใช้เครื่องมือ IDE (`view_file`, `grep_search`, `find_by_name`, `list_dir`, `replace_file_content`, `write_to_file`) เท่านั้น ห้ามใช้คำสั่ง Terminal หรือเขียนสคริปต์ Node.js เพื่ออ่านหรือแยกไฟล์โปรเจกต์ และห้ามสร้างไฟล์ขยะทิ้งไว้ใน Root หรือ `Working/`


