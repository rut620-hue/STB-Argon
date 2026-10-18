/**
 * =============================================================================
 * STB APP n2 — Admin Users & Permissions Module (assets/js/admin/admin-users.js)
 * =============================================================================
 * User Accounts, Role Assignments (USER/ADMIN/SUPERADMIN), Setup Mode Bypass
 * Auto-Lock, Granular Per-App SSO Permissions Matrix & User Account Deletion.
 * =============================================================================
 */
(function (global) {
  'use strict';

  function getShared() {
    return global.AdminShared || {};
  }
  function getApp() {
    return (getShared().getApp && getShared().getApp()) || global.PORTAL_APP;
  }
  function getApi() {
    return (getShared().getApi && getShared().getApi()) || global.PORTAL_API;
  }
  function esc(val) {
    return getShared().esc ? getShared().esc(val) : String(val == null ? '' : val);
  }
  function toast(title, icon) {
    if (getShared().toast) getShared().toast(title, icon);
  }
  function alertError(msg) {
    if (getShared().alertError) getShared().alertError(msg);
  }
  function triggerIcons() {
    if (getShared().triggerIcons) getShared().triggerIcons();
  }
  function getState() {
    return (getShared().ADMIN_STATE) || {};
  }

  var AdminUsers = {
    loadUsersData: async function (silent) {
      try {
        var res = await getApi().listUsers(silent);
        var list = (res && (res.users || res.data)) || [];
        var admState = getState();
        admState.users = list;
        return list;
      } catch (err) {
        alertError('ไม่สามารถโหลดรายชื่อผู้ใช้งานได้: ' + err.message);
        return [];
      }
    },

    renderUsersPage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('จัดการบัญชีและสิทธิ์', 'ควบคุมการเข้าถึงระบบ กำหนดบทบาทสิทธิ์ (SUPERADMIN, ADMIN, USER) และอนุญาตการเข้าถึงเว็บแอปย่อย', 'shield-check');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var admState = getState();
      var sSearch = (admState.usersSearch || '').toLowerCase();
      var sRole = admState.usersRoleFilter || '';

      var filtered = (admState.users || []).filter(function (u) {
        if (sRole && u.role !== sRole) return false;
        if (!sSearch) return true;
        var matchStr = [
          u.username,
          u.email,
          u.role,
          u.personnel_name,
          u.personnel_ref_id
        ].join(' ').toLowerCase();
        return matchStr.indexOf(sSearch) !== -1;
      });

      var rowsHtml = '';
      if (filtered.length === 0) {
        rowsHtml = '<tr><td colspan="8" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่พบบัญชีผู้ใช้งานตรงตามเงื่อนไข</div></td></tr>';
      } else {
        filtered.forEach(function (u, idx) {
          var roleChip = (u.role === 'SUPERADMIN')
            ? '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red)"><i data-lucide="crown" class="w-3 h-3"></i> SUPERADMIN</span>'
            : (u.role === 'ADMIN'
              ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber)"><i data-lucide="shield" class="w-3 h-3"></i> ADMIN</span>'
              : '<span class="badge soft">USER</span>');

          var statusBadge = (u.status === 'ใช้งานปกติ')
            ? '<span class="badge chip">ใช้งานปกติ</span>'
            : (u.status === 'รออนุมัติ'
              ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber)">รออนุมัติ</span>'
              : '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red)">ระงับการใช้งาน</span>');

          var permCount = 0;
          if (u.permissions && typeof u.permissions === 'object') {
            Object.keys(u.permissions).forEach(function (k) {
              if (u.permissions[k] && u.permissions[k] !== 'NONE') permCount++;
            });
          }

          var permText = (u.role === 'SUPERADMIN')
            ? '<span class="text-xs font-bold text-green-600 dark:text-green-400">ทุกแอปพลิเคชัน (Full)</span>'
            : '<span class="badge soft">' + permCount + ' แอป</span>';

          var lastLoginText = u.last_login_at
            ? '<span class="text-xs muted" title="' + esc(u.last_login_at) + '">' + esc(u.last_login_at.slice(0, 16).replace('T', ' ')) + '</span>'
            : '<span class="text-xs muted">ยังไม่เคยล็อกอิน</span>';

          rowsHtml += ''
            + '<tr>'
            + '  <td class="text-center muted">' + (idx + 1) + '</td>'
            + '  <td>'
            + '    <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><i data-lucide="user" class="w-3.5 h-3.5 accent"></i> ' + esc(u.username) + '</div>'
            + '    <div class="text-[11px] muted">' + esc(u.email || '-') + '</div>'
            + '  </td>'
            + '  <td>'
            + '    <div class="font-medium">' + esc(u.personnel_name || '-') + '</div>'
            + '    <div class="text-[11px] muted"><code>' + esc(u.personnel_ref_id || '-') + '</code></div>'
            + '  </td>'
            + '  <td>' + roleChip + '</td>'
            + '  <td>' + permText + '</td>'
            + '  <td>' + statusBadge + '</td>'
            + '  <td>' + lastLoginText + '</td>'
            + '  <td class="text-right">'
            + '    <div class="inline-flex gap-1">'
            + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openUserModal(\'' + esc(u.personnel_ref_id) + '\')" title="แก้ไขสิทธิ์และรหัสผ่าน"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
            + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deleteUser(\'' + esc(u.personnel_ref_id) + '\', \'' + esc(u.username) + '\')" title="ลบบัญชีผู้ใช้"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
            + '    </div>'
            + '  </td>'
            + '</tr>';
        });
      }

      var isSetup = app.STATE && app.STATE.isSetupMode;
      var setupBanner = isSetup
        ? '<div class="card p-4 mb-4 border-l-4 border-amber-500 bg-amber-500/10 flex items-center gap-3">'
        + '  <i data-lucide="alert-triangle" class="w-6 h-6 text-amber-500 shrink-0"></i>'
        + '  <div>'
        + '    <div class="font-bold text-sm">โหมดตั้งค่าเริ่มต้น (Setup Bypass Mode)</div>'
        + '    <div class="text-xs muted mt-0.5">ระบบยังไม่มีบัญชี SUPERADMIN กรุณาสร้างบัญชีแรกโดยกดปุ่ม <b>"+ สร้างบัญชีผู้ใช้งาน"</b> ด้านล่าง เมื่อสร้างสำเร็จ ระบบจะปิดโหมด Bypass และล็อกอินอัตโนมัติทันที</div>'
        + '  </div>'
        + '</div>'
        : '';

      var toolsHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.refreshUsers()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเฟรช</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openUserModal()"><i data-lucide="user-plus" class="w-4 h-4"></i> สร้างบัญชีผู้ใช้งาน</button>';

      var sectionHeader = app.sectionBar('จัดการบัญชีและสิทธิ์ (Users & Permissions)', toolsHtml, 'shield-check');

      var filterCard = ''
        + '<div class="card p-3 mb-4">'
        + '  <div class="flex flex-wrap gap-3 items-center justify-between">'
        + '    <div class="flex flex-wrap gap-2 items-center flex-1 max-w-xl">'
        + '      <div class="relative flex-1 min-w-[200px]">'
        + '        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 muted"></i>'
        + '        <input type="text" id="usersSearchInput" class="inp pl-9 !py-1.5 text-xs" placeholder="ค้นหา Username, Email, ชื่อบุคลากร..." value="' + esc(admState.usersSearch) + '">'
        + '      </div>'
        + '      <select id="usersRoleSelect" class="inp !py-1.5 !w-auto text-xs">'
        + '        <option value="">-- ทุกบทบาท --</option>'
        + '        <option value="SUPERADMIN"' + (sRole === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN</option>'
        + '        <option value="ADMIN"' + (sRole === 'ADMIN' ? ' selected' : '') + '>ADMIN</option>'
        + '        <option value="USER"' + (sRole === 'USER' ? ' selected' : '') + '>USER</option>'
        + '      </select>'
        + '    </div>'
        + '    <div class="text-xs muted">แสดง <b>' + filtered.length + '</b> จาก ' + (admState.users || []).length + ' บัญชี</div>'
        + '  </div>'
        + '</div>';

      var tableHtml = ''
        + '<div class="card overflow-hidden">'
        + '  <div class="overflow-x-auto">'
        + '    <table class="tbl min-w-[1000px]">'
        + '      <thead>'
        + '        <tr>'
        + app.th('#', 'no')
        + app.th('บัญชีผู้ใช้งาน (Username / Email)', 'user')
        + app.th('บุคลากรเจ้าของบัญชี', 'name')
        + app.th('บทบาทสิทธิ์', 'role')
        + app.th('สิทธิ์รายแอป', 'action')
        + app.th('สถานะ', 'status')
        + app.th('เข้าสู่ระบบล่าสุด', 'date')
        + app.th('จัดการ', 'action')
        + '        </tr>'
        + '      </thead>'
        + '      <tbody>' + rowsHtml + '</tbody>'
        + '    </table>'
        + '  </div>'
        + '</div>';

      pageBody.innerHTML = setupBanner + sectionHeader + filterCard + tableHtml;

      var uInp = document.getElementById('usersSearchInput');
      if (uInp) {
        uInp.addEventListener('input', function (e) {
          admState.usersSearch = e.target.value;
          AdminUsers.renderUsersPage();
        });
      }

      var uSel = document.getElementById('usersRoleSelect');
      if (uSel) {
        uSel.addEventListener('change', function (e) {
          admState.usersRoleFilter = e.target.value;
          AdminUsers.renderUsersPage();
        });
      }

      triggerIcons();
    },

    quickCreateAccountForPersonnel: function (personnelId) {
      AdminUsers.openUserModal(personnelId, true);
    },

    openUserModal: function (personnelRefId, isFromPersonnelQuick) {
      var app = getApp();
      if (!app) return;

      var admState = getState();
      var existingUser = null;
      if (personnelRefId && !isFromPersonnelQuick) {
        existingUser = (admState.users || []).find(function (u) { return u.personnel_ref_id === personnelRefId; });
      }

      var isEdit = !!existingUser;
      var u = existingUser || {};

      var personnelOptions = '';
      (admState.personnel || []).forEach(function (p) {
        var isSelected = (p.personnel_id === personnelRefId || p.personnel_id === u.personnel_ref_id);
        personnelOptions += '<option value="' + esc(p.personnel_id) + '"' + (isSelected ? ' selected' : '') + '>'
          + esc(p.full_name || (p.first_name + ' ' + p.last_name)) + ' (' + esc(p.personnel_id) + ' - ' + esc(p.position || '') + ')'
          + '</option>';
      });

      var appCheckboxes = '';
      (admState.webapps || []).forEach(function (w) {
        var userPerms = u.permissions || {};
        var curLevel = userPerms[w.webapp_id] || 'USER';
        var isGranted = !!userPerms[w.webapp_id];

        appCheckboxes += ''
          + '<div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">'
          + '  <div class="flex items-center gap-2">'
          + '    <input type="checkbox" id="perm_chk_' + esc(w.webapp_id) + '"' + (isGranted ? ' checked' : '') + ' class="rounded text-green-600">'
          + '    <label for="perm_chk_' + esc(w.webapp_id) + '" class="font-medium text-xs cursor-pointer">' + esc(w.name) + ' <code>(' + esc(w.webapp_id) + ')</code></label>'
          + '  </div>'
          + '  <select id="perm_lvl_' + esc(w.webapp_id) + '" class="inp !py-1 !px-2 !text-xs !w-auto">'
          + '    <option value="USER"' + (curLevel === 'USER' ? ' selected' : '') + '>USER</option>'
          + '    <option value="ADMIN"' + (curLevel === 'ADMIN' ? ' selected' : '') + '>ADMIN</option>'
          + '  </select>'
          + '</div>';
      });

      var bodyHtml = ''
        + '<form id="admUserForm" onsubmit="event.preventDefault();" class="space-y-4">'
        + '  <div>'
        + '    <label class="lbl">เลือกบุคลากรเจ้าของบัญชี *</label>'
        + '    <select id="adm_u_personnel_id" class="inp" required' + (isEdit ? ' disabled style="background:var(--surface2);"' : '') + '>'
        + '      <option value="">-- เลือกบุคลากร --</option>' + personnelOptions
        + '    </select>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-3">'
        + '    <div><label class="lbl">ชื่อผู้ใช้งาน (Username) *</label><input type="text" id="adm_u_username" class="inp" placeholder="ภาษาอังกฤษ ตัวเลข" value="' + esc(u.username || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '></div>'
        + '    <div><label class="lbl">อีเมล (Email) *</label><input type="email" id="adm_u_email" class="inp" placeholder="user@bangkok.go.th" value="' + esc(u.email || '') + '" required></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-3">'
        + '    <div><label class="lbl">บทบาทสิทธิ์ส่วนกลาง *</label>'
        + '      <select id="adm_u_role" class="inp" required>'
        + '        <option value="USER"' + (u.role === 'USER' || !u.role ? ' selected' : '') + '>USER (บุคลากรทั่วไป)</option>'
        + '        <option value="ADMIN"' + (u.role === 'ADMIN' ? ' selected' : '') + '>ADMIN (ผู้ดูแลระบบงาน)</option>'
        + '        <option value="SUPERADMIN"' + (u.role === 'SUPERADMIN' ? ' selected' : '') + '>SUPERADMIN (ผู้ดูแลระบบสูงสุด)</option>'
        + '      </select>'
        + '    </div>'
        + '    <div><label class="lbl">สถานะบัญชี *</label>'
        + '      <select id="adm_u_status" class="inp" required>'
        + '        <option value="ใช้งานปกติ"' + (u.status === 'ใช้งานปกติ' || !u.status ? ' selected' : '') + '>ใช้งานปกติ</option>'
        + '        <option value="รออนุมัติ"' + (u.status === 'รออนุมัติ' ? ' selected' : '') + '>รออนุมัติ</option>'
        + '        <option value="ระงับการใช้งาน"' + (u.status === 'ระงับการใช้งาน' ? ' selected' : '') + '>ระงับการใช้งาน</option>'
        + '      </select>'
        + '    </div>'
        + '  </div>'
        + '  <div class="p-3.5 rounded-xl soft">'
        + '    <label class="lbl">' + (isEdit ? 'รีเซ็ตรหัสผ่านใหม่ (เว้นว่างไว้หากไม่เปลี่ยน)' : 'รหัสผ่านเริ่มต้น *') + '</label>'
        + '    <input type="password" id="adm_u_password" class="inp" placeholder="อย่างน้อย 8 ตัวอักษร"' + (isEdit ? '' : ' required') + '>'
        + '  </div>'
        + '  <div>'
        + '    <label class="lbl mb-2">กำหนดสิทธิ์เข้าถึงเว็บแอปพลิเคชันย่อย (SSO Permissions)</label>'
        + '    <div class="space-y-2 max-h-48 overflow-y-auto">' + (appCheckboxes || '<span class="text-xs muted">ยังไม่มีเว็บแอปพลิเคชันในระบบ</span>') + '</div>'
        + '  </div>'
        + '</form>';

      var footerHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitUserModal(' + (isEdit ? 'true' : 'false') + ')"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูลบัญชี</button>';

      var title = isEdit ? 'แก้ไขบัญชีผู้ใช้งาน (' + esc(u.username) + ')' : 'สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์';
      app.openModal(title, bodyHtml, footerHtml, '650px', 'user-shield');
      triggerIcons();
    },

    submitUserModal: async function (isEdit) {
      var pId = document.getElementById('adm_u_personnel_id').value;
      var username = (document.getElementById('adm_u_username').value || '').trim();
      var email = (document.getElementById('adm_u_email').value || '').trim();
      var role = document.getElementById('adm_u_role').value;
      var status = document.getElementById('adm_u_status').value;
      var password = document.getElementById('adm_u_password').value;

      if (!pId || !username || !email || !role || !status) {
        alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        return;
      }
      if (!isEdit && !password) {
        alertError('กรุณากำหนดรหัสผ่านเริ่มต้นสำหรับบัญชีใหม่');
        return;
      }

      var permissions = {};
      var admState = getState();
      (admState.webapps || []).forEach(function (w) {
        var chk = document.getElementById('perm_chk_' + w.webapp_id);
        var lvl = document.getElementById('perm_lvl_' + w.webapp_id);
        if (chk && chk.checked) {
          permissions[w.webapp_id] = lvl ? lvl.value : 'USER';
        } else {
          permissions[w.webapp_id] = 'NONE';
        }
      });

      var payload = {
        personnel_ref_id: pId,
        username: username,
        email: email,
        role: role,
        status: status,
        permissions: permissions
      };
      if (password) payload.password = password;

      try {
        var res = await global.LOADER.busy(
          getApi().saveUser(payload),
          'กำลังบันทึกข้อมูลบัญชีผู้ใช้...'
        );
        toast(res.message || 'บันทึกบัญชีผู้ใช้งานสำเร็จ');
        getApp().closeModal();

        if (res && res.auto_session_token) {
          toast('สร้าง SUPERADMIN สำเร็จ! เข้าสู่ระบบด้วยบัญชีของคุณทันที', 'info');
          await getApp().bootSystem();
          return;
        }

        await AdminUsers.loadUsersData(true);
        if (global.AdminPersonnel && typeof global.AdminPersonnel.loadPersonnelData === 'function') {
          await global.AdminPersonnel.loadPersonnelData(true);
        }
        AdminUsers.renderUsersPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถบันทึกบัญชีผู้ใช้งานได้');
      }
    },

    deleteUser: async function (personnelRefId, username) {
      var confirmed = await getApp().confirmAction({
        title: 'ยืนยันการลบบัญชีผู้ใช้งาน?',
        text: 'ต้องการลบบัญชีผู้ใช้งาน @' + username + ' หรือไม่? ข้อมูลประวัติบุคลากรจะยังคงอยู่ในทำเนียบ',
        confirmText: 'ลบบัญชี',
        cancelText: 'ยกเลิก',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      try {
        var res = await global.LOADER.busy(
          getApi().deleteUser(personnelRefId),
          'กำลังลบบัญชีผู้ใช้งาน...'
        );
        toast(res.message || 'ลบบัญชีผู้ใช้งานสำเร็จ');
        await AdminUsers.loadUsersData(true);
        if (global.AdminPersonnel && typeof global.AdminPersonnel.loadPersonnelData === 'function') {
          await global.AdminPersonnel.loadPersonnelData(true);
        }
        AdminUsers.renderUsersPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถลบบัญชีผู้ใช้งานได้');
      }
    },

    refreshUsers: async function () {
      await AdminUsers.loadUsersData(false);
      AdminUsers.renderUsersPage();
    }
  };

  global.AdminUsers = AdminUsers;
})(window);

