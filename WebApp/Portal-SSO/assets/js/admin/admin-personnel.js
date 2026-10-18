/**
 * =============================================================================
 * STB APP n2 — Admin Personnel Module (assets/js/admin/admin-personnel.js)
 * =============================================================================
 * Personnel Registry, Search/Filter by Status, Dynamic 4-Level Org Cascading,
 * Modal Add/Edit, Google Drive Photo/Signature Upload & Deletion.
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
  function resolveDriveImg(url, fallback) {
    return getShared().resolveDriveImg ? getShared().resolveDriveImg(url, fallback) : (url || fallback || '');
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

  var AdminPersonnel = {
    loadPersonnelData: async function (silent) {
      try {
        var res = await getApi().listPersonnel(silent);
        var list = (res && (res.personnel || res.data)) || [];
        var admState = getState();
        admState.personnel = list;
        return list;
      } catch (err) {
        alertError('ไม่สามารถโหลดข้อมูลบุคลากรได้: ' + err.message);
        return [];
      }
    },

    renderPersonnelPage: function () {
      var app = getApp();
      if (!app) return;
      app.setPageHeader('ทำเนียบบุคลากร', 'จัดการฐานข้อมูลบุคลากร ค้นหา กรองสถานะ และอัปโหลดรูปภาพ/ลายเซ็นลง Google Drive', 'users');

      var pageBody = getShared().getPageBody ? getShared().getPageBody() : document.getElementById('content');
      if (!pageBody) return;

      var admState = getState();
      var sSearch = (admState.personnelSearch || '').toLowerCase();
      var sStatus = admState.personnelStatusFilter || '';

      var filtered = (admState.personnel || []).filter(function (p) {
        if (sStatus && p.status !== sStatus) return false;
        if (!sSearch) return true;
        var matchStr = [
          p.personnel_id,
          p.id_card_number,
          p.prefix,
          p.first_name,
          p.last_name,
          p.full_name,
          p.position,
          p.position_level,
          p.office,
          p.department,
          p.division
        ].join(' ').toLowerCase();
        return matchStr.indexOf(sSearch) !== -1;
      });

      var rowsHtml = '';
      if (filtered.length === 0) {
        rowsHtml = '<tr><td colspan="8" class="text-center py-10 muted"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><div class="text-sm">ไม่พบข้อมูลบุคลากรตรงตามเงื่อนไข</div></td></tr>';
      } else {
        filtered.forEach(function (p, idx) {
          var photoSrc = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
          var chipStatus = (p.status === 'ช่วยราชการ')
            ? '<span class="badge" style="background:rgba(255,179,0,.15);color:var(--amber)">' + esc(p.status) + '</span>'
            : (p.status === 'พ้นสภาพ'
              ? '<span class="badge" style="background:rgba(229,57,53,.15);color:var(--red)">' + esc(p.status) + '</span>'
              : '<span class="badge chip">' + esc(p.status || 'ทำงานอยู่') + '</span>');

          var accountBadge = p.has_user_account
            ? '<span class="badge chip" title="ชื่อผู้ใช้: ' + esc(p.username) + '"><i data-lucide="user-check" class="w-3 h-3"></i> ' + esc(p.username) + '</span>'
            : '<button type="button" class="btn-ghost !py-0.5 !px-2 !text-[11px]" onclick="PORTAL_ADMIN.quickCreateAccountForPersonnel(\'' + esc(p.personnel_id) + '\')" title="คลิกเพื่อผูกบัญชี"><i data-lucide="user-plus" class="w-3 h-3"></i> ผูกบัญชี</button>';

          rowsHtml += ''
            + '<tr>'
            + '  <td class="text-center muted">' + (idx + 1) + '</td>'
            + '  <td class="text-center">'
            + '    <img src="' + esc(photoSrc) + '" alt="Profile" class="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 mx-auto bg-white" loading="lazy">'
            + '  </td>'
            + '  <td>'
            + '    <div class="font-bold text-slate-800 dark:text-slate-100">' + esc(p.full_name || ((p.prefix || '') + p.first_name + ' ' + p.last_name)) + '</div>'
            + '    <div class="text-[11px] muted flex items-center gap-1 mt-0.5"><i data-lucide="id-card" class="w-3 h-3"></i> ' + esc(p.id_card_number) + ' &bull; <code>' + esc(p.personnel_id) + '</code></div>'
            + '  </td>'
            + '  <td>'
            + '    <div class="font-medium">' + esc(p.position || '-') + '</div>'
            + '    <div class="text-[11px] muted">' + esc(p.position_level || 'ไม่มีระดับ') + (p.position_type ? ' (' + esc(p.position_type) + ')' : '') + '</div>'
            + '  </td>'
            + '  <td>'
            + '    <div>' + esc(p.office || '-') + '</div>'
            + '    <div class="text-[11px] muted">' + esc(p.department || '-') + (p.division ? ' / ' + esc(p.division) : '') + '</div>'
            + '  </td>'
            + '  <td>' + accountBadge + '</td>'
            + '  <td>' + chipStatus + '</td>'
            + '  <td class="text-right">'
            + '    <div class="inline-flex gap-1">'
            + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.openPersonnelModal(\'' + esc(p.personnel_id) + '\')" title="แก้ไขข้อมูล"><i data-lucide="pencil" class="w-3.5 h-3.5 text-amber-500"></i></button>'
            + '      <button type="button" class="btn-ghost !p-1.5" onclick="PORTAL_ADMIN.deletePersonnel(\'' + esc(p.personnel_id) + '\', \'' + esc(p.full_name) + '\')" title="ลบข้อมูล"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-500"></i></button>'
            + '    </div>'
            + '  </td>'
            + '</tr>';
        });
      }

      var statuses = app.getReferenceItems('STATUS').map(function (x) { return x.value; });
      if (statuses.length === 0) statuses = ['ทำงานอยู่', 'ไปช่วยราชการ', 'ช่วยราชการที่อื่น', 'ลาศึกษาต่อ', 'เกษียณอายุ', 'ลาออก', 'ให้ออก/ไล่ออก'];

      var toolsHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_ADMIN.refreshPersonnel()"><i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเฟรช</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.openPersonnelModal()"><i data-lucide="user-plus" class="w-4 h-4"></i> เพิ่มบุคลากร</button>';

      var sectionHeader = app.sectionBar('ทำเนียบบุคลากร (Personnel Management)', toolsHtml, 'users');

      var filterCard = ''
        + '<div class="card p-3 mb-4">'
        + '  <div class="flex flex-wrap gap-3 items-center justify-between">'
        + '    <div class="flex flex-wrap gap-2 items-center flex-1 max-w-xl">'
        + '      <div class="relative flex-1 min-w-[220px]">'
        + '        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 muted"></i>'
        + '        <input type="text" id="personnelSearchInput" class="inp pl-9 !py-1.5 text-xs" placeholder="ค้นหาชื่อ, เลขบัตร, ตำแหน่ง, สังกัด..." value="' + esc(admState.personnelSearch) + '">'
        + '      </div>'
        + '      <select id="personnelStatusSelect" class="inp !py-1.5 !w-auto text-xs">'
        + '        <option value="">-- ทุกสถานะ --</option>'
        + statuses.map(function (st) {
            return '<option value="' + esc(st) + '"' + (sStatus === st ? ' selected' : '') + '>' + esc(st) + '</option>';
          }).join('')
        + '      </select>'
        + '    </div>'
        + '    <div class="text-xs muted">แสดง <b>' + filtered.length + '</b> จาก ' + (admState.personnel || []).length + ' คน</div>'
        + '  </div>'
        + '</div>';

      var tableHtml = ''
        + '<div class="card overflow-hidden">'
        + '  <div class="overflow-x-auto">'
        + '    <table class="tbl min-w-[1000px]">'
        + '      <thead>'
        + '        <tr>'
        + app.th('#', 'no')
        + app.th('รูปถ่าย', 'file')
        + app.th('ชื่อ-นามสกุล / เลขประจำตัว', 'name')
        + app.th('ตำแหน่ง / สายงาน', 'position')
        + app.th('สังกัด / หน่วยงาน', 'unit')
        + app.th('บัญชีผู้ใช้', 'user')
        + app.th('สถานะ', 'status')
        + app.th('จัดการ', 'action')
        + '        </tr>'
        + '      </thead>'
        + '      <tbody>' + rowsHtml + '</tbody>'
        + '    </table>'
        + '  </div>'
        + '</div>';

      pageBody.innerHTML = sectionHeader + filterCard + tableHtml;

      var sInp = document.getElementById('personnelSearchInput');
      if (sInp) {
        sInp.addEventListener('input', function (e) {
          admState.personnelSearch = e.target.value;
          AdminPersonnel.renderPersonnelPage();
        });
      }

      var sSel = document.getElementById('personnelStatusSelect');
      if (sSel) {
        sSel.addEventListener('change', function (e) {
          admState.personnelStatusFilter = e.target.value;
          AdminPersonnel.renderPersonnelPage();
        });
      }

      triggerIcons();
    },

    openPersonnelModal: function (personnelId) {
      var app = getApp();
      if (!app) return;
      var admState = getState();
      var item = null;
      if (personnelId) {
        item = (admState.personnel || []).find(function (p) { return p.personnel_id === personnelId; });
      }

      var isEdit = !!item;
      var p = item || {};

      var prefixes = app.getReferenceItems('PREFIX').map(function (x) { return x.value; });
      var bureaus = app.getReferenceItems('BUREAU').map(function (x) { return x.value; });
      var statuses = app.getReferenceItems('STATUS').map(function (x) { return x.value; });
      if (statuses.length === 0) statuses = ['ทำงานอยู่', 'ไปช่วยราชการ', 'ช่วยราชการที่อื่น', 'ลาศึกษาต่อ', 'เกษียณอายุ', 'ลาออก', 'ให้ออก/ไล่ออก'];
      var posTypes = app.getPositionTypes();

      var defBureau = p.bureau_name || (bureaus.length > 0 ? bureaus[0] : '');
      var defPosType = p.position_type || (posTypes.length > 0 ? posTypes[0] : '');
      var defStatus = p.status || (statuses.length > 0 ? statuses[0] : 'ทำงานอยู่');

      var photoPreview = resolveDriveImg(p.photo_url, 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
      var signPreview = resolveDriveImg(p.signature_url, '');

      var bodyHtml = ''
        + '<form id="admPsnForm" onsubmit="event.preventDefault();" class="space-y-4">'
        + '  <input type="hidden" id="adm_p_id" value="' + esc(p.personnel_id || '') + '">'
        + '  <input type="hidden" id="adm_p_photo_url" value="' + esc(p.photo_url || '') + '">'
        + '  <input type="hidden" id="adm_p_signature_url" value="' + esc(p.signature_url || '') + '">'
        + '  <div class="grid grid-cols-3 gap-3">'
        + '    <div><label class="lbl">คำนำหน้า *</label><select id="adm_p_prefix" class="inp" required>' + app.buildOptionsHtml(prefixes, p.prefix, '-- เลือก --') + '</select></div>'
        + '    <div><label class="lbl">ชื่อจริง *</label><input type="text" id="adm_p_first_name" class="inp" value="' + esc(p.first_name || '') + '" required></div>'
        + '    <div><label class="lbl">นามสกุล *</label><input type="text" id="adm_p_last_name" class="inp" value="' + esc(p.last_name || '') + '" required></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-3">'
        + '    <div><label class="lbl">เลขประจำตัวประชาชน (13 หลัก) *</label><input type="text" id="adm_p_id_card" maxlength="13" class="inp" value="' + esc(p.id_card_number || '') + '"' + (isEdit ? ' readonly style="background:var(--surface2);"' : ' required') + '></div>'
        + '    <div><label class="lbl">สถานะการทำงาน *</label>'
        + '      <select id="adm_p_status" class="inp" required>'
        + app.buildOptionsHtml(statuses, defStatus, '-- เลือกสถานะ --')
        + '      </select>'
        + '    </div>'
        + '  </div>'
        + '  <div class="p-3.5 rounded-xl soft space-y-3">'
        + '    <div class="font-bold text-xs muted uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="briefcase" class="w-3.5 h-3.5 accent"></i> ตำแหน่งและโครงสร้างหน่วยงาน</div>'
        + '    <div class="grid grid-cols-3 gap-3">'
        + '      <div><label class="lbl">ประเภทตำแหน่ง</label><select id="adm_p_position_type" class="inp">' + app.buildOptionsHtml(posTypes, defPosType, '-- เลือกประเภทตำแหน่ง --') + '</select></div>'
        + '      <div><label class="lbl">สายงาน/ตำแหน่ง *</label><select id="adm_p_position" class="inp" required></select></div>'
        + '      <div><label class="lbl">ระดับตำแหน่ง</label><select id="adm_p_position_level" class="inp"></select></div>'
        + '    </div>'
        + '    <div class="grid grid-cols-3 gap-3">'
        + '      <div><label class="lbl">สำนัก</label><select id="adm_p_bureau_name" class="inp">' + app.buildOptionsHtml(bureaus, defBureau, '-- เลือกสำนัก --') + '</select></div>'
        + '      <div><label class="lbl">สำนักงาน/กอง *</label><select id="adm_p_office" class="inp" required></select></div>'
        + '      <div><label class="lbl">ฝ่าย/ส่วน *</label><select id="adm_p_department" class="inp" required></select></div>'
        + '    </div>'
        + '    <div class="grid grid-cols-2 gap-3">'
        + '      <div><label class="lbl">กลุ่มงาน</label><select id="adm_p_division" class="inp"></select></div>'
        + '      <div><label class="lbl">ตำแหน่งอื่น/รักษาการ (ถ้ามี)</label><input type="text" id="adm_p_position_2" class="inp" value="' + esc(p.position_2 || '') + '"></div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-3">'
        + '    <div><label class="lbl">ปีที่เริ่มรับราชการ (พ.ศ.)</label><input type="number" id="adm_p_start_year" class="inp" placeholder="เช่น 2558" value="' + esc(p.start_service_year_be || '') + '"></div>'
        + '    <div><label class="lbl">เงินเดือนปัจจุบัน (บาท)</label><input type="number" step="0.01" id="adm_p_salary" class="inp" placeholder="เช่น 28500" value="' + esc(p.current_salary || '') + '"></div>'
        + '  </div>'
        + '  <div class="grid grid-cols-2 gap-4 p-3.5 rounded-xl soft">'
        + '    <div>'
        + '      <label class="lbl">รูปถ่ายบุคลากร</label>'
        + '      <div class="flex items-center gap-3">'
        + '        <img id="adm_p_photo_preview" src="' + esc(photoPreview) + '" alt="Preview" class="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white">'
        + '        <input type="file" id="adm_p_photo_file" accept="image/*" class="text-xs">'
        + '      </div>'
        + '    </div>'
        + '    <div>'
        + '      <label class="lbl">ไฟล์ภาพลายเซ็น</label>'
        + '      <div class="flex items-center gap-3">'
        + '        <div class="w-20 h-12 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center p-1 bg-white">'
        + (signPreview ? '<img id="adm_p_sig_preview" src="' + esc(signPreview) + '" class="max-h-full max-w-full object-contain">' : '<span class="text-[10px] muted">ไม่มีลายเซ็น</span>')
        + '        </div>'
        + '        <input type="file" id="adm_p_sig_file" accept="image/*" class="text-xs">'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</form>';

      var footerHtml = ''
        + '<button type="button" class="btn-ghost" onclick="PORTAL_APP.closeModal()">ยกเลิก</button>'
        + '<button type="button" class="btn-primary" onclick="PORTAL_ADMIN.submitPersonnelModal()"><i data-lucide="save" class="w-4 h-4"></i> บันทึกข้อมูล</button>';

      var title = isEdit ? 'แก้ไขข้อมูลบุคลากร (' + esc(p.personnel_id) + ')' : 'เพิ่มข้อมูลบุคลากรใหม่';
      app.openModal(title, bodyHtml, footerHtml, '760px', 'user-pen');

      app.bindOrgAndPositionCascade('adm_p', {
        position: p.position,
        position_level: p.position_level,
        office: p.office,
        department: p.department,
        division: p.division
      });

      triggerIcons();
    },

    submitPersonnelModal: async function () {
      var app = getApp();
      if (!app) return;

      var idCard = (document.getElementById('adm_p_id_card').value || '').trim();
      var firstName = (document.getElementById('adm_p_first_name').value || '').trim();
      var lastName = (document.getElementById('adm_p_last_name').value || '').trim();
      var prefix = document.getElementById('adm_p_prefix').value;
      var position = document.getElementById('adm_p_position').value;
      var office = document.getElementById('adm_p_office').value;
      var department = document.getElementById('adm_p_department').value;

      if (!idCard || !firstName || !lastName || !prefix || !position || !office || !department) {
        alertError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        return;
      }

      if (!/^\d{13}$/.test(idCard)) {
        alertError('เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก');
        return;
      }

      var photoFile = document.getElementById('adm_p_photo_file').files[0];
      var sigFile = document.getElementById('adm_p_sig_file').files[0];

      try {
        if (photoFile && global.STB_DRIVE) {
          var folderId = (app.STATE.settings && app.STATE.settings.Profile_Folder_ID) || '';
          var photoRes = await global.LOADER.busy(
            global.STB_DRIVE.uploadToDrive(photoFile, {
              folderId: folderId,
              fileName: 'PROFILE_' + idCard + '_' + Date.now()
            }),
            'กำลังอัปโหลดรูปโปรไฟล์ลง Google Drive...'
          );
          var finalUrl = photoRes.lh3Url || photoRes.fileUrl || '';
          if (finalUrl) document.getElementById('adm_p_photo_url').value = finalUrl;
        }

        if (sigFile && global.STB_DRIVE) {
          var folderId2 = (app.STATE.settings && app.STATE.settings.Signature_Folder_ID) || '';
          var sigRes = await global.LOADER.busy(
            global.STB_DRIVE.uploadToDrive(sigFile, {
              folderId: folderId2,
              fileName: 'SIGNATURE_' + idCard + '_' + Date.now()
            }),
            'กำลังอัปโหลดลายเซ็นลง Google Drive...'
          );
          var finalUrl2 = sigRes.lh3Url || sigRes.fileUrl || '';
          if (finalUrl2) document.getElementById('adm_p_signature_url').value = finalUrl2;
        }
      } catch (upErr) {
        alertError('อัปโหลดไฟล์ไม่สำเร็จ: ' + upErr.message);
        return;
      }

      var payload = {
        personnel_id: document.getElementById('adm_p_id').value || undefined,
        id_card_number: idCard,
        prefix: prefix,
        first_name: firstName,
        last_name: lastName,
        status: document.getElementById('adm_p_status').value,
        position_type: document.getElementById('adm_p_position_type').value,
        position: position,
        position_level: document.getElementById('adm_p_position_level').value,
        position_2: (document.getElementById('adm_p_position_2').value || '').trim(),
        bureau_name: document.getElementById('adm_p_bureau_name').value,
        office: office,
        department: department,
        division: document.getElementById('adm_p_division').value,
        start_service_year_be: document.getElementById('adm_p_start_year').value ? parseInt(document.getElementById('adm_p_start_year').value, 10) : null,
        current_salary: document.getElementById('adm_p_salary').value ? parseFloat(document.getElementById('adm_p_salary').value) : null,
        photo_url: document.getElementById('adm_p_photo_url').value,
        signature_url: document.getElementById('adm_p_signature_url').value
      };

      try {
        var res = await global.LOADER.busy(
          getApi().savePersonnel(payload),
          'กำลังบันทึกข้อมูลบุคลากร...'
        );
        toast(res.message || 'บันทึกข้อมูลบุคลากรสำเร็จ');
        app.closeModal();
        await AdminPersonnel.loadPersonnelData(true);
        AdminPersonnel.renderPersonnelPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถบันทึกข้อมูลบุคลากรได้');
      }
    },

    deletePersonnel: async function (personnelId, fullName) {
      var confirmed = await getApp().confirmAction({
        title: 'ยืนยันการลบข้อมูลบุคลากร?',
        text: 'ต้องการลบข้อมูลของ ' + (fullName || personnelId) + ' ออกจากทำเนียบหรือไม่? (หากมีบัญชีผู้ใช้งาน บัญชีจะถูกยกเลิกการผูกด้วย)',
        confirmText: 'ลบข้อมูล',
        cancelText: 'ยกเลิก',
        confirmColor: '#E53935'
      });
      if (!confirmed) return;

      try {
        var res = await global.LOADER.busy(
          getApi().deletePersonnel(personnelId),
          'กำลังลบข้อมูลบุคลากร...'
        );
        toast(res.message || 'ลบข้อมูลบุคลากรสำเร็จ');
        await AdminPersonnel.loadPersonnelData(true);
        AdminPersonnel.renderPersonnelPage();
      } catch (err) {
        alertError(err.message || 'ไม่สามารถลบข้อมูลบุคลากรได้');
      }
    },

    refreshPersonnel: async function () {
      await AdminPersonnel.loadPersonnelData(false);
      AdminPersonnel.renderPersonnelPage();
    }
  };

  global.AdminPersonnel = AdminPersonnel;
})(window);

